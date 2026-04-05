import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { users, nodes } from "@repo/db/schema";
import { signUpSchema, loginSchema, updateProfileSchema } from "@repo/validators";
import { db } from "../../db";
import { config } from "../../config";
import {
  issueTokenPair,
  rotateRefreshToken,
  revokeFamily,
  clearAuthCookies,
} from "../../lib/tokens";

const AVATAR_CHOICES = ["/char1.png", "/char2.png", "/char3.png"];
function randomAvatar() {
  return AVATAR_CHOICES[Math.floor(Math.random() * AVATAR_CHOICES.length)];
}

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/signup — public
  app.post("/signup", async (request, reply) => {
    try {
      const { name, email, password } = signUpSchema.parse(request.body);

      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (existing) {
        return reply.code(409).send({ error: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const avatarUrl = randomAvatar();

      const result = await db
        .insert(users)
        .values({ name, email, hashedPassword, avatarUrl })
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          onboardingCompleted: users.onboardingCompleted,
        });

      const user = result[0]!;
      await issueTokenPair(app, request, reply, { id: user.id, email: user.email });

      return reply.code(201).send({ user });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return reply.code(400).send({ error: "Invalid input" });
      }
      request.log.error(error);
      return reply.code(500).send({ error: "Internal server error" });
    }
  });

  // POST /auth/login — public
  app.post("/login", async (request, reply) => {
    try {
      const { email, password } = loginSchema.parse(request.body);

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!user || !user.hashedPassword) {
        return reply.code(401).send({ error: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.hashedPassword);
      if (!isValid) {
        return reply.code(401).send({ error: "Invalid credentials" });
      }

      await issueTokenPair(app, request, reply, { id: user.id, email: user.email });

      return reply.send({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          onboardingCompleted: user.onboardingCompleted,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return reply.code(400).send({ error: "Invalid input" });
      }
      request.log.error(error);
      return reply.code(500).send({ error: "Internal server error" });
    }
  });

  // GET /auth/google — redirect to Google consent screen
  app.get("/google", async (_request, reply) => {
    const params = new URLSearchParams({
      client_id: config.GOOGLE_CLIENT_ID,
      redirect_uri: config.GOOGLE_REDIRECT_URI,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
    });

    return reply.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  });

  // GET /auth/google/callback — handle Google OAuth callback
  app.get("/google/callback", async (request, reply) => {
    try {
      const { code } = request.query as { code?: string };

      if (!code) {
        return reply.redirect(`${config.FRONTEND_URL}/login?error=no_code`);
      }

      // Exchange code for tokens
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: config.GOOGLE_CLIENT_ID,
          client_secret: config.GOOGLE_CLIENT_SECRET,
          redirect_uri: config.GOOGLE_REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenRes.ok) {
        request.log.error("Google token exchange failed");
        return reply.redirect(`${config.FRONTEND_URL}/login?error=token_exchange`);
      }

      const tokens: GoogleTokenResponse = await tokenRes.json();

      // Fetch user info
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (!userInfoRes.ok) {
        request.log.error("Google userinfo fetch failed");
        return reply.redirect(`${config.FRONTEND_URL}/login?error=userinfo`);
      }

      const googleUser: GoogleUserInfo = await userInfoRes.json();

      // Find or create user
      let [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, googleUser.email));

      if (!user) {
        // Create new user from Google profile
        const result = await db
          .insert(users)
          .values({
            email: googleUser.email,
            name: googleUser.name,
            avatarUrl: googleUser.picture || randomAvatar(),
          })
          .returning();
        user = result[0]!;
      } else if (!user.avatarUrl && googleUser.picture) {
        // Update avatar if missing
        await db
          .update(users)
          .set({ avatarUrl: googleUser.picture, updatedAt: new Date() })
          .where(eq(users.id, user.id));
      }

      // Issue token pair and set cookies on the redirect response
      await issueTokenPair(app, request, reply, { id: user.id, email: user.email });

      // Decide destination based on onboarding status.
      // We need the latest value — fetch fresh since the user may have just been created.
      const [fresh] = await db
        .select({ onboardingCompleted: users.onboardingCompleted })
        .from(users)
        .where(eq(users.id, user.id));
      const next = fresh?.onboardingCompleted ? "/vault" : "/onboarding";
      return reply.redirect(`${config.FRONTEND_URL}${next}`);
    } catch (error) {
      request.log.error(error);
      return reply.redirect(`${config.FRONTEND_URL}/login?error=server`);
    }
  });

  // POST /auth/refresh — public (but requires refresh cookie)
  // Rotates the refresh token and issues new access + refresh cookies.
  // If the presented token was already rotated (reuse detection), revokes
  // the entire family.
  app.post("/refresh", async (request, reply) => {
    const raw = request.cookies.refresh_token;
    if (!raw) {
      return reply.code(401).send({ error: "No refresh token" });
    }

    const result = await rotateRefreshToken(app, request, reply, raw);
    if (!result.ok) {
      clearAuthCookies(reply);
      return reply.code(401).send({ error: result.reason });
    }
    return reply.send({ ok: true });
  });

  // POST /auth/logout — public and idempotent
  // Revokes the entire refresh token family and clears cookies.
  app.post("/logout", async (request, reply) => {
    const raw = request.cookies.refresh_token;
    if (raw) {
      await revokeFamily(raw);
    }
    clearAuthCookies(reply);
    return reply.send({ ok: true });
  });

  // GET /auth/me — authenticated
  app.get("/me", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id: userId } = request.user;

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        avatarUrl: users.avatarUrl,
        onboardingCompleted: users.onboardingCompleted,
        socialLinks: users.socialLinks,
        resumeNodeId: users.resumeNodeId,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return reply.code(404).send({ error: "User not found" });
    }

    let resumeNode: { id: string; title: string | null } | null = null;
    if (user.resumeNodeId) {
      const [node] = await db
        .select({ id: nodes.id, title: nodes.title })
        .from(nodes)
        .where(eq(nodes.id, user.resumeNodeId));
      resumeNode = node || null;
    }

    return reply.send({ ...user, resumeNode });
  });

  // PATCH /auth/me — authenticated
  app.patch("/me", { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { id: userId } = request.user;
      const input = updateProfileSchema.parse(request.body);

      const [user] = await db
        .update(users)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          avatarUrl: users.avatarUrl,
          onboardingCompleted: users.onboardingCompleted,
          socialLinks: users.socialLinks,
          resumeNodeId: users.resumeNodeId,
        });

      if (!user) {
        return reply.code(404).send({ error: "User not found" });
      }

      return reply.send(user);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return reply.code(400).send({ error: "Invalid input" });
      }
      request.log.error(error);
      return reply.code(500).send({ error: "Internal server error" });
    }
  });

  // GET /auth/me/stats — authenticated
  app.get("/me/stats", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id: userId } = request.user;

    const [user] = await db
      .select({ createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, userId));

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(nodes)
      .where(eq(nodes.userId, userId));

    return reply.send({
      memoriesCount: Number(countResult?.count || 0),
      memberSince: user?.createdAt,
    });
  });
}

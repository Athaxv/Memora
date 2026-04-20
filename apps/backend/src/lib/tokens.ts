import crypto from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { and, eq, isNull } from "drizzle-orm";
import { refreshTokens } from "@repo/db/schema";
import { db } from "../db";
import { config } from "../config";

// ─────────────────────────────────────────────────────────────
// Why hash with SHA-256 (not bcrypt)?
// The input is 512 bits of CSPRNG randomness — not a low-entropy
// password. Pre-image resistance of SHA-256 + uniform input
// distribution = cryptographically infeasible to reverse. Bcrypt
// would only add latency for no security benefit. And because
// SHA-256 is deterministic, we can do an indexed point lookup
// on the hash column instead of scanning every row.
// ─────────────────────────────────────────────────────────────
export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

// ─────────────────────────────────────────────────────────────
// Cookie helpers
// Access cookie:  Path=/     (attached to every API request)
// Refresh cookie: Path=/auth (only attached to /auth/refresh, /auth/logout)
// Path scoping dramatically shrinks refresh-token exposure.
// ─────────────────────────────────────────────────────────────
export function setAuthCookies(
  reply: FastifyReply,
  accessToken: string,
  refreshToken: string
) {
  const isProd = config.NODE_ENV === "production";
  const sameSite = isProd ? ("none" as const) : ("lax" as const);
  const base = {
    httpOnly: true,
    secure: isProd,
    sameSite,
    domain: config.COOKIE_DOMAIN,
  };

  reply.setCookie("access_token", accessToken, {
    ...base,
    path: "/",
    maxAge: config.ACCESS_TOKEN_TTL_SECONDS,
  });

  reply.setCookie("refresh_token", refreshToken, {
    ...base,
    path: "/auth",
    maxAge: config.REFRESH_TOKEN_TTL_SECONDS,
  });
}

export function clearAuthCookies(reply: FastifyReply) {
  const base = { domain: config.COOKIE_DOMAIN };
  reply.clearCookie("access_token", { ...base, path: "/" });
  reply.clearCookie("refresh_token", { ...base, path: "/auth" });
}

function generateRawRefreshToken(): string {
  // 64 bytes = 512 bits of entropy. base64url is URL-safe (no +, /, =).
  return crypto.randomBytes(64).toString("base64url");
}

// ─────────────────────────────────────────────────────────────
// Issue a brand-new token pair (new family).
// Called on signup, login, and Google OAuth success.
// ─────────────────────────────────────────────────────────────
export async function issueTokenPair(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
  user: { id: string; email: string }
): Promise<void> {
  const accessToken = app.jwt.sign({ id: user.id, email: user.email });
  const rawRefresh = generateRawRefreshToken();
  const familyId = crypto.randomUUID();

  await db.insert(refreshTokens).values({
    userId: user.id,
    familyId,
    tokenHash: hashToken(rawRefresh),
    expiresAt: new Date(Date.now() + config.REFRESH_TOKEN_TTL_SECONDS * 1000),
    userAgent: request.headers["user-agent"] || null,
    ipAddress: request.ip || null,
  });

  setAuthCookies(reply, accessToken, rawRefresh);
}

// ─────────────────────────────────────────────────────────────
// Rotate a refresh token with reuse detection.
//
// Happy path: old row marked revoked+replaced, new row inserted
// with same family_id, new cookies set.
//
// Reuse detection: if an already-revoked token is presented,
// someone is replaying a stolen/rotated credential. Revoke the
// entire family — we can't know which holder is legitimate.
// ─────────────────────────────────────────────────────────────
type RotateResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "expired" | "reuse_detected" };

export async function rotateRefreshToken(
  app: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
  rawOldToken: string
): Promise<RotateResult> {
  const hash = hashToken(rawOldToken);
  const [row] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, hash));

  if (!row) return { ok: false, reason: "not_found" };
  if (row.expiresAt < new Date()) return { ok: false, reason: "expired" };

  if (row.revokedAt !== null) {
    // REUSE DETECTED — nuke the whole family
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(refreshTokens.familyId, row.familyId),
          isNull(refreshTokens.revokedAt)
        )
      );
    request.log.warn(
      { userId: row.userId, familyId: row.familyId },
      "refresh token reuse detected — family revoked"
    );
    return { ok: false, reason: "reuse_detected" };
  }

  // Happy path: mint a new token in the same family
  const newRaw = generateRawRefreshToken();
  const [newRow] = await db
    .insert(refreshTokens)
    .values({
      userId: row.userId,
      familyId: row.familyId,
      tokenHash: hashToken(newRaw),
      expiresAt: new Date(Date.now() + config.REFRESH_TOKEN_TTL_SECONDS * 1000),
      userAgent: request.headers["user-agent"] || null,
      ipAddress: request.ip || null,
    })
    .returning({ id: refreshTokens.id });

  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date(), replacedById: newRow!.id })
    .where(eq(refreshTokens.id, row.id));

  // Re-sign the access token. We need the current email — look it up once.
  // (We could cache it on the refresh_tokens row, but a single indexed
  // lookup is cheap and keeps that row small.)
  const { users } = await import("@repo/db/schema");
  const [userRow] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, row.userId));

  if (!userRow) return { ok: false, reason: "not_found" };

  const newAccess = app.jwt.sign({ id: row.userId, email: userRow.email });
  setAuthCookies(reply, newAccess, newRaw);
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────
// Revoke an entire token family (used by logout).
// ─────────────────────────────────────────────────────────────
export async function revokeFamily(rawToken: string): Promise<void> {
  const hash = hashToken(rawToken);
  const [row] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, hash));

  if (!row) return;

  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(refreshTokens.familyId, row.familyId),
        isNull(refreshTokens.revokedAt)
      )
    );
}

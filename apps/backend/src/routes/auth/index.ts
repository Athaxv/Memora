import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { users } from "@repo/db/schema";
import { signUpSchema, loginSchema } from "@repo/validators";
import { db } from "../../db";

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

      const result = await db
        .insert(users)
        .values({ name, email, hashedPassword })
        .returning({ id: users.id, email: users.email, name: users.name });

      const user = result[0]!;
      const token = app.jwt.sign({ id: user.id, email: user.email });

      return reply.code(201).send({ user, token });
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

      const token = app.jwt.sign({ id: user.id, email: user.email });

      return reply.send({
        user: { id: user.id, email: user.email, name: user.name },
        token,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return reply.code(400).send({ error: "Invalid input" });
      }
      request.log.error(error);
      return reply.code(500).send({ error: "Internal server error" });
    }
  });

  // POST /auth/token — token exchange for Google OAuth
  // Frontend completes Google OAuth via NextAuth, then calls this with the user's email
  app.post("/token", async (request, reply) => {
    try {
      const { email } = request.body as { email?: string };

      if (!email) {
        return reply.code(400).send({ error: "Email is required" });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!user) {
        return reply.code(404).send({ error: "User not found" });
      }

      const token = app.jwt.sign({ id: user.id, email: user.email });

      return reply.send({
        user: { id: user.id, email: user.email, name: user.name },
        token,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: "Internal server error" });
    }
  });
}

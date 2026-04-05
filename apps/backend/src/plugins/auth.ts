import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fjwt from "@fastify/jwt";
import { config } from "../config";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { id: string; email: string };
    user: { id: string; email: string };
  }
}

export async function registerAuth(app: FastifyInstance) {
  await app.register(fjwt, {
    secret: config.JWT_SECRET,
    sign: { expiresIn: `${config.ACCESS_TOKEN_TTL_SECONDS}s` },
  });

  app.decorate(
    "authenticate",
    async function (request: FastifyRequest, reply: FastifyReply) {
      const token = request.cookies.access_token;
      if (!token) {
        return reply.code(401).send({ error: "Unauthorized" });
      }
      try {
        request.user = app.jwt.verify<{ id: string; email: string }>(token);
      } catch {
        return reply.code(401).send({ error: "Unauthorized" });
      }
    }
  );
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

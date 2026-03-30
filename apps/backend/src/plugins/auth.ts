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
  });

  app.decorate(
    "authenticate",
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        await request.jwtVerify();
      } catch {
        reply.code(401).send({ error: "Unauthorized" });
      }
    }
  );
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

import type { FastifyInstance } from "fastify";
import fastifyRateLimit from "@fastify/rate-limit";

export async function registerRateLimit(app: FastifyInstance) {
  await app.register(fastifyRateLimit, {
    global: false,
    keyGenerator: (request) => request.ip,
  });
}

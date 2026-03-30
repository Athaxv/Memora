import type { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { config } from "../config";

export async function registerCors(app: FastifyInstance) {
  await app.register(cors, {
    origin: config.FRONTEND_URL,
    credentials: true,
  });
}

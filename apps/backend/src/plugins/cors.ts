import type { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { config } from "../config";

export async function registerCors(app: FastifyInstance) {
  await app.register(cors, {
    origin: [config.FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
}

import type { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { config } from "../config";

export async function registerCors(app: FastifyInstance) {
  const localOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];
  const allowedOrigins = new Set<string>([
    config.FRONTEND_URL,
    ...(config.NODE_ENV === "production" ? [] : localOrigins),
  ]);

  await app.register(cors, {
    origin: (origin, callback) => {
      // Allow non-browser clients (curl/server-to-server) without Origin header.
      if (!origin) {
        callback(null, true);
        return;
      }

      callback(null, allowedOrigins.has(origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
}

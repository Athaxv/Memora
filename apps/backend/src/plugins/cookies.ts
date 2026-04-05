import type { FastifyInstance } from "fastify";
import cookie from "@fastify/cookie";
import { config } from "../config";

export async function registerCookies(app: FastifyInstance) {
  await app.register(cookie, {
    secret: config.COOKIE_SECRET,
    hook: "onRequest",
  });
}

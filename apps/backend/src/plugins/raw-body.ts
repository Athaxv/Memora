import type { FastifyInstance } from "fastify";
import rawBody from "fastify-raw-body";

export async function registerRawBody(app: FastifyInstance) {
  await app.register(rawBody, {
    field: "rawBody",
    global: false,
    runFirst: true,
    encoding: false,
  });
}

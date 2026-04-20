import Fastify from "fastify";
import { memoryGraphQuerySchema } from "@repo/validators";
import { sql } from "drizzle-orm";
import { config } from "./config";
import { db } from "./db";
import { registerCors } from "./plugins/cors";
import { registerCookies } from "./plugins/cookies";
import { registerAuth } from "./plugins/auth";
import { registerMultipart } from "./plugins/multipart";
import { registerRawBody } from "./plugins/raw-body";
import { registerRateLimit } from "./plugins/rate-limit";
import { authRoutes } from "./routes/auth/index";
import { memoriesRoutes } from "./routes/memories/index";
import { ingestRoutes } from "./routes/ingest/index";
import { tagsRoutes } from "./routes/tags/index";
import { chatRoutes } from "./routes/chat/index";
import { whatsappRoutes } from "./routes/whatsapp/index";
import { telegramRoutes } from "./routes/telegram/index";
import { getMemoryGraph } from "./services/memory-graph";

async function main() {
  const app = Fastify({ logger: true });

  // Plugins — order matters: cookie must parse headers before auth reads them
  await registerCors(app);
  await registerCookies(app);
  await registerAuth(app);
  await registerMultipart(app);
  await registerRawBody(app);
  await registerRateLimit(app);

  // Routes
  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(memoriesRoutes, { prefix: "/memories" });
  await app.register(ingestRoutes, { prefix: "/ingest" });
  await app.register(tagsRoutes, { prefix: "/tags" });
  await app.register(chatRoutes, { prefix: "/chat" });
  await app.register(whatsappRoutes, { prefix: "/whatsapp" });
  await app.register(telegramRoutes, { prefix: "/telegram" });

  // Alias for clients that call singular memory graph path.
  app.get(
    "/memory/graph",
    { preHandler: app.authenticate },
    async (request, reply) => {
      try {
        const { id: userId } = request.user;
        const query = memoryGraphQuerySchema.parse(request.query ?? {});

        const graph = await getMemoryGraph(db, userId, {
          limit: query.limit,
          edgeLimitPerNode: query.edgeLimitPerNode,
          tag: query.tag,
          from: query.from,
          to: query.to,
        });

        return reply.send(graph);
      } catch (error) {
        if (error instanceof Error && error.name === "ZodError") {
          return reply.code(400).send({ error: "Invalid query" });
        }
        request.log.error(error);
        return reply.code(500).send({ error: "Failed to build graph" });
      }
    }
  );

  // Health check
  app.get("/health", async (request, reply) => {
    try {
      await db.execute(sql`select 1`);
      return reply.send({ status: "ok" });
    } catch (error) {
      request.log.error(error, "Health check failed");
      return reply.code(503).send({ status: "degraded" });
    }
  });

  // Start
  try {
    await app.listen({ port: config.PORT, host: "0.0.0.0" });
    console.log(`Backend running on http://localhost:${config.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();

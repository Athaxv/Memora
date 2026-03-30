import Fastify from "fastify";
import { config } from "./config";
import { registerCors } from "./plugins/cors";
import { registerAuth } from "./plugins/auth";
import { registerMultipart } from "./plugins/multipart";
import { authRoutes } from "./routes/auth/index";
import { memoriesRoutes } from "./routes/memories/index";
import { ingestRoutes } from "./routes/ingest/index";
import { tagsRoutes } from "./routes/tags/index";
import { chatRoutes } from "./routes/chat/index";

async function main() {
  const app = Fastify({ logger: true });

  // Plugins
  await registerCors(app);
  await registerAuth(app);
  await registerMultipart(app);

  // Routes
  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(memoriesRoutes, { prefix: "/memories" });
  await app.register(ingestRoutes, { prefix: "/ingest" });
  await app.register(tagsRoutes, { prefix: "/tags" });
  await app.register(chatRoutes, { prefix: "/chat" });

  // Health check
  app.get("/health", async () => ({ status: "ok" }));

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

# Backend API

## Summary
The backend is a Fastify server that exposes auth, memory, ingest, tags, chat, WhatsApp, and Telegram routes. It relies on shared packages for schema access, graph operations, AI utilities, and validation.

## Detailed explanation
- Server bootstraps Fastify, registers auth, cookies, CORS, and multipart, then attaches route groups.
- Auth routes manage signup/login, Google OAuth, refresh rotation, logout, and current user info.
- Auth routes include endpoint-specific rate limits and OAuth state validation.
- Memory routes support list, detail, update, soft delete, semantic search, and graph payload generation for visualization.
- Ingest routes handle text/URL ingestion and multipart file uploads with type and size checks.
- Chat route classifies intent, retrieves related memories, calls Groq to generate an answer, and now persists user/assistant turns to `conversations` and `messages`.
- Chat route now handles `store` intent by ingesting text directly into memory nodes before replying, and non-store intents run retrieval + generation with recent conversation-turn grounding.
- Tags route returns user tags for filtering.
- WhatsApp routes are registered; detail lives under the whatsapp route folder.
- Telegram routes are registered; deep-link linking now starts at `/telegram/link/start` and completes via `/telegram/webhook` `/start <token>` handling.
- Memory graph endpoint `GET /memories/graph` returns graph-ready `{ nodes, edges }` with persisted semantic edges plus derived tag and temporal edges.
- Docker/Render runtime startup is defined in [apps/backend/scripts/start-render.sh](apps/backend/scripts/start-render.sh): start prebuilt backend process only.
- Migration execution is separated into [apps/backend/scripts/migrate-render.sh](apps/backend/scripts/migrate-render.sh) for explicit CI/deploy-hook usage.
- Runtime Docker image definition is in [apps/backend/Dockerfile](apps/backend/Dockerfile), with Render service wiring in [render.yaml](render.yaml).
- Health probing uses `/health` route in [apps/backend/src/index.ts](apps/backend/src/index.ts), which validates DB connectivity before returning `ok`.

## Relationships
- [ai-memory/wiki/auth-system.md](ai-memory/wiki/auth-system.md) - Cookie auth and refresh tokens.
- [ai-memory/wiki/ingestion-pipeline.md](ai-memory/wiki/ingestion-pipeline.md) - Ingest orchestration.
- [ai-memory/wiki/graph-layer.md](ai-memory/wiki/graph-layer.md) - Graph queries and search.
- [ai-memory/wiki/ai-layer.md](ai-memory/wiki/ai-layer.md) - LLM calls for chat and tagging.
- [ai-memory/wiki/validators.md](ai-memory/wiki/validators.md) - Zod schemas used by routes.
- [ai-memory/wiki/whatsapp-integration.md](ai-memory/wiki/whatsapp-integration.md) - WhatsApp webhook and link flow.
- [ai-memory/wiki/telegram-integration.md](ai-memory/wiki/telegram-integration.md) - Telegram webhook and link flow.
- [ai-memory/wiki/graph-layer.md](ai-memory/wiki/graph-layer.md) - Graph edge derivation and search behavior.

## Code references
- [apps/backend/src/index.ts](apps/backend/src/index.ts)
- [apps/backend/src/plugins/rate-limit.ts](apps/backend/src/plugins/rate-limit.ts)
- [apps/backend/src/plugins/raw-body.ts](apps/backend/src/plugins/raw-body.ts)
- [apps/backend/src/routes/auth/index.ts](apps/backend/src/routes/auth/index.ts)
- [apps/backend/src/routes/memories/index.ts](apps/backend/src/routes/memories/index.ts)
- [apps/backend/src/routes/ingest/index.ts](apps/backend/src/routes/ingest/index.ts)
- [apps/backend/src/routes/chat/index.ts](apps/backend/src/routes/chat/index.ts)
- [apps/backend/src/services/chat.ts](apps/backend/src/services/chat.ts)
- [apps/backend/src/routes/tags/index.ts](apps/backend/src/routes/tags/index.ts)
- [apps/backend/src/routes/whatsapp/index.ts](apps/backend/src/routes/whatsapp/index.ts)
- [apps/backend/src/routes/telegram/index.ts](apps/backend/src/routes/telegram/index.ts)
- [apps/backend/src/routes/memories/index.ts](apps/backend/src/routes/memories/index.ts)
- [apps/backend/src/services/memory-graph.ts](apps/backend/src/services/memory-graph.ts)
- [apps/backend/Dockerfile](apps/backend/Dockerfile)
- [apps/backend/scripts/start-render.sh](apps/backend/scripts/start-render.sh)
- [render.yaml](render.yaml)

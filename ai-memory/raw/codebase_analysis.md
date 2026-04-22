# Codebase Analysis (Raw Notes)

## Sources scanned
- [README.md](README.md)
- [PRD.md](PRD.md)
- [context.md](context.md)
- [turbo.json](turbo.json)
- [package.json](package.json)
- [apps/backend/src/index.ts](apps/backend/src/index.ts)
- [apps/backend/src/config.ts](apps/backend/src/config.ts)
- [apps/backend/src/db.ts](apps/backend/src/db.ts)
- [apps/backend/src/routes/auth/index.ts](apps/backend/src/routes/auth/index.ts)
- [apps/backend/src/routes/memories/index.ts](apps/backend/src/routes/memories/index.ts)
- [apps/backend/src/routes/ingest/index.ts](apps/backend/src/routes/ingest/index.ts)
- [apps/backend/src/routes/chat/index.ts](apps/backend/src/routes/chat/index.ts)
- [apps/backend/src/routes/tags/index.ts](apps/backend/src/routes/tags/index.ts)
- [apps/backend/src/services/chat.ts](apps/backend/src/services/chat.ts)
- [apps/backend/src/lib/tokens.ts](apps/backend/src/lib/tokens.ts)
- [apps/frontend/app/layout.tsx](apps/frontend/app/layout.tsx)
- [apps/frontend/app/page.tsx](apps/frontend/app/page.tsx)
- [apps/frontend/lib/api.ts](apps/frontend/lib/api.ts)
- [packages/db/src/schema/index.ts](packages/db/src/schema/index.ts)
- [packages/db/src/schema/users.ts](packages/db/src/schema/users.ts)
- [packages/db/src/schema/nodes.ts](packages/db/src/schema/nodes.ts)
- [packages/db/src/schema/edges.ts](packages/db/src/schema/edges.ts)
- [packages/db/src/schema/auth.ts](packages/db/src/schema/auth.ts)
- [packages/db/src/schema/whatsapp-links.ts](packages/db/src/schema/whatsapp-links.ts)
- [packages/ai/src/index.ts](packages/ai/src/index.ts)
- [packages/graph/src/index.ts](packages/graph/src/index.ts)
- [packages/ingestion/src/pipeline.ts](packages/ingestion/src/pipeline.ts)
- [packages/validators/src/index.ts](packages/validators/src/index.ts)

## Monorepo overview
- Turborepo + Bun workspace. Tasks are defined in [turbo.json](turbo.json) and root scripts in [package.json](package.json).
- Apps include a Next.js frontend in [apps/frontend](apps/frontend) and a Fastify backend in [apps/backend](apps/backend). Additional apps exist (docs, web, landing-page) but appear secondary.
- Shared packages include database schema/client, AI utilities, graph operations, ingestion pipeline, validators, UI, and config packages.

## Backend (Fastify)
- Entry point wires plugins and routes in [apps/backend/src/index.ts](apps/backend/src/index.ts).
- Config and env vars in [apps/backend/src/config.ts](apps/backend/src/config.ts).
- Auth routes implement email/password + Google OAuth and cookie-based JWT sessions in [apps/backend/src/routes/auth/index.ts](apps/backend/src/routes/auth/index.ts).
- Token rotation + refresh family logic in [apps/backend/src/lib/tokens.ts](apps/backend/src/lib/tokens.ts).
- Memories API provides list, detail, update, delete, and semantic search in [apps/backend/src/routes/memories/index.ts](apps/backend/src/routes/memories/index.ts).
- Ingestion API accepts text/URL and file uploads in [apps/backend/src/routes/ingest/index.ts](apps/backend/src/routes/ingest/index.ts).
- Chat API uses intent classification + semantic search + Groq completion in [apps/backend/src/routes/chat/index.ts](apps/backend/src/routes/chat/index.ts) and [apps/backend/src/services/chat.ts](apps/backend/src/services/chat.ts).

## Frontend (Next.js)
- Next.js app located under [apps/frontend/app](apps/frontend/app).
- API client uses cookie auth and single-flight refresh in [apps/frontend/lib/api.ts](apps/frontend/lib/api.ts).
- No Next.js API routes detected under [apps/frontend/app/api](apps/frontend/app/api).

## Database schema
- Core tables: users, nodes, edges, tags, node_tags, conversations, messages in [packages/db/src/schema](packages/db/src/schema).
- Auth-related tables include accounts/sessions/verification_tokens and refresh_tokens in [packages/db/src/schema/auth.ts](packages/db/src/schema/auth.ts).
- WhatsApp link table in [packages/db/src/schema/whatsapp-links.ts](packages/db/src/schema/whatsapp-links.ts).
- Nodes use ULID (length 26), edges are typed, embeddings are pgvector(768) in [packages/db/src/schema/nodes.ts](packages/db/src/schema/nodes.ts) and [packages/db/src/schema/edges.ts](packages/db/src/schema/edges.ts).

## AI + graph + ingestion
- AI utilities export embeddings, summarize, auto-tag, intent in [packages/ai/src/index.ts](packages/ai/src/index.ts).
- Graph package exports node CRUD, edges, traversal, search, tags in [packages/graph/src/index.ts](packages/graph/src/index.ts).
- Ingestion pipeline orchestrates extract -> summarize -> embed -> tag -> create node -> link tags -> compute edges in [packages/ingestion/src/pipeline.ts](packages/ingestion/src/pipeline.ts).

## Validators
- Zod schemas for auth, ingestion, search, chat, profile updates in [packages/validators/src/index.ts](packages/validators/src/index.ts).

## Noted mismatches / drift
- PRD and architecture context describe Next.js API routes + NextAuth, but current implementation uses a Fastify backend with custom JWT cookies. The database still contains NextAuth-style tables, likely for compatibility or future use.
- PRD and context highlight Next.js apps in apps/web and apps/docs; current active app appears to be apps/frontend with backend in apps/backend.

## Incident notes
- 2026-04-17: `/auth/signup` intermittently returned 500 with `NeonDbError: relation "refresh_tokens" does not exist` during token issuance in [apps/backend/src/lib/tokens.ts](apps/backend/src/lib/tokens.ts).
- Root cause: database schema drift. Drizzle migrations in [packages/db/drizzle](packages/db/drizzle) did not include newer auth/session tables in applied state.
- Resolution:
	- Generated migration [packages/db/drizzle/0002_workable_roughhouse.sql](packages/db/drizzle/0002_workable_roughhouse.sql).
	- Reconciled live database using `npm run db:push` in [packages/db](packages/db).
	- Added defensive rollback/error handling in [apps/backend/src/routes/auth/index.ts](apps/backend/src/routes/auth/index.ts) so signup does not leave partially created users when token issuance fails.

## Implementation notes (2026-04-17, auth hardening + chat persistence)
- Added Fastify rate-limiting plugin in [apps/backend/src/plugins/rate-limit.ts](apps/backend/src/plugins/rate-limit.ts) and registered it in [apps/backend/src/index.ts](apps/backend/src/index.ts).
- Added route-level limits for `/auth/signup`, `/auth/login`, and `/auth/google/callback` in [apps/backend/src/routes/auth/index.ts](apps/backend/src/routes/auth/index.ts).
- Added OAuth state generation/validation via cookie on Google auth flow in [apps/backend/src/routes/auth/index.ts](apps/backend/src/routes/auth/index.ts).
- Added profile patch validation for `resumeNodeId` ownership in [apps/backend/src/routes/auth/index.ts](apps/backend/src/routes/auth/index.ts).
- Added chat persistence to `conversations` and `messages` in [apps/backend/src/routes/chat/index.ts](apps/backend/src/routes/chat/index.ts), including conversation ownership checks.
- Updated auth validator normalization in [packages/validators/src/index.ts](packages/validators/src/index.ts) to canonicalize email input.

## Implementation notes (2026-04-17, Telegram dual support)
- Added Telegram schema table in [packages/db/src/schema/telegram-links.ts](packages/db/src/schema/telegram-links.ts) and export in [packages/db/src/schema/index.ts](packages/db/src/schema/index.ts).
- Added migration script [packages/db/drizzle/0003_telegram_links.sql](packages/db/drizzle/0003_telegram_links.sql).
- Added Telegram config vars in [apps/backend/src/config.ts](apps/backend/src/config.ts): `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, and `PRIMARY_BOT`.
- Added Telegram validators in [packages/validators/src/index.ts](packages/validators/src/index.ts): `telegramLinkSchema` and `telegramVerifySchema`.
- Added Telegram service in [apps/backend/src/services/telegram.ts](apps/backend/src/services/telegram.ts) for bot `sendMessage` calls.
- Added Telegram routes in [apps/backend/src/routes/telegram/index.ts](apps/backend/src/routes/telegram/index.ts): webhook + authenticated link/verify/status/unlink endpoints.
- Registered Telegram routes in [apps/backend/src/index.ts](apps/backend/src/index.ts) under `/telegram` while preserving `/whatsapp`.
- Added Telegram settings UI in [apps/frontend/app/components/settings/telegram-link.tsx](apps/frontend/app/components/settings/telegram-link.tsx) and rendered Telegram first in [apps/frontend/app/(dashboard)/settings/page.tsx](apps/frontend/app/(dashboard)/settings/page.tsx).

## Implementation notes (2026-04-17, Telegram deep-link UX)
- Added Telegram link session schema [packages/db/src/schema/telegram-link-sessions.ts](packages/db/src/schema/telegram-link-sessions.ts) and migration [packages/db/drizzle/0004_telegram_link_sessions.sql](packages/db/drizzle/0004_telegram_link_sessions.sql).
- Added authenticated endpoint `POST /telegram/link/start` in [apps/backend/src/routes/telegram/index.ts](apps/backend/src/routes/telegram/index.ts) to mint short-lived single-use deep-link tokens.
- Updated Telegram webhook in [apps/backend/src/routes/telegram/index.ts](apps/backend/src/routes/telegram/index.ts) to handle `/start <token>`, validate token hash/expiry, and auto-link the incoming Telegram `chat.id`.
- Updated Telegram settings UI in [apps/frontend/app/components/settings/telegram-link.tsx](apps/frontend/app/components/settings/telegram-link.tsx) to remove manual chat ID entry and use one-click connect + pending polling.
- Validation: `bun --filter @repo/db check-types`, `bun --filter backend check-types`, and `bun --filter frontend check-types` all passed; `bun db:push` applied schema changes successfully.

## Implementation notes (2026-04-19, Memory Graph visualization)
- Added graph query validation schema `memoryGraphQuerySchema` in [packages/validators/src/index.ts](packages/validators/src/index.ts) with limits, per-node edge cap, tag filter, and date range parsing.
- Added graph assembly service in [apps/backend/src/services/memory-graph.ts](apps/backend/src/services/memory-graph.ts) that:
	- loads recent memory nodes (user-scoped, excluding soft-deleted),
	- reuses persisted semantic edges from `edges`,
	- derives tag-overlap and temporal-proximity edges on the fly,
	- ranks/merges edges and enforces per-node + global caps for readability.
- Added authenticated endpoint `GET /memories/graph` in [apps/backend/src/routes/memories/index.ts](apps/backend/src/routes/memories/index.ts).
- Added new dashboard page [apps/frontend/app/(dashboard)/memory-graph/page.tsx](apps/frontend/app/(dashboard)/memory-graph/page.tsx) with React Flow rendering, custom memory nodes, tag filtering, connected-node highlighting, and double-click navigation to memory detail.
- Added sidebar navigation entry for Memory Graph in [apps/frontend/app/components/dashboard/sidebar.tsx](apps/frontend/app/components/dashboard/sidebar.tsx).

## Implementation notes (2026-04-19, retrieval reliability fix)
- Root cause diagnosed for repeated "no relevant memories" replies: embedding endpoint in [packages/ai/src/embeddings.ts](packages/ai/src/embeddings.ts) was pointing to a 404 route (`router ... /pipeline/feature-extraction/...`).
- Updated embeddings model endpoint to Hugging Face router inference (`BAAI/bge-base-en-v1.5`) in [packages/ai/src/embeddings.ts](packages/ai/src/embeddings.ts), keeping 768-dim vectors compatible with `vector(768)` schema.
- Added response-shape normalization in [packages/ai/src/embeddings.ts](packages/ai/src/embeddings.ts) to safely parse array/object payload variants from HF and avoid silent retrieval failure.
- Added lexical fallback retrieval in [apps/backend/src/services/chat.ts](apps/backend/src/services/chat.ts): when semantic search returns none (or query embedding is unavailable), fallback uses `listNodes(..., search: message)` so chat can still ground on stored memories.
- Added backfill utility [apps/backend/src/scripts/backfill-embeddings.ts](apps/backend/src/scripts/backfill-embeddings.ts) and script command `backfill:embeddings` in [apps/backend/package.json](apps/backend/package.json) to regenerate missing embeddings for existing rows.
- Executed backfill locally: `processed=4, updated=4, skipped=0`.

## Implementation notes (2026-04-19, chat create/retrieve continuity)
- Fixed web chat store-intent behavior in [apps/backend/src/routes/chat/index.ts](apps/backend/src/routes/chat/index.ts):
	- route now classifies intent before response generation,
	- `store` intent now runs ingestion pipeline directly (same persistence model as Telegram webhook path),
	- response returns persisted memory id/title so frontend can surface references.
- Added short conversation history grounding in [apps/backend/src/services/chat.ts](apps/backend/src/services/chat.ts):
	- accepts prior turns and optional intent override,
	- includes up to last 6 prior turns in LLM prompt to reduce turn-to-turn forgetfulness.
- Fixed frontend conversation continuity in [apps/frontend/app/components/chat/chat-interface.tsx](apps/frontend/app/components/chat/chat-interface.tsx):
	- stores `conversationId` from first response,
	- sends same `conversationId` on subsequent requests so backend can fetch prior turns.

## Implementation notes (2026-04-20, Docker + Render backend deploy)
- Added Docker deployment artifacts:
	- [apps/backend/Dockerfile](apps/backend/Dockerfile) for Bun-based monorepo runtime build.
	- [apps/backend/scripts/start-render.sh](apps/backend/scripts/start-render.sh) to run DB migrations before API startup.
	- [.dockerignore](.dockerignore) to reduce Docker build context and exclude local env/cache artifacts.
	- [render.yaml](render.yaml) with Render Docker service blueprint using repo-root context and backend Dockerfile path.
- Deployment startup flow now runs `db:migrate` from [packages/db/package.json](packages/db/package.json) and then starts backend from source with `tsx` to preserve current workspace package exports that target TypeScript source.
- Added missing runtime dependency `fastify-raw-body` in [apps/backend/package.json](apps/backend/package.json) to match usage in [apps/backend/src/plugins/raw-body.ts](apps/backend/src/plugins/raw-body.ts).

## Implementation notes (2026-04-20, runtime/migration separation)
- Refactored startup script [apps/backend/scripts/start-render.sh](apps/backend/scripts/start-render.sh) to runtime-only execution (`bun run --cwd apps/backend start:prod`) with no migration invocation.
- Added migration-only script [apps/backend/scripts/migrate-render.sh](apps/backend/scripts/migrate-render.sh) so `drizzle.config.ts` is used strictly for CLI/migrations.
- Simplified [apps/backend/Dockerfile](apps/backend/Dockerfile) by removing global npm CLI installs and relying on workspace-resolved Bun scripts.
- Added explicit runtime-only note in [packages/db/src/client.ts](packages/db/src/client.ts) to prevent accidental drizzle-kit config coupling.

## Implementation notes (2026-04-21, Groq model-not-found hotfix)
- Root cause for repeated chat fallback `Sorry, something went wrong.` was invalid model IDs being sent to Groq (`chatgpt-4o-latest` and `codex-mini-latest`) from shared AI package modules.
- Updated model IDs to Groq-supported options:
	- [packages/ai/src/intent.ts](packages/ai/src/intent.ts): `llama-3.1-8b-instant`
	- [packages/ai/src/auto-tag.ts](packages/ai/src/auto-tag.ts): `llama-3.1-8b-instant`
	- [packages/ai/src/summarize.ts](packages/ai/src/summarize.ts): `llama-3.3-70b-versatile`
- Also improved chat UI error surfacing in [apps/frontend/app/components/chat/chat-interface.tsx](apps/frontend/app/components/chat/chat-interface.tsx) to show backend error detail instead of a generic fallback.

## Implementation notes (2026-04-21, Render runtime hardening)
- Confirmed `tsx` runtime startup under Bun in production is fragile (`Cannot find module './cjs/index.cjs'` from Bun when executing `tsx src/index.ts`).
- Switched backend production path to compile then run JavaScript:
	- [apps/backend/package.json](apps/backend/package.json): `start:prod` now runs `bun dist/index.js`; `start`/`start:deploy` now build first.
	- [apps/backend/Dockerfile](apps/backend/Dockerfile): build step `bun run --cwd apps/backend build` is executed during image build.
	- [apps/backend/scripts/start-render.sh](apps/backend/scripts/start-render.sh): runtime-only startup with prebuilt dist artifact; no TypeScript runtime execution.

## Implementation notes (2026-04-21, normalized memory layer foundation)
- Added normalized memory schema under [packages/db/src/schema](packages/db/src/schema):
	- [artifacts.ts](packages/db/src/schema/artifacts.ts)
	- [memory-records.ts](packages/db/src/schema/memory-records.ts)
	- [memory-evidence.ts](packages/db/src/schema/memory-evidence.ts)
	- [memory-edges.ts](packages/db/src/schema/memory-edges.ts)
	- [conversation-state.ts](packages/db/src/schema/conversation-state.ts)
- Added migration [packages/db/drizzle/0005_memory_layer.sql](packages/db/drizzle/0005_memory_layer.sql) with new enums/tables, HNSW vector index, and FTS index for `memory_records`.
- Introduced shared package [packages/memory](packages/memory) for artifact creation, LLM-based post-turn memory extraction, merge/upsert logic, conversation-state updates, and normalized memory search.
- Refactored backend chat into orchestrated services:
	- [intent-service.ts](apps/backend/src/services/intent-service.ts)
	- [retrieval-service.ts](apps/backend/src/services/retrieval-service.ts)
	- [context-builder.ts](apps/backend/src/services/context-builder.ts)
	- [reasoning-service.ts](apps/backend/src/services/reasoning-service.ts)
	- [chat-orchestrator.ts](apps/backend/src/services/chat-orchestrator.ts)
- [apps/backend/src/routes/chat/index.ts](apps/backend/src/routes/chat/index.ts) now returns `confidence`, `grounding`, and `memoryWriteStatus`, persists richer metadata, and triggers post-turn normalized memory processing.
- Added authenticated internal endpoints in [apps/backend/src/routes/internal/index.ts](apps/backend/src/routes/internal/index.ts) for event-style hooks, extraction, merge, context reads, and reindex search.
- Updated [packages/ingestion/src/pipeline.ts](packages/ingestion/src/pipeline.ts) to create an `artifact` in addition to the legacy graph `node`, and `IngestResult` now includes optional `artifactId`.
- Validation completed:
	- `tsc --noEmit -p packages/memory/tsconfig.json`
	- `tsc --noEmit -p packages/db/tsconfig.json`
	- `tsc --noEmit -p packages/ingestion/tsconfig.json`
	- `tsc --noEmit -p apps/backend/tsconfig.json`
	- `bun --filter @repo/db test`
	- `bun --filter @repo/ai test`
	- `bun --filter @repo/ingestion test`

## Incident notes (2026-04-21, memory_records missing in live DB)
- Symptom: `POST /chat` returned 500 with `relation "memory_records" does not exist` from [packages/memory/src/search.ts](packages/memory/src/search.ts) during normalized retrieval.
- Root cause: code was deployed before the new normalized memory schema was applied to the database.
- Resolution:
	- Added defensive fallback in [packages/memory/src/search.ts](packages/memory/src/search.ts) so missing normalized-memory tables return `[]` instead of crashing chat; retrieval then falls back to legacy graph search.
	- `bun --filter @repo/db db:migrate` failed because the live database already had older objects and migration history was drifted (`type "edge_type" already exists`).
	- Applied schema reconciliation with `bun --filter @repo/db db:push`, which created the missing normalized memory tables successfully.

# Architecture

## Summary
Personal Memory OS is a monorepo with a Next.js frontend and a Fastify backend that stores memories in a Postgres graph schema and enriches them through AI summarization, tagging, and embeddings. Ingestion and graph operations are factored into shared packages to keep the backend thin.

## Detailed explanation
- Runtime components: a Next.js UI client, a Fastify API server, and a Neon Postgres database with pgvector.
- Data flow: user input -> backend ingest route -> extraction and AI enrichment -> graph storage -> optional semantic links -> retrieval via list/search or chat.
- The shared packages isolate AI utilities, ingestion logic, graph queries, and database schema to reduce duplication.
- A single API client in the frontend handles cookie auth and refresh rotation for all requests.
- The PRD describes Next.js API routes and NextAuth, but the implementation uses a Fastify server with JWT cookies and custom refresh token rotation.

## Relationships
- [ai-memory/wiki/monorepo-tooling.md](ai-memory/wiki/monorepo-tooling.md) - Repository layout and build tooling.
- [ai-memory/wiki/backend-api.md](ai-memory/wiki/backend-api.md) - Fastify routes and API surface.
- [ai-memory/wiki/frontend-app.md](ai-memory/wiki/frontend-app.md) - UI client and API calls.
- [ai-memory/wiki/ai-layer.md](ai-memory/wiki/ai-layer.md) - Summarization, tagging, embeddings, intent.
- [ai-memory/wiki/ingestion-pipeline.md](ai-memory/wiki/ingestion-pipeline.md) - Ingestion orchestration.
- [ai-memory/wiki/graph-layer.md](ai-memory/wiki/graph-layer.md) - Graph operations and traversal.
- [ai-memory/wiki/db-schema.md](ai-memory/wiki/db-schema.md) - Database structure and constraints.
- [ai-memory/wiki/auth-system.md](ai-memory/wiki/auth-system.md) - Auth flow and token rotation.

## Code references
- [apps/backend/src/index.ts](apps/backend/src/index.ts)
- [apps/frontend/app/layout.tsx](apps/frontend/app/layout.tsx)
- [apps/frontend/lib/api.ts](apps/frontend/lib/api.ts)
- [packages/ingestion/src/pipeline.ts](packages/ingestion/src/pipeline.ts)
- [packages/graph/src/index.ts](packages/graph/src/index.ts)
- [packages/db/src/schema/index.ts](packages/db/src/schema/index.ts)

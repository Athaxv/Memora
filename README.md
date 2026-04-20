# Personal Memory OS

Personal Memory OS is an AI-powered memory platform that turns user inputs (notes, links, messages, documents, ideas, media) into a structured knowledge graph.

It is designed as a second brain: capture information quickly, connect it semantically, and retrieve it through natural language chat or graph exploration.

## What this project does

- Ingests user content from UI and messaging channels.
- Enriches memories with AI summaries, intent, tags, and embeddings.
- Stores memory as a graph in Postgres (Neon) + pgvector.
- Retrieves memories by semantic similarity and graph relationships.
- Supports chat with conversation history and memory-aware responses.

## Knowledge graph model

The core data model is node-edge based.

### Node types

Nodes represent memory units. The current schema supports:

- `link`
- `note`
- `document`
- `message`
- `idea`
- `media`

### Node shape

Each node stores:

- `id` (ULID for time-sortability)
- `userId`
- `type`
- `title`
- `content`
- `summary`
- `source` and `sourceUrl`
- `metadata` (JSON)
- `embedding` (`vector(768)`)
- `createdAt`, `updatedAt`, optional `deletedAt`

### Edge types

Edges represent how two nodes are related:

- `semantic`: meaning-level similarity
- `temporal`: time proximity
- `source`: common source channel
- `tag`: shared tags/topics
- `reference`: explicit references
- `derived`: inferred/system-generated links

Edge records include `weight`, `metadata`, and ownership by `userId`.

### Tags and chat context

- Tags are normalized in `tags` and connected through `node_tags`.
- Chat sessions are stored in `conversations` and `messages`.
- Chat writes both user and assistant turns and can reuse existing conversation IDs.

## High-level architecture

### Frontend

- Next.js app (`apps/frontend`) for dashboard, memory interaction, and chat.

### Backend

- Fastify API (`apps/backend`) with auth, ingestion, memories, tags, chat, and webhook routes.
- Cookie/JWT auth with refresh-token rotation.

### Shared packages

- `@repo/ai`: LLM calls (intent, summarization, tagging)
- `@repo/ingestion`: ingestion orchestration
- `@repo/graph`: graph CRUD/search/traversal helpers
- `@repo/db`: Drizzle schema and DB client
- `@repo/validators`: shared zod schemas

### Data layer

- Neon Postgres + pgvector for relational + semantic memory retrieval.

## Ingestion and retrieval flow

1. User submits content (text/link/file/message).
2. Backend validates and normalizes payload.
3. AI layer generates summary, tags, and embeddings.
4. Graph layer creates node and related edges.
5. Retrieval uses semantic search + graph traversal.
6. Chat composes responses from relevant memory context.

## Monorepo layout

```txt
apps/
	frontend/        # Next.js primary product UI
	backend/         # Fastify API
	landing-page/    # marketing UI
	docs/            # docs app
	web/             # additional web app
packages/
	ai/
	db/
	graph/
	ingestion/
	validators/
	ui/
	eslint-config/
	typescript-config/
```

## Prerequisites

- Bun `1.3.3` (workspace package manager)
- Node `>=18` (engine compatibility)
- Postgres with pgvector (Neon recommended)

## Environment variables

Backend requires:

- `DATABASE_URL`
- `JWT_SECRET`
- `GROQ_API_KEY`

Recommended for local dev:

- `FRONTEND_URL` (default: `http://localhost:3000`)
- `COOKIE_SECRET` (defaults to `JWT_SECRET` in local; must be different in production)
- `HF_API_KEY` (optional, depending on embedding strategy)

Production requirements:

- `COOKIE_SECRET` is mandatory and must differ from `JWT_SECRET`.
- `FRONTEND_URL` is mandatory.
- Bot-specific vars are required when `PRIMARY_BOT` enables WhatsApp and/or Telegram.

## Local development

Install dependencies from repo root:

```bash
bun install
```

Run all apps/packages in dev mode:

```bash
bun run dev
```

Run only backend:

```bash
bun --filter backend run dev
```

Run only frontend:

```bash
bun --filter frontend run dev
```

Type-check everything:

```bash
bun run check-types
```

## Database commands

From repo root:

```bash
bun --filter @repo/db run db:generate
bun --filter @repo/db run db:migrate
```

## Production backend runtime

The backend production path is compile-first:

1. Build TypeScript to `dist/`
2. Run compiled JavaScript (`dist/index.js`)

Package scripts:

- `start`: build then run compiled output
- `start:prod`: run compiled output only
- `start:deploy`: build then run prod start

This avoids runtime instability from direct TypeScript execution in production.

## API surface overview

Main route groups exposed by backend:

- `/auth`
- `/memories`
- `/ingest`
- `/tags`
- `/chat`
- `/whatsapp`
- `/telegram`
- `/memory/graph` (alias endpoint)
- `/health`

## Documentation map

Deep-dive docs are in `ai-memory/wiki`:

- `architecture.md`
- `graph-layer.md`
- `db-schema.md`
- `backend-api.md`
- `frontend-app.md`
- `ingestion-pipeline.md`
- `ai-layer.md`
- `auth-system.md`

## Current status

This repository is an actively evolving implementation of the Personal Memory OS PRD. Core graph ingestion, semantic retrieval, and memory-aware chat are in place, with continued improvements across integrations and UX.

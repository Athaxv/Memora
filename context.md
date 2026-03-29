# Personal Memory OS — Architecture Context

> AI-powered knowledge graph system that captures, structures, and retrieves user memories through natural language.

**Last updated:** 2026-03-22
**Phase:** 1 (Foundation) — Complete
**Status:** Core backend + frontend implemented, database deployed on Neon

---

## 1. Monorepo Overview

| Field | Value |
|-------|-------|
| Package manager | Bun 1.3.3 |
| Build system | Turborepo 2.8.17 |
| Language | TypeScript 5.9.2 |
| Workspace convention | `"*"` (not `"workspace:*"`) |
| Node minimum | >=18 |

### Directory Structure

```
build/
├── apps/
│   ├── frontend/          # Main web app (Next.js 16.1.7 + React 19)
│   ├── landing-page/      # Marketing site (do NOT touch)
│   ├── web/               # Boilerplate (unused)
│   └── docs/              # Boilerplate (unused)
├── packages/
│   ├── db/                # Database schema + client (Drizzle ORM + Neon)
│   ├── ai/                # AI utilities (Groq LLM + HuggingFace embeddings)
│   ├── graph/             # Knowledge graph operations (CRUD, search, traversal)
│   ├── ingestion/         # Content extraction + ingestion pipeline
│   ├── ui/                # Shared React component library
│   ├── eslint-config/     # Shared ESLint config
│   └── typescript-config/ # Shared TypeScript config
├── turbo.json
├── package.json
└── PRD.md
```

### Turborepo Tasks

| Task | Cache | Notes |
|------|-------|-------|
| `build` | Yes | Outputs: `.next/**`, `dist/**` |
| `dev` | No | Persistent |
| `check-types` | Yes | `tsc --noEmit` |
| `lint` | Yes | ESLint |
| `db:generate` | No | Drizzle migration generation |
| `db:migrate` | No | Run migrations |
| `db:push` | No | Push schema to database |
| `db:studio` | No | Persistent, Drizzle Studio |

---

## 2. `packages/db` — Database Layer

**ORM:** Drizzle ORM with `@neondatabase/serverless` (neon-http driver)
**Database:** Neon PostgreSQL with pgvector extension
**ID Strategy:** ULID (26-char, time-sortable) for nodes, UUID for everything else
**Soft deletes:** `deletedAt` timestamp on nodes

### Schema Tables

#### `users`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | `defaultRandom()` |
| `email` | VARCHAR(255) | Unique, not null |
| `name` | VARCHAR(255) | |
| `avatar_url` | TEXT | |
| `hashed_password` | TEXT | For credential auth |
| `email_verified` | TIMESTAMPTZ | |
| `created_at` | TIMESTAMPTZ | Not null, default now |
| `updated_at` | TIMESTAMPTZ | Not null, default now |

#### `accounts` / `sessions` / `verification_tokens`
NextAuth v5 adapter tables (via `@auth/drizzle-adapter`). Standard schema.

#### `nodes` (core memory table)
| Column | Type | Notes |
|--------|------|-------|
| `id` | VARCHAR(26) (PK) | ULID |
| `user_id` | UUID (FK → users) | CASCADE delete |
| `type` | ENUM `node_type` | `link`, `note`, `document`, `message`, `idea`, `media` |
| `title` | VARCHAR(500) | |
| `content` | TEXT | Raw content |
| `summary` | TEXT | AI-generated |
| `source` | VARCHAR(100) | `web`, `manual`, `upload` |
| `source_url` | TEXT | Original URL |
| `metadata` | JSONB | Flexible metadata |
| `embedding` | `vector(768)` | pgvector, nomic-embed-text-v1.5 dimension |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |
| `deleted_at` | TIMESTAMPTZ | Soft delete |

**Indexes:** `user_id`, `(user_id, type)`, `created_at`
**Note:** pgvector custom type uses `customType` with JSON serialization for driver compat.

#### `edges` (relationships)
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK → users) | CASCADE |
| `source_node_id` | VARCHAR(26) (FK → nodes) | CASCADE |
| `target_node_id` | VARCHAR(26) (FK → nodes) | CASCADE |
| `type` | ENUM `edge_type` | `semantic`, `temporal`, `source`, `tag`, `reference`, `derived` |
| `weight` | REAL | Default 1.0, similarity score for semantic edges |
| `metadata` | JSONB | |
| `created_at` | TIMESTAMPTZ | |

**Unique constraint:** `(source_node_id, target_node_id, type)`

#### `tags`
| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK → users) | CASCADE |
| `name` | VARCHAR(100) | Lowercase, hyphenated |
| `is_ai` | BOOLEAN | AI-generated vs user-created |
| `created_at` | TIMESTAMPTZ | |

**Unique constraint:** `(user_id, name)`

#### `node_tags` (junction)
Composite PK: `(node_id, tag_id)`, both CASCADE delete.

#### `conversations`
UUID PK, `user_id` FK, `title`, timestamps.

#### `messages`
UUID PK, `conversation_id` FK (CASCADE), `role` enum (`user`, `assistant`, `system`), `content` text, `metadata` JSONB, `created_at`.

### Client

```typescript
// packages/db/src/client.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
export function createDb(databaseUrl: string) { ... }
export type Database = ReturnType<typeof createDb>;
```

### Exports
- `@repo/db` → `src/index.ts` (re-exports schema + client)
- `@repo/db/schema` → `src/schema/index.ts`
- `@repo/db/client` → `src/client.ts`

---

## 3. `packages/ai` — AI Utilities

**LLM Provider:** Groq (OpenAI-compatible SDK, base URL: `https://api.groq.com/openai/v1`)
**LLM Model:** `meta-llama/llama-4-scout-17b-16e-instruct`
**Embedding Provider:** HuggingFace Inference API (optional, requires `HF_API_KEY`)
**Embedding Model:** `nomic-ai/nomic-embed-text-v1.5` (768 dimensions)

### Modules

#### `@repo/ai/embeddings` — `generateEmbedding(text, apiKey, purpose)` / `generateEmbeddings(texts, apiKey, purpose)`
- Uses HuggingFace Inference API with `nomic-embed-text-v1.5`
- `purpose` param: `"document"` (storage) or `"query"` (retrieval) — prefixes text accordingly
- Returns `null` if no API key provided (embeddings are optional)
- Max input: 8000 chars

#### `@repo/ai/summarize` — `summarize(content, apiKey)`
- Groq LLM, max_tokens 300
- Truncates input to 10000 chars
- Returns 2-3 sentence summary

#### `@repo/ai/auto-tag` — `autoTag(content, apiKey)`
- Groq LLM, max_tokens 300
- Returns `TagResult[]` — `{ name: string, confidence: number }`
- Zod-validated JSON output, returns `[]` on parse failure
- Tags are lowercase, hyphenated (e.g., `machine-learning`)

#### `@repo/ai/intent` — `classifyIntent(message, apiKey)`
- Groq LLM, max_tokens 200
- Returns `IntentResult` — `{ intent, entities[], confidence }`
- Intents: `store`, `retrieve`, `summarize`, `connect`, `ask`, `manage`
- Falls back to `{ intent: "ask", entities: [], confidence: 0.5 }` on failure

### Types (`@repo/ai/types`)
```typescript
interface TagResult { name: string; confidence: number; }
type Intent = "store" | "retrieve" | "summarize" | "connect" | "ask" | "manage";
interface IntentResult { intent: Intent; entities: string[]; confidence: number; }
```

---

## 4. `packages/graph` — Knowledge Graph Operations

All functions take `Database` as first argument (dependency injection pattern).

### Node Operations (`nodes.ts`)
| Function | Signature | Notes |
|----------|-----------|-------|
| `createNode` | `(db, input: CreateNodeInput) → Node` | Generates ULID, inserts, returns |
| `getNode` | `(db, nodeId, userId) → Node \| null` | Filters soft-deleted |
| `listNodes` | `(db, userId, opts: ListNodesOptions) → ListNodesResult` | Cursor pagination via ULID ordering (DESC), ilike search on title/content |
| `updateNode` | `(db, nodeId, userId, input) → Node \| null` | Sets `updatedAt` |
| `softDeleteNode` | `(db, nodeId, userId) → boolean` | Sets `deletedAt` |

**Pagination:** Cursor-based using ULID (`lt(nodes.id, cursor)` + `DESC` order). Fetches `limit + 1` to determine `hasMore`.

### Edge Operations (`edges.ts`)
| Function | Signature | Notes |
|----------|-----------|-------|
| `computeSemanticEdges` | `(db, nodeId, userId, embedding) → edgeCount` | Finds top-10 similar nodes above 0.75 threshold via pgvector cosine distance, creates edges idempotently |
| `createEdge` | `(db, input) → Edge` | `onConflictDoNothing()` |
| `getEdgesForNode` | `(db, nodeId, userId) → Edge[]` | Both directions |

### Search (`search.ts`)
| Function | Signature | Notes |
|----------|-----------|-------|
| `semanticSearch` | `(db, userId, queryEmbedding, opts) → SearchResult[]` | pgvector `<=>` cosine distance, default threshold 0.5, optional type filter |

### Traversal (`traversal.ts`)
| Function | Signature | Notes |
|----------|-----------|-------|
| `getRelatedNodes` | `(db, nodeId, userId, limit) → { node, edgeType, weight }[]` | 1-hop graph traversal via SQL JOIN, ordered by weight DESC |

### Tag Operations (`tags.ts`)
| Function | Signature | Notes |
|----------|-----------|-------|
| `upsertTags` | `(db, userId, tagNames, isAi) → Tag[]` | `onConflictDoNothing` + fallback select |
| `addTagsToNode` | `(db, nodeId, tagIds) → void` | |
| `getTagsForUser` | `(db, userId) → Tag[]` | |
| `getTagsForNode` | `(db, nodeId) → Tag[]` | JOIN through `nodeTags` |
| `removeTagFromNode` | `(db, nodeId, tagId) → void` | |

### Exported Types
```typescript
type Node = typeof nodes.$inferSelect;
type Edge = typeof edges.$inferSelect;
type Tag = typeof tags.$inferSelect;
interface ListNodesOptions { cursor?, limit?, type?, tagIds?, dateFrom?, dateTo?, search? }
interface ListNodesResult { nodes: Node[]; nextCursor: string | null }
interface SearchResult { node: Node; similarity: number }
interface CreateNodeInput { userId, type, title?, content?, summary?, source?, sourceUrl?, metadata?, embedding? }
interface UpdateNodeInput { title?, content?, summary?, metadata? }
```

---

## 5. `packages/ingestion` — Content Pipeline

### Pipeline Flow (`ingest(ctx, input) → IngestResult`)

```
Input → Extract → Summarize (Groq) → Embed (HF, optional) → Auto-tag (Groq)
  → Create Node → Upsert Tags → Link Tags → Compute Semantic Edges
```

### Context & Input Types
```typescript
interface PipelineContext {
  db: Database;
  groqApiKey: string;
  hfApiKey?: string;        // Optional — embeddings skipped without it
}

interface IngestInput {
  userId: string;
  type: "text" | "url" | "file";
  content: string;
  title?: string;
  tags?: string[];           // User-provided tags
  fileName?: string;         // For file uploads
  mimeType?: string;         // For file uploads
  fileBuffer?: Buffer;       // For file uploads
}

interface IngestResult {
  nodeId: string;
  title: string | null;
  summary: string;
  tags: string[];
  edgeCount: number;
}
```

### Extractors

| Extractor | Input | Output | Notes |
|-----------|-------|--------|-------|
| `extractText` | `(content, title?)` | `ExtractedContent` | Passthrough, infers title from first line |
| `extractUrl` | `(url)` | `ExtractedContent` | Fetches URL, strips HTML (script/style/nav/footer/header), extracts title from `<title>`, `<h1>`, or `og:title`. 10s timeout |
| `extractFile` | `(buffer, mimeType, fileName, groqApiKey)` | `ExtractedContent` | Routes by MIME: PDF → `pdf-parse`, images → Groq vision (llama-4-scout), text → UTF-8 passthrough |

### Type Resolution
| Input type | Node type |
|------------|-----------|
| `url` | `link` |
| `file` (image/*) | `media` |
| `file` (application/pdf) | `document` |
| `file` (other) | `note` |
| `text` | `note` |

---

## 6. `apps/frontend` — Main Web Application

**Framework:** Next.js 16.1.7 (App Router, React 19, Tailwind CSS v4)
**Auth:** NextAuth v5 (beta.25) with DrizzleAdapter, JWT sessions
**UI:** shadcn/ui (badge, button, card, separator) + custom components
**Animation:** motion (Framer Motion v12)

### Environment Variables

| Variable | Required | Used by |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Neon connection string |
| `NEXTAUTH_URL` | Yes | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Yes | JWT signing |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth |
| `GROQ_API_KEY` | Yes | LLM (summarize, tag, intent, chat) |
| `HF_API_KEY` | Optional | Embeddings (nomic-embed-text-v1.5) |

### Auth Configuration (`lib/auth.ts`)
- **Adapter:** DrizzleAdapter connected to Neon
- **Strategy:** JWT (not database sessions)
- **Providers:** Google OAuth + Credentials (bcrypt password verification)
- **Callbacks:** Injects `user.id` into JWT token and session object
- **Custom pages:** `/login`

### Database Singleton (`lib/db.ts`)
```typescript
import { createDb } from "@repo/db/client";
export const db = createDb(process.env.DATABASE_URL!);
```

### Validation Schemas (`lib/validators.ts`)
| Schema | Fields |
|--------|--------|
| `signUpSchema` | name (1-255), email, password (8-100) |
| `ingestSchema` | type (`text`\|`url`), content (1-100K), title?, tags? (max 20) |
| `updateNodeSchema` | title?, content?, summary? |
| `searchSchema` | query (1-1000), limit? (1-50), type? |
| `chatSchema` | conversationId? (UUID), message (1-5000) |

### API Routes

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/auth/[...nextauth]` | * | No | NextAuth handler |
| `/api/signup` | POST | No | Register with email/password (bcrypt hash) |
| `/api/ingest` | POST | Yes | Run ingestion pipeline (text or URL) |
| `/api/memories` | GET | Yes | List memories (cursor, limit, type, q, from, to) |
| `/api/memories/[id]` | GET | Yes | Node + tags + related nodes (max 10) |
| `/api/memories/[id]` | PATCH | Yes | Update title/content/summary |
| `/api/memories/[id]` | DELETE | Yes | Soft delete |
| `/api/memories/search` | POST | Yes | Semantic search (requires HF_API_KEY) |
| `/api/tags` | GET | Yes | All tags for user |
| `/api/chat` | POST | Yes | Intent classify → embed → search → Groq response with citations |
| `/api/ingest/upload` | POST | Yes | File upload endpoint (multipart form) |

### Page Structure

```
app/
├── layout.tsx              # Root layout (metadata: "Memory OS")
├── page.tsx                # Landing/redirect page
├── globals.css             # Tailwind v4 styles
├── (auth)/
│   ├── layout.tsx          # Centered card layout
│   ├── login/page.tsx      # Google + email/password login
│   └── signup/page.tsx     # Google + email/password registration
├── (dashboard)/
│   ├── layout.tsx          # Auth guard (redirects to /login)
│   ├── page.tsx            # Main dashboard: header + sidebar + quick capture + memory feed
│   ├── memories/[id]/page.tsx  # Memory detail: content, tags, connections, delete
│   └── chat/page.tsx       # AI chat interface
├── components/
│   ├── dashboard/
│   │   ├── header.tsx      # Search bar, nav links
│   │   ├── sidebar.tsx     # Filter by node type
│   │   ├── quick-capture.tsx   # Auto-detects URL vs text
│   │   ├── memory-card.tsx # Color-coded type badges, truncated summary
│   │   ├── memory-feed.tsx # IntersectionObserver infinite scroll
│   │   └── timeline-view.tsx
│   ├── chat/
│   │   └── chat-interface.tsx  # Full chat UI, auto-scroll, memory citations
│   └── landing/
│       └── ...             # Landing page components
├── api/
│   └── (see API Routes above)
├── components/ui/          # shadcn components (badge, button, card, separator)
└── lib/
    ├── auth.ts
    ├── db.ts
    ├── validators.ts
    ├── api-utils.ts        # withAuth helper, jsonResponse, errorResponse
    └── utils.ts            # cn() utility for tailwind-merge
```

### Key Frontend Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.1.7 | Framework |
| `react` | 19.2.3 | UI |
| `next-auth` | 5.0.0-beta.25 | Authentication |
| `@auth/drizzle-adapter` | ^1.7.0 | DB adapter for NextAuth |
| `drizzle-orm` | ^0.39.0 | ORM (direct dep for type compat) |
| `openai` | ^4.80.0 | Groq client (OpenAI-compatible) |
| `bcryptjs` | ^2.4.3 | Password hashing |
| `zod` | ^3.24.0 | Input validation |
| `lucide-react` | ^0.577.0 | Icons |
| `motion` | ^12.38.0 | Animations |
| `shadcn` | ^4.1.0 | UI component CLI |
| `class-variance-authority` | ^0.7.1 | Component variants |
| `tailwind-merge` | ^3.5.0 | Class merging |

---

## 7. Data Flow Diagrams

### Memory Ingestion (Text/URL)

```
User Input (Quick Capture)
    │
    ▼
POST /api/ingest { type, content, title?, tags? }
    │
    ├── Auth check (NextAuth session)
    ├── Zod validation (ingestSchema)
    │
    ▼
ingest(ctx, input) — packages/ingestion
    │
    ├── 1. Extract content
    │       text → passthrough
    │       url  → fetch + strip HTML
    │       file → pdf-parse / Groq vision / UTF-8
    │
    ├── 2. Summarize (Groq LLM)
    │
    ├── 3. Generate embedding (HuggingFace, optional)
    │
    ├── 4. Auto-tag (Groq LLM → JSON array)
    │
    ├── 5. Create node (ULID, insert to DB)
    │
    ├── 6. Upsert tags (user + AI tags)
    │
    ├── 7. Link tags to node (node_tags junction)
    │
    └── 8. Compute semantic edges (pgvector cosine > 0.75, max 10)
    │
    ▼
Response: { nodeId, title, summary, tags[], edgeCount }
```

### AI Chat Flow

```
User Message
    │
    ▼
POST /api/chat { message, conversationId? }
    │
    ├── 1. Classify intent (Groq) → { intent, entities, confidence }
    │
    ├── 2. Generate query embedding (HuggingFace, optional)
    │
    ├── 3. Semantic search (pgvector, top 5 results)
    │
    ├── 4. Build memory context string
    │
    └── 5. Generate response (Groq LLM with system prompt + memory context)
    │
    ▼
Response: { message, intent, memories[{ id, title, summary, type, similarity }] }
```

### Memory Retrieval

```
GET /api/memories?cursor=&limit=&type=&q=&from=&to=
    │
    ▼
listNodes(db, userId, opts)
    │
    ├── WHERE user_id = ? AND deleted_at IS NULL
    ├── + type filter
    ├── + date range filter
    ├── + ilike search (title OR content)
    ├── + cursor pagination (id < cursor)
    │
    ▼
ORDER BY id DESC, LIMIT limit+1
    │
    ▼
{ nodes[], nextCursor }
```

---

## 8. Known Limitations & Technical Debt

| Item | Details |
|------|---------|
| **Embeddings optional** | Without `HF_API_KEY`, semantic search and edge computation are disabled. System works but degrades to keyword-only search. |
| **No ivfflat index** | pgvector cosine index should be created after ~1000+ vectors for performance. Currently using sequential scan. |
| **No streaming chat** | Chat responses are not streamed (returns full response). SSE/streaming is Phase 2. |
| **No file upload route validation** | `/api/ingest/upload` exists but `ingestSchema` only validates `text`/`url` types. File uploads need separate validation. |
| **Image extraction model** | Uses `llama-4-scout` for vision via Groq — verify model supports `image_url` content type on Groq's API. |
| **No conversation persistence** | `conversations`/`messages` tables exist but chat API doesn't persist messages yet. |
| **No rate limiting** | API routes have no rate limiting. |
| **No RLS** | Row-level security not enabled on Neon — enforced in application code via `userId` filters. |
| **Search is basic** | No full-text search (tsvector), no RRF re-ranking. Currently semantic-only or ilike keyword. |

---

## 9. Phase 2 Roadmap (from PRD)

- [ ] Streaming chat responses (SSE)
- [ ] Conversation persistence (use `conversations`/`messages` tables)
- [ ] Full-text search (PostgreSQL tsvector) + hybrid RRF ranking
- [ ] Graph explorer (visual, force-directed)
- [ ] Timeline view
- [ ] Collections (user-created groups)
- [ ] File upload UI (PDF, images)
- [ ] Privacy dashboard + data export
- [ ] Weekly digest (AI summary)
- [ ] Pattern detection + insights

---

## 10. Commands Reference

```bash
# Development
bun run --filter frontend dev          # Start frontend dev server
bun run --filter @repo/db db:push      # Push schema to Neon
bun run --filter @repo/db db:generate  # Generate migration
bun run --filter @repo/db db:studio    # Open Drizzle Studio

# Build & Check
bun run build                          # Build all packages
bun run check-types                    # Type check all packages (turbo)
bun run lint                           # Lint all packages

# Install
bun install                            # Install all workspace dependencies
```

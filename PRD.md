# Product Requirements Document: Personal Memory OS

**Version:** 1.0
**Date:** 2026-03-18
**Status:** Draft

---

## 1. Executive Summary

Personal Memory OS is a production-grade, AI-powered platform that transforms scattered personal data into a structured, queryable, and intelligent memory layer. It captures information from multiple sources, organizes it as a dynamic knowledge graph, and provides natural-language retrieval powered by semantic search and graph traversal.

The system acts as a **second brain** — it remembers what users forget, connects ideas across time, and evolves as more data is added.

---

## 2. Problem Statement

Users generate and consume vast amounts of information daily — links, notes, messages, documents, ideas, media. This data is:

- **Fragmented** across apps (WhatsApp, browsers, email, files)
- **Unstructured** with no relationships between pieces
- **Difficult to retrieve** — search depends on exact keywords, not meaning
- **Context-lost** — when and why something was saved is forgotten
- **Static** — stored data doesn't surface insights or connections

There is no unified system that captures, connects, and makes personal information *intelligent*.

---

## 3. Product Vision

> A personal intelligence layer that captures everything you choose to remember, connects it meaningfully, and retrieves it when you need it — through natural language.

---

## 4. Target Users

### Primary: Knowledge Workers & Power Users
- Researchers, developers, writers, students, founders
- People who consume high volumes of information daily
- Users who currently juggle Notion, bookmarks, notes apps, and messaging

### Secondary: General Consumers
- Anyone who wants a smarter way to save and recall information
- Users who want AI-powered organization without manual effort

### User Personas

**Persona 1: Priya — Startup Founder**
- Saves 50+ links/week, takes meeting notes, collects ideas
- Struggles to find "that article I read 3 weeks ago about pricing"
- Needs: contextual recall, timeline exploration, connection surfacing

**Persona 2: Arjun — Graduate Researcher**
- Reads papers, annotates, collects references across topics
- Needs to see how research topics connect over time
- Needs: semantic search, automatic clustering, citation trails

**Persona 3: Meera — Casual User**
- Forwards interesting things on WhatsApp to "save for later"
- Never goes back because there's no good retrieval mechanism
- Needs: frictionless capture, natural language recall

---

## 5. Core Architecture

### 5.1 Knowledge Graph Model

```
┌─────────────────────────────────────────────────────┐
│                    MEMORY GRAPH                      │
│                                                      │
│   ┌──────┐  semantic   ┌──────┐  temporal  ┌──────┐ │
│   │ Node ├────────────►│ Node ├───────────►│ Node │ │
│   │(Link)│             │(Note)│            │(Idea)│ │
│   └──┬───┘             └──┬───┘            └──┬───┘ │
│      │ source              │ tag               │     │
│      ▼                     ▼                   │     │
│   ┌──────┐             ┌──────┐               │     │
│   │Source│             │ Tag  │◄──────────────┘     │
│   │(Web) │             │(AI)  │   ai-inferred       │
│   └──────┘             └──────┘                      │
└─────────────────────────────────────────────────────┘
```

**Nodes** represent any piece of information:
| Node Type | Examples |
|-----------|----------|
| `link` | Web URLs, articles, tweets |
| `note` | User-written text, annotations |
| `document` | PDFs, files, uploads |
| `message` | WhatsApp forwards, email snippets |
| `idea` | Freeform thoughts, voice memos |
| `media` | Images, screenshots, audio clips |

**Node Properties:**
- `id` — unique identifier (ULID for time-sortability)
- `type` — node type enum
- `content` — raw content or reference
- `summary` — AI-generated summary
- `embedding` — vector embedding for semantic search
- `metadata` — source, timestamps, user context
- `created_at` — ingestion timestamp
- `accessed_at` — last retrieval timestamp
- `tags[]` — auto-generated and user-defined

**Edges** represent relationships:
| Edge Type | Description | Example |
|-----------|-------------|---------|
| `semantic` | Similar meaning/topic | Two articles about "graph databases" |
| `temporal` | Time-based proximity | Notes taken in the same session |
| `source` | Same origin | All items from WhatsApp |
| `tag` | Shared tag/category | Items tagged "startup-ideas" |
| `reference` | Explicit link | Note referencing a saved URL |
| `derived` | AI-inferred connection | Pattern detected across nodes |

### 5.2 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  Web App  │  │ WhatsApp Bot │  │  Browser Extension     │ │
│  │ (Next.js) │  │  (Webhook)   │  │  (Chrome/Firefox)      │ │
│  └─────┬─────┘  └──────┬───────┘  └───────────┬────────────┘ │
└────────┼───────────────┼──────────────────────┼──────────────┘
         │               │                      │
         ▼               ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│                       API GATEWAY                            │
│              (Next.js API Routes / tRPC)                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐ │
│  │  Auth       │  │  Rate      │  │  Request Validation    │ │
│  │  Middleware  │  │  Limiting  │  │  & Routing             │ │
│  └─────────────┘  └────────────┘  └────────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     AI AGENT LAYER                           │
│  ┌──────────────────────────────────────────────────┐       │
│  │  Intent Classifier                                │       │
│  │  (store | retrieve | summarize | connect | ask)   │       │
│  └──────────────────┬───────────────────────────────┘       │
│                     │                                        │
│  ┌──────────┐  ┌────┴─────┐  ┌───────────┐  ┌────────────┐ │
│  │ Ingestion│  │ Retrieval│  │ Reasoning │  │ Generation │ │
│  │ Pipeline │  │ Engine   │  │ Engine    │  │ Engine     │ │
│  └──────────┘  └──────────┘  └───────────┘  └────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  PostgreSQL   │  │  Vector DB   │  │  Object Storage   │  │
│  │  (Neon)       │  │  (pgvector)  │  │  (S3/R2)          │  │
│  │  Graph +      │  │  Embeddings  │  │  Files + Media    │  │
│  │  Metadata     │  │  + Search    │  │                   │  │
│  └──────────────┘  └──────────────┘  └───────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Feature Requirements

### Phase 1: Foundation (MVP)

#### F1. Memory Capture
| ID | Requirement | Priority |
|----|-------------|----------|
| F1.1 | Manual text input via web app (notes, ideas, thoughts) | P0 |
| F1.2 | URL ingestion — paste a link, auto-extract title, summary, content | P0 |
| F1.3 | File upload — PDF, images, text files | P0 |
| F1.4 | WhatsApp forwarding — send messages to a bot number to save | P1 |
| F1.5 | Browser extension — save current page with one click | P1 |
| F1.6 | Email forwarding — forward emails to a dedicated address | P2 |

**Ingestion Pipeline:**
1. Receive raw input (text, URL, file, message)
2. Extract content (scrape page, parse PDF, transcribe audio)
3. Generate AI summary
4. Compute vector embedding
5. Auto-tag using LLM classification
6. Create node in graph
7. Compute edges to existing nodes (semantic similarity threshold)
8. Return confirmation to user

#### F2. Memory Organization
| ID | Requirement | Priority |
|----|-------------|----------|
| F2.1 | Automatic tagging — AI assigns relevant tags on ingestion | P0 |
| F2.2 | Automatic linking — connect semantically similar nodes | P0 |
| F2.3 | Manual tagging — users can add/edit/remove tags | P0 |
| F2.4 | Collections — user-created groups of nodes | P1 |
| F2.5 | Automatic clustering — group related nodes into topics | P1 |
| F2.6 | Tag suggestions — AI suggests tags based on content patterns | P2 |

#### F3. Memory Retrieval
| ID | Requirement | Priority |
|----|-------------|----------|
| F3.1 | Natural language search — "what was that article about graph databases?" | P0 |
| F3.2 | Semantic search — find by meaning, not just keywords | P0 |
| F3.3 | Timeline view — browse memories chronologically | P0 |
| F3.4 | Filter by type, tag, source, date range | P0 |
| F3.5 | Contextual recall — "what was I reading last Tuesday?" | P1 |
| F3.6 | Related memories — "show me everything connected to this" | P1 |

#### F4. AI Agent Interface
| ID | Requirement | Priority |
|----|-------------|----------|
| F4.1 | Chat interface in web app — conversational memory interaction | P0 |
| F4.2 | Intent detection — classify user input as store/retrieve/ask/connect | P0 |
| F4.3 | Multi-turn conversations — maintain context across messages | P0 |
| F4.4 | Summarization — "summarize everything I saved about X" | P1 |
| F4.5 | Connection surfacing — "how are X and Y related in my memories?" | P1 |
| F4.6 | WhatsApp agent — same capabilities via WhatsApp chat | P2 |

#### F5. User Authentication & Privacy
| ID | Requirement | Priority |
|----|-------------|----------|
| F5.1 | Email/password authentication | P0 |
| F5.2 | OAuth (Google, GitHub) | P0 |
| F5.3 | Per-user data isolation — complete tenant separation | P0 |
| F5.4 | Data export — download all personal data (JSON/ZIP) | P1 |
| F5.5 | Selective deletion — delete individual nodes or bulk delete | P0 |
| F5.6 | Privacy dashboard — see what's stored, when, from where | P1 |

### Phase 2: Intelligence

#### F6. Advanced Reasoning
| ID | Requirement | Priority |
|----|-------------|----------|
| F6.1 | Pattern detection — "topics you save most about" | P1 |
| F6.2 | Weekly digest — AI-generated summary of the week's memories | P1 |
| F6.3 | Knowledge gaps — identify areas with sparse information | P2 |
| F6.4 | Contradiction detection — flag conflicting saved information | P2 |

#### F7. Graph Exploration
| ID | Requirement | Priority |
|----|-------------|----------|
| F7.1 | Visual graph explorer — interactive node-edge visualization | P1 |
| F7.2 | Graph traversal — navigate connections between memories | P1 |
| F7.3 | Cluster visualization — see topic groupings | P2 |
| F7.4 | Time-lapse view — watch the graph evolve over time | P2 |

### Phase 3: Platform

#### F8. Integrations
| ID | Requirement | Priority |
|----|-------------|----------|
| F8.1 | WhatsApp Business API integration | P1 |
| F8.2 | Telegram bot | P2 |
| F8.3 | Slack integration | P2 |
| F8.4 | Readwise/Kindle highlights import | P2 |
| F8.5 | Twitter/X bookmarks import | P2 |
| F8.6 | REST API for third-party integrations | P1 |

#### F9. Predictive Assistance
| ID | Requirement | Priority |
|----|-------------|----------|
| F9.1 | Proactive suggestions — surface relevant memories based on current context | P2 |
| F9.2 | "You might want to revisit" — time-based memory resurfacing | P2 |
| F9.3 | Smart reminders — "you saved a deadline about X" | P2 |

---

## 7. Technical Requirements

### 7.1 Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Monorepo** | Turborepo + Bun | Existing setup, fast builds, workspace management |
| **Frontend** | Next.js 16 + React 19 | Server components, streaming, app router |
| **UI Components** | `@repo/ui` (shared library) | Consistent design across apps |
| **Styling** | Tailwind CSS 4 | Utility-first, fast iteration |
| **API** | Next.js API Routes + tRPC | Type-safe API layer |
| **Auth** | NextAuth.js v5 / Neon Auth | OAuth + credential auth |
| **Database** | Neon (PostgreSQL) | Serverless Postgres, branching, scaling |
| **Vector Search** | pgvector (via Neon) | Embeddings stored alongside relational data |
| **Graph Queries** | PostgreSQL recursive CTEs + adjacency lists | Graph traversal without separate graph DB |
| **AI/LLM** | Claude API (Anthropic) | Intent classification, summarization, tagging |
| **Embeddings** | Voyage AI / OpenAI embeddings | Vector representations of content |
| **Object Storage** | Cloudflare R2 / AWS S3 | File and media storage |
| **Deployment** | Vercel | Integrated with Next.js + Turborepo |
| **Background Jobs** | Inngest / Trigger.dev | Async ingestion pipeline, embedding generation |
| **Real-time** | Server-Sent Events (SSE) | Streaming AI responses |

### 7.2 Monorepo Structure

```
build/
├── apps/
│   ├── web/                    # Main web application
│   │   ├── app/
│   │   │   ├── (auth)/         # Auth pages (login, signup)
│   │   │   ├── (dashboard)/    # Protected dashboard
│   │   │   │   ├── memories/   # Memory feed & search
│   │   │   │   ├── graph/      # Graph explorer
│   │   │   │   ├── timeline/   # Timeline view
│   │   │   │   ├── chat/       # AI agent chat
│   │   │   │   └── settings/   # User settings & privacy
│   │   │   └── api/
│   │   │       ├── memories/   # CRUD + search endpoints
│   │   │       ├── ingest/     # Ingestion pipeline triggers
│   │   │       ├── agent/      # AI agent endpoints
│   │   │       └── webhooks/   # WhatsApp, email webhooks
│   │   └── ...
│   ├── docs/                   # Documentation site
│   └── whatsapp-bot/           # WhatsApp integration service (future)
├── packages/
│   ├── ui/                     # Shared React components
│   ├── db/                     # Database schema, queries, migrations (Drizzle ORM)
│   ├── ai/                     # AI utilities (embeddings, LLM calls, intent classifier)
│   ├── graph/                  # Graph operations (node CRUD, edge computation, traversal)
│   ├── ingestion/              # Content extraction (URL scraping, PDF parsing, etc.)
│   ├── eslint-config/          # Shared ESLint config
│   └── typescript-config/      # Shared TypeScript config
├── turbo.json
└── package.json
```

### 7.3 Database Schema (Core Tables)

```sql
-- Users
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  name          TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Memory Nodes
CREATE TABLE nodes (
  id            TEXT PRIMARY KEY,              -- ULID for time-sortability
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,                 -- link, note, document, message, idea, media
  title         TEXT,
  content       TEXT,                          -- raw content
  summary       TEXT,                          -- AI-generated summary
  source        TEXT,                          -- origin (web, whatsapp, upload, manual)
  source_url    TEXT,                          -- original URL if applicable
  metadata      JSONB DEFAULT '{}',           -- flexible metadata
  embedding     vector(1536),                 -- pgvector embedding
  created_at    TIMESTAMPTZ DEFAULT now(),
  accessed_at   TIMESTAMPTZ DEFAULT now(),
  is_archived   BOOLEAN DEFAULT false,
  is_deleted    BOOLEAN DEFAULT false
);

-- Edges (Relationships)
CREATE TABLE edges (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_node   TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  target_node   TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,                 -- semantic, temporal, source, tag, reference, derived
  weight        REAL DEFAULT 1.0,             -- relationship strength
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_node, target_node, type)
);

-- Tags
CREATE TABLE tags (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  is_ai         BOOLEAN DEFAULT false,        -- AI-generated vs user-created
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Node-Tag junction
CREATE TABLE node_tags (
  node_id       TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  tag_id        UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (node_id, tag_id)
);

-- Chat conversations
CREATE TABLE conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Chat messages
CREATE TABLE messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role          TEXT NOT NULL,                 -- user, assistant
  content       TEXT NOT NULL,
  metadata      JSONB DEFAULT '{}',           -- referenced node IDs, tool calls, etc.
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_nodes_user ON nodes(user_id);
CREATE INDEX idx_nodes_type ON nodes(user_id, type);
CREATE INDEX idx_nodes_created ON nodes(user_id, created_at DESC);
CREATE INDEX idx_nodes_embedding ON nodes USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_edges_source ON edges(source_node);
CREATE INDEX idx_edges_target ON edges(target_node);
CREATE INDEX idx_edges_user_type ON edges(user_id, type);
CREATE INDEX idx_node_tags_node ON node_tags(node_id);
CREATE INDEX idx_node_tags_tag ON node_tags(tag_id);
```

### 7.4 API Design (Key Endpoints)

```
POST   /api/ingest              — Ingest new memory (text, URL, file)
GET    /api/memories             — List memories (paginated, filtered)
GET    /api/memories/:id         — Get single memory with connections
PATCH  /api/memories/:id         — Update memory (tags, content)
DELETE /api/memories/:id         — Soft delete memory
POST   /api/memories/search      — Semantic + keyword search
GET    /api/memories/:id/related — Get related memories (graph traversal)
GET    /api/timeline             — Timeline view (date-bucketed)
GET    /api/tags                 — List user's tags
POST   /api/agent/chat           — Send message to AI agent (streaming)
GET    /api/agent/conversations   — List conversations
POST   /api/webhooks/whatsapp    — WhatsApp incoming webhook
GET    /api/export               — Export all user data
```

### 7.5 Performance Requirements

| Metric | Target |
|--------|--------|
| Search latency (semantic) | < 500ms for 100K nodes |
| Ingestion time (URL) | < 5s end-to-end |
| Ingestion time (text) | < 2s end-to-end |
| Chat response (first token) | < 1s |
| Page load (dashboard) | < 2s LCP |
| API response (CRUD) | < 200ms |
| Concurrent users | 1000+ |
| Storage per user | Up to 1M nodes |

### 7.6 Security Requirements

| Requirement | Implementation |
|-------------|---------------|
| Authentication | JWT + HTTP-only cookies, OAuth 2.0 |
| Authorization | Row-level security (RLS) on Neon |
| Data isolation | `user_id` enforced on every query |
| Encryption at rest | Neon default encryption |
| Encryption in transit | TLS everywhere |
| API rate limiting | Per-user rate limits (100 req/min) |
| Input sanitization | Zod validation on all inputs |
| Content Security Policy | Strict CSP headers |
| CORS | Whitelist allowed origins |
| Audit logging | Log data access and mutations |

---

## 8. User Interface

### 8.1 Key Screens

**1. Dashboard / Memory Feed**
- Chronological feed of saved memories (cards)
- Search bar with natural language support
- Filter sidebar (type, tags, source, date)
- Quick capture input at top

**2. Memory Detail**
- Full content view
- AI-generated summary
- Tags (editable)
- Related memories (graph neighbors)
- Timeline context (before/after)
- Source and metadata

**3. AI Chat**
- Full-screen conversational interface
- Streaming responses
- Inline memory cards (referenced nodes)
- Suggested follow-up queries
- Actions: save, tag, connect from chat

**4. Graph Explorer**
- Force-directed graph visualization
- Click node to preview
- Filter by type, tag, time range
- Zoom into clusters
- Edge labels visible on hover

**5. Timeline**
- Calendar-based or vertical timeline
- Date buckets (day/week/month)
- Density indicators (how much was saved)
- Click to expand memories for a period

**6. Settings**
- Profile management
- Connected sources (WhatsApp, email, extension)
- Privacy controls
- Data export/delete
- API key management

### 8.2 Design Principles
- **Minimal and calm** — not overwhelming despite rich data
- **Information density on demand** — progressive disclosure
- **Keyboard-first** — power user shortcuts (`/` to search, `n` to create)
- **Mobile responsive** — capture happens on mobile too
- **Dark mode** — default, with light mode option

---

## 9. AI Agent Specification

### 9.1 Intent Classification

The AI agent classifies every user input into one of these intents:

| Intent | Trigger Examples | Action |
|--------|-----------------|--------|
| `store` | "Save this...", "Remember that...", pasted URLs | Run ingestion pipeline |
| `retrieve` | "What was...", "Find...", "Show me..." | Semantic search + graph query |
| `summarize` | "Summarize...", "Give me an overview of..." | Aggregate + LLM summary |
| `connect` | "How is X related to Y?", "Link these..." | Graph traversal + explanation |
| `ask` | "What do I know about...", general questions | RAG over memory graph |
| `manage` | "Delete...", "Tag this as...", "Archive..." | CRUD operations |

### 9.2 Retrieval Strategy

```
User Query
    │
    ├──► Embedding generation
    │        │
    │        ▼
    │    Vector similarity search (top 20 candidates)
    │        │
    ├──► Keyword extraction
    │        │
    │        ▼
    │    Full-text search (PostgreSQL tsvector)
    │        │
    ├──► Temporal parsing ("last week", "in January")
    │        │
    │        ▼
    │    Date-range filter
    │
    ▼
Merge + Re-rank (RRF — Reciprocal Rank Fusion)
    │
    ▼
Graph expansion (1-hop neighbors of top results)
    │
    ▼
Context assembly (top 10 nodes → LLM prompt)
    │
    ▼
LLM generates response with citations
```

### 9.3 Prompt Architecture

- **System prompt**: Agent identity, capabilities, user context
- **Memory context**: Top retrieved nodes (content + metadata)
- **Graph context**: Relationships between retrieved nodes
- **Conversation history**: Last N messages for multi-turn
- **User query**: Current input

---

## 10. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Availability** | 99.9% uptime |
| **Scalability** | Horizontal scaling via Vercel serverless |
| **Observability** | Structured logging, error tracking (Sentry), uptime monitoring |
| **Accessibility** | WCAG 2.1 AA compliance |
| **Internationalization** | English first, i18n-ready architecture |
| **Documentation** | API docs, user guide, developer docs (in `docs` app) |
| **Testing** | Unit tests (Vitest), integration tests, E2E tests (Playwright) |
| **CI/CD** | GitHub Actions with Turborepo caching, preview deployments on Vercel |

---

## 11. Success Metrics

| Metric | Target (3 months post-launch) |
|--------|-------------------------------|
| Registered users | 1,000+ |
| Weekly active users | 40% of registered |
| Memories saved per active user/week | 20+ |
| Search-to-result satisfaction | >80% (thumbs up/down) |
| AI chat engagement | 5+ messages per session |
| Retention (30-day) | >50% |
| Ingestion success rate | >99% |
| Average retrieval relevance (NDCG) | >0.7 |

---

## 12. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| LLM costs scale linearly with users | High | Cache embeddings, batch operations, use smaller models for classification |
| Semantic search quality insufficient | High | Hybrid search (vector + keyword + graph), user feedback loop for re-ranking |
| WhatsApp API rate limits/costs | Medium | Queue-based ingestion, batch processing |
| User data privacy breach | Critical | RLS, encryption, audit logging, penetration testing |
| Graph query performance at scale | High | Materialized views, edge count limits, pagination |
| Content extraction unreliable (diverse URLs) | Medium | Fallback chain: Readability → headless browser → raw HTML |

---

## 13. Implementation Phases

### Phase 1: Foundation (Weeks 1-6)
- [ ] Database schema + migrations (`packages/db`)
- [ ] Auth system (signup, login, OAuth)
- [ ] Basic node CRUD API
- [ ] Manual text + URL ingestion pipeline
- [ ] Embedding generation + vector storage
- [ ] Semantic search endpoint
- [ ] Dashboard UI (memory feed, search, filters)
- [ ] Memory detail page
- [ ] Basic AI chat (retrieve intent only)

### Phase 2: Intelligence (Weeks 7-12)
- [ ] Full AI agent (all intents)
- [ ] Auto-tagging + auto-linking on ingestion
- [ ] Graph edge computation pipeline
- [ ] Timeline view
- [ ] Related memories (graph traversal)
- [ ] File upload support (PDF, images)
- [ ] Streaming chat responses
- [ ] Collections (user-created groups)
- [ ] Privacy dashboard + data export

### Phase 3: Platform (Weeks 13-18)
- [ ] WhatsApp bot integration
- [ ] Browser extension (Chrome)
- [ ] Graph explorer (visual)
- [ ] Weekly digest emails
- [ ] Pattern detection + insights
- [ ] Public API + API keys
- [ ] Performance optimization + caching
- [ ] E2E tests + CI/CD hardening

---

## 14. Open Questions

1. **Graph DB vs PostgreSQL?** — Start with PostgreSQL adjacency lists + recursive CTEs. Migrate to Neo4j/Dgraph only if query complexity demands it.
2. **Embedding model choice?** — Evaluate Voyage AI vs OpenAI `text-embedding-3-large` vs Cohere for cost/quality tradeoff.
3. **WhatsApp Business API pricing** — Evaluate per-message costs at scale. Consider Telegram as free alternative.
4. **Self-hosted option?** — Future consideration for privacy-conscious users.
5. **Monetization model?** — Freemium (100 nodes free, paid for unlimited + advanced features) vs flat subscription.

---

## 15. Glossary

| Term | Definition |
|------|-----------|
| **Node** | A single unit of memory (link, note, document, etc.) |
| **Edge** | A relationship between two nodes |
| **Memory Graph** | The complete set of nodes and edges for a user |
| **Ingestion** | The process of capturing and processing new information |
| **Embedding** | A vector representation of content for semantic similarity |
| **Semantic Search** | Finding content by meaning rather than exact keywords |
| **RAG** | Retrieval-Augmented Generation — LLM answers grounded in user's data |
| **RRF** | Reciprocal Rank Fusion — method to combine multiple ranked lists |
| **ULID** | Universally Unique Lexicographically Sortable Identifier |

---

*This is a living document. It will be updated as requirements evolve and implementation progresses.*

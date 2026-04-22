# Database Schema

## Summary
The database now stores both the legacy graph model (`nodes`, `edges`, `tags`) and a normalized memory layer (`artifacts`, `memory_records`, `memory_evidence`, `memory_edges`, `conversation_state`). Nodes and normalized memories both use `vector(768)` embeddings.

## Detailed explanation
- Core memory graph lives in nodes, edges, tags, and node_tags tables.
- Normalized memory storage lives in `artifacts`, `memory_records`, `memory_evidence`, `memory_edges`, and `conversation_state`.
- Users include onboarding status, social links, and optional resume node reference.
- Embeddings use a custom pgvector type compatible with the Neon driver.
- Auth tables include accounts, sessions, verification_tokens, and refresh_tokens used by the Fastify auth flow.
- WhatsApp linkage is tracked in whatsapp_links with verification code fields.
- `memory_records` stores durable agent memories with tier (`short_term`, `long_term`, `personality`), kind, salience, confidence, lifecycle status, dedupe key, and optional embedding.
- `memory_evidence` links normalized memories back to artifacts and/or persisted chat messages.
- `conversation_state` stores rolling session summary, active topics, open loops, recent preferences, and last user goal.

## Relationships
- [ai-memory/wiki/graph-layer.md](ai-memory/wiki/graph-layer.md) - Graph operations over nodes and edges.
- [ai-memory/wiki/auth-system.md](ai-memory/wiki/auth-system.md) - Refresh token storage.
- [ai-memory/wiki/ingestion-pipeline.md](ai-memory/wiki/ingestion-pipeline.md) - Writes nodes and tags.

## Code references
- [packages/db/src/schema/index.ts](packages/db/src/schema/index.ts)
- [packages/db/src/schema/users.ts](packages/db/src/schema/users.ts)
- [packages/db/src/schema/nodes.ts](packages/db/src/schema/nodes.ts)
- [packages/db/src/schema/edges.ts](packages/db/src/schema/edges.ts)
- [packages/db/src/schema/tags.ts](packages/db/src/schema/tags.ts)
- [packages/db/src/schema/node-tags.ts](packages/db/src/schema/node-tags.ts)
- [packages/db/src/schema/conversations.ts](packages/db/src/schema/conversations.ts)
- [packages/db/src/schema/messages.ts](packages/db/src/schema/messages.ts)
- [packages/db/src/schema/artifacts.ts](packages/db/src/schema/artifacts.ts)
- [packages/db/src/schema/memory-records.ts](packages/db/src/schema/memory-records.ts)
- [packages/db/src/schema/memory-evidence.ts](packages/db/src/schema/memory-evidence.ts)
- [packages/db/src/schema/memory-edges.ts](packages/db/src/schema/memory-edges.ts)
- [packages/db/src/schema/conversation-state.ts](packages/db/src/schema/conversation-state.ts)
- [packages/db/src/schema/auth.ts](packages/db/src/schema/auth.ts)
- [packages/db/src/schema/whatsapp-links.ts](packages/db/src/schema/whatsapp-links.ts)

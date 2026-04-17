# Database Schema

## Summary
The database stores users, memories, edges, tags, and chat history, with auth support tables and a WhatsApp linkage table. Nodes use ULID identifiers and embeddings are stored as pgvector(768).

## Detailed explanation
- Core memory graph lives in nodes, edges, tags, and node_tags tables.
- Users include onboarding status, social links, and optional resume node reference.
- Embeddings use a custom pgvector type compatible with the Neon driver.
- Auth tables include accounts, sessions, verification_tokens, and refresh_tokens used by the Fastify auth flow.
- WhatsApp linkage is tracked in whatsapp_links with verification code fields.

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
- [packages/db/src/schema/auth.ts](packages/db/src/schema/auth.ts)
- [packages/db/src/schema/whatsapp-links.ts](packages/db/src/schema/whatsapp-links.ts)

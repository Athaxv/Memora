# Graph Layer

## Summary
The graph layer encapsulates node CRUD, edge creation, semantic search, traversal, and tag management over the Postgres schema.

## Detailed explanation
- Nodes are created with ULIDs and soft-deleted by setting deletedAt.
- Semantic edges are created between similar nodes using embeddings and a threshold.
- Visualization payloads can combine persisted semantic edges with derived tag-overlap and temporal-proximity edges at read time.
- Search uses pgvector cosine distance and supports limits and type filters.
- Tags are upserted and attached to nodes via a junction table.
- Traversal returns related nodes and the associated edge metadata.

## Relationships
- [ai-memory/wiki/db-schema.md](ai-memory/wiki/db-schema.md) - Tables and enums.
- [ai-memory/wiki/ingestion-pipeline.md](ai-memory/wiki/ingestion-pipeline.md) - Writes nodes and edges.
- [ai-memory/wiki/ai-layer.md](ai-memory/wiki/ai-layer.md) - Embeddings that drive search and edges.
- [ai-memory/wiki/backend-api.md](ai-memory/wiki/backend-api.md) - Graph endpoint contract and route behavior.

## Code references
- [packages/graph/src/index.ts](packages/graph/src/index.ts)
- [packages/graph/src/nodes.ts](packages/graph/src/nodes.ts)
- [packages/graph/src/edges.ts](packages/graph/src/edges.ts)
- [packages/graph/src/search.ts](packages/graph/src/search.ts)
- [packages/graph/src/traversal.ts](packages/graph/src/traversal.ts)
- [packages/graph/src/tags.ts](packages/graph/src/tags.ts)
- [apps/backend/src/services/memory-graph.ts](apps/backend/src/services/memory-graph.ts)

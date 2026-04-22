# Ingestion Pipeline

## Summary
The ingestion pipeline remains the raw content capture path. It now writes both a normalized raw `artifact` record and the legacy graph `node`, then attaches tags and optionally computes semantic edges.

## Detailed explanation
- Input types are text, URL, and file; the pipeline resolves node type and source based on input.
- Content extraction is delegated to specialized extractors for URL, text, and files.
- Summarization and tagging use Groq; embeddings use Hugging Face if configured.
- The pipeline now creates an `artifacts` row before the legacy graph node so downstream memory extraction/merge can preserve provenance.
- Tags are merged from user input and AI output before being linked to the node.
- Semantic edges are only computed if embeddings are available.

## Relationships
- [ai-memory/wiki/ai-layer.md](ai-memory/wiki/ai-layer.md) - Summarize, tag, and embed.
- [ai-memory/wiki/graph-layer.md](ai-memory/wiki/graph-layer.md) - Node creation and semantic edges.
- [ai-memory/wiki/db-schema.md](ai-memory/wiki/db-schema.md) - Nodes, tags, and edges schema.

## Code references
- [packages/ingestion/src/pipeline.ts](packages/ingestion/src/pipeline.ts)
- [packages/memory/src/artifacts.ts](packages/memory/src/artifacts.ts)
- [packages/ingestion/src/extractors/text.ts](packages/ingestion/src/extractors/text.ts)
- [packages/ingestion/src/extractors/url.ts](packages/ingestion/src/extractors/url.ts)
- [packages/ingestion/src/extractors/file.ts](packages/ingestion/src/extractors/file.ts)
- [packages/ingestion/src/types.ts](packages/ingestion/src/types.ts)

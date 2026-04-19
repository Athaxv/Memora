# AI Layer

## Summary
AI utilities provide summarization, auto-tagging, intent classification, and embeddings using Groq-hosted LLMs and Hugging Face embeddings.

## Detailed explanation
- Summarization uses Groq OpenAI-compatible API with a Llama 4 model and short outputs.
- Auto-tagging extracts 3-8 tags as structured JSON, validated with Zod.
- Intent classification maps user messages to store/retrieve/summarize/connect/ask/manage.
- Embeddings use Hugging Face Router inference (`BAAI/bge-base-en-v1.5`) and are optional; if no HF key is configured, embeddings are skipped to keep ingestion functional.
- Chat retrieval now includes a lexical fallback in [apps/backend/src/services/chat.ts](apps/backend/src/services/chat.ts): if semantic retrieval yields no results (or query embedding fails), it runs text search over nodes to reduce false "no memory" replies.

## Relationships
- [ai-memory/wiki/ingestion-pipeline.md](ai-memory/wiki/ingestion-pipeline.md) - Calls summarize, embed, and auto-tag.
- [ai-memory/wiki/backend-api.md](ai-memory/wiki/backend-api.md) - Chat service uses intent and embeddings.
- [ai-memory/wiki/graph-layer.md](ai-memory/wiki/graph-layer.md) - Embeddings power semantic search and edges.

## Code references
- [packages/ai/src/summarize.ts](packages/ai/src/summarize.ts)
- [packages/ai/src/auto-tag.ts](packages/ai/src/auto-tag.ts)
- [packages/ai/src/intent.ts](packages/ai/src/intent.ts)
- [packages/ai/src/embeddings.ts](packages/ai/src/embeddings.ts)
- [apps/backend/src/services/chat.ts](apps/backend/src/services/chat.ts)
- [packages/ai/src/index.ts](packages/ai/src/index.ts)

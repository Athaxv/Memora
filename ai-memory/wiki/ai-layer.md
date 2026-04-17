# AI Layer

## Summary
AI utilities provide summarization, auto-tagging, intent classification, and embeddings using Groq-hosted LLMs and Hugging Face embeddings.

## Detailed explanation
- Summarization uses Groq OpenAI-compatible API with a Llama 4 model and short outputs.
- Auto-tagging extracts 3-8 tags as structured JSON, validated with Zod.
- Intent classification maps user messages to store/retrieve/summarize/connect/ask/manage.
- Embeddings are optional; if no HF key is configured, embeddings are skipped to keep ingestion functional.

## Relationships
- [ai-memory/wiki/ingestion-pipeline.md](ai-memory/wiki/ingestion-pipeline.md) - Calls summarize, embed, and auto-tag.
- [ai-memory/wiki/backend-api.md](ai-memory/wiki/backend-api.md) - Chat service uses intent and embeddings.
- [ai-memory/wiki/graph-layer.md](ai-memory/wiki/graph-layer.md) - Embeddings power semantic search and edges.

## Code references
- [packages/ai/src/summarize.ts](packages/ai/src/summarize.ts)
- [packages/ai/src/auto-tag.ts](packages/ai/src/auto-tag.ts)
- [packages/ai/src/intent.ts](packages/ai/src/intent.ts)
- [packages/ai/src/embeddings.ts](packages/ai/src/embeddings.ts)
- [packages/ai/src/index.ts](packages/ai/src/index.ts)

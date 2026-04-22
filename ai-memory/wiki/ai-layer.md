# AI Layer

## Summary
AI utilities now power both the legacy ingestion/chat flow and a normalized memory layer. Groq-hosted LLMs are used for summarization, auto-tagging, intent classification, memory extraction, and reply generation; Hugging Face embeddings support both graph nodes and normalized memory retrieval.

## Detailed explanation
- Summarization uses Groq OpenAI-compatible API with a Llama 4 model and short outputs.
- Auto-tagging extracts 3-8 tags as structured JSON, validated with Zod.
- Intent classification maps user messages to store/retrieve/summarize/connect/ask/manage.
- Embeddings use Hugging Face Router inference (`BAAI/bge-base-en-v1.5`) and are optional; if no HF key is configured, embeddings are skipped to keep ingestion functional.
- Normalized memory extraction is implemented in [packages/memory/src/extractor.ts](packages/memory/src/extractor.ts): it extracts durable user facts/preferences/goals from user turns, then salience/confidence heuristics filter noise before merge.
- Normalized memory retrieval is implemented in [packages/memory/src/search.ts](packages/memory/src/search.ts): it combines FTS and vector similarity over `memory_records`.
- Chat orchestration now uses dedicated retrieval/context/reasoning services instead of one monolithic chat service.
- Chat orchestration now includes a policy decision engine that gates retrieval and post-turn memory extraction.
- Retrieval behavior is mode-aware (`HIGH`/`MEDIUM`/`LOW`/`NONE`) with graph-neighbor expansion only in high-recall paths.
- Backend memory graph service now supports structured memory mutation operations (`CREATE`, `UPDATE`, `LINK`) for extracted memory candidates.
- Chat route now applies meta-awareness (`detectMetaQuery`) before policy decisioning, with hard blocks that prevent memory writes for memory/system queries.
- Retrieval now supports active-topic query expansion from conversation state and applies weighted ranking with priority injection for goal/preference memories.
- Prompt context now includes stronger grounding instructions and explicit active-topic context for personalization with bounded memory claims.
- Optional web-context enrichment is now available in orchestration via gated search (Tavily API) for freshness/public-knowledge gaps; web snippets are added to prompt context and source URLs are surfaced in grounding metadata.
- Groq calls require Groq-supported model IDs. OpenAI-specific model IDs (for example `chatgpt-4o-latest` or `codex-mini-latest`) result in `model_not_found` responses and can surface as `/chat` failures.

## Relationships
- [ai-memory/wiki/ingestion-pipeline.md](ai-memory/wiki/ingestion-pipeline.md) - Calls summarize, embed, and auto-tag.
- [ai-memory/wiki/backend-api.md](ai-memory/wiki/backend-api.md) - Chat service uses intent and embeddings.
- [ai-memory/wiki/graph-layer.md](ai-memory/wiki/graph-layer.md) - Embeddings power semantic search and edges.

## Code references
- [packages/ai/src/summarize.ts](packages/ai/src/summarize.ts)
- [packages/ai/src/auto-tag.ts](packages/ai/src/auto-tag.ts)
- [packages/ai/src/intent.ts](packages/ai/src/intent.ts)
- [packages/ai/src/embeddings.ts](packages/ai/src/embeddings.ts)
- [packages/memory/src/extractor.ts](packages/memory/src/extractor.ts)
- [packages/memory/src/search.ts](packages/memory/src/search.ts)
- [apps/backend/src/services/chat-orchestrator.ts](apps/backend/src/services/chat-orchestrator.ts)
- [apps/backend/src/services/decision-engine.ts](apps/backend/src/services/decision-engine.ts)
- [apps/backend/src/services/memory-policy.ts](apps/backend/src/services/memory-policy.ts)
- [apps/backend/src/services/retrieval-service.ts](apps/backend/src/services/retrieval-service.ts)
- [apps/backend/src/services/web-search-service.ts](apps/backend/src/services/web-search-service.ts)
- [apps/backend/src/services/context-builder.ts](apps/backend/src/services/context-builder.ts)
- [apps/backend/src/services/reasoning-service.ts](apps/backend/src/services/reasoning-service.ts)
- [apps/backend/src/services/memory-graph.ts](apps/backend/src/services/memory-graph.ts)
- [apps/backend/src/services/topic-tracker.ts](apps/backend/src/services/topic-tracker.ts)
- [packages/ai/src/index.ts](packages/ai/src/index.ts)
- [apps/frontend/app/components/chat/chat-interface.tsx](apps/frontend/app/components/chat/chat-interface.tsx)

# Validators

## Summary
Request validation is centralized in a shared Zod schema package used by the backend routes.

## Detailed explanation
- Schemas cover signup/login, ingestion, node updates, search, chat, profile updates, WhatsApp linking, and Telegram linking.
- Signup/login email fields are normalized (trim + lowercase) at validation time to enforce canonical identity handling.
- Chat schema already supports optional `conversationId`, which is now used by the backend for conversation continuity and persistence.
- Backend routes parse and validate requests using these schemas before accessing the database.

## Relationships
- [ai-memory/wiki/backend-api.md](ai-memory/wiki/backend-api.md) - Routes use validators.
- [ai-memory/wiki/ingestion-pipeline.md](ai-memory/wiki/ingestion-pipeline.md) - Ingest request schema.

## Code references
- [packages/validators/src/index.ts](packages/validators/src/index.ts)
- [apps/backend/src/routes/auth/index.ts](apps/backend/src/routes/auth/index.ts)
- [apps/backend/src/routes/ingest/index.ts](apps/backend/src/routes/ingest/index.ts)
- [apps/backend/src/routes/chat/index.ts](apps/backend/src/routes/chat/index.ts)
- [apps/backend/src/routes/memories/index.ts](apps/backend/src/routes/memories/index.ts)

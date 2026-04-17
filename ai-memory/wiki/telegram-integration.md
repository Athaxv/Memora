# Telegram Integration

## Summary
Telegram integration uses bot webhooks for inbound messages and authenticated endpoints to deep-link and auto-link a Telegram chat without manual chat ID entry. It runs in dual-support mode alongside WhatsApp.

## Detailed explanation
- POST `/telegram/webhook` accepts Telegram updates and optionally verifies `x-telegram-bot-api-secret-token` when configured.
- POST `/telegram/link/start` creates a short-lived single-use token and returns a Telegram deep link (`https://t.me/<bot>?start=<token>`).
- Webhook handles `/start <token>`, validates token hash and expiry from `telegram_link_sessions`, and links the incoming `chat.id` to the authenticated user.
- Webhook text messages are routed by intent: `store` goes through ingestion; other intents go through chat retrieval/generation.
- Link state is stored in `telegram_links`; session tokens are stored in `telegram_link_sessions`.
- User-facing endpoints (`/telegram/status`, `/telegram/link/start`, `/telegram/link`, `/telegram/verify`, `/telegram/link` DELETE) require authenticated user context, except webhook.
- Outbound messages are sent through Telegram Bot API `sendMessage`.

## Relationships
- [ai-memory/wiki/backend-api.md](ai-memory/wiki/backend-api.md) - Route registration and endpoint surface.
- [ai-memory/wiki/whatsapp-integration.md](ai-memory/wiki/whatsapp-integration.md) - Parallel messaging channel.
- [ai-memory/wiki/ingestion-pipeline.md](ai-memory/wiki/ingestion-pipeline.md) - Store intent ingestion.
- [ai-memory/wiki/ai-layer.md](ai-memory/wiki/ai-layer.md) - Intent classification and response generation.
- [ai-memory/wiki/validators.md](ai-memory/wiki/validators.md) - Telegram link/verify schemas.

## Code references
- [apps/backend/src/routes/telegram/index.ts](apps/backend/src/routes/telegram/index.ts)
- [apps/backend/src/services/telegram.ts](apps/backend/src/services/telegram.ts)
- [apps/backend/src/config.ts](apps/backend/src/config.ts)
- [packages/db/src/schema/telegram-links.ts](packages/db/src/schema/telegram-links.ts)
- [packages/db/src/schema/telegram-link-sessions.ts](packages/db/src/schema/telegram-link-sessions.ts)
- [packages/validators/src/index.ts](packages/validators/src/index.ts)
- [apps/frontend/app/components/settings/telegram-link.tsx](apps/frontend/app/components/settings/telegram-link.tsx)

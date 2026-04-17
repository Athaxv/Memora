# WhatsApp Integration

## Summary
WhatsApp integration uses Meta webhooks for inbound messages and provides authenticated endpoints to link, verify, and unlink phone numbers. It now runs in dual-support mode alongside Telegram.

## Detailed explanation
- Webhook verification is handled via GET /whatsapp/webhook with the configured verify token.
- Incoming text messages are classified as store or retrieval and routed to ingestion or chat.
- Users link phone numbers via OTP codes sent through the WhatsApp API.
- Link state is stored in the whatsapp_links table.

## Relationships
- [ai-memory/wiki/backend-api.md](ai-memory/wiki/backend-api.md) - Route registration and handlers.
- [ai-memory/wiki/telegram-integration.md](ai-memory/wiki/telegram-integration.md) - Parallel messaging channel.
- [ai-memory/wiki/ingestion-pipeline.md](ai-memory/wiki/ingestion-pipeline.md) - Store intent ingestion.
- [ai-memory/wiki/ai-layer.md](ai-memory/wiki/ai-layer.md) - Intent classification.
- [ai-memory/wiki/db-schema.md](ai-memory/wiki/db-schema.md) - whatsapp_links table.

## Code references
- [apps/backend/src/routes/whatsapp/index.ts](apps/backend/src/routes/whatsapp/index.ts)
- [apps/backend/src/services/chat.ts](apps/backend/src/services/chat.ts)
- [packages/db/src/schema/whatsapp-links.ts](packages/db/src/schema/whatsapp-links.ts)
- [packages/validators/src/index.ts](packages/validators/src/index.ts)

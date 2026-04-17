# API Layer

## Summary
The API layer is a cookie-authenticated HTTP interface served by Fastify and consumed by the Next.js frontend via a shared fetch wrapper that handles refresh rotation.

## Detailed explanation
- The backend exposes route groups under /auth, /memories, /ingest, /tags, /chat, and /whatsapp.
- Auth uses access and refresh cookies; the frontend always sends credentials.
- The frontend API client retries once on 401 by calling /auth/refresh, then replays the original request.
- File uploads are multipart and validated for size and MIME types.

## Relationships
- [ai-memory/wiki/backend-api.md](ai-memory/wiki/backend-api.md) - Detailed route responsibilities.
- [ai-memory/wiki/auth-system.md](ai-memory/wiki/auth-system.md) - Token and cookie behavior.
- [ai-memory/wiki/frontend-app.md](ai-memory/wiki/frontend-app.md) - API client usage.

## Code references
- [apps/backend/src/index.ts](apps/backend/src/index.ts)
- [apps/backend/src/routes/ingest/index.ts](apps/backend/src/routes/ingest/index.ts)
- [apps/frontend/lib/api.ts](apps/frontend/lib/api.ts)

# Auth System

## Summary
Authentication is implemented in the Fastify backend with JWT access tokens, rotating refresh tokens, and cookie-based session handling. Google OAuth and email/password login are supported.

## Detailed explanation
- Signup and login set access and refresh cookies; refresh tokens are stored hashed with family rotation.
- Refresh rotation includes reuse detection and family revocation.
- Google OAuth exchanges the code for tokens, then finds or creates the user and issues cookies.
- Auth routes now apply endpoint-level rate limits for signup, login, and OAuth callback.
- OAuth uses a short-lived state cookie and validates callback state before token exchange.
- Email input is canonicalized via validators (trim + lowercase) so auth lookups are case-insensitive and consistent.
- The frontend API wrapper retries once after a 401 by calling /auth/refresh.
- Auth depends on the `refresh_tokens` table. If DB schema is behind, signup/login can fail at token issuance. Current route logic includes a defensive rollback for newly created users when token issuance fails.
- Profile updates now validate `resumeNodeId` ownership and reject inaccessible node IDs.

## Relationships
- [ai-memory/wiki/backend-api.md](ai-memory/wiki/backend-api.md) - Auth endpoints.
- [ai-memory/wiki/db-schema.md](ai-memory/wiki/db-schema.md) - refresh_tokens and users tables.
- [ai-memory/wiki/api-layer.md](ai-memory/wiki/api-layer.md) - Cookie usage from the client.

## Code references
- [apps/backend/src/routes/auth/index.ts](apps/backend/src/routes/auth/index.ts)
- [apps/backend/src/plugins/rate-limit.ts](apps/backend/src/plugins/rate-limit.ts)
- [apps/backend/src/index.ts](apps/backend/src/index.ts)
- [apps/backend/src/lib/tokens.ts](apps/backend/src/lib/tokens.ts)
- [apps/backend/src/config.ts](apps/backend/src/config.ts)
- [apps/frontend/lib/api.ts](apps/frontend/lib/api.ts)
- [packages/db/src/schema/auth.ts](packages/db/src/schema/auth.ts)
- [packages/db/drizzle/0002_workable_roughhouse.sql](packages/db/drizzle/0002_workable_roughhouse.sql)
- [packages/validators/src/index.ts](packages/validators/src/index.ts)

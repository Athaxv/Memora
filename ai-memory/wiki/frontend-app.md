# Frontend App

## Summary
The primary UI is a Next.js app in apps/frontend that renders the dashboard, onboarding, and auth pages and communicates with the backend via a cookie-authenticated API client.

## Detailed explanation
- The app uses the App Router and a shared API wrapper that retries on 401 by refreshing the session.
- Dashboard, vault, chat, onboarding, and auth routes live under the app directory structure.
- The UI does not define Next.js API routes; it relies on the Fastify backend for data and auth.

## Relationships
- [ai-memory/wiki/api-layer.md](ai-memory/wiki/api-layer.md) - Frontend to backend contract.
- [ai-memory/wiki/auth-system.md](ai-memory/wiki/auth-system.md) - Session and cookie behavior.
- [ai-memory/wiki/architecture.md](ai-memory/wiki/architecture.md) - Runtime components.

## Code references
- [apps/frontend/app/layout.tsx](apps/frontend/app/layout.tsx)
- [apps/frontend/app/page.tsx](apps/frontend/app/page.tsx)
- [apps/frontend/app/(dashboard)](apps/frontend/app/(dashboard))
- [apps/frontend/app/(auth)](apps/frontend/app/(auth))
- [apps/frontend/app/(onboarding)](apps/frontend/app/(onboarding))
- [apps/frontend/lib/api.ts](apps/frontend/lib/api.ts)

# Monorepo Tooling

## Summary
The repository uses Turborepo for task orchestration and Bun for workspace management, with shared packages providing schema, AI, graph, ingestion, validators, and UI modules.

## Detailed explanation
- Root scripts delegate to Turborepo tasks for build, dev, lint, and typecheck.
- Tasks declare cache and output behavior for apps and packages.
- Workspace layout separates apps (UI and API) from shared packages.
- Additional apps (docs, web, landing-page) are present but appear secondary compared to apps/frontend and apps/backend.

## Relationships
- [ai-memory/wiki/architecture.md](ai-memory/wiki/architecture.md) - System-level view.
- [ai-memory/wiki/frontend-app.md](ai-memory/wiki/frontend-app.md) - Main UI app.
- [ai-memory/wiki/backend-api.md](ai-memory/wiki/backend-api.md) - Main API server.
- [ai-memory/wiki/db-schema.md](ai-memory/wiki/db-schema.md) - Database package used by backend.

## Code references
- [package.json](package.json)
- [turbo.json](turbo.json)
- [apps/frontend](apps/frontend)
- [apps/backend](apps/backend)
- [packages](packages)

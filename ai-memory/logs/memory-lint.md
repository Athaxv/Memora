# Memory Lint Report

Date: 2026-04-17

## Checks performed
- Verified wiki pages exist for core runtime components, AI, ingestion, graph, and schema.
- Checked for spec vs implementation drift and documented it in architecture and raw notes.
- Ensured all wiki pages include Relationships and Code references sections.
- Added documentation coverage for WhatsApp integration.

## Findings
- PRD and architecture context describe Next.js API routes and NextAuth, but the codebase implements a Fastify backend with cookie-based JWT auth. Documented in the wiki.
- Additional apps (docs, web, landing-page) are present but not described in depth; covered at a high level in monorepo tooling.

## Actions taken
- Created initial wiki pages and cross-links.
- Added WhatsApp integration page.
- Recorded raw codebase analysis and linked it from the index.
- Updated wiki pages after auth/chat implementation pass:
	- Auth hardening (rate limits, OAuth state, canonical email behavior, resume node ownership checks).
	- Chat persistence behavior (conversation/message writes and continuity via conversationId).
	- Validator behavior notes for canonical email handling.- Added Telegram dual-support documentation:
  - New page [ai-memory/wiki/telegram-integration.md](ai-memory/wiki/telegram-integration.md).
  - Updated backend API and validator pages for Telegram route and schema coverage.
  - Updated WhatsApp page to explicitly document coexistence with Telegram.
 - Updated Telegram linking UX documentation:
	 - Added deep-link start flow (`/telegram/link/start`) and webhook `/start <token>` auto-link behavior.
	 - Added token session table coverage (`telegram_link_sessions`) and migration tracking.
	 - Updated frontend notes to reflect one-click connect flow replacing manual chat ID input.
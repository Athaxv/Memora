#!/bin/sh
set -e

# Apply database migrations before starting the API.
bun run --cwd packages/db db:migrate

# Run backend directly from source so workspace package TS exports keep working.
exec bunx tsx apps/backend/src/index.ts

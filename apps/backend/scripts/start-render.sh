#!/bin/sh
set -e

# Apply database migrations before starting the API.
drizzle-kit migrate --config packages/db/drizzle.config.ts

# Run backend directly from source so workspace package TS exports keep working.
exec tsx apps/backend/src/index.ts

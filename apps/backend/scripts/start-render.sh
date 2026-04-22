#!/bin/sh
set -e

# Runtime-only startup. No migration/config execution here.
chmod +x apps/backend/scripts/run-built.sh
exec bun run --cwd apps/backend start:prod

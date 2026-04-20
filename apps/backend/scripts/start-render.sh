#!/bin/sh
set -e

# Runtime-only startup. No migration/config execution here.
exec bun run --cwd apps/backend start:prod

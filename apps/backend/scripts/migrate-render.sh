#!/bin/sh
set -e

# Migration-only entrypoint. This is intended for CI/CD hooks or one-off runs.
exec bun run --cwd packages/db db:migrate

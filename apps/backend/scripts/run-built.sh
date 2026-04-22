#!/bin/sh
set -e

# Prefer app-local output, but support monorepo-root output layout when
# TypeScript emits with rootDir set to repository root.
if [ -f "dist/index.js" ]; then
  exec bun "dist/index.js"
fi

if [ -f "dist/apps/backend/src/index.js" ]; then
  exec bun "dist/apps/backend/src/index.js"
fi

echo "No compiled backend entrypoint found."
echo "Expected one of:"
echo "  - dist/index.js"
echo "  - dist/apps/backend/src/index.js"
exit 1

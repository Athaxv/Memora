FROM oven/bun:1.3.3-alpine

WORKDIR /app

# Copy monorepo source so workspace dependencies resolve correctly.
COPY . .

RUN bun install --frozen-lockfile
RUN bun run --cwd apps/backend build
RUN chmod +x apps/backend/scripts/start-render.sh
RUN chmod +x apps/backend/scripts/migrate-render.sh
RUN chmod +x apps/backend/scripts/run-built.sh

ENV NODE_ENV=production
EXPOSE 10000

CMD ["sh", "apps/backend/scripts/start-render.sh"]

FROM oven/bun:1.3.3-alpine

WORKDIR /app

RUN apk add --no-cache nodejs npm
RUN npm install -g drizzle-kit@0.30.0 tsx@4.20.6

# Copy monorepo source so workspace dependencies resolve correctly.
COPY . .

RUN bun install --frozen-lockfile
RUN chmod +x apps/backend/scripts/start-render.sh

ENV NODE_ENV=production
EXPOSE 10000

CMD ["sh", "apps/backend/scripts/start-render.sh"]

# ---- Build stage ----
FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json bun.lock* bun.lockb* ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# ---- Runtime stage ----
FROM oven/bun:1-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copie le build et les deps runtime (hono + @hono/node-server)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.mjs ./server.mjs
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["bun", "run", "server.mjs"]
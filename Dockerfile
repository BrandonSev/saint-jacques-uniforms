# ---- Build stage ----
FROM oven/bun:1 AS builder
WORKDIR /app

# Install deps (with lockfile)
COPY package.json bun.lock* bun.lockb* ./
RUN bun install --frozen-lockfile

# Copy sources and build
COPY . .
RUN bun run build

# ---- Runtime stage ----
FROM oven/bun:1-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy build output, wrangler config and node_modules (wrangler binary inclus)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/wrangler.jsonc ./wrangler.jsonc
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

# Lance le worker Cloudflare en local via Wrangler, bind sur 0.0.0.0:$PORT
CMD ["sh", "-c", "bunx wrangler dev --ip 0.0.0.0 --port ${PORT:-3000} --local"]
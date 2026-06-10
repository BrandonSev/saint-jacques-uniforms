# ---- Build stage ----
FROM oven/bun:1 AS builder
WORKDIR /app

ARG VITE_SUPABASE_URL=https://uyavawaeytlrjxozxyam.supabase.co
ARG VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6InV5YXZhd2FleXRscmp4b3p4eWFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MzYwNTksImV4cCI6MjA5MzExMjA1OX0.G1ZZ6UV6cM-ujAzZmkcXU6NR5YxnEGuKvYagGTkupxk
ARG VITE_SUPABASE_PROJECT_ID=uyavawaeytlrjxozxyam
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID

COPY package.json bun.lock* bun.lockb* ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# ---- Runtime stage ----
FROM oven/bun:1-slim AS runtime
WORKDIR /app

ARG VITE_SUPABASE_URL=https://uyavawaeytlrjxozxyam.supabase.co
ARG VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6InV5YXZhd2FleXRscmp4b3p4eWFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MzYwNTksImV4cCI6MjA5MzExMjA1OX0.G1ZZ6UV6cM-ujAzZmkcXU6NR5YxnEGuKvYagGTkupxk
ARG VITE_SUPABASE_PROJECT_ID=uyavawaeytlrjxozxyam
ARG SUPABASE_URL=$VITE_SUPABASE_URL
ARG SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY

ENV NODE_ENV=production
ENV PORT=3000
ENV SUPABASE_URL=$SUPABASE_URL
ENV SUPABASE_PUBLISHABLE_KEY=$SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID

# Copie le build et les deps runtime (hono + @hono/node-server)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/host.mjs ./host.mjs
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Fallback Coolify : si un cache ou une commande de démarrage lance l'app sans
# artefacts dist, le wrapper peut reconstruire au démarrage au lieu de sortir.
COPY --from=builder /app/src ./src
COPY --from=builder /app/vite.config.ts ./vite.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/wrangler.jsonc ./wrangler.jsonc

EXPOSE 3000

CMD ["bun", "run", "start"]
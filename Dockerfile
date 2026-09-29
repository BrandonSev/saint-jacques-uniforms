# ---- Build stage ----
FROM oven/bun:1 AS builder
WORKDIR /app

# Figées dans le bundle client au build : fournies par GitHub Actions (build-args), aucune valeur par défaut.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID

RUN test -n "$VITE_SUPABASE_URL" && test -n "$VITE_SUPABASE_PUBLISHABLE_KEY" \
  || (echo "VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY manquantes (build-args)" && exit 1)

COPY package.json bun.lock* bun.lockb* ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# ---- Runtime stage ----
FROM oven/bun:1-slim AS runtime
WORKDIR /app

# Variables serveur (SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY, ...) : fournies par Coolify au démarrage.
ENV NODE_ENV=production
ENV PORT=3000

# Build Nitro (node-server) : serveur Node autonome, aucun wrapper nécessaire.
COPY --from=builder /app/.output ./.output

EXPOSE 3000

CMD ["bun", ".output/server/index.mjs"]

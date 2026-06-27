# ─── Stage 1: Install dependencies ─────────────────────────────────────────
# node:20-slim (Debian/glibc) — required by onnxruntime-node (used by
# @huggingface/transformers for local CPU embeddings); the prior alpine/musl
# base has no prebuilt onnxruntime binary.
FROM node:20-slim AS deps
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --install-strategy=nested --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000

# ─── Stage 2: Build ───────────────────────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app

# Copy backend deps
COPY --from=deps /app/node_modules ./node_modules
COPY backend/ ./

# Copy Prisma schema inside backend directory so Prisma finds /app/package.json
# (avoids the "could not find package.json at root /" auto-install failure)
COPY prisma/ ./prisma/

# Copy root lib files imported by seed scripts (e.g. lib/currency.ts, lib/db.ts)
COPY lib/currency.ts ./lib/currency.ts
COPY lib/db.ts ./lib/db.ts

# Generate Prisma client
RUN npx prisma generate --schema=./prisma/schema.prisma

# Build NestJS
ENV NODE_ENV=production
RUN npx nest build

# Pre-bake the embedding model into the image cache (no prod cold-start).
# Non-fatal: if the download fails, the model lazy-loads at runtime instead.
ENV TRANSFORMERS_CACHE=/app/.models
RUN node scripts/bake-embeddings.mjs || echo "[bake] skipped — model will download at runtime"

# ─── Stage 3: Production runner ───────────────────────────────────────────
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV TRANSFORMERS_CACHE=/app/.models

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nestjs

# Copy compiled output + production deps
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Copy Prisma schema + generated client (needed at runtime)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy root lib files needed by seed scripts at runtime (ts-node resolves ../../lib/*)
COPY --from=builder /app/lib ./lib

# Baked embedding model cache
COPY --from=builder /app/.models ./.models

RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3001
ENV API_PORT=3001

CMD ["node", "dist/main.js"]

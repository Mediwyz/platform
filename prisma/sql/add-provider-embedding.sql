-- Semantic search: per-provider Gemini embedding stored as a float array.
-- Similarity is computed in-app (no pgvector needed at this scale). Idempotent.

CREATE TABLE IF NOT EXISTS "ProviderEmbedding" (
  "id"             TEXT PRIMARY KEY,
  "providerUserId" TEXT NOT NULL,
  "textCorpus"     TEXT NOT NULL,
  "embedding"      DOUBLE PRECISION[] NOT NULL DEFAULT '{}',
  "dim"            INTEGER NOT NULL DEFAULT 0,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "ProviderEmbedding_providerUserId_key" ON "ProviderEmbedding"("providerUserId");

-- pgvector: native vector column for similarity search (Gemini text-embedding-004
-- is 768-dim). The Float[] column above is kept as a portable backup / fallback.
CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE "ProviderEmbedding" ADD COLUMN IF NOT EXISTS "embeddingVec" vector(768);

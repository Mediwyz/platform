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

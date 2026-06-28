-- Semantic search for the Health Shop: a native pgvector column on each
-- inventory item (768-dim, same local e5 model as providers). Embeddings are
-- written on item create/update + backfilled on boot. Idempotent.

CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE "ProviderInventoryItem" ADD COLUMN IF NOT EXISTS "embeddingVec" vector(768);

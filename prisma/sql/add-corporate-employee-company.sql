-- Per-company membership: add companyId to CorporateEmployee. Idempotent.
-- The data backfill lives in seed 62 (runs AFTER seeds create the rows).
ALTER TABLE "CorporateEmployee" ADD COLUMN IF NOT EXISTS "companyId" TEXT;
CREATE INDEX IF NOT EXISTS "CorporateEmployee_companyId_idx" ON "CorporateEmployee"("companyId");

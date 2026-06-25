-- Switch CorporateEmployee uniqueness from per-owner to per-company so a person
-- can belong to several of an owner's companies at once. Idempotent + safe.

-- 1. Defensive: ensure every row has a companyId before enforcing uniqueness.
UPDATE "CorporateEmployee" e
SET "companyId" = (
  SELECT p."id" FROM "CorporateAdminProfile" p WHERE p."userId" = e."corporateAdminId" LIMIT 1
)
WHERE e."companyId" IS NULL
  AND EXISTS (SELECT 1 FROM "CorporateAdminProfile" p WHERE p."userId" = e."corporateAdminId");

-- 2. Drop the old per-owner unique.
ALTER TABLE "CorporateEmployee" DROP CONSTRAINT IF EXISTS "CorporateEmployee_corporateAdminId_userId_key";

-- 3. Remove any duplicate (companyId, userId) rows (keep the lowest id) so the
--    new unique can be added safely.
DELETE FROM "CorporateEmployee" a
USING "CorporateEmployee" b
WHERE a."companyId" IS NOT NULL
  AND a."companyId" = b."companyId"
  AND a."userId" = b."userId"
  AND a."id" > b."id";

-- 4. Add the per-company unique (idempotent).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CorporateEmployee_companyId_userId_key'
  ) THEN
    ALTER TABLE "CorporateEmployee"
      ADD CONSTRAINT "CorporateEmployee_companyId_userId_key" UNIQUE ("companyId", "userId");
  END IF;
END $$;

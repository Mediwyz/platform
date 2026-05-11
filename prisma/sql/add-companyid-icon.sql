-- Manual migration: Add companyId to DoctorPost and icon to ProviderSpecialty
-- Run this BEFORE prisma db push to avoid FK constraint errors

-- Add companyId column to DoctorPost table (nullable, no FK yet)
ALTER TABLE "DoctorPost" ADD COLUMN IF NOT EXISTS "companyId" TEXT;

-- Add icon column to ProviderSpecialty table
ALTER TABLE "ProviderSpecialty" ADD COLUMN IF NOT EXISTS "icon" TEXT;

-- Create index on companyId
CREATE INDEX IF NOT EXISTS "DoctorPost_companyId_idx" ON "DoctorPost"("companyId");

-- Add FK constraint for companyId -> CorporateAdminProfile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'DoctorPost_companyId_fkey'
  ) THEN
    ALTER TABLE "DoctorPost"
    ADD CONSTRAINT "DoctorPost_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "CorporateAdminProfile"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

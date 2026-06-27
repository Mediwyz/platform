-- Org-level booking: link a ServiceBooking to the org it was made through, and
-- give each provider per-org weekly availability. Idempotent — runs every deploy.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. ServiceBooking → organisation link.
ALTER TABLE "ServiceBooking" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
CREATE INDEX IF NOT EXISTS "ServiceBooking_organizationId_idx" ON "ServiceBooking"("organizationId");

-- 2. Per-org provider availability.
CREATE TABLE IF NOT EXISTS "OrgProviderAvailability" (
  "id"                 TEXT PRIMARY KEY,
  "userId"             TEXT NOT NULL,
  "healthcareEntityId" TEXT NOT NULL,
  "dayOfWeek"          INTEGER NOT NULL,
  "startTime"          TEXT NOT NULL,
  "endTime"            TEXT NOT NULL,
  "isActive"           BOOLEAN NOT NULL DEFAULT true,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "OrgProviderAvailability_unique"
  ON "OrgProviderAvailability"("userId","healthcareEntityId","dayOfWeek","startTime");
CREATE INDEX IF NOT EXISTS "OrgProviderAvailability_userId_idx" ON "OrgProviderAvailability"("userId");
CREATE INDEX IF NOT EXISTS "OrgProviderAvailability_entity_idx" ON "OrgProviderAvailability"("healthcareEntityId");

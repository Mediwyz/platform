-- Sell a Health Shop item under an organisation (e.g. a pharmacy) the provider
-- belongs to, or as an individual (null). Backward-compatible nullable column.

-- AlterTable
ALTER TABLE "public"."ProviderInventoryItem" ADD COLUMN "healthcareEntityId" TEXT;

-- CreateIndex
CREATE INDEX "ProviderInventoryItem_healthcareEntityId_idx" ON "public"."ProviderInventoryItem"("healthcareEntityId");

-- AddForeignKey
ALTER TABLE "public"."ProviderInventoryItem" ADD CONSTRAINT "ProviderInventoryItem_healthcareEntityId_fkey" FOREIGN KEY ("healthcareEntityId") REFERENCES "public"."HealthcareEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

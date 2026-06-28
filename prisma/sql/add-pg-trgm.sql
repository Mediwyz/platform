-- Fuzzy name→ID resolution for the Wyzo agent: trigram similarity matching so
-- "Dr Rakoto" / "clinique moka" resolve even when slightly misspelled.
-- Idempotent. The agent falls back to in-app bigram scoring if this is absent.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN trigram indexes keep similarity() lookups fast as the tables grow.
CREATE INDEX IF NOT EXISTS "user_fullname_trgm"
  ON "User" USING gin ((lower("firstName" || ' ' || "lastName")) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "entity_name_trgm"
  ON "HealthcareEntity" USING gin ((lower("name")) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "inventory_name_trgm"
  ON "ProviderInventoryItem" USING gin ((lower("name")) gin_trgm_ops);

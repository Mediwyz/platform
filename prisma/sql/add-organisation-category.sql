-- Manual migration: OrganisationCategory table (regional-admin managed org types)
-- Idempotent: safe to run on every deploy.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS "OrganisationCategory" (
  "id"           TEXT PRIMARY KEY,
  "key"          TEXT NOT NULL,
  "label"        TEXT NOT NULL,
  "blurb"        TEXT,
  "icon"         TEXT NOT NULL DEFAULT 'FaBuilding',
  "displayOrder" INTEGER NOT NULL DEFAULT 100,
  "isActive"     BOOLEAN NOT NULL DEFAULT true,
  "regionCode"   TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "OrganisationCategory_key_key" ON "OrganisationCategory"("key");
CREATE INDEX IF NOT EXISTS "OrganisationCategory_isActive_idx" ON "OrganisationCategory"("isActive");

-- Seed the default categories (only if absent).
INSERT INTO "OrganisationCategory" ("id","key","label","blurb","icon","displayOrder") VALUES
  (gen_random_uuid(),'pharmacy',        'Pharmacy',        'Pharmacies & drugstores',          'FaPrescriptionBottleAlt', 10),
  (gen_random_uuid(),'clinic',          'Clinic',          'Outpatient clinics',               'FaClinicMedical',         20),
  (gen_random_uuid(),'hospital',        'Hospital',        'Hospitals & medical centers',      'FaHospital',              30),
  (gen_random_uuid(),'laboratory',      'Laboratory',      'Diagnostic & pathology labs',      'FaFlask',                 40),
  (gen_random_uuid(),'insurance',       'Insurance',       'Insurance companies',              'FaShieldAlt',             50),
  (gen_random_uuid(),'dental_clinic',   'Dental Clinic',   'Dental practices',                 'FaTooth',                 60),
  (gen_random_uuid(),'optical_center',  'Optical Center',  'Opticians & eyewear',              'FaEye',                   70),
  (gen_random_uuid(),'wellness_center', 'Wellness Center', 'Wellness, therapy & rehab',        'FaSpa',                   80),
  (gen_random_uuid(),'self_employed',   'Self-employed',   'Solo practice / freelancer',       'FaUserMd',                90),
  (gen_random_uuid(),'other',           'Other',           'Company not related to healthcare','FaBuilding',             100)
ON CONFLICT ("key") DO NOTHING;

-- Emergency / ambulance services. Key 'ambulance' matches the EMERGENCY_WORKER
-- role and triggers the Dispatch tab on the org manage page. Idempotent.
INSERT INTO "OrganisationCategory" ("id","key","label","blurb","icon","displayOrder") VALUES
  (gen_random_uuid(),'ambulance',       'Emergency / Ambulance','Ambulance & emergency response services','FaAmbulance',  35)
ON CONFLICT ("key") DO NOTHING;

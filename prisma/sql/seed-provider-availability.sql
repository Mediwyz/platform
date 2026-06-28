-- Make every active provider bookable: seed default weekday availability
-- (Mon–Fri 09:00–17:00, 30-min slots) for any provider that has none.
-- Many seeded providers (e.g. doctors) had no ProviderAvailability rows, so the
-- in-chat booking flow always returned "no slots". Idempotent: the NOT EXISTS
-- guard + unique(userId,dayOfWeek,startTime) prevent duplicates on re-run.

INSERT INTO "ProviderAvailability"
  ("id", "userId", "dayOfWeek", "startTime", "endTime", "slotDuration", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, u.id, d.dow, '09:00', '17:00', 30, true, now(), now()
FROM "User" u
CROSS JOIN (VALUES (1), (2), (3), (4), (5)) AS d(dow)
WHERE u."accountStatus" = 'active'
  AND u."userType" IN (
    'DOCTOR','NURSE','NANNY','PHARMACIST','LAB_TECHNICIAN','EMERGENCY_WORKER',
    'CAREGIVER','PHYSIOTHERAPIST','DENTIST','OPTOMETRIST','NUTRITIONIST'
  )
  AND NOT EXISTS (SELECT 1 FROM "ProviderAvailability" pa WHERE pa."userId" = u.id)
ON CONFLICT ("userId", "dayOfWeek", "startTime") DO NOTHING;

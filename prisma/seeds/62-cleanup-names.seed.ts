import { PrismaClient } from '@prisma/client'

/**
 * Seed 62 - One-time cleanup: replace real company/entity names with mock names.
 *
 * Problem: previous seeds used "find-then-skip" patterns that don't update
 * existing records. When we renamed companies to avoid legal risk, old names
 * persisted in the DB while re-seeding created duplicate records with the new
 * names. This seed corrects both issues.
 *
 * Safe to re-run: all operations are idempotent.
 */

const OLD_ENTITY_NAMES = [
  'City Clinic Mauritius',
  'Apollo Bramwell Hospital',
  'Grand Baie Medical Centre',
  'MedLab Analysis',
  'SmileFirst Dental Clinic',
  'ClearVision Optical Centre',
  'Physiotherapy & Rehab Centre Mauritius',
  'Clinique Adventiste Antananarivo',
  'Nairobi West Hospital',
]

// Map old corporate company names → new mock names
const COMPANY_RENAMES: Record<string, string> = {
  'MediCare Clinic Mauritius': 'BlueLagoon Medical Clinic',
  'MediShield Mauritius':      'Flamingo Health Co',
}

// Mock names that may have been created as duplicates alongside old names;
// we'll remove the duplicate if the old-name record also exists (and has been renamed).
const DUPLICATE_MOCK_NAMES = ['Flamingo Health Co']

export async function seedCleanupNames(prisma: PrismaClient) {
  console.log('  Running name-cleanup seed...')
  let entityDeleted = 0
  let companyUpdated = 0
  let duplicateDeleted = 0

  // ── 1. Remove old healthcare entities ────────────────────────────────────
  // seed 60 already upserted new mock-name entities. The old real-name records
  // are orphans - cascade delete removes their ProviderWorkplace links.
  const oldEntities = await (prisma.healthcareEntity as any).findMany({
    where: { name: { in: OLD_ENTITY_NAMES } },
    select: { id: true, name: true },
  })

  if (oldEntities.length > 0) {
    const oldIds = oldEntities.map((e: any) => e.id)
    const del = await (prisma.healthcareEntity as any).deleteMany({
      where: { id: { in: oldIds } },
    })
    entityDeleted = del.count
    console.log(`  ✓ Removed ${entityDeleted} old-name healthcare entities`)
  }

  // ── 2. Rename old corporate company names ────────────────────────────────
  for (const [oldName, newName] of Object.entries(COMPANY_RENAMES)) {
    const res = await prisma.corporateAdminProfile.updateMany({
      where: { companyName: oldName },
      data:  { companyName: newName },
    })
    if (res.count > 0) {
      companyUpdated += res.count
      console.log(`  ✓ Renamed "${oldName}" → "${newName}" (${res.count} record(s))`)
    }
  }

  // ── 3. Remove duplicates created by re-seeding ───────────────────────────
  // After renaming "MediShield Mauritius" → "Flamingo Health Co", a user may
  // have two CorporateAdminProfile rows both named "Flamingo Health Co":
  //   - The original (now renamed) with employees, treasury, claims attached
  //   - A newly-created empty duplicate from seed 47's re-run
  //
  // We delete the NEWER empty duplicate (no treasury, no claims, no plans).
  for (const mockName of DUPLICATE_MOCK_NAMES) {
    const records = await prisma.corporateAdminProfile.findMany({
      where: { companyName: mockName },
      include: {
        treasury:         true,
        claimSubmissions: { take: 1 },
        plans:            { take: 1 },
      },
      orderBy: { id: 'asc' },
    })

    if (records.length <= 1) continue

    // Group by userId; only clean up users with multiple same-name records
    const byUser: Record<string, typeof records> = {}
    for (const r of records) {
      byUser[r.userId] = byUser[r.userId] ?? []
      byUser[r.userId].push(r)
    }

    for (const [, userRecords] of Object.entries(byUser)) {
      if (userRecords.length <= 1) continue

      // Keep the first (oldest by id sort); delete newer ones that have no data
      const [keeper, ...extras] = userRecords
      void keeper // we keep this one

      for (const dup of extras) {
        const hasData =
          dup.treasury !== null ||
          dup.claimSubmissions.length > 0 ||
          dup.plans.length > 0

        if (!hasData) {
          await prisma.corporateAdminProfile.delete({ where: { id: dup.id } })
          duplicateDeleted++
          console.log(`  ✓ Removed empty duplicate "${mockName}" (id=${dup.id})`)
        }
      }
    }
  }

  console.log(
    `  Name-cleanup done - entities: ${entityDeleted}, companies renamed: ${companyUpdated}, duplicates removed: ${duplicateDeleted}`,
  )
}

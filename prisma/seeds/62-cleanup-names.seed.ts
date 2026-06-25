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

  // ── 4. Replace real public-figure names with mock names ──────────────────
  // Avoid using real people (e.g. a sitting head of state) as seed data.
  const USER_RENAMES = [
    { match: { firstName: 'Andry', lastName: 'Rajoelina' }, to: { firstName: 'Mamy', lastName: 'Rakotonirina' } },
  ]
  let userRenamed = 0
  for (const r of USER_RENAMES) {
    const res = await prisma.user.updateMany({ where: r.match, data: r.to })
    userRenamed += res.count
  }
  if (userRenamed) console.log(`  ✓ Renamed ${userRenamed} real-person user name(s)`)

  // ── 5. Give every seeded user a realistic portrait avatar ────────────────
  // Local portraits live in public/images/avatars/{f,m}/0..24.jpg. Runs last so
  // users from every prior seed (incl. dentists/nutritionists in seed 32) exist.
  const AVATARS_PER_GENDER = 25
  const GENDER_OVERRIDE: Record<string, 'f' | 'm'> = {
    DOC001: 'f', DOC002: 'm', DOC003: 'f', NUTR001: 'm', DENT001: 'f', PHARM001: 'm', PHARM002: 'f',
    NUR001: 'f', NUR002: 'f', NAN001: 'f', NAN002: 'f', PAT001: 'f', PAT002: 'm', PAT003: 'f',
    PAT004: 'm', PAT005: 'f', LAB001: 'm', LAB002: 'f', EMW001: 'm', EMW002: 'f', INS001: 'm',
    INS002: 'f', CORP001: 'm', REF001: 'f', RADM000: 'm', RADM001: 'f', RADM002: 'f', RADM003: 'm',
  }
  // Only replace seed-generated/placeholder avatars — never a real uploaded photo.
  const isSeedAvatar = (p: string | null) =>
    !p || p.endsWith('.svg') || p.startsWith('/uploads/seed/') ||
    p.startsWith('/images/doctors') || p.startsWith('/images/nurses') ||
    p.startsWith('/images/patients') || p.includes('dicebear')

  const users = await prisma.user.findMany({
    select: { id: true, gender: true, profileImage: true },
    orderBy: { id: 'asc' },
  })
  const counters: Record<'f' | 'm', number> = { f: 0, m: 0 }
  let avatarsSet = 0
  for (const u of users) {
    if (!isSeedAvatar(u.profileImage)) continue
    let g: 'f' | 'm'
    if (GENDER_OVERRIDE[u.id]) {
      g = GENDER_OVERRIDE[u.id]
    } else {
      const gg = (u.gender || '').trim().toLowerCase()
      if (gg.startsWith('f')) g = 'f'
      else if (gg.startsWith('m')) g = 'm'
      else g = (counters.f + counters.m) % 2 === 0 ? 'f' : 'm'
    }
    const idx = counters[g] % AVATARS_PER_GENDER
    counters[g]++
    await prisma.user.update({ where: { id: u.id }, data: { profileImage: `/images/avatars/${g}/${idx}.jpg` } })
    avatarsSet++
  }
  console.log(`  ✓ Assigned realistic portraits to ${avatarsSet} users`)

  // ── 6. Enrich every user with realistic personal details ─────────────────
  // Only fills fields that are currently empty, so a real user's edits are
  // never overwritten. Values are deterministic (derived from id/gender/role).
  const enriched = await enrichUserProfiles(prisma)
  console.log(`  ✓ Enriched ${enriched} user profiles with personal details`)

  console.log(
    `  Name-cleanup done - entities: ${entityDeleted}, companies renamed: ${companyUpdated}, duplicates removed: ${duplicateDeleted}`,
  )
}

// Country profile presets keyed by the 2-letter id prefix (multi-country users
// are `${CODE}-${ROLE}###`). Mauritius users have no prefix → default.
const COUNTRY_PRESETS: Record<string, { country: string; nationality: string; city: string; postal: string; dial: string; languages: string[] }> = {
  MG: { country: 'Madagascar', nationality: 'Malagasy', city: 'Antananarivo', postal: '101', dial: '+261', languages: ['Malagasy', 'French'] },
  KE: { country: 'Kenya',      nationality: 'Kenyan',    city: 'Nairobi',      postal: '00100', dial: '+254', languages: ['English', 'Swahili'] },
  TG: { country: 'Togo',       nationality: 'Togolese',  city: 'Lomé',         postal: '01BP', dial: '+228', languages: ['French', 'Ewe'] },
  BJ: { country: 'Benin',      nationality: 'Beninese',  city: 'Cotonou',      postal: '229', dial: '+229', languages: ['French', 'Fon'] },
  RW: { country: 'Rwanda',     nationality: 'Rwandan',   city: 'Kigali',       postal: '250', dial: '+250', languages: ['Kinyarwanda', 'French', 'English'] },
  MU: { country: 'Mauritius',  nationality: 'Mauritian', city: 'Port Louis',   postal: '11328', dial: '+230', languages: ['English', 'French', 'Mauritian Creole'] },
}

const OCCUPATION_BY_TYPE: Record<string, string> = {
  DOCTOR: 'Physician', NURSE: 'Registered Nurse', NANNY: 'Childcare Nurse', PHARMACIST: 'Pharmacist',
  LAB_TECHNICIAN: 'Laboratory Technician', EMERGENCY_WORKER: 'Emergency Responder', INSURANCE_REP: 'Insurance Advisor',
  CORPORATE_ADMIN: 'Corporate Administrator', REFERRAL_PARTNER: 'Referral Partner', REGIONAL_ADMIN: 'Regional Administrator',
  CAREGIVER: 'Caregiver', PHYSIOTHERAPIST: 'Physiotherapist', DENTIST: 'Dentist', OPTOMETRIST: 'Optometrist',
  NUTRITIONIST: 'Nutritionist', PATIENT: 'Member', MEMBER: 'Member',
}

const MARITAL_CYCLE = ['single', 'married', 'married', 'single', 'divorced', 'married']
const REL_CYCLE = ['Spouse', 'Parent', 'Sibling', 'Friend', 'Partner']
const EMERGENCY_NAMES = ['Alex Carter', 'Sam Rivera', 'Jordan Blake', 'Casey Morgan', 'Taylor Reed', 'Robin Hayes']

function hashId(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

async function enrichUserProfiles(prisma: PrismaClient): Promise<number> {
  const users = await prisma.user.findMany({
    select: {
      id: true, firstName: true, lastName: true, gender: true, userType: true, phone: true,
      preferredName: true, pronouns: true, nationality: true, country: true, city: true, postalCode: true,
      maritalStatus: true, occupation: true, employer: true, languages: true,
      emergencyContactName: true, emergencyContactPhone: true, emergencyContactRelationship: true,
      heightCm: true, weightKg: true, website: true, linkedinUrl: true,
    },
    orderBy: { id: 'asc' },
  })

  let count = 0
  for (const u of users) {
    const code = /^[A-Z]{2}-/.test(u.id) ? u.id.slice(0, 2) : 'MU'
    const preset = COUNTRY_PRESETS[code] ?? COUNTRY_PRESETS.MU
    const h = hashId(u.id)
    const gg = (u.gender || '').trim().toLowerCase()
    const isFemale = gg.startsWith('f')
    const isProvider = !['PATIENT', 'MEMBER', 'ADMIN', 'REGIONAL_ADMIN', 'CORPORATE_ADMIN'].includes(u.userType as string)
    const slug = `${u.firstName}.${u.lastName}`.toLowerCase().replace(/[^a-z.]/g, '')

    const data: Record<string, any> = {}
    const setIfEmpty = (key: keyof typeof u, value: any) => {
      const cur = (u as any)[key]
      if (cur === null || cur === undefined || cur === '' || (Array.isArray(cur) && cur.length === 0)) data[key] = value
    }

    setIfEmpty('preferredName', u.firstName)
    setIfEmpty('pronouns', isFemale ? 'she/her' : gg.startsWith('m') ? 'he/him' : 'they/them')
    setIfEmpty('nationality', preset.nationality)
    setIfEmpty('country', preset.country)
    setIfEmpty('city', preset.city)
    setIfEmpty('postalCode', preset.postal)
    setIfEmpty('languages', preset.languages)
    setIfEmpty('maritalStatus', MARITAL_CYCLE[h % MARITAL_CYCLE.length])
    setIfEmpty('occupation', OCCUPATION_BY_TYPE[u.userType as string] ?? 'Member')
    setIfEmpty('employer', isProvider ? 'MediWyz Partner Network' : null)
    setIfEmpty('emergencyContactName', EMERGENCY_NAMES[h % EMERGENCY_NAMES.length])
    setIfEmpty('emergencyContactPhone', `${preset.dial} ${5 + (h % 4)}${String(1000000 + (h % 8999999)).slice(0, 7)}`)
    setIfEmpty('emergencyContactRelationship', REL_CYCLE[h % REL_CYCLE.length])
    // Biometrics: plausible ranges by gender, stable per user.
    setIfEmpty('heightCm', isFemale ? 156 + (h % 18) : 168 + (h % 20))
    setIfEmpty('weightKg', (isFemale ? 52 + (h % 28) : 64 + (h % 34)) + 0.0)
    if (isProvider) {
      setIfEmpty('linkedinUrl', `https://www.linkedin.com/in/${slug}`)
      setIfEmpty('website', `https://mediwyz.com/profile/${u.id}`)
    }

    if (Object.keys(data).length > 0) {
      await prisma.user.update({ where: { id: u.id }, data })
      count++
    }
  }
  return count
}

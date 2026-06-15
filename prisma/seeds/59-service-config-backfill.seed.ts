/**
 * Seed 59 - Unique service ownership + realistic workflow attachment
 *
 * Responsibilities:
 * 0. Top up providers per type so there are enough to give every service an
 *    owner under the "<=3 services/provider, no service shared" rule
 *    (generates searchable, map-located mock providers where a type is short).
 * 1. Assign each active isDefault PlatformService to EXACTLY ONE provider of the
 *    matching type, with at most 3 services per provider. This makes the service
 *    filter meaningful (one service -> one provider) instead of every provider
 *    offering every service. Runs AFTER seed 57/58.
 * 2. For every ProviderServiceConfig, attach ONLY the workflow templates whose
 *    serviceMode is clinically appropriate for that service:
 *
 *      "Dry Eye Management"     → office only   (eye exams need in-person equipment)
 *      "Home Nursing Visit"     → home only      (explicitly home-based)
 *      "Video Consultation"     → video only     (explicitly remote)
 *      "Blood Test"             → office + home  (can collect in clinic or at home)
 *      "General Consultation"   → office + video (most outpatient services)
 *      "Emergency Dispatch"     → home/emergency (responder goes to patient)
 *
 * Safe to re-run: deletes all auto-attached links and reapplies with correct logic.
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

// ─── Mock provider generation pools (Step 0) ───────────────────────────────────
const FIRST_NAMES = [
  'Aanya', 'Bilal', 'Chloe', 'Devan', 'Elodie', 'Farouk', 'Gita', 'Hugo', 'Ishani', 'Jordan',
  'Kavi', 'Lina', 'Mathis', 'Nisha', 'Oscar', 'Priya', 'Rayan', 'Sasha', 'Tarun', 'Uma',
  'Vimal', 'Wendy', 'Xena', 'Yannick', 'Zara', 'Ayaan', 'Bianca', 'Cedric', 'Diya', 'Emeric',
  'Fanny', 'Girish', 'Hema', 'Imran', 'Jaya', 'Karan', 'Laetitia', 'Mira', 'Naveen', 'Owen',
]
const LAST_NAMES = [
  'Appadoo', 'Bhola', 'Curpen', 'Dookhy', 'Emrith', 'Fokeer', 'Gungah', 'Hurloll', 'Issur', 'Jhuboo',
  'Khodabux', 'Luchmun', 'Mungroo', 'Nababsing', 'Oozeer', 'Peerbaccus', 'Quirin', 'Ramphul', 'Seeruttun', 'Teeluck',
  'Unmole', 'Veerapen', 'Woograsing', 'Yerriah', 'Zafer', 'Beeharry', 'Callychurn', 'Dhondee', 'Elahee', 'Foolchand',
]
const CITIES = [
  { name: 'Port Louis', lat: -20.1609, lng: 57.4977 },
  { name: 'Curepipe', lat: -20.3173, lng: 57.5259 },
  { name: 'Quatre Bornes', lat: -20.2648, lng: 57.4759 },
  { name: 'Vacoas', lat: -20.2985, lng: 57.4786 },
  { name: 'Rose Hill', lat: -20.2342, lng: 57.4617 },
  { name: 'Beau Bassin', lat: -20.2267, lng: 57.4684 },
  { name: 'Grand Baie', lat: -20.0130, lng: 57.5820 },
  { name: 'Mahebourg', lat: -20.4072, lng: 57.7020 },
  { name: 'Flacq', lat: -20.1908, lng: 57.7150 },
  { name: 'Moka', lat: -20.2366, lng: 57.4960 },
]
const TYPE_ABBR: Record<string, string> = {
  DOCTOR: 'GDOC', NURSE: 'GNUR', NANNY: 'GNAN', PHARMACIST: 'GPHA', LAB_TECHNICIAN: 'GLAB',
  EMERGENCY_WORKER: 'GEMR', CAREGIVER: 'GCAR', PHYSIOTHERAPIST: 'GPHY', DENTIST: 'GDEN',
  OPTOMETRIST: 'GOPT', NUTRITIONIST: 'GNUT',
}

// ─── Mode inference ───────────────────────────────────────────────────────────
// Returns which serviceModes are clinically appropriate for a given service.
// Keeps the list short (1-2 modes) so patients see 1-2 appointment types max.

function inferModes(serviceName: string, category: string): string[] {
  const text = (serviceName + ' ' + category).toLowerCase()

  // ── Emergency - responder always goes TO the patient ────────────────────
  if (text.match(/\bemergency|urgence|ambulance|secours|rescue|first aid|premiers secours\b/))
    return ['home']

  // ── Explicitly home-based services ─────────────────────────────────────
  if (text.match(/\bhome visit|visite.{0,8}domicile|domicile|house call|home nursing|nursing.{0,5}home|home care|elderly.{0,5}home|post.surgery care|wound dressing|injection\b/))
    return ['home']

  // ── Explicitly video / telemedicine ────────────────────────────────────
  if (text.match(/\bvideo consult|teleconsult|telemedicine|online consult|remote consult|virtual consult|digital health\b/))
    return ['video']

  // ── Office-only: requires specialised equipment or in-person procedure ──
  if (text.match(/\beye exam|vision test|fundus|retina|glaucoma|cataract|optical|contact lens|glasses fitting|dry eye|macular|cornea|optom\b/))
    return ['office']

  if (text.match(/\bsurgery|chirurgie|operation|root canal|implant|extraction|biopsy|endoscopy|colonoscopy|mri|scanner|xray|x.ray|ultrasound|sonographie|radiology|cardiac|ecg|eeg|procedure\b/))
    return ['office']

  if (text.match(/\bdental checkup|teeth cleaning|dental exam|tooth|wisdom|orthodont|braces\b/))
    return ['office']

  // ── Lab / sample collection - in clinic OR nurse comes home ────────────
  if (text.match(/\bblood test|urine test|sample|prelevement|specimen|collection|lab test|analyse|lipid|cbc|complete blood|glucose|hba1c|thyroid|creatinine\b/))
    return ['office', 'home']

  // ── Physical therapy / rehabilitation - clinic or home session ─────────
  if (text.match(/\bphysio|physiotherapy|kine|rehab|rehabilitation|sports rehab|massage|manipulation|osteopath\b/))
    return ['office', 'home']

  // ── Caregiver / elderly care - always at patient's location ────────────
  if (text.match(/\belderly|senior care|post.surgery|recovery care|personal care|palliative|respite\b/))
    return ['home']

  // ── Consultation with prescription / follow-up - office or video ───────
  if (text.match(/\bprescription|ordonnance|medication|refill|renewal|follow.?up|follow up|consultation générale|general consult|initial consult\b/))
    return ['office', 'video']

  // ── Nutrition / mental health / coaching - office or video ─────────────
  if (text.match(/\bnutrition|diet consult|meal plan|dietary|weight loss|nutritional|mental health|psychology|psychiatry|counseling|therapy session|coaching\b/))
    return ['office', 'video']

  // ── Pharmacy / medication dispensing - office (pickup) or home (delivery)
  if (text.match(/\bpharmacy|medicine|drug|dispensing|delivery|medication order\b/))
    return ['office', 'home']

  // ── Default: general outpatient consultation (office + video) ──────────
  return ['office', 'video']
}

// ─── Main seed function ───────────────────────────────────────────────────────

export async function seedServiceConfigBackfill(prisma: PrismaClient) {
  console.log('  Seeding service config backfill (seed 59)...')

  const providerTypes = [
    'DOCTOR', 'NURSE', 'NANNY',
    'PHARMACIST', 'LAB_TECHNICIAN', 'EMERGENCY_WORKER',
    'CAREGIVER', 'PHYSIOTHERAPIST', 'DENTIST',
    'OPTOMETRIST', 'NUTRITIONIST',
  ]

  const [providers, services] = await Promise.all([
    prisma.user.findMany({
      where: { userType: { in: providerTypes as any[] }, accountStatus: 'active' },
      select: { id: true, userType: true },
    }),
    prisma.platformService.findMany({
      where: { isDefault: true, isActive: true },
      select: { id: true, providerType: true, serviceName: true, category: true },
    }),
  ])

  // Build lookups
  const servicesByType = new Map<string, typeof services>()
  for (const s of services) {
    const list = servicesByType.get(s.providerType) ?? []
    list.push(s)
    servicesByType.set(s.providerType, list)
  }

  // Group providers by type (mutated below as Step 0 tops up short-staffed types).
  const providersByType = new Map<string, typeof providers>()
  for (const p of providers) {
    const list = providersByType.get(p.userType) ?? []
    list.push(p)
    providersByType.set(p.userType, list)
  }

  const MAX_PER_PROVIDER = 3

  // ── Step 0: Top up providers so EVERY service can have its own owner ────────
  // With "<=3 services/provider and no service shared", a type needs at least
  // ceil(services / 3) providers to give every service a provider. Where a type
  // is short, generate searchable, map-located mock providers to cover the gap.
  const genHash = await bcrypt.hash('Provider123!', 10)
  const regionMU = await prisma.region.findFirst({ where: { countryCode: 'MU' } })

  let generated = 0
  let gIdx = 0 // global name cursor (keeps names varied across types)
  for (const type of providerTypes) {
    const svcCount = (servicesByType.get(type) ?? []).length
    if (!providersByType.has(type)) providersByType.set(type, [])
    const have = providersByType.get(type)!.length
    const needed = Math.ceil(svcCount / MAX_PER_PROVIDER)
    const deficit = Math.max(0, needed - have)

    for (let k = 0; k < deficit; k++) {
      const idx = gIdx++
      const first = FIRST_NAMES[idx % FIRST_NAMES.length]
      const last = LAST_NAMES[(idx * 7 + k) % LAST_NAMES.length]
      const city = CITIES[idx % CITIES.length]
      const abbr = TYPE_ABBR[type] ?? 'GEN'
      const id = `${abbr}-${String(k + 1).padStart(3, '0')}`
      const email = `${abbr.toLowerCase()}.${k + 1}.${first.toLowerCase()}@mediwyz.com`
      // small deterministic offsets so map markers do not stack on one point
      const lat = city.lat + (((idx % 5) - 2) * 0.004)
      const lng = city.lng + (((k % 5) - 2) * 0.004)
      try {
        await prisma.user.create({
          data: {
            id, firstName: first, lastName: last, email,
            password: genHash, phone: `+2305${String(7000000 + idx).slice(0, 7)}`,
            userType: type as any, accountStatus: 'active', verified: true,
            address: `${city.name}, Mauritius`, gender: idx % 2 === 0 ? 'Male' : 'Female',
            regionId: regionMU?.id, latitude: lat, longitude: lng,
          },
        })
        await prisma.userWallet.create({
          data: { userId: id, balance: 5000, currency: 'MUR', initialCredit: 5000 },
        }).catch(() => {})
        const newP = { id, userType: type } as (typeof providers)[number]
        providers.push(newP)
        providersByType.get(type)!.push(newP)
        generated++
      } catch {
        // id/email already exists (re-run on a non-wiped DB) — existing provider covers the slot
      }
    }
  }
  console.log(`  ✓ Step 0: generated ${generated} providers so every service can have an owner`)

  // ── Step 1: Assign services UNIQUELY to providers ──────────────────────────
  // Each provider offers AT MOST 3 services, every service is offered by EXACTLY
  // ONE provider, and (thanks to Step 0) every service gets an owner. This makes
  // the service filter meaningful: picking a service returns the single provider
  // who offers it. (The schema still allows sharing; this is how we seed demo data.)

  // Idempotent reset: drop any previously-assigned configs (and their workflow
  // links) for these providers so a re-run reproduces the same unique mapping.
  const providerIds = providers.map((p: any) => p.id)
  const existingCfgs = await (prisma.providerServiceConfig as any).findMany({
    where: { providerUserId: { in: providerIds } }, select: { id: true },
  })
  if (existingCfgs.length) {
    await (prisma.providerServiceWorkflow as any).deleteMany({
      where: { providerServiceConfigId: { in: existingCfgs.map((c: any) => c.id) } },
    })
    await (prisma.providerServiceConfig as any).deleteMany({
      where: { providerUserId: { in: providerIds } },
    })
  }

  let configsUpserted = 0
  let servicesUnassigned = 0
  for (const type of providerTypes) {
    const typeProviders = [...(providersByType.get(type) ?? [])].sort((a: any, b: any) => a.id.localeCompare(b.id))
    const typeServices  = [...(servicesByType.get(type) ?? [])].sort((a: any, b: any) => a.id.localeCompare(b.id))
    if (typeProviders.length === 0 || typeServices.length === 0) {
      servicesUnassigned += typeServices.length
      continue
    }

    // Round-robin so each provider gets one service before any gets a second,
    // capping at MAX_PER_PROVIDER. Services beyond total capacity stay unoffered.
    const counts = new Map<string, number>(typeProviders.map((p: any) => [p.id, 0]))
    let pIdx = 0
    for (const svc of typeServices) {
      let tries = 0
      while (tries < typeProviders.length && (counts.get(typeProviders[pIdx].id) ?? 0) >= MAX_PER_PROVIDER) {
        pIdx = (pIdx + 1) % typeProviders.length
        tries++
      }
      if ((counts.get(typeProviders[pIdx].id) ?? 0) >= MAX_PER_PROVIDER) {
        servicesUnassigned++ // every provider of this type is full
        continue
      }
      const provider = typeProviders[pIdx]
      await (prisma.providerServiceConfig as any).create({
        data: { platformServiceId: svc.id, providerUserId: provider.id, priceOverride: null, isActive: true },
      })
      counts.set(provider.id, (counts.get(provider.id) ?? 0) + 1)
      pIdx = (pIdx + 1) % typeProviders.length
      configsUpserted++
    }
  }

  console.log(`  ✓ ${configsUpserted} unique ProviderServiceConfig rows (<=${MAX_PER_PROVIDER}/provider, 1 provider/service); ${servicesUnassigned} services left unoffered`)

  // ── Step 2: Build template maps ────────────────────────────────────────────
  // Fetch ALL system/admin templates. Build:
  //   svcSpecificMap[serviceId]          → templates bound to exactly that service
  //   standardByTypeMode[type:mode]      → the one "-standard-{mode}" template per type+mode
  //   fallbackByTypeMode[type:mode]      → any template for type+mode (if no standard)

  const allTemplates = await (prisma.workflowTemplate as any).findMany({
    where: {
      isActive: true,
      createdByProviderId: null,
      providerType: { in: providerTypes as any[] },
    },
    select: {
      id: true,
      providerType: true,
      platformServiceId: true,
      serviceMode: true,
      slug: true,
      isDefault: true,
    },
  })

  const svcSpecificMap = new Map<string, string[]>()         // serviceId → [templateId]
  const standardByTypeMode = new Map<string, string>()       // "TYPE:mode" → templateId
  const fallbackByTypeMode = new Map<string, string[]>()     // "TYPE:mode" → [templateId]

  for (const t of allTemplates) {
    if (t.platformServiceId) {
      const list = svcSpecificMap.get(t.platformServiceId) ?? []
      list.push(t.id)
      svcSpecificMap.set(t.platformServiceId, list)
    } else {
      const key = `${t.providerType}:${t.serviceMode}`

      // The "-standard-" template is the one safe generic default per mode
      if (typeof t.slug === 'string' && t.slug.includes('-standard-')) {
        standardByTypeMode.set(key, t.id)
      }

      const fallList = fallbackByTypeMode.get(key) ?? []
      fallList.push(t.id)
      fallbackByTypeMode.set(key, fallList)
    }
  }

  // ── Step 3: Build a service metadata lookup (for mode inference) ───────────

  const serviceMeta = new Map(services.map(s => [s.id, { serviceName: s.serviceName, category: s.category }]))

  // ── Step 4: Reset and reattach with realistic modes ────────────────────────

  const allConfigs = await (prisma.providerServiceConfig as any).findMany({
    where: { providerUserId: { in: providers.map((p: any) => p.id) }, isActive: true },
    select: { id: true, providerUserId: true, platformServiceId: true },
  })

  const providerTypeMap = new Map(providers.map((p: any) => [p.id, p.userType]))

  // Clear all existing auto-attached links (full reset so re-run is idempotent)
  const configIds = allConfigs.map((c: any) => c.id)
  const deleted = await (prisma.providerServiceWorkflow as any).deleteMany({
    where: { providerServiceConfigId: { in: configIds } },
  })
  console.log(`  ✓ Cleared ${deleted.count} stale ProviderServiceWorkflow links`)

  let workflowsLinked = 0
  let skipped = 0

  for (const config of allConfigs) {
    const providerType = providerTypeMap.get(config.providerUserId) ?? ''
    const svcId = config.platformServiceId
    const meta = serviceMeta.get(svcId)

    // Priority 1: service-specific templates (most relevant - linked to this exact service)
    const specificIds = svcSpecificMap.get(svcId) ?? []
    if (specificIds.length > 0) {
      for (const tplId of specificIds) {
        await (prisma.providerServiceWorkflow as any).upsert({
          where: {
            providerServiceConfigId_workflowTemplateId: {
              providerServiceConfigId: config.id,
              workflowTemplateId: tplId,
            },
          },
          update: {},
          create: { providerServiceConfigId: config.id, workflowTemplateId: tplId },
        })
        workflowsLinked++
      }
      continue
    }

    // Priority 2: infer valid modes from service name/category, then attach
    // the standard template for each mode (or best fallback if no standard)
    if (!meta) { skipped++; continue }

    const validModes = inferModes(meta.serviceName, meta.category)

    let attachedCount = 0
    for (const mode of validModes) {
      const key = `${providerType}:${mode}`

      // Prefer the "-standard-" template; fall back to first available
      const tplId = standardByTypeMode.get(key)
        ?? (fallbackByTypeMode.get(key) ?? [])[0]

      if (!tplId) continue

      await (prisma.providerServiceWorkflow as any).upsert({
        where: {
          providerServiceConfigId_workflowTemplateId: {
            providerServiceConfigId: config.id,
            workflowTemplateId: tplId,
          },
        },
        update: {},
        create: { providerServiceConfigId: config.id, workflowTemplateId: tplId },
      })
      workflowsLinked++
      attachedCount++
    }

    if (attachedCount === 0) skipped++
  }

  console.log(`  ✓ ${workflowsLinked} ProviderServiceWorkflow links created (mode-inferred)`)
  if (skipped > 0) console.log(`  ⚠ ${skipped} configs skipped (no matching template for inferred modes)`)
}

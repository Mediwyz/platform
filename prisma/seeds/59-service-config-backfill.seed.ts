/**
 * Seed 59 - ProviderServiceConfig backfill + realistic workflow attachment
 *
 * Responsibilities:
 * 1. Ensure every active isDefault PlatformService has a ProviderServiceConfig
 *    row for every provider of the matching type (runs AFTER seed 57/58).
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

  // ── Step 1: Ensure ProviderServiceConfig rows ──────────────────────────────

  let configsUpserted = 0
  for (const provider of providers) {
    const svcs = servicesByType.get(provider.userType) ?? []
    for (const svc of svcs) {
      await (prisma.providerServiceConfig as any).upsert({
        where: {
          platformServiceId_providerUserId: {
            platformServiceId: svc.id,
            providerUserId: provider.id,
          },
        },
        update: {},
        create: {
          platformServiceId: svc.id,
          providerUserId: provider.id,
          priceOverride: null,
          isActive: true,
        },
      })
      configsUpserted++
    }
  }

  console.log(`  ✓ ${configsUpserted} ProviderServiceConfig rows ensured (${providers.length} providers)`)

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

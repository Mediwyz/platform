/**
 * Seed 60 - Healthcare Entities (clinics, hospitals, labs, etc.)
 *
 * Creates representative healthcare entities in Mauritius (and one per
 * other supported region) and links existing seeded providers to them
 * via ProviderWorkplace.
 *
 * Safe to re-run: upserts by entity name + city + country.
 */

import { PrismaClient } from '@prisma/client'

const ENTITIES = [
  // ── Mauritius ──────────────────────────────────────────────────────────────
  {
    name: 'BlueLagoon Clinic',
    type: 'clinic',
    description: 'Multi-specialty outpatient clinic in the heart of Port Louis, serving all ages with general practice, specialist consultations, and minor procedures.',
    address: '12 Sir William Newton St',
    city: 'Port Louis',
    country: 'MU',
    phone: '+230 211 0000',
    email: 'info@bluelagoonclinic.mu',
    latitude: -20.1619,
    longitude: 57.4989,
  },
  {
    name: 'Mount Olympus Hospital',
    type: 'hospital',
    description: 'Leading private hospital in Mauritius offering 24/7 emergency care, surgical suites, and over 40 specialties.',
    address: 'Royal Road, Moka',
    city: 'Moka',
    country: 'MU',
    phone: '+230 605 1000',
    email: 'info@mountolympushospital.mu',
    latitude: -20.2366,
    longitude: 57.5056,
    isVerified: true,
  },
  {
    name: 'Sunset Bay Medical Centre',
    type: 'clinic',
    description: 'Full-service medical centre in the north of Mauritius - GP consultations, specialist referrals, and preventive health screening.',
    address: 'Royal Road, Grand Baie',
    city: 'Grand Baie',
    country: 'MU',
    phone: '+230 263 1234',
    latitude: -19.9978,
    longitude: 57.5869,
  },
  {
    name: 'QuirkLab Analysis',
    type: 'laboratory',
    description: 'Accredited diagnostic laboratory offering blood panels, urine tests, pathology, and home sample collection.',
    address: '45 Pope Hennessy St',
    city: 'Port Louis',
    country: 'MU',
    phone: '+230 208 4747',
    email: 'labs@quirklab.mu',
    latitude: -20.1644,
    longitude: 57.5029,
  },
  {
    name: 'ToothFairy Dental Clinic',
    type: 'dental_clinic',
    description: 'Modern dental practice offering general dentistry, orthodontics, implants, and cosmetic treatments.',
    address: '3 St Georges St',
    city: 'Curepipe',
    country: 'MU',
    phone: '+230 676 5555',
    latitude: -20.3165,
    longitude: 57.5264,
  },
  {
    name: 'FourEyes Optical Centre',
    type: 'optical_center',
    description: 'Optometry practice with full eye examination suite, contact lens fitting, and a wide selection of prescription frames.',
    address: 'Bagatelle Mall, Moka',
    city: 'Moka',
    country: 'MU',
    phone: '+230 454 8899',
    latitude: -20.2402,
    longitude: 57.4928,
  },
  {
    name: 'BendRight Rehab Centre',
    type: 'wellness_center',
    description: 'Dedicated rehabilitation facility for post-surgical recovery, sports injuries, neurological rehab, and occupational therapy.',
    address: '7 Dr Ferriere St',
    city: 'Rose Hill',
    country: 'MU',
    phone: '+230 454 2200',
    latitude: -20.2353,
    longitude: 57.4674,
  },
  {
    name: 'Dr Johnson Family Practice',
    type: 'self_employed',
    description: 'Independent solo practice run by Dr Sarah Johnson — general consultations, follow-ups, and home visits.',
    address: 'Royal Road, Moka',
    city: 'Moka',
    country: 'MU',
    phone: '+230 605 2020',
    latitude: -20.2370,
    longitude: 57.5060,
  },
  {
    name: 'GoodHealth Pharmacy',
    type: 'pharmacy',
    description: 'Community pharmacy dispensing prescription and over-the-counter medicines, with home delivery across the central plateau.',
    address: 'Royal Road, Curepipe',
    city: 'Curepipe',
    country: 'MU',
    phone: '+230 670 3030',
    email: 'contact@goodhealthpharmacy.mu',
    latitude: -20.3155,
    longitude: 57.5270,
  },
  // ── Madagascar ────────────────────────────────────────────────────────────
  {
    name: 'Clinique Bonne Humeur',
    type: 'clinic',
    description: 'Non-profit clinic providing affordable general medicine, maternity care, and laboratory services in Antananarivo.',
    address: 'Lot IVA 26 Soamanandray, Antananarivo',
    city: 'Antananarivo',
    country: 'MG',
    phone: '+261 20 22 348 32',
    latitude: -18.9137,
    longitude: 47.5361,
  },
  // ── Kenya ─────────────────────────────────────────────────────────────────
  {
    name: 'Nairobi Sunrise Hospital',
    type: 'hospital',
    description: 'Level 4 private hospital offering specialist consultations, maternity, surgical, and emergency services in Nairobi.',
    address: 'Raila Odinga Way, Nairobi West',
    city: 'Nairobi',
    country: 'KE',
    phone: '+254 722 205 205',
    latitude: -1.3078,
    longitude: 36.8219,
  },
]

export async function seedHealthcareEntities(prisma: PrismaClient) {
  console.log('  Seeding healthcare entities (seed 60)...')

  let created = 0
  const entityIds: Record<string, string> = {}

  for (const e of ENTITIES) {
    const entity = await (prisma.healthcareEntity as any).upsert({
      where: {
        // Unique by name + city + country
        name_city_country: {
          name: e.name,
          city: e.city ?? '',
          country: e.country,
        },
      },
      update: {},
      create: {
        name: e.name,
        type: e.type,
        description: e.description ?? null,
        address: e.address ?? null,
        city: e.city ?? null,
        country: e.country,
        phone: e.phone ?? null,
        email: (e as any).email ?? null,
        latitude: e.latitude ?? null,
        longitude: e.longitude ?? null,
        isVerified: (e as any).isVerified ?? false,
        isActive: true,
      },
    })
    entityIds[e.name] = entity.id
    created++
  }

  console.log(`  ✓ ${created} healthcare entities upserted`)

  // ── Assign a founder (owner) to each entity ───────────────────────────────
  // Without a founder, no one "owns" the org and the My Company overview shows
  // nothing under "owned". Make the primary seeded provider the founder so the
  // demo shows owned organisations across categories (and Dr Johnson owns a
  // hospital + clinic + self-employed practice for a rich multi-org demo).
  const founders: Record<string, string> = {
    'BlueLagoon Clinic': 'aisha.patel@mediwyz.com',
    'Mount Olympus Hospital': 'sarah.johnson@mediwyz.com',
    'Sunset Bay Medical Centre': 'sarah.johnson@mediwyz.com',
    'QuirkLab Analysis': 'raj.labtech@mediwyz.com',
    'ToothFairy Dental Clinic': 'david.dentist@mediwyz.com',
    'FourEyes Optical Centre': 'lisa.optom@mediwyz.com',
    'BendRight Rehab Centre': 'carlos.physio@mediwyz.com',
    'Dr Johnson Family Practice': 'sarah.johnson@mediwyz.com',
    'GoodHealth Pharmacy': 'pharma.jean@mediwyz.com',
  }

  let founded = 0
  for (const [entityName, founderEmail] of Object.entries(founders)) {
    const entityId = entityIds[entityName]
    if (!entityId) continue
    const founder = await prisma.user.findUnique({ where: { email: founderEmail }, select: { id: true } })
    if (!founder) continue

    await (prisma.healthcareEntity as any).update({
      where: { id: entityId },
      data: { founderUserId: founder.id },
    })
    // Founder is also an active member with the Founder role.
    await (prisma.providerWorkplace as any).upsert({
      where: { providerUserId_healthcareEntityId: { providerUserId: founder.id, healthcareEntityId: entityId } },
      update: { role: 'Founder', isPrimary: true, isActive: true, status: 'active' },
      create: {
        providerUserId: founder.id,
        healthcareEntityId: entityId,
        role: 'Founder',
        isPrimary: true,
        isActive: true,
        status: 'active',
      },
    })
    founded++
  }
  console.log(`  ✓ ${founded} entity founders assigned`)

  // ── Link existing providers to entities ──────────────────────────────────
  // Find providers by email (seeded in earlier seeds), link to an appropriate entity

  const providerLinks: Array<{
    email: string
    entityName: string
    role?: string
    isPrimary?: boolean
  }> = [
    // Doctors → Mount Olympus Hospital
    { email: 'sarah.johnson@mediwyz.com', entityName: 'Mount Olympus Hospital', role: 'Consultant Physician', isPrimary: true },
    { email: 'michael.chen@mediwyz.com',  entityName: 'Mount Olympus Hospital', role: 'Senior Consultant',   isPrimary: true },
    { email: 'aisha.patel@mediwyz.com',   entityName: 'BlueLagoon Clinic',    role: 'General Practitioner', isPrimary: true },
    // Nurses → Sunset Bay Medical Centre
    { email: 'marie.dupont@mediwyz.com',  entityName: 'Sunset Bay Medical Centre', role: 'Registered Nurse',   isPrimary: true },
    { email: 'john.smith@mediwyz.com',    entityName: 'BlueLagoon Clinic',     role: 'Registered Nurse',   isPrimary: true },
    // Lab Technicians → QuirkLab Analysis
    { email: 'raj.labtech@mediwyz.com',   entityName: 'QuirkLab Analysis',          role: 'Senior Lab Technician', isPrimary: true },
    { email: 'fatima.lab@mediwyz.com',    entityName: 'QuirkLab Analysis',          role: 'Lab Technician',        isPrimary: true },
    // Dentist → SmileFirst
    { email: 'david.dentist@mediwyz.com', entityName: 'ToothFairy Dental Clinic', role: 'General Dentist',    isPrimary: true },
    // Optometrist → ClearVision
    { email: 'lisa.optom@mediwyz.com',    entityName: 'FourEyes Optical Centre', role: 'Optometrist',      isPrimary: true },
    // Physiotherapist → Physio & Rehab Centre
    { email: 'carlos.physio@mediwyz.com', entityName: 'BendRight Rehab Centre', role: 'Senior Physiotherapist', isPrimary: true },
  ]

  let linked = 0
  for (const link of providerLinks) {
    const entityId = entityIds[link.entityName]
    if (!entityId) continue

    const user = await prisma.user.findUnique({
      where: { email: link.email },
      select: { id: true },
    })
    if (!user) continue

    await (prisma.providerWorkplace as any).upsert({
      where: {
        providerUserId_healthcareEntityId: {
          providerUserId: user.id,
          healthcareEntityId: entityId,
        },
      },
      update: {},
      create: {
        providerUserId: user.id,
        healthcareEntityId: entityId,
        role: link.role ?? null,
        isPrimary: link.isPrimary ?? false,
        isActive: true,
      },
    })
    linked++
  }

  console.log(`  ✓ ${linked} provider–entity workplace links created`)
}

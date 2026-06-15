import { PrismaClient, UserType } from '@prisma/client'
import bcrypt from 'bcrypt'

/**
 * Seed 55 - Sarah Johnson + provider service config backfill
 *
 * Two responsibilities:
 * 1. Create Dr. Sarah Johnson (DOC004, email sarah.johnson@mediwyz.com) who is
 *    referenced by seed 47 (insurance company owner) and legacy billing/clinical data.
 * 2. Backfill ProviderServiceConfig for all providers seeded AFTER seed 30 ran
 *    (PHYSIO002, DENT002, OPT002, NUTR002, and any future additions) so every
 *    provider has at least the default services for their type.
 */
export async function seedSarahJohnsonAndServices(prisma: PrismaClient) {
  console.log('  Seeding Sarah Johnson + provider service config backfill...')

  // ── 1. Sarah Johnson ───────────────────────────────────────────────────────
  const sarahEmail = 'sarah.johnson@mediwyz.com'
  const existing = await prisma.user.findUnique({ where: { email: sarahEmail } })

  if (!existing) {
    const hash = (pw: string) => bcrypt.hash(pw, 10)
    await prisma.user.create({
      data: {
        id: 'DOC004',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: sarahEmail,
        password: await hash('Doctor123!'),
        profileImage: '/images/doctors/4.jpg',
        phone: '+230 5789 4004',
        userType: UserType.DOCTOR,
        dateOfBirth: new Date('1983-09-14'),
        gender: 'Female',
        address: 'Chemin Grenier, South Mauritius',
        verified: true,
        accountStatus: 'active',
        regionId: 'REG-MU',
        doctorProfile: {
          create: {
            id: 'DPROF004',
            specialty: ['Internal Medicine', 'Infectious Disease'],
            subSpecialties: ['HIV/AIDS Management', 'Travel Medicine'],
            licenseNumber: 'MU-DOC-2016-044',
            licenseExpiryDate: new Date('2027-09-30'),
            clinicAffiliation: 'City Medical Center',
            hospitalPrivileges: ['City Medical Center', 'Victoria Hospital'],
            rating: 4.7,
            reviewCount: 94,
            experience: '10 years',
            publications: [],
            awards: [],
            location: 'Port Louis, Mauritius',
            languages: ['English', 'French', 'Creole'],
            nextAvailable: new Date(Date.now() + 86400000),
            consultationDuration: 30,
            consultationFee: 1200,
            videoConsultationFee: 900,
            emergencyConsultationFee: 2500,
            consultationTypes: ['video', 'in-person', 'home-visit'],
            emergencyAvailable: true,
            homeVisitAvailable: true,
            telemedicineAvailable: true,
            nationality: 'Mauritian',
            bio: 'Internal medicine specialist with a focus on infectious disease and comprehensive patient care.',
            philosophy: 'Holistic, patient-centred medicine guided by evidence.',
            specialInterests: ['Preventive Medicine', 'Travel Health'],
            verificationDate: new Date('2023-06-01'),
          },
        },
      },
    })
    console.log('  ✓ Created Dr. Sarah Johnson (DOC004 / sarah.johnson@mediwyz.com)')
  } else {
    console.log('  · Dr. Sarah Johnson already exists - skipping creation')
  }

  // ── 2. Backfill ProviderServiceConfig for all providers ────────────────────
  //    Replicates seed 30's auto-assign logic so providers added in seed 40+
  //    (PHYSIO002, DENT002, OPT002, NUTR002, DOC004, …) get their default services.

  const providerTypes = [
    UserType.DOCTOR, UserType.NURSE, UserType.NANNY,
    UserType.PHARMACIST, UserType.LAB_TECHNICIAN, UserType.EMERGENCY_WORKER,
    UserType.CAREGIVER, UserType.PHYSIOTHERAPIST, UserType.DENTIST,
    UserType.OPTOMETRIST, UserType.NUTRITIONIST,
  ]

  const providers = await prisma.user.findMany({
    where: { userType: { in: providerTypes } },
    select: { id: true, userType: true },
  })

  const defaultServices = await prisma.platformService.findMany({
    where: { isDefault: true },
    select: { id: true, providerType: true },
  })

  let added = 0
  for (const provider of providers) {
    const matching = defaultServices.filter(s => s.providerType === provider.userType)
    for (const svc of matching) {
      await prisma.providerServiceConfig.upsert({
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
      added++
    }
  }

  console.log(`  ✓ Ensured service configs for ${providers.length} providers (${added} upserts)`)
}

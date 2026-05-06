import { PrismaClient, UserType } from '@prisma/client'
import bcrypt from 'bcrypt'

export async function seedNewUserTypes(prisma: PrismaClient) {
  const hash = (pw: string) => bcrypt.hash(pw, 10)

  console.log('Seeding new user types...')

  // ── Pharmacist Users with nested PharmacistProfiles ───────────────────────

  const pharmacists = [
    {
      id: 'PHARM001',
      firstName: 'Jean',
      lastName: 'Dumont',
      email: 'pharma.jean@mediwyz.com',
      password: await hash('Pharma123!'),
      profileImage: '/images/pharmacists/1.jpg',
      phone: '+230 5789 0001',
      userType: UserType.PHARMACIST,
      dateOfBirth: new Date('1985-04-12'),
      gender: 'Male',
      address: 'Royal Road, Port Louis, Mauritius',
      verified: true,
      accountStatus: 'active',
      regionId: 'REG-MU',
      pharmacistProfile: {
        create: {
          id: 'PHPROF001',
          licenseNumber: 'PHARM-MU-2019-001',
          pharmacyName: 'PillPal Pharmacy',
          pharmacyAddress: 'Royal Road, Port Louis',
          specializations: ['Clinical Pharmacy', 'Geriatric Pharmacy'],
        },
      },
    },
    {
      id: 'PHARM002',
      firstName: 'Anushka',
      lastName: 'Doobur',
      email: 'anushka.doobur@healthways.mu',
      password: await hash('Pharma123!'),
      profileImage: '/images/pharmacists/2.jpg',
      phone: '+230 5789 0002',
      userType: UserType.PHARMACIST,
      dateOfBirth: new Date('1990-08-25'),
      gender: 'Female',
      address: 'St Jean Road, Quatre Bornes, Mauritius',
      verified: true,
      accountStatus: 'active',
      regionId: 'REG-MU',
      pharmacistProfile: {
        create: {
          id: 'PHPROF002',
          licenseNumber: 'PHARM-MU-2020-002',
          pharmacyName: 'HealthyHippo Pharmacy',
          pharmacyAddress: 'St Jean Road, Quatre Bornes',
          specializations: ['Oncology Pharmacy', 'Pediatric Pharmacy'],
        },
      },
    },
  ]

  for (const pharmacist of pharmacists) {
    await prisma.user.upsert({
      where: { id: pharmacist.id },
      update: {},
      create: pharmacist,
    })
  }

  console.log(`  Seeded ${pharmacists.length} pharmacist users with profiles`)

  // ── Lab Technician Users with nested LabTechProfiles ──────────────────────

  const labTechnicians = [
    {
      id: 'LAB001',
      firstName: 'Marie',
      lastName: 'Fontaine',
      email: 'lab.marie@mediwyz.com',
      password: await hash('Lab123!'),
      profileImage: '/images/lab-technicians/1.jpg',
      phone: '+230 5789 1001',
      userType: UserType.LAB_TECHNICIAN,
      dateOfBirth: new Date('1988-02-18'),
      gender: 'Male',
      address: 'Curepipe, Mauritius',
      verified: true,
      accountStatus: 'active',
      regionId: 'REG-MU',
      labTechProfile: {
        create: {
          id: 'LTPROF001',
          licenseNumber: 'LAB-MU-2018-001',
          labName: 'WizardLab Mauritius',
          specializations: ['Hematology', 'Clinical Chemistry'],
        },
      },
    },
    {
      id: 'LAB002',
      firstName: 'Priya',
      lastName: 'Doorgakant',
      email: 'priya.doorgakant@healthways.mu',
      password: await hash('Lab123!'),
      profileImage: '/images/lab-technicians/2.jpg',
      phone: '+230 5789 1002',
      userType: UserType.LAB_TECHNICIAN,
      dateOfBirth: new Date('1993-06-30'),
      gender: 'Female',
      address: 'Rose Hill, Mauritius',
      verified: true,
      accountStatus: 'active',
      regionId: 'REG-MU',
      labTechProfile: {
        create: {
          id: 'LTPROF002',
          licenseNumber: 'LAB-MU-2021-002',
          labName: 'BubbleTest Labs',
          specializations: ['Microbiology', 'Immunology'],
        },
      },
    },
  ]

  for (const labTech of labTechnicians) {
    await prisma.user.upsert({
      where: { id: labTech.id },
      update: {},
      create: labTech,
    })
  }

  console.log(`  Seeded ${labTechnicians.length} lab technician users with profiles`)

  // ── Emergency Worker Users with nested EmergencyWorkerProfiles ────────────

  const emergencyWorkers = [
    {
      id: 'EMW001',
      firstName: 'David',
      lastName: 'Bernard',
      email: 'emt.david@mediwyz.com',
      password: await hash('EMT123!'),
      profileImage: '/images/emergency-workers/1.jpg',
      phone: '+230 5789 2001',
      userType: UserType.EMERGENCY_WORKER,
      dateOfBirth: new Date('1982-11-05'),
      gender: 'Male',
      address: 'Port Louis, Mauritius',
      verified: true,
      accountStatus: 'active',
      regionId: 'REG-MU',
      emergencyWorkerProfile: {
        create: {
          id: 'EWPROF001',
          certifications: ['Advanced Cardiac Life Support', 'Trauma Care'],
          vehicleType: 'ambulance',
          responseZone: 'Port Louis & Northern Districts',
          emtLevel: 'Paramedic',
        },
      },
    },
    {
      id: 'EMW002',
      firstName: 'Fatima',
      lastName: 'Joomun',
      email: 'fatima.joomun@healthways.mu',
      password: await hash('Emergency123!'),
      profileImage: '/images/emergency-workers/2.jpg',
      phone: '+230 5789 2002',
      userType: UserType.EMERGENCY_WORKER,
      dateOfBirth: new Date('1991-03-14'),
      gender: 'Female',
      address: 'Vacoas, Mauritius',
      verified: true,
      accountStatus: 'active',
      regionId: 'REG-MU',
      emergencyWorkerProfile: {
        create: {
          id: 'EWPROF002',
          certifications: ['Basic Life Support', 'Hazardous Materials'],
          vehicleType: 'motorcycle',
          responseZone: 'Central Plateau',
          emtLevel: 'EMT-Intermediate',
        },
      },
    },
  ]

  for (const worker of emergencyWorkers) {
    await prisma.user.upsert({
      where: { id: worker.id },
      update: {},
      create: worker,
    })
  }

  console.log(`  Seeded ${emergencyWorkers.length} emergency worker users with profiles`)

  // ── Insurance Rep Users with nested InsuranceRepProfiles ──────────────────

  const insuranceReps = [
    {
      id: 'INS001',
      firstName: 'Insurance',
      lastName: 'Rep',
      email: 'insurance.rep@mediwyz.com',
      password: await hash('Insurance123!'),
      profileImage: null,
      phone: '+230 5789 3001',
      userType: UserType.INSURANCE_REP,
      dateOfBirth: new Date('1979-07-20'),
      gender: 'Male',
      address: 'Ebene, Mauritius',
      verified: true,
      accountStatus: 'active',
      regionId: 'REG-MU',
      insuranceRepProfile: {
        create: {
          id: 'IRPROF001',
          companyName: 'Swan Life Ltd',
          licenseNumber: 'INS-MU-2017-001',
          coverageTypes: ['health', 'dental', 'life'],
        },
      },
    },
    {
      id: 'INS002',
      firstName: 'Marie',
      lastName: 'Genave',
      email: 'marie.genave@healthways.mu',
      password: await hash('Insurance123!'),
      profileImage: null,
      phone: '+230 5789 3002',
      userType: UserType.INSURANCE_REP,
      dateOfBirth: new Date('1987-12-03'),
      gender: 'Female',
      address: 'Floreal, Mauritius',
      verified: true,
      accountStatus: 'active',
      regionId: 'REG-MU',
      insuranceRepProfile: {
        create: {
          id: 'IRPROF002',
          companyName: 'MUA Insurance',
          licenseNumber: 'INS-MU-2019-002',
          coverageTypes: ['health', 'vision', 'dental'],
        },
      },
    },
  ]

  for (const rep of insuranceReps) {
    await prisma.user.upsert({
      where: { id: rep.id },
      update: {},
      create: rep,
    })
  }

  console.log(`  Seeded ${insuranceReps.length} insurance rep users with profiles`)

  // ── Corporate Admin User with nested CorporateAdminProfile ────────────────

  const corporateAdmins = [
    {
      id: 'CORP001',
      firstName: 'Corporate',
      lastName: 'Admin',
      email: 'corporate.admin@mediwyz.com',
      password: await hash('Corporate123!'),
      profileImage: null,
      phone: '+230 5789 4001',
      userType: UserType.CORPORATE_ADMIN,
      dateOfBirth: new Date('1975-09-10'),
      gender: 'Male',
      address: 'Ebene Cybercity, Mauritius',
      verified: true,
      accountStatus: 'active',
      regionId: 'REG-MU',
      corporateAdminProfile: {
        create: {
          id: 'CAPROF001',
          companyName: 'Rogers Group',
          registrationNumber: 'REG-MU-2015-001',
          employeeCount: 2500,
          industry: 'Financial Services',
        },
      },
    },
  ]

  for (const admin of corporateAdmins) {
    await prisma.user.upsert({
      where: { id: admin.id },
      update: {},
      create: admin,
    })
  }

  console.log(`  Seeded ${corporateAdmins.length} corporate admin user with profile`)

  // ── Referral Partner User with nested ReferralPartnerProfile ──────────────

  const referralPartners = [
    {
      id: 'REF001',
      firstName: 'Sophie',
      lastName: 'Leclerc',
      email: 'sophie.leclerc@healthways.mu',
      password: await hash('Referral123!'),
      profileImage: null,
      phone: '+230 5789 5001',
      userType: UserType.REFERRAL_PARTNER,
      dateOfBirth: new Date('1986-05-22'),
      gender: 'Female',
      address: 'Grand Baie, Mauritius',
      verified: true,
      accountStatus: 'active',
      regionId: 'REG-MU',
      referralPartnerProfile: {
        create: {
          id: 'RPPROF001',
          businessType: 'Wellness Center',
          commissionRate: 10.0,
          referralCode: 'WELLREF2024',
          totalReferrals: 45,
        },
      },
    },
  ]

  for (const partner of referralPartners) {
    await prisma.user.upsert({
      where: { id: partner.id },
      update: {},
      create: partner,
    })
  }

  console.log(`  Seeded ${referralPartners.length} referral partner user with profile`)

  // ── Regional Admin Users with nested RegionalAdminProfiles ──────────────────

  const regionalAdmins = [
    {
      id: 'RADM000',
      firstName: 'Hassan',
      lastName: 'Doorgakant',
      email: 'hassan.doorgakant@healthways.mu',
      password: await hash('Admin123!'),
      profileImage: null,
      phone: '+230 5789 6000',
      userType: UserType.REGIONAL_ADMIN,
      dateOfBirth: new Date('1978-03-10'),
      gender: 'Male',
      address: 'Port Louis, Mauritius',
      verified: true,
      accountStatus: 'active',
      regionId: 'REG-MU',
      regionalAdminProfile: {
        create: {
          id: 'RAPROF000',
          region: 'National',
          country: 'Mauritius',
          countryCode: 'MU',
        },
      },
    },
    {
      id: 'RADM001',
      firstName: 'Regional',
      lastName: 'Admin MU',
      email: 'regional.mu@mediwyz.com',
      password: await hash('Regional123!'),
      profileImage: null,
      phone: '+230 5789 6001',
      userType: UserType.REGIONAL_ADMIN,
      dateOfBirth: new Date('1980-01-15'),
      gender: 'Male',
      address: 'Port Louis, Mauritius',
      verified: true,
      accountStatus: 'active',
      regionId: 'REG-MU',
      regionalAdminProfile: {
        create: {
          id: 'RAPROF001',
          region: 'Mauritius',
          country: 'Mauritius',
          countryCode: 'MU',
        },
      },
    },
    {
      id: 'RADM002',
      firstName: 'Tiana',
      lastName: 'Rasoamanarivo',
      email: 'tiana.rasoa@healthways.mg',
      password: await hash('Regional123!'),
      profileImage: null,
      phone: '+261 34 00 001',
      userType: UserType.REGIONAL_ADMIN,
      dateOfBirth: new Date('1985-06-20'),
      gender: 'Female',
      address: 'Antananarivo, Madagascar',
      verified: true,
      accountStatus: 'active',
      regionId: 'REG-MG',
      regionalAdminProfile: {
        create: {
          id: 'RAPROF002',
          region: 'Madagascar',
          country: 'Madagascar',
          countryCode: 'MG',
        },
      },
    },
    {
      id: 'RADM003',
      firstName: 'James',
      lastName: 'Mwangi',
      email: 'james.mwangi@healthways.ke',
      password: await hash('Regional123!'),
      profileImage: null,
      phone: '+254 700 000 001',
      userType: UserType.REGIONAL_ADMIN,
      dateOfBirth: new Date('1982-09-10'),
      gender: 'Male',
      address: 'Nairobi, Kenya',
      verified: true,
      accountStatus: 'active',
      regionId: 'REG-KE',
      regionalAdminProfile: {
        create: {
          id: 'RAPROF003',
          region: 'Kenya',
          country: 'Kenya',
          countryCode: 'KE',
        },
      },
    },
    {
      id: 'RADM004',
      firstName: 'Kofi',
      lastName: 'Agbeko',
      email: 'kofi.agbeko@mediwyz.com',
      password: await hash('Regional123!'),
      profileImage: null,
      phone: '+228 90 00 0001',
      userType: UserType.REGIONAL_ADMIN,
      dateOfBirth: new Date('1984-04-18'),
      gender: 'Male',
      address: 'Lomé, Togo',
      verified: true,
      accountStatus: 'active',
      regionId: 'REG-TG',
      regionalAdminProfile: {
        create: {
          id: 'RAPROF004',
          region: 'Togo',
          country: 'Togo',
          countryCode: 'TG',
        },
      },
    },
    {
      id: 'RADM005',
      firstName: 'Amina',
      lastName: 'Houssou',
      email: 'amina.houssou@mediwyz.com',
      password: await hash('Regional123!'),
      profileImage: null,
      phone: '+229 97 00 0001',
      userType: UserType.REGIONAL_ADMIN,
      dateOfBirth: new Date('1986-11-22'),
      gender: 'Female',
      address: 'Cotonou, Benin',
      verified: true,
      accountStatus: 'active',
      regionId: 'REG-BJ',
      regionalAdminProfile: {
        create: {
          id: 'RAPROF005',
          region: 'Benin',
          country: 'Benin',
          countryCode: 'BJ',
        },
      },
    },
    {
      id: 'RADM006',
      firstName: 'Emmanuel',
      lastName: 'Uwimana',
      email: 'emmanuel.uwimana@mediwyz.com',
      password: await hash('Regional123!'),
      profileImage: null,
      phone: '+250 78 000 0001',
      userType: UserType.REGIONAL_ADMIN,
      dateOfBirth: new Date('1983-07-05'),
      gender: 'Male',
      address: 'Kigali, Rwanda',
      verified: true,
      accountStatus: 'active',
      regionId: 'REG-RW',
      regionalAdminProfile: {
        create: {
          id: 'RAPROF006',
          region: 'Rwanda',
          country: 'Rwanda',
          countryCode: 'RW',
        },
      },
    },
  ]

  for (const admin of regionalAdmins) {
    await prisma.user.upsert({
      where: { id: admin.id },
      update: {},
      create: admin,
    })
  }

  console.log(`  Seeded ${regionalAdmins.length} regional admin user with profile`)

  const totalSeeded =
    pharmacists.length +
    labTechnicians.length +
    emergencyWorkers.length +
    insuranceReps.length +
    corporateAdmins.length +
    referralPartners.length +
    regionalAdmins.length

  console.log(`  Seeded ${totalSeeded} new user type users with profiles (total)`)
}

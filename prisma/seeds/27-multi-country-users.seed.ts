import { PrismaClient, UserType } from '@prisma/client'
import bcrypt from 'bcrypt'

interface CountryConfig {
  code: string
  tld: string
  phonePrefix: string
  regionId: string
  cities: string[]
  names: { first: string; last: string; gender: string }[]
}

const countries: CountryConfig[] = [
  {
    code: 'MG',
    tld: 'mg',
    phonePrefix: '+261',
    regionId: 'REG-MG',
    cities: ['Antananarivo', 'Toamasina', 'Antsirabe', 'Fianarantsoa', 'Mahajanga'],
    names: [
      { first: 'Tiana', last: 'Rasoamanarivo', gender: 'Female' },
      { first: 'Ravo', last: 'Andriamihaja', gender: 'Male' },
      { first: 'Haingo', last: 'Rakotoarisoa', gender: 'Female' },
      { first: 'Faly', last: 'Randrianasolo', gender: 'Male' },
      { first: 'Nomena', last: 'Razafindrakoto', gender: 'Female' },
      { first: 'Miora', last: 'Ratsimbazafy', gender: 'Female' },
      { first: 'Mamy', last: 'Rakotonirina', gender: 'Male' },
      { first: 'Hery', last: 'Rakotondrazaka', gender: 'Male' },
      { first: 'Lalaina', last: 'Andrianaivo', gender: 'Female' },
      { first: 'Voahangy', last: 'Ramanantsoa', gender: 'Female' },
    ],
  },
  {
    code: 'KE',
    tld: 'ke',
    phonePrefix: '+254',
    regionId: 'REG-KE',
    cities: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'],
    names: [
      { first: 'Wanjiru', last: 'Kamau', gender: 'Female' },
      { first: 'Odhiambo', last: 'Otieno', gender: 'Male' },
      { first: 'Njeri', last: 'Muthoni', gender: 'Female' },
      { first: 'Kariuki', last: 'Ngugi', gender: 'Male' },
      { first: 'Achieng', last: 'Ouma', gender: 'Female' },
      { first: 'Wambui', last: 'Gitonga', gender: 'Female' },
      { first: 'Kipchoge', last: 'Korir', gender: 'Male' },
      { first: 'Mutiso', last: 'Musyoka', gender: 'Male' },
      { first: 'Nyambura', last: 'Wainaina', gender: 'Female' },
      { first: 'Chebet', last: 'Rotich', gender: 'Female' },
    ],
  },
  {
    code: 'TG',
    tld: 'tg',
    phonePrefix: '+228',
    regionId: 'REG-TG',
    cities: ['Lome', 'Sokode', 'Kara', 'Kpalime', 'Atakpame'],
    names: [
      { first: 'Kofi', last: 'Agbeko', gender: 'Male' },
      { first: 'Ama', last: 'Mensah', gender: 'Female' },
      { first: 'Yao', last: 'Dossou', gender: 'Male' },
      { first: 'Adjoa', last: 'Amegah', gender: 'Female' },
      { first: 'Kwame', last: 'Koudjo', gender: 'Male' },
      { first: 'Akua', last: 'Afi', gender: 'Female' },
      { first: 'Kodjo', last: 'Lawson', gender: 'Male' },
      { first: 'Abla', last: 'Togbe', gender: 'Female' },
      { first: 'Komlan', last: 'Akakpo', gender: 'Male' },
      { first: 'Afi', last: 'Agbenou', gender: 'Female' },
    ],
  },
  {
    code: 'BJ',
    tld: 'bj',
    phonePrefix: '+229',
    regionId: 'REG-BJ',
    cities: ['Cotonou', 'Porto-Novo', 'Parakou', 'Abomey-Calavi', 'Djougou'],
    names: [
      { first: 'Dossou', last: 'Ahouandjinou', gender: 'Male' },
      { first: 'Gbaguidi', last: 'Amoussou', gender: 'Male' },
      { first: 'Hounton', last: 'Sossa', gender: 'Female' },
      { first: 'Agossou', last: 'Kiki', gender: 'Male' },
      { first: 'Adjovi', last: 'Hounsa', gender: 'Female' },
      { first: 'Sessinou', last: 'Gandonou', gender: 'Female' },
      { first: 'Codjo', last: 'Houngbedji', gender: 'Male' },
      { first: 'Fifame', last: 'Adjibi', gender: 'Female' },
      { first: 'Gbenou', last: 'Tossou', gender: 'Male' },
      { first: 'Ayaba', last: 'Dah', gender: 'Female' },
    ],
  },
  {
    code: 'RW',
    tld: 'rw',
    phonePrefix: '+250',
    regionId: 'REG-RW',
    cities: ['Kigali', 'Butare', 'Gisenyi', 'Ruhengeri', 'Gitarama'],
    names: [
      { first: 'Uwimana', last: 'Mugisha', gender: 'Female' },
      { first: 'Habimana', last: 'Niyonzima', gender: 'Male' },
      { first: 'Ingabire', last: 'Mutesi', gender: 'Female' },
      { first: 'Ndayisaba', last: 'Hakizimana', gender: 'Male' },
      { first: 'Uwase', last: 'Mukamana', gender: 'Female' },
      { first: 'Irakoze', last: 'Nsengimana', gender: 'Female' },
      { first: 'Ntwari', last: 'Bizimana', gender: 'Male' },
      { first: 'Iradukunda', last: 'Uwitonze', gender: 'Female' },
      { first: 'Ishimwe', last: 'Rugamba', gender: 'Male' },
      { first: 'Umutesi', last: 'Ingabire', gender: 'Female' },
    ],
  },
]

// User type assignments per country (10 users each):
// Index 0,1 = PATIENT, 2,3 = DOCTOR, 4 = NURSE, 5 = NANNY, 6 = PHARMACIST, 7 = LAB_TECHNICIAN, 8 = EMERGENCY_WORKER, 9 = INSURANCE_REP
const typeAssignments: { type: UserType; idPrefix: string; profileKey: string }[] = [
  { type: UserType.MEMBER, idPrefix: 'PAT', profileKey: 'patientProfile' },
  { type: UserType.MEMBER, idPrefix: 'PAT', profileKey: 'patientProfile' },
  { type: UserType.DOCTOR, idPrefix: 'DOC', profileKey: 'doctorProfile' },
  { type: UserType.DOCTOR, idPrefix: 'DOC', profileKey: 'doctorProfile' },
  { type: UserType.NURSE, idPrefix: 'NUR', profileKey: 'nurseProfile' },
  { type: UserType.NANNY, idPrefix: 'NAN', profileKey: 'nannyProfile' },
  { type: UserType.PHARMACIST, idPrefix: 'PHARM', profileKey: 'pharmacistProfile' },
  { type: UserType.LAB_TECHNICIAN, idPrefix: 'LAB', profileKey: 'labTechProfile' },
  { type: UserType.EMERGENCY_WORKER, idPrefix: 'EMW', profileKey: 'emergencyWorkerProfile' },
  { type: UserType.INSURANCE_REP, idPrefix: 'INS', profileKey: 'insuranceRepProfile' },
]

function buildProfile(userType: UserType, profileId: string, country: CountryConfig) {
  switch (userType) {
    case UserType.MEMBER:
      return {
        patientProfile: {
          create: {
            id: profileId,
            nationalId: `${country.code}-NID-${profileId}`,
            bloodType: ['A+', 'B+', 'O+', 'AB+', 'A-', 'O-'][Math.floor(Math.random() * 6)],
            allergies: [],
            chronicConditions: [],
            healthScore: 70 + Math.floor(Math.random() * 25),
          },
        },
      }
    case UserType.DOCTOR:
      return {
        doctorProfile: {
          create: {
            id: profileId,
            specialty: ['General Practice'],
            subSpecialties: [],
            licenseNumber: `${country.code}-DOC-${profileId}`,
            licenseExpiryDate: new Date('2027-12-31'),
            clinicAffiliation: `${country.cities[0]} Medical Center`,
            hospitalPrivileges: [],
            consultationFee: 500 + Math.floor(Math.random() * 1000),
            videoConsultationFee: 400 + Math.floor(Math.random() * 800),
            emergencyConsultationFee: 1500 + Math.floor(Math.random() * 1000),
            consultationTypes: ['video', 'in-person'],
            rating: 4.0 + Math.random() * 0.9,
            reviewCount: Math.floor(Math.random() * 50),
            experience: `${3 + Math.floor(Math.random() * 15)} years`,
            publications: [],
            awards: [],
            location: `${country.cities[0]}, ${country.code}`,
            languages: country.tld === 'ke' || country.tld === 'rw' ? ['English', 'Swahili'] : ['French', 'English'],
            consultationDuration: 30,
            telemedicineAvailable: true,
            emergencyAvailable: false,
            homeVisitAvailable: false,
            nationality: country.code,
            bio: `Experienced general practitioner based in ${country.cities[0]}.`,
            specialInterests: [],
            verificationDate: new Date('2024-01-15'),
          },
        },
      }
    case UserType.NURSE:
      return {
        nurseProfile: {
          create: {
            id: profileId,
            licenseNumber: `${country.code}-NUR-${Date.now().toString().slice(-6)}`,
            experience: 3 + Math.floor(Math.random() * 10),
            specializations: ['Home Care', 'General Nursing'],
          },
        },
      }
    case UserType.NANNY:
      return {
        nannyProfile: {
          create: {
            id: profileId,
            experience: 2 + Math.floor(Math.random() * 8),
            certifications: ['First Aid', 'Child Development'],
          },
        },
      }
    case UserType.PHARMACIST:
      return {
        pharmacistProfile: {
          create: {
            id: profileId,
            licenseNumber: `${country.code}-PHARM-${Date.now().toString().slice(-6)}`,
            pharmacyName: `HealthPharm ${country.cities[0]}`,
            pharmacyAddress: `Main Road, ${country.cities[0]}`,
            specializations: ['Clinical Pharmacy'],
          },
        },
      }
    case UserType.LAB_TECHNICIAN:
      return {
        labTechProfile: {
          create: {
            id: profileId,
            licenseNumber: `${country.code}-LAB-${Date.now().toString().slice(-6)}`,
            labName: `${country.cities[0]} Diagnostics`,
            specializations: ['Hematology', 'Clinical Chemistry'],
          },
        },
      }
    case UserType.EMERGENCY_WORKER:
      return {
        emergencyWorkerProfile: {
          create: {
            id: profileId,
            certifications: ['Basic Life Support', 'Trauma Care'],
            vehicleType: 'ambulance',
            responseZone: `${country.cities[0]} Metropolitan`,
            emtLevel: 'Paramedic',
          },
        },
      }
    case UserType.INSURANCE_REP:
      return {
        insuranceRepProfile: {
          create: {
            id: profileId,
            companyName: `HealthInsure ${country.code}`,
            licenseNumber: `${country.code}-INS-${Date.now().toString().slice(-6)}`,
            coverageTypes: ['health', 'dental'],
          },
        },
      }
    default:
      return {}
  }
}

export async function seedMultiCountryUsers(prisma: PrismaClient) {
  const hash = (pw: string) => bcrypt.hash(pw, 10)
  const hashedPassword = await hash('User123!')

  let totalSeeded = 0

  for (const country of countries) {
    const counters: Record<string, number> = {}

    for (let i = 0; i < typeAssignments.length; i++) {
      const assignment = typeAssignments[i]
      const person = country.names[i]

      // Track per-type counter for this country
      counters[assignment.idPrefix] = (counters[assignment.idPrefix] || 0) + 1
      const num = counters[assignment.idPrefix].toString().padStart(3, '0')

      const userId = `${country.code}-${assignment.idPrefix}${num}`
      const profileId = `${country.code}-${assignment.idPrefix}PROF${num}`
      const email = `${person.first.toLowerCase()}.${person.last.toLowerCase()}@healthways.${country.tld}`
      const phone = `${country.phonePrefix} ${(7000000 + i * 100 + Math.floor(Math.random() * 100)).toString()}`
      const city = country.cities[i % country.cities.length]

      const profile = buildProfile(assignment.type, profileId, country)

      const userData = {
        id: userId,
        firstName: person.first,
        lastName: person.last,
        email,
        password: hashedPassword,
        profileImage: null,
        phone,
        userType: assignment.type,
        dateOfBirth: new Date(1975 + Math.floor(Math.random() * 25), Math.floor(Math.random() * 12), 1 + Math.floor(Math.random() * 28)),
        gender: person.gender,
        address: `${city}, ${country.code === 'MG' ? 'Madagascar' : country.code === 'KE' ? 'Kenya' : country.code === 'TG' ? 'Togo' : country.code === 'BJ' ? 'Benin' : 'Rwanda'}`,
        verified: true,
        accountStatus: 'active',
        regionId: country.regionId,
        ...profile,
      }

      await prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: userData,
      })

      totalSeeded++
    }

    console.log(`  Seeded 10 users for ${country.code}`)
  }

  console.log(`  Seeded ${totalSeeded} multi-country users total`)
}

/**
 * Seed 35 - Provider Role Configuration
 *
 * Populates the ProviderRole table with all 17 existing user types
 * and their metadata (label, icon, color, slug, verification docs).
 * Regional admins can create additional roles from the UI.
 */
import { PrismaClient } from '@prisma/client'

interface RoleDef {
  code: string
  label: string
  singularLabel: string
  slug: string
  icon: string
  color: string
  description: string
  isProvider: boolean
  searchEnabled: boolean
  bookingEnabled: boolean
  inventoryEnabled: boolean
  displayOrder: number
  urlPrefix: string
  cookieValue: string
  verificationDocs: { documentName: string; description: string; isRequired: boolean }[]
}

const ROLES: RoleDef[] = [
  // ─── Non-provider roles ────────────────────────────────────────────
  {
    code: 'MEMBER',
    label: 'Patients',
    singularLabel: 'Patient',
    slug: 'patients',
    icon: 'FaUser',
    color: '#0C6780',
    description: 'Patient account for booking health services',
    isProvider: false,
    searchEnabled: false,
    bookingEnabled: false,
    inventoryEnabled: false,
    displayOrder: 0,
    urlPrefix: '/patient',
    cookieValue: 'patient',
    verificationDocs: [
      { documentName: 'National ID', description: 'Valid national identity card', isRequired: true },
    ],
  },
  {
    code: 'REGIONAL_ADMIN',
    label: 'Regional Admins',
    singularLabel: 'Regional Admin',
    slug: 'regional-admins',
    icon: 'FaGlobe',
    color: '#6B21A8',
    description: 'Regional administrator managing services and providers',
    isProvider: false,
    searchEnabled: false,
    bookingEnabled: false,
    inventoryEnabled: false,
    displayOrder: 0,
    urlPrefix: '/regional',
    cookieValue: 'regional-admin',
    verificationDocs: [],
  },
  {
    code: 'CORPORATE_ADMIN',
    label: 'Corporate Admins',
    singularLabel: 'Corporate Admin',
    slug: 'corporate-admins',
    icon: 'FaBuilding',
    color: '#1E40AF',
    description: 'Corporate account managing employee health plans',
    isProvider: false,
    searchEnabled: false,
    bookingEnabled: false,
    inventoryEnabled: false,
    displayOrder: 0,
    urlPrefix: '/corporate',
    cookieValue: 'corporate',
    verificationDocs: [
      { documentName: 'Business Registration', description: 'Company registration certificate', isRequired: true },
    ],
  },
  {
    code: 'INSURANCE_REP',
    label: 'Insurance Reps',
    singularLabel: 'Insurance Rep',
    slug: 'insurance-reps',
    icon: 'FaShieldAlt',
    color: '#059669',
    description: 'Insurance representative processing claims',
    isProvider: false,
    searchEnabled: true,
    bookingEnabled: true,
    inventoryEnabled: false,
    displayOrder: 90,
    urlPrefix: '/insurance',
    cookieValue: 'insurance',
    verificationDocs: [
      { documentName: 'Insurance License', description: 'Valid insurance practitioner license', isRequired: true },
    ],
  },
  {
    code: 'REFERRAL_PARTNER',
    label: 'Referral Partners',
    singularLabel: 'Referral Partner',
    slug: 'referral-partners',
    icon: 'FaHandshake',
    color: '#D97706',
    description: 'Referral partner earning commissions on referrals',
    isProvider: false,
    searchEnabled: false,
    bookingEnabled: false,
    inventoryEnabled: false,
    displayOrder: 0,
    urlPrefix: '/referral-partner',
    cookieValue: 'referral-partner',
    verificationDocs: [],
  },

  // ─── Provider roles ────────────────────────────────────────────────
  {
    code: 'DOCTOR',
    label: 'Doctors',
    singularLabel: 'Doctor',
    slug: 'doctors',
    icon: 'FaUserMd',
    color: '#0C6780',
    description: 'Book certified GPs and specialists for in-clinic visits, video consultations, or home visits. Get prescriptions, referrals, and chronic disease management - all in one place.',
    isProvider: true,
    searchEnabled: true,
    bookingEnabled: true,
    inventoryEnabled: true,
    displayOrder: 10,
    urlPrefix: '/doctor',
    cookieValue: 'doctor',
    verificationDocs: [
      { documentName: 'Medical License', description: 'Valid medical practitioner license', isRequired: true },
      { documentName: 'Medical Degree', description: 'MBBS, MD, or equivalent', isRequired: true },
      { documentName: 'National ID', description: 'Government-issued identity card', isRequired: true },
    ],
  },
  {
    code: 'NURSE',
    label: 'Nurses',
    singularLabel: 'Nurse',
    slug: 'nurses',
    icon: 'FaUserNurse',
    color: '#0891B2',
    description: 'Qualified nurses for home visits, wound care, injections, post-surgery recovery, and health monitoring. Professional clinical care delivered to your door.',
    isProvider: true,
    searchEnabled: true,
    bookingEnabled: true,
    inventoryEnabled: true,
    displayOrder: 20,
    urlPrefix: '/nurse',
    cookieValue: 'nurse',
    verificationDocs: [
      { documentName: 'Nursing License', description: 'Valid nursing practitioner license', isRequired: true },
      { documentName: 'National ID', description: 'Government-issued identity card', isRequired: true },
    ],
  },
  {
    code: 'NANNY',
    label: 'Childcare',
    singularLabel: 'Nanny',
    slug: 'childcare',
    icon: 'FaBaby',
    color: '#DB2777',
    description: 'Certified childcare providers offering daily care, educational activities, and overnight supervision. Give your children safe, nurturing hands.',
    isProvider: true,
    searchEnabled: true,
    bookingEnabled: true,
    inventoryEnabled: true,
    displayOrder: 30,
    urlPrefix: '/nanny',
    cookieValue: 'child-care-nurse',
    verificationDocs: [
      { documentName: 'Childcare Certificate', description: 'Childcare or early education certification', isRequired: true },
      { documentName: 'Police Clearance', description: 'Background check certificate', isRequired: true },
    ],
  },
  {
    code: 'PHARMACIST',
    label: 'Pharmacists',
    singularLabel: 'Pharmacist',
    slug: 'pharmacists',
    icon: 'FaPills',
    color: '#059669',
    description: 'Order prescriptions and OTC products with delivery, get medication reviews, vaccinations, and quick health screenings from licensed pharmacists.',
    isProvider: true,
    searchEnabled: true,
    bookingEnabled: true,
    inventoryEnabled: true,
    displayOrder: 40,
    urlPrefix: '/pharmacist',
    cookieValue: 'pharmacy',
    verificationDocs: [
      { documentName: 'Pharmacy License', description: 'Valid pharmacy practitioner license', isRequired: true },
      { documentName: 'Pharmacy Registration', description: 'Pharmacy business registration', isRequired: true },
    ],
  },
  {
    code: 'LAB_TECHNICIAN',
    label: 'Lab Technicians',
    singularLabel: 'Lab Technician',
    slug: 'lab-technicians',
    icon: 'FaFlask',
    color: '#7C3AED',
    description: 'Home sample collection and fast results for blood tests, urinalysis, thyroid panels, and more. No clinic queues - certified lab technicians come to you.',
    isProvider: true,
    searchEnabled: true,
    bookingEnabled: true,
    inventoryEnabled: true,
    displayOrder: 50,
    urlPrefix: '/lab-technician',
    cookieValue: 'lab',
    verificationDocs: [
      { documentName: 'Lab Technician License', description: 'Valid laboratory technician certification', isRequired: true },
      { documentName: 'Lab Registration', description: 'Laboratory registration certificate', isRequired: true },
    ],
  },
  {
    code: 'EMERGENCY_WORKER',
    label: 'Emergency Responders',
    singularLabel: 'Emergency Responder',
    slug: 'emergency',
    icon: 'FaAmbulance',
    color: '#DC2626',
    description: '24/7 emergency ambulance dispatch, first aid response, and inter-hospital transfers. Professional paramedics ready when every second counts.',
    isProvider: true,
    searchEnabled: true,
    bookingEnabled: true,
    inventoryEnabled: true,
    displayOrder: 60,
    urlPrefix: '/responder',
    cookieValue: 'ambulance',
    verificationDocs: [
      { documentName: 'EMT Certificate', description: 'Emergency Medical Technician certification', isRequired: true },
      { documentName: 'First Aid Certificate', description: 'Current first aid certification', isRequired: true },
    ],
  },
  {
    code: 'CAREGIVER',
    label: 'Caregivers',
    singularLabel: 'Caregiver',
    slug: 'caregivers',
    icon: 'FaHandHoldingHeart',
    color: '#EC4899',
    description: 'Compassionate caregivers providing daily assistance, companionship, and specialized support for the elderly, post-surgery patients, and those with special needs.',
    isProvider: true,
    searchEnabled: true,
    bookingEnabled: true,
    inventoryEnabled: true,
    displayOrder: 70,
    urlPrefix: '/caregiver',
    cookieValue: 'caregiver',
    verificationDocs: [
      { documentName: 'Caregiver Certificate', description: 'Professional caregiving certification', isRequired: true },
      { documentName: 'Police Clearance', description: 'Background check certificate', isRequired: true },
    ],
  },
  {
    code: 'PHYSIOTHERAPIST',
    label: 'Physiotherapists',
    singularLabel: 'Physiotherapist',
    slug: 'physiotherapists',
    icon: 'FaWalking',
    color: '#2563EB',
    description: 'Restore mobility and relieve pain with evidence-based physiotherapy. Sessions for sports injuries, post-surgery rehab, and chronic conditions - at clinic or home.',
    isProvider: true,
    searchEnabled: true,
    bookingEnabled: true,
    inventoryEnabled: true,
    displayOrder: 71,
    urlPrefix: '/physiotherapist',
    cookieValue: 'physiotherapist',
    verificationDocs: [
      { documentName: 'Physiotherapy License', description: 'Valid physiotherapy practitioner license', isRequired: true },
      { documentName: 'Degree Certificate', description: 'Physiotherapy degree or diploma', isRequired: true },
    ],
  },
  {
    code: 'DENTIST',
    label: 'Dentists',
    singularLabel: 'Dentist',
    slug: 'dentists',
    icon: 'FaTooth',
    color: '#0EA5E9',
    description: 'Complete dental care from routine check-ups and cleaning to orthodontics, fillings, and cosmetic treatments. Your healthy smile starts here.',
    isProvider: true,
    searchEnabled: true,
    bookingEnabled: true,
    inventoryEnabled: true,
    displayOrder: 72,
    urlPrefix: '/dentist',
    cookieValue: 'dentist',
    verificationDocs: [
      { documentName: 'Dental License', description: 'Valid dental practitioner license', isRequired: true },
      { documentName: 'Dental Degree', description: 'BDS, DDS, or equivalent', isRequired: true },
    ],
  },
  {
    code: 'OPTOMETRIST',
    label: 'Optometrists',
    singularLabel: 'Optometrist',
    slug: 'optometrists',
    icon: 'FaEye',
    color: '#6366F1',
    description: 'Comprehensive eye exams, glasses prescriptions, contact lens fittings, and pediatric vision care. Protect your sight with certified optometrists.',
    isProvider: true,
    searchEnabled: true,
    bookingEnabled: true,
    inventoryEnabled: true,
    displayOrder: 73,
    urlPrefix: '/optometrist',
    cookieValue: 'optometrist',
    verificationDocs: [
      { documentName: 'Optometry License', description: 'Valid optometry practitioner license', isRequired: true },
      { documentName: 'Optometry Degree', description: 'Optometry degree or diploma', isRequired: true },
    ],
  },
  {
    code: 'NUTRITIONIST',
    label: 'Nutritionists',
    singularLabel: 'Nutritionist',
    slug: 'nutritionists',
    icon: 'FaAppleAlt',
    color: '#16A34A',
    description: 'Personalized diet plans and nutritional guidance for weight management, diabetes, sports performance, and clinical conditions. Eat better, live better.',
    isProvider: true,
    searchEnabled: true,
    bookingEnabled: true,
    inventoryEnabled: true,
    displayOrder: 74,
    urlPrefix: '/nutritionist',
    cookieValue: 'nutritionist',
    verificationDocs: [
      { documentName: 'Nutrition License', description: 'Valid nutritionist/dietitian certification', isRequired: true },
      { documentName: 'Degree Certificate', description: 'Nutrition or dietetics degree', isRequired: true },
    ],
  },
]

export async function seedProviderRoles(prisma: PrismaClient) {
  console.log('  Seeding provider roles...')

  let count = 0
  for (const role of ROLES) {
    const { verificationDocs, ...roleData } = role

    await prisma.providerRole.upsert({
      where: { code: roleData.code },
      update: {
        label: roleData.label,
        singularLabel: roleData.singularLabel,
        slug: roleData.slug,
        icon: roleData.icon,
        color: roleData.color,
        description: roleData.description,
        isProvider: roleData.isProvider,
        searchEnabled: roleData.searchEnabled,
        bookingEnabled: roleData.bookingEnabled,
        inventoryEnabled: roleData.inventoryEnabled,
        displayOrder: roleData.displayOrder,
        urlPrefix: roleData.urlPrefix,
        cookieValue: roleData.cookieValue,
      },
      create: roleData,
    })

    // Upsert verification docs
    for (let i = 0; i < verificationDocs.length; i++) {
      const doc = verificationDocs[i]
      const existingRole = await prisma.providerRole.findUnique({ where: { code: roleData.code } })
      if (!existingRole) continue

      const existing = await prisma.roleVerificationDoc.findFirst({
        where: { roleId: existingRole.id, documentName: doc.documentName },
      })

      if (!existing) {
        await prisma.roleVerificationDoc.create({
          data: {
            roleId: existingRole.id,
            documentName: doc.documentName,
            description: doc.description,
            isRequired: doc.isRequired,
            displayOrder: i,
          },
        })
      }
    }

    count++
  }

  console.log(`  ✓ ${count} provider roles seeded`)
}

import { Prisma, PrismaClient } from '@prisma/client'
import { getEquivalentAmount } from '../../lib/currency'

// Region currency mapping
const REGION_CURRENCIES: Record<string, { currency: string; countryCode: string }> = {
  MU: { currency: 'MUR', countryCode: 'MU' },
  MG: { currency: 'MGA', countryCode: 'MG' },
  KE: { currency: 'KES', countryCode: 'KE' },
  TG: { currency: 'XOF', countryCode: 'TG' },
  BJ: { currency: 'XOF', countryCode: 'BJ' },
  RW: { currency: 'RWF', countryCode: 'RW' },
}

// Base plans defined in MUR - will be converted per region
interface QuotaEntry {
  role: string
  specialty?: string | null
  limit: number
}

interface PlanTemplate {
  name: string
  slugBase: string
  type: 'individual' | 'corporate'
  priceMUR: number
  targetAudience?: string
  quotas: QuotaEntry[]
  discounts: Record<string, number> | null
  paidServices: Record<string, number> | null
  features: string[]
}

const INDIVIDUAL_PLANS: PlanTemplate[] = [
  {
    name: 'Essential',
    slugBase: 'essential',
    type: 'individual',
    priceMUR: 499,
    targetAudience: 'students & young adults',
    quotas: [
      { role: 'DOCTOR', specialty: 'General Practice', limit: 1 },
    ],
    discounts: { lab: 5 },
    paidServices: null,
    features: [
      '1 GP consultation/month',
      'Chat with a doctor',
      'E-prescriptions',
      'Digital health record',
      'Pharmacy ordering',
      '5% lab test discount',
    ],
  },
  {
    name: 'Plus',
    slugBase: 'plus',
    type: 'individual',
    priceMUR: 799,
    targetAudience: 'families',
    quotas: [
      { role: 'DOCTOR', specialty: 'General Practice', limit: 1 },
      { role: 'NUTRITIONIST', limit: 1 },
    ],
    discounts: { lab: 10, pharmacy: 10 },
    paidServices: null,
    features: [
      '1 GP consultation/month',
      '1 nutrition consultation/month',
      'Priority booking',
      '10% lab & pharmacy discounts',
      'Chat with a doctor',
      'E-prescriptions',
      'Digital health record',
    ],
  },
  {
    name: 'Premium',
    slugBase: 'premium',
    type: 'individual',
    priceMUR: 1399,
    targetAudience: 'health-conscious individuals',
    quotas: [
      { role: 'DOCTOR', specialty: 'General Practice', limit: 2 },
      { role: 'DOCTOR', specialty: 'Psychiatry', limit: 1 },
      { role: 'EMERGENCY_WORKER', limit: 1 },
    ],
    discounts: { specialist: 20, lab: 10 },
    paidServices: null,
    features: [
      '2 GP consultations/month',
      '1 mental health consultation/month',
      '1 free ambulance call/month',
      '20% specialist discount',
      '10% lab discount',
      'Priority booking',
      'Annual health screening',
      'Medicine delivery',
    ],
  },
]

const CORPORATE_PLANS: PlanTemplate[] = [
  {
    name: 'Corp Essential',
    slugBase: 'corp-essential',
    type: 'corporate',
    priceMUR: 399,
    targetAudience: 'small businesses',
    quotas: [
      { role: 'DOCTOR', specialty: 'General Practice', limit: 1 },
    ],
    discounts: { gp: 10, pharmacy: 5 },
    paidServices: null,
    features: [
      '1 GP consultation/month per employee',
      '10% GP discount',
      '5% pharmacy discount',
      'Digital sick certificates',
      'HR dashboard',
      'E-prescriptions',
    ],
  },
  {
    name: 'Corp Plus',
    slugBase: 'corp-plus',
    type: 'corporate',
    priceMUR: 699,
    targetAudience: 'medium businesses',
    quotas: [
      { role: 'DOCTOR', specialty: 'General Practice', limit: 1 },
      { role: 'NURSE', limit: 1 },
      { role: 'NUTRITIONIST', limit: 1 },
    ],
    discounts: { lab: 10, pharmacy: 10, specialist: 10 },
    paidServices: null,
    features: [
      '1 GP consultation/month per employee',
      '1 nurse consultation/month',
      '1 nutrition consultation/month',
      '10% lab, pharmacy & specialist discounts',
      'Employee analytics',
      'HR dashboard',
      'Digital sick certificates',
    ],
  },
  {
    name: 'Corp Premium',
    slugBase: 'corp-premium',
    type: 'corporate',
    priceMUR: 999,
    targetAudience: 'large businesses',
    quotas: [
      { role: 'DOCTOR', specialty: 'General Practice', limit: 2 },
      { role: 'NURSE', limit: 2 },
      { role: 'DOCTOR', specialty: 'Psychiatry', limit: 1 },
      { role: 'NUTRITIONIST', limit: 1 },
    ],
    discounts: { specialist: 20, lab: 15, pharmacy: 10 },
    paidServices: null,
    features: [
      '2 GP consultations/month per employee',
      '2 nurse consultations/month',
      '1 mental health consultation/month',
      '1 nutrition consultation/month',
      '20% specialist, 15% lab, 10% pharmacy discounts',
      'Wellness programs',
      'Employee analytics',
      'HR dashboard',
    ],
  },
  {
    name: 'Enterprise',
    slugBase: 'enterprise',
    type: 'corporate',
    priceMUR: 1199,
    targetAudience: 'enterprise organizations',
    quotas: [
      { role: 'DOCTOR', specialty: 'General Practice', limit: 2 },
      { role: 'NURSE', limit: 2 },
      { role: 'DOCTOR', specialty: 'Psychiatry', limit: 1 },
      { role: 'NUTRITIONIST', limit: 1 },
    ],
    discounts: { specialist: 25, lab: 20, pharmacy: 15, volume_50: 5, volume_100: 10, volume_300: 15 },
    paidServices: null,
    features: [
      'Full MediWyz ecosystem access',
      '2 GP consultations/month per employee',
      '2 nurse consultations/month',
      '1 mental health consultation/month',
      '1 nutrition consultation/month',
      '25% specialist, 20% lab, 15% pharmacy discounts',
      'Volume discounts (50+ employees)',
      'Dedicated account manager',
      'Custom wellness programs',
      'Full analytics & reporting',
      'Priority support',
    ],
  },
]

export async function seedSubscriptions(prisma: PrismaClient) {
  console.log('  Seeding subscription plans...')

  const allPlans = [...INDIVIDUAL_PLANS, ...CORPORATE_PLANS]
  let totalSeeded = 0

  for (const [countryCode, { currency }] of Object.entries(REGION_CURRENCIES)) {
    for (const plan of allPlans) {
      const price = currency === 'MUR' ? plan.priceMUR : getEquivalentAmount(plan.priceMUR, currency)
      const slug = `${plan.slugBase}-${countryCode.toLowerCase()}`

      const discountsVal = plan.discounts ?? Prisma.JsonNull
      const paidServicesVal = plan.paidServices ?? Prisma.JsonNull

      await prisma.subscriptionPlan.upsert({
        where: { slug },
        update: {
          price,
          currency,
          quotas: plan.quotas as unknown as Prisma.InputJsonValue,
          discounts: discountsVal,
          paidServices: paidServicesVal,
          targetAudience: plan.targetAudience ?? null,
          features: plan.features,
        },
        create: {
          name: plan.name,
          slug,
          type: plan.type,
          price,
          currency,
          countryCode,
          targetAudience: plan.targetAudience ?? null,
          quotas: plan.quotas as unknown as Prisma.InputJsonValue,
          discounts: discountsVal,
          paidServices: paidServicesVal,
          features: plan.features,
        },
      })
      totalSeeded++
    }
  }

  console.log(`  ✓ ${totalSeeded} subscription plans seeded (${allPlans.length} plans × ${Object.keys(REGION_CURRENCIES).length} regions)`)

  // ── Enroll all seeded users in subscription plans ──────────────────────
  console.log('  Enrolling users in subscription plans...')

  const planAssignment: Record<string, string> = {
    PATIENT: 'essential',
    DOCTOR: 'plus',
    NURSE: 'essential',
    NANNY: 'essential',
    PHARMACIST: 'essential',
    LAB_TECHNICIAN: 'essential',
    EMERGENCY_WORKER: 'essential',
    INSURANCE_REP: 'plus',
    REFERRAL_PARTNER: 'plus',
    REGIONAL_ADMIN: 'premium',
    CAREGIVER: 'essential',
    PHYSIOTHERAPIST: 'essential',
    DENTIST: 'essential',
    OPTOMETRIST: 'essential',
    NUTRITIONIST: 'essential',
  }

  const users = await prisma.user.findMany({
    select: { id: true, userType: true, regionId: true },
  })

  let enrolled = 0
  for (const user of users) {
    // Skip users who already have a subscription
    const existing = await prisma.userSubscription.findUnique({ where: { userId: user.id } })
    if (existing) continue

    // Find the plan slug based on user type and region
    const planBase = planAssignment[user.userType]
    if (!planBase) continue

    // Get region country code
    let cc = 'mu'
    if (user.regionId) {
      const region = await prisma.region.findUnique({
        where: { id: user.regionId },
        select: { countryCode: true },
      })
      if (region) cc = region.countryCode.toLowerCase()
    }

    const slug = `${planBase}-${cc}`
    const plan = await prisma.subscriptionPlan.findUnique({ where: { slug } })
    if (!plan) continue

    await prisma.userSubscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        status: 'active',
        startDate: new Date(),
        autoRenew: true,
      },
    })
    enrolled++
  }

  // Enroll corporate employees via their admin
  const corpAdmin = await prisma.user.findFirst({
    where: { userType: 'CORPORATE_ADMIN' },
    select: { id: true, regionId: true },
  })
  if (corpAdmin) {
    let cc = 'mu'
    if (corpAdmin.regionId) {
      const region = await prisma.region.findUnique({
        where: { id: corpAdmin.regionId },
        select: { countryCode: true },
      })
      if (region) cc = region.countryCode.toLowerCase()
    }
    const corpPlan = await prisma.subscriptionPlan.findUnique({ where: { slug: `corp-plus-${cc}` } })
    if (corpPlan) {
      const employees = await prisma.corporateEmployee.findMany({
        where: { corporateAdminId: corpAdmin.id, status: 'active' },
        select: { userId: true },
      })
      for (const emp of employees) {
        const existing = await prisma.userSubscription.findUnique({ where: { userId: emp.userId } })
        if (existing) {
          await prisma.userSubscription.update({
            where: { userId: emp.userId },
            data: { planId: corpPlan.id, corporateAdminId: corpAdmin.id },
          })
        }
      }
    }
  }

  console.log(`  ✓ ${enrolled} users enrolled in subscription plans`)
}

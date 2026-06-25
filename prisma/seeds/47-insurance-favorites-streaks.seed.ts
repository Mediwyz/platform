import { PrismaClient } from '@prisma/client'

/**
 * Demo data for the new feature set:
 *   - 1 insurance company flagged on the super-admin's profile
 *   - Sample members (active employees) with mixed paid/unpaid status
 *   - A few claim submissions (pending / approved / paid)
 *   - Favourite providers for each seeded patient
 *   - Starter health streaks so the tile shows real data on day 1
 *
 * Idempotent: every upsert keys on stable identifiers so re-running is safe.
 */
export async function seedInsuranceFavoritesStreaks(prisma: PrismaClient) {
  // ── 1. Insurance company on Dr Sarah (DOC001) ────────────────────────────
  const owner = await prisma.user.findUnique({
    where: { email: 'sarah.johnson@mediwyz.com' },
    select: { id: true },
  })
  if (!owner) { console.log('  (skipped - owner email not seeded)'); return }

  let company = await prisma.corporateAdminProfile.findFirst({
    where: { userId: owner.id, companyName: 'Flamingo Health Co' },
  })
  if (!company) {
    company = await prisma.corporateAdminProfile.create({
      data: {
        userId: owner.id,
        companyName: 'Flamingo Health Co',
        industry: 'Insurance',
        employeeCount: 25,
        isInsuranceCompany: true,
        monthlyContribution: 500,
        coverageDescription: 'Hospitalisation, outpatient consultations, basic dental, yearly check-up',
        registrationNumber: 'BRN-MSMU-2026-001',
      },
    })
    console.log('  ✓ Created insurance company Flamingo Health Co')
  }

  // ── 2. Enrol seeded patients as members ──────────────────────────────────
  const patientEmails = [
    'emma.johnson@mediwyz.com',
    'jean.pierre@mediwyz.com',
    'aisha.khan@mediwyz.com',
    'vikash.d@mediwyz.com',
    'nadia.s@mediwyz.com',
  ]
  const patients = await prisma.user.findMany({
    where: { email: { in: patientEmails } },
    select: { id: true, email: true },
  })

  const thisMonth = new Date().toISOString().slice(0, 7)
  const lastMonth = (() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1)
    return d.toISOString().slice(0, 7)
  })()

  for (let i = 0; i < patients.length; i++) {
    const p = patients[i]
    const paidThisMonth = i % 2 === 0 // mix paid and unpaid
    await prisma.corporateEmployee.upsert({
      where: {
        companyId_userId: { companyId: company.id, userId: p.id },
      },
      update: {
        status: 'active',
        lastContributionMonth: paidThisMonth ? thisMonth : lastMonth,
        lastContributionAt: paidThisMonth ? new Date() : new Date(Date.now() - 30 * 24 * 3600e3),
      },
      create: {
        corporateAdminId: owner.id, companyId: company.id, userId: p.id,
        status: 'active',
        approvedAt: new Date(),
        lastContributionMonth: paidThisMonth ? thisMonth : lastMonth,
        lastContributionAt: paidThisMonth ? new Date() : new Date(Date.now() - 30 * 24 * 3600e3),
      },
    })
  }
  console.log(`  ✓ Enrolled ${patients.length} members in the insurance company`)

  // ── 3. Sample claims (pending + paid + denied) ───────────────────────────
  const sampleClaims: Array<{ memberIdx: number; amount: number; status: string; description: string }> = [
    { memberIdx: 0, amount: 2500, status: 'pending', description: 'X-ray consultation at Clinique du Nord' },
    { memberIdx: 1, amount: 1200, status: 'paid', description: 'Emergency room visit for allergic reaction' },
    { memberIdx: 2, amount: 800, status: 'denied', description: 'Cosmetic dental consultation (not covered)' },
  ]
  for (const c of sampleClaims) {
    const member = patients[c.memberIdx]
    if (!member) continue
    const existing = await prisma.insuranceClaimSubmission.findFirst({
      where: { memberId: member.id, companyProfileId: company.id, description: c.description },
    })
    if (existing) continue
    await prisma.insuranceClaimSubmission.create({
      data: {
        memberId: member.id,
        companyProfileId: company.id,
        description: c.description,
        amount: c.amount,
        status: c.status,
        reviewedAt: c.status === 'pending' ? null : new Date(),
        reviewedBy: c.status === 'pending' ? null : owner.id,
        paidAt: c.status === 'paid' ? new Date() : null,
        reviewerNote: c.status === 'denied' ? 'Cosmetic procedures are not covered under this plan.' : null,
      },
    })
  }
  console.log(`  ✓ Created ${sampleClaims.length} sample insurance claims`)

  // ── 4. Starter favourite providers for each patient ──────────────────────
  const providers = await prisma.user.findMany({
    where: {
      email: {
        in: [
          'sarah.johnson@mediwyz.com',
          'priya.ramgoolam@mediwyz.com',
          'marie.dupont@mediwyz.com',
        ],
      },
    },
    select: { id: true },
  })
  for (const patient of patients) {
    for (const provider of providers.slice(0, 2)) { // each patient favourites 2 providers
      await prisma.providerFavorite.upsert({
        where: { userId_providerId: { userId: patient.id, providerId: provider.id } },
        update: {},
        create: { userId: patient.id, providerId: provider.id },
      })
    }
  }
  console.log(`  ✓ Created starter favourites for ${patients.length} patients`)

  // ── 5. Health streaks - seed a healthy distribution ──────────────────────
  const streakSeeds: Array<{ idx: number; current: number; longest: number }> = [
    { idx: 0, current: 12, longest: 12 },
    { idx: 1, current: 3,  longest: 8 },
    { idx: 2, current: 0,  longest: 5 },
    { idx: 3, current: 30, longest: 30 },
    { idx: 4, current: 1,  longest: 1 },
  ]
  const today = new Date().toISOString().slice(0, 10)
  for (const s of streakSeeds) {
    const p = patients[s.idx]
    if (!p) continue
    await prisma.healthStreak.upsert({
      where: { userId: p.id },
      update: {
        currentStreak: s.current,
        longestStreak: s.longest,
        lastCheckInDate: s.current > 0 ? today : null,
      },
      create: {
        userId: p.id,
        currentStreak: s.current,
        longestStreak: s.longest,
        lastCheckInDate: s.current > 0 ? today : null,
      },
    })
  }
  console.log(`  ✓ Seeded health streaks for ${streakSeeds.length} patients`)
}

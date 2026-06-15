import { PrismaClient } from '@prisma/client'

/**
 * Seed 41 - Company activity: enrollments + company posts in feed
 *
 * Creates:
 * - Company page for DOC001 (existing doctor)
 * - Enrolls PAT001, PAT002, NUR001 as employees
 * - Creates 5 company-branded posts in the feed
 */
export async function seedCompanyActivity(prisma: PrismaClient) {
  console.log('  Seeding company activity...')

  // Check if DOC001 already has a company
  const existing = await prisma.corporateAdminProfile.findFirst({
    where: { userId: 'DOC001' },
  })

  let companyId: string
  if (existing) {
    companyId = existing.id
  } else {
    const company = await prisma.corporateAdminProfile.create({
      data: {
        userId: 'DOC001',
        companyName: 'BlueLagoon Medical Clinic',
        registrationNumber: 'BRN-MU-2024-001',
        industry: 'Healthcare',
        employeeCount: 15,
      },
    })
    companyId = company.id
  }

  // Enroll employees (PAT001, PAT002, NUR001)
  const employeeIds = ['PAT001', 'PAT002', 'NUR001']
  for (const userId of employeeIds) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) continue

    const existingEnrollment = await prisma.corporateEmployee.findFirst({
      where: { corporateAdminId: 'DOC001', userId },
    })
    if (!existingEnrollment) {
      await prisma.corporateEmployee.create({
        data: {
          corporateAdminId: 'DOC001',
          userId,
          status: 'active',
          approvedAt: new Date(),
          department: userId.startsWith('PAT') ? 'Patients' : 'Staff',
        },
      })
    }
  }

  // Create company-branded posts
  const companyPosts = [
    {
      content: 'Exciting news! BlueLagoon Medical Clinic is now offering free health screenings every Saturday. Book your slot today through MediWyz. #HealthAwareness #FreeClinics',
      category: 'news',
      tags: ['health-screening', 'free-clinic', 'mauritius'],
    },
    {
      content: 'Our team of specialists performed over 500 consultations this month. Thank you for trusting MediCare Clinic with your health needs. We are committed to providing quality healthcare to every Mauritian family.',
      category: 'wellness',
      tags: ['milestone', 'healthcare', 'gratitude'],
    },
    {
      content: 'Did you know? Regular blood pressure monitoring can prevent 80% of cardiovascular emergencies. Visit our clinic or use MediWyz to book a quick checkup. Your heart will thank you!',
      category: 'health_tips',
      tags: ['blood-pressure', 'prevention', 'cardiology'],
    },
    {
      content: 'We are proud to announce our partnership with 3 new pharmacies across Mauritius. Now your prescriptions can be delivered faster than ever through the MediWyz Health Shop.',
      category: 'news',
      tags: ['partnership', 'pharmacy', 'delivery'],
    },
    {
      content: 'Mental health matters. Our clinic now offers confidential counseling sessions every Wednesday. No referral needed - just book through MediWyz. Take the first step today.',
      category: 'wellness',
      tags: ['mental-health', 'counseling', 'wellness'],
    },
  ]

  let postCount = 0
  for (const post of companyPosts) {
    const existingPost = await prisma.post.findFirst({
      where: { authorId: 'DOC001', companyId, content: { startsWith: post.content.substring(0, 50) } },
    })
    if (!existingPost) {
      await prisma.post.create({
        data: {
          authorId: 'DOC001',
          companyId,
          content: post.content,
          category: post.category,
          tags: post.tags,
          isPublished: true,
        },
      })
      postCount++
    }
  }

  // Also create some personal posts from various providers
  const personalPosts = [
    { authorId: 'DOC002', content: 'Just completed a 12-hour surgery marathon. 3 successful procedures. The team was incredible. Remember - your health is your wealth.', category: 'wellness', tags: ['surgery', 'teamwork'] },
    { authorId: 'NUR001', content: 'Tip: Always keep your vaccination records up to date. As a nurse, I see too many patients who forgot their boosters. Stay protected!', category: 'health_tips', tags: ['vaccination', 'prevention'] },
    { authorId: 'PHARM001', content: 'Important reminder: Never take antibiotics without a prescription. Antibiotic resistance is a growing global threat. Ask your pharmacist if you have questions.', category: 'health_tips', tags: ['antibiotics', 'pharmacy'] },
    { authorId: 'DENT001', content: 'Brushing twice a day is great, but are you flossing? Most cavities form between teeth where your toothbrush cannot reach. Start flossing today!', category: 'health_tips', tags: ['dental', 'flossing'] },
    { authorId: 'NUTR001', content: 'Meal prep Sunday! Here is a simple high-protein breakfast: Greek yogurt + mixed berries + chia seeds + honey. Takes 2 minutes, fuels your whole morning.', category: 'health_tips', tags: ['nutrition', 'meal-prep'] },
  ]

  for (const post of personalPosts) {
    const user = await prisma.user.findUnique({ where: { id: post.authorId } })
    if (!user) continue
    const existingPost = await prisma.post.findFirst({
      where: { authorId: post.authorId, content: { startsWith: post.content.substring(0, 50) } },
    })
    if (!existingPost) {
      await prisma.post.create({
        data: {
          authorId: post.authorId,
          content: post.content,
          category: post.category,
          tags: post.tags,
          isPublished: true,
        },
      })
      postCount++
    }
  }

  const enrollCount = await prisma.corporateEmployee.count({ where: { corporateAdminId: 'DOC001', status: 'active' } })
  console.log(`  ✓ Company: MediCare Clinic (${enrollCount} employees, ${postCount} new posts)`)
}

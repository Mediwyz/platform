import { PrismaClient, UserType } from '@prisma/client'

export async function seedServiceBookings(prisma: PrismaClient) {
  console.log('  Seeding service bookings for new roles...')

  // Get ALL patients (not just 3)
  const patients = await prisma.user.findMany({
    where: { userType: 'MEMBER' },
    select: { id: true, firstName: true, lastName: true },
    take: 10,
  })

  const providers = await prisma.user.findMany({
    where: { userType: { in: ['CAREGIVER', 'PHYSIOTHERAPIST', 'DENTIST', 'OPTOMETRIST', 'NUTRITIONIST'] } },
    select: { id: true, firstName: true, lastName: true, userType: true },
  })

  if (patients.length === 0 || providers.length === 0) {
    console.log('  Skipping - no patients or new providers found')
    return
  }

  const now = new Date()
  const DAY = 24 * 60 * 60 * 1000
  const bookings: {
    patientId: string
    providerUserId: string
    providerType: string
    providerName: string
    scheduledAt: Date
    duration: number
    type: string
    status: string
    serviceName: string
    servicePrice: number
    specialty: string | null
    reason: string | null
    notes: string | null
  }[] = []

  const serviceData: Record<string, { services: string[]; prices: number[]; specialties: string[] }> = {
    CAREGIVER: {
      services: ['Elder Daily Care - Half Day', 'Dementia Companion', 'Post-Surgery Home Aide', 'Overnight Care', 'Disability Support', 'Palliative Care Support'],
      prices: [600, 800, 700, 1200, 650, 900],
      specialties: ['Elder Care', 'Dementia Care', 'Post-Surgery', 'Overnight', 'Disability', 'Palliative'],
    },
    PHYSIOTHERAPIST: {
      services: ['Initial Assessment', 'Rehabilitation Session', 'Sports Injury Treatment', 'Back Pain Therapy', 'Post-Op Rehab', 'Neurological Physiotherapy'],
      prices: [800, 600, 900, 700, 850, 950],
      specialties: ['General', 'Rehabilitation', 'Sports', 'Orthopedic', 'Post-Op', 'Neurological'],
    },
    DENTIST: {
      services: ['Dental Check-up', 'Teeth Cleaning', 'Filling', 'Root Canal', 'Teeth Whitening', 'Orthodontic Consultation'],
      prices: [500, 400, 800, 2500, 1500, 600],
      specialties: ['General', 'Preventive', 'Restorative', 'Endodontics', 'Cosmetic', 'Orthodontics'],
    },
    OPTOMETRIST: {
      services: ['Eye Exam', 'Glasses Prescription', 'Contact Lens Fitting', 'Glaucoma Screening', 'Pediatric Eye Exam', 'Visual Field Test'],
      prices: [800, 500, 600, 1000, 700, 900],
      specialties: ['General', 'Corrective', 'Contact Lenses', 'Glaucoma', 'Pediatric', 'Diagnostics'],
    },
    NUTRITIONIST: {
      services: ['Initial Nutrition Assessment', 'Follow-up Consultation', 'Meal Plan Creation', 'Sports Nutrition Plan', 'Diabetes Diet Plan', 'Weight Management Program'],
      prices: [1000, 600, 800, 1200, 900, 1100],
      specialties: ['Clinical', 'Follow-up', 'Meal Planning', 'Sports', 'Diabetes', 'Weight Management'],
    },
  }

  const statuses = ['completed', 'completed', 'accepted', 'pending', 'pending', 'in_progress']
  const types = ['in_person', 'in_person', 'video', 'home_visit', 'in_person', 'video']

  // Each provider gets bookings with ALL patients (not just one random one)
  for (const provider of providers) {
    const data = serviceData[provider.userType] || { services: ['Consultation'], prices: [500], specialties: ['General'] }

    for (let pi = 0; pi < Math.min(patients.length, 5); pi++) {
      const patient = patients[pi]
      // Each patient-provider pair gets 2-4 bookings at varying dates
      const numBookings = 2 + (pi % 3) // 2, 3, or 4 bookings per pair
      for (let i = 0; i < numBookings; i++) {
        const svcIdx = (pi + i) % data.services.length
        // Spread bookings: past (-30 to -1 days), present (+1 to +3), future (+4 to +30)
        const daysOffset = i === 0 ? -(7 + pi * 5) : i === 1 ? (2 + pi) : i === 2 ? (7 + pi * 3) : -(1 + pi * 2)
        const scheduledAt = new Date(now.getTime() + daysOffset * DAY)
        scheduledAt.setHours(8 + (i * 2) % 10, (pi % 2) * 30, 0, 0)

        const isPast = daysOffset < 0
        const status = isPast ? (i % 3 === 0 ? 'completed' : 'cancelled') : statuses[i % statuses.length]

        bookings.push({
          patientId: patient.id,
          providerUserId: provider.id,
          providerType: provider.userType,
          providerName: `${provider.firstName} ${provider.lastName}`,
          scheduledAt,
          duration: 30 + (svcIdx % 3) * 15,
          type: types[i % types.length],
          status,
          serviceName: data.services[svcIdx],
          servicePrice: data.prices[svcIdx],
          specialty: data.specialties[svcIdx],
          reason: isPast ? 'Completed visit' : 'Scheduled appointment',
          notes: isPast ? 'Session completed successfully.' : null,
        })
      }
    }
  }

  // Batch create
  for (const b of bookings) {
    await prisma.serviceBooking.create({ data: { ...b, providerType: b.providerType as UserType } })
  }

  console.log(`  ✓ ${bookings.length} service bookings seeded for new provider roles`)
}

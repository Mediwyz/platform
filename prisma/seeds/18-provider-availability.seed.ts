import { PrismaClient, UserType } from '@prisma/client'

const PROVIDER_USER_TYPES: UserType[] = [
  UserType.DOCTOR,
  UserType.NURSE,
  UserType.NANNY,
  UserType.LAB_TECHNICIAN,
]

// Monday–Friday (1–5), two time windows per day
const WEEKDAYS = [1, 2, 3, 4, 5]
const TIME_WINDOWS = [
  { startTime: '09:00', endTime: '12:00' }, // Morning block
  { startTime: '13:00', endTime: '17:00' }, // Afternoon block
]

export async function seedProviderAvailability(prisma: PrismaClient) {
  // Query all users who are providers (doctor, nurse, nanny, lab technician)
  const providers = await prisma.user.findMany({
    where: {
      userType: { in: PROVIDER_USER_TYPES },
    },
    select: { id: true, userType: true },
  })

  if (providers.length === 0) {
    console.log('  No provider users found - skipping availability seeding')
    return
  }

  // Build availability records for every provider × weekday × time window
  const records: {
    userId: string
    dayOfWeek: number
    startTime: string
    endTime: string
    slotDuration: number
    isActive: boolean
  }[] = []

  for (const provider of providers) {
    // Doctors use 30-min slots, nurses/nannies/lab techs use 60-min slots
    const slotDuration = provider.userType === UserType.DOCTOR ? 30 : 60

    for (const day of WEEKDAYS) {
      for (const window of TIME_WINDOWS) {
        records.push({
          userId: provider.id,
          dayOfWeek: day,
          startTime: window.startTime,
          endTime: window.endTime,
          slotDuration,
          isActive: true,
        })
      }
    }
  }

  const result = await prisma.providerAvailability.createMany({
    data: records,
    skipDuplicates: true,
  })

  console.log(
    `  Seeded ${result.count} provider availability windows for ${providers.length} providers (${WEEKDAYS.length} days x ${TIME_WINDOWS.length} windows each)`
  )
}

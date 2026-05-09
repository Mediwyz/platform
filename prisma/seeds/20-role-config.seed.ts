import { PrismaClient } from '@prisma/client'

export async function seedRoleConfig(prisma: PrismaClient) {
  const commonFeatures = ['feed', 'overview', 'profile', 'billing', 'video', 'audio', 'messages', 'settings']

  const roleFeatures: Record<string, string[]> = {
    PATIENT: [
      ...commonFeatures,
      'consultations', 'bookings', 'prescriptions', 'health-records',
      'ai-assistant', 'nurse-services', 'childcare', 'emergency',
      'lab-results', 'insurance', 'chat',
    ],
    DOCTOR: [
      ...commonFeatures,
      'appointments', 'patients', 'schedule', 'posts', 'reviews', 'booking-requests',
    ],
    NURSE: [
      ...commonFeatures,
      'appointments', 'patients', 'schedule', 'booking-requests', 'reviews',
    ],
    NANNY: [
      ...commonFeatures,
      'bookings', 'schedule', 'reviews', 'booking-requests',
    ],
    PHARMACIST: [
      ...commonFeatures,
      'inventory', 'orders', 'booking-requests',
    ],
    LAB_TECHNICIAN: [
      ...commonFeatures,
      'test-requests', 'results', 'booking-requests',
    ],
    EMERGENCY_WORKER: [
      ...commonFeatures,
      'dispatch', 'active-calls', 'booking-requests',
    ],
    INSURANCE_REP: [
      ...commonFeatures,
      'plans', 'claims', 'clients',
    ],
    CORPORATE_ADMIN: [
      ...commonFeatures,
      'employees', 'company', 'claims',
    ],
    REFERRAL_PARTNER: [
      ...commonFeatures,
      'referrals', 'earnings', 'analytics', 'clients',
    ],
    REGIONAL_ADMIN: [
      ...commonFeatures,
      'accounts', 'users', 'analytics', 'content', 'security',
      'system', 'regional-admins', 'role-config', 'required-documents',
    ],
  }

  // Features explicitly disabled for certain roles
  const disabledFeatures: Record<string, string[]> = {
    PATIENT: ['services', 'practice', 'workflows', 'inventory'],
  }

  let count = 0

  for (const [userType, features] of Object.entries(roleFeatures)) {
    for (const featureKey of features) {
      await prisma.roleFeatureConfig.upsert({
        where: { userType_featureKey: { userType, featureKey } },
        update: {},
        create: {
          userType,
          featureKey,
          enabled: true,
        },
      })
      count++
    }
  }

  // Create disabled feature entries
  for (const [userType, features] of Object.entries(disabledFeatures)) {
    for (const featureKey of features) {
      await prisma.roleFeatureConfig.upsert({
        where: { userType_featureKey: { userType, featureKey } },
        update: { enabled: false },
        create: {
          userType,
          featureKey,
          enabled: false,
        },
      })
      count++
    }
  }

  console.log(`  Seeded ${count} role feature configs across ${Object.keys(roleFeatures).length + Object.keys(disabledFeatures).length} user types`)
}

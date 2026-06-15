import { z } from 'zod'

// ─── Conversations ──────────────────────────────────────────────────────────

export const createConversationSchema = z.object({
  participantIds: z.array(z.string().min(1)).min(1, 'At least one participant is required'),
})

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(5000),
})

// ─── Video & WebRTC ─────────────────────────────────────────────────────────

export const createVideoRoomSchema = z.object({
  creatorId: z.string().min(1),
  participantIds: z.array(z.string().min(1)).optional(),
  scheduledAt: z.string().datetime().optional(),
  reason: z.string().max(500).optional(),
})

export const createWebRTCSessionSchema = z.object({
  roomId: z.string().min(1),
  userId: z.string().min(1),
  userName: z.string().optional().default(''),
  userType: z.string().optional().default(''),
})

export const updateWebRTCSessionSchema = z.object({
  sessionId: z.string().min(1),
  connectionState: z.string().min(1).optional(),
  iceConnectionState: z.string().min(1).optional(),
})

export const recoverWebRTCSessionSchema = z.object({
  roomId: z.string().min(1),
  userId: z.string().min(1),
})

// ─── Bookings ───────────────────────────────────────────────────────────────

const baseBookingSchema = z.object({
  scheduledDate: z.string().min(1, 'Date is required'),
  scheduledTime: z.string().min(1, 'Time is required'),
  reason: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  duration: z.number().int().min(15).max(1440).optional(),
})

export const createDoctorBookingSchema = baseBookingSchema.extend({
  doctorId: z.string().min(1, 'Doctor ID is required'),
  consultationType: z.enum(['in_person', 'home_visit', 'video']),
})

export const createNurseBookingSchema = baseBookingSchema.extend({
  nurseId: z.string().min(1, 'Nurse ID is required'),
  consultationType: z.enum(['in_person', 'home_visit', 'video']),
})

export const createNannyBookingSchema = baseBookingSchema.extend({
  nannyId: z.string().min(1, 'Nanny ID is required'),
  consultationType: z.enum(['in_person', 'home_visit', 'video']),
  children: z.array(z.string()).optional(),
})

export const createLabTestBookingSchema = z.object({
  labTechId: z.string().min(1).optional(),
  testName: z.string().min(1, 'Test name is required'),
  scheduledDate: z.string().min(1),
  scheduledTime: z.string().min(1),
  sampleType: z.string().optional(),
  notes: z.string().max(1000).optional(),
  price: z.number().min(0).optional(),
})

export const createEmergencyBookingSchema = z.object({
  emergencyType: z.string().min(1, 'Emergency type is required'),
  location: z.string().min(1, 'Location is required'),
  contactNumber: z.string().min(1, 'Contact number is required'),
  notes: z.string().max(1000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
})

export const createServiceBookingSchema = z.object({
  providerUserId: z.string().min(1, 'Provider ID is required'),
  providerType: z.string().min(1, 'Provider type is required'),
  scheduledDate: z.string().min(1, 'Date is required'),
  scheduledTime: z.string().min(1, 'Time is required'),
  type: z.enum(['in_person', 'home_visit', 'video']).default('in_person'),
  reason: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  duration: z.number().int().min(15).max(1440).optional(),
  serviceName: z.string().optional(),
  servicePrice: z.number().min(0).optional(),
  specialty: z.string().optional(),
})

export const bookingActionSchema = z.object({
  action: z.enum(['accept', 'deny', 'cancel', 'en_route', 'complete']),
  reason: z.string().max(500).optional(),
})

// ─── User Profile ───────────────────────────────────────────────────────────

export const updateUserProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).max(30).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().max(500).optional(),
  profileImage: z.string().max(500).optional(),
  emergencyContact: z.object({
    name: z.string().min(1),
    relationship: z.string().min(1),
    phone: z.string().min(1),
  }).optional(),
  profileData: z.record(z.string(), z.unknown()).optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

// ─── Notifications ──────────────────────────────────────────────────────────

export const markNotificationsReadSchema = z.object({
  notificationIds: z.array(z.string().min(1)).optional(),
})

// ─── Prescriptions ──────────────────────────────────────────────────────────

export const createPrescriptionSchema = z.object({
  patientId: z.string().min(1),
  diagnosis: z.string().min(1, 'Diagnosis is required'),
  notes: z.string().optional(),
  nextRefill: z.string().optional(),
  medicines: z.array(z.object({
    medicineId: z.string().min(1),
    dosage: z.string().min(1),
    frequency: z.string().min(1),
    duration: z.string().min(1),
    instructions: z.string().optional(),
  })).min(1, 'At least one medicine is required'),
})

/** Doctor prescription route accepts medicine by name (upserts on create) */
export const createDoctorPrescriptionSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  diagnosis: z.string().min(1, 'Diagnosis is required'),
  notes: z.string().optional(),
  nextRefill: z.string().optional(),
  medicines: z.array(z.object({
    name: z.string().min(1, 'Medicine name is required'),
    dosage: z.string().min(1),
    frequency: z.string().min(1),
    duration: z.string().min(1),
    instructions: z.string().optional(),
  })).min(1, 'At least one medicine is required'),
})

// ─── Orders ─────────────────────────────────────────────────────────────────

export const createOrderSchema = z.object({
  items: z.array(z.object({
    pharmacyMedicineId: z.string().min(1),
    quantity: z.number().int().min(1),
  })).min(1, 'At least one item is required'),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(['confirmed', 'shipped', 'delivered', 'cancelled']),
})

// ─── Posts ───────────────────────────────────────────────────────────────────

export const createPostSchema = z.object({
  content: z.string().min(1, 'Content is required').max(10000),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().max(5000000).optional(),
})

export const updatePostSchema = z.object({
  content: z.string().min(1, 'Content cannot be empty').max(10000).optional(),
  category: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().max(5000000).nullable().optional(),
  isPublished: z.boolean().optional(),
})

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(5000),
})

// ─── Wallet ─────────────────────────────────────────────────────────────────

export const walletDebitSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  serviceType: z.string().min(1, 'Service type is required'),
  referenceId: z.string().optional(),
})

// ─── Availability ────────────────────────────────────────────────────────────

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

const availabilitySlotSchema = z.object({
  dayOfWeek: z.number().int().min(0, 'dayOfWeek must be 0-6').max(6, 'dayOfWeek must be 0-6'),
  startTime: z.string().regex(timeRegex, 'startTime must be HH:MM (24h)'),
  endTime: z.string().regex(timeRegex, 'endTime must be HH:MM (24h)'),
  isActive: z.boolean().optional(),
})

export const updateAvailabilitySchema = z.object({
  slots: z.array(availabilitySlotSchema),
}).refine(
  (data) => data.slots.every((slot) => slot.startTime < slot.endTime),
  { message: 'startTime must be before endTime' }
)

// ─── Preferences ─────────────────────────────────────────────────────────────

export const updatePreferencesSchema = z.object({
  language: z.enum(['en', 'fr', 'mfe']).optional(),
  timezone: z.string().min(1).max(100).optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  appointmentReminders: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  profileVisibility: z.enum(['public', 'connections', 'private']).optional(),
})

// ─── Admin ──────────────────────────────────────────────────────────────────

export const adminAccountActionSchema = z.object({
  userId: z.string().min(1),
  action: z.enum(['approve', 'reject', 'suspend']),
})

// ─── Subscription Plans ─────────────────────────────────────────────────────

const planServiceSchema = z.object({
  platformServiceId: z.string().min(1).optional(),
  serviceGroupId: z.string().min(1).optional(),
  isFree: z.boolean().default(false),
  discountPercent: z.number().int().min(0).max(100).default(0),
  adminPrice: z.number().min(0).nullable().optional(),
  monthlyLimit: z.number().int().min(-1).default(0),
})

export const createSubscriptionPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required').max(100),
  type: z.enum(['individual', 'corporate']),
  price: z.number().min(0, 'Price must be non-negative'),
  currency: z.string().length(3, 'Currency code must be 3 characters').default('MUR'),
  targetAudience: z.string().max(200).optional(),
  quotas: z.array(z.object({
    role: z.string().min(1),
    specialty: z.string().nullable().optional(),
    limit: z.number().int().min(-1),
  })).optional().default([]),
  discounts: z.record(z.string(), z.number()).optional(),
  paidServices: z.record(z.string(), z.number()).optional(),
  features: z.array(z.string()).min(1, 'At least one feature is required'),
  // Service links - services and groups included in this plan
  services: z.array(planServiceSchema).optional(),
})

export const updateSubscriptionPlanSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  price: z.number().min(0).optional(),
  targetAudience: z.string().max(200).nullable().optional(),
  quotas: z.array(z.object({
    role: z.string().min(1),
    specialty: z.string().nullable().optional(),
    limit: z.number().int().min(-1),
  })).optional(),
  discounts: z.record(z.string(), z.number()).nullable().optional(),
  paidServices: z.record(z.string(), z.number()).nullable().optional(),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
})

// ─── Regions ───────────────────────────────────────────────────────────────

export const createRegionSchema = z.object({
  name: z.string().min(1, 'Region name is required'),
  countryCode: z.string().length(2, 'Country code must be exactly 2 characters').toUpperCase(),
  language: z.string().optional().default('en'),
  flag: z.string().optional(),
})

export const updateRegionSchema = z.object({
  name: z.string().min(1, 'Region name is required').optional(),
  countryCode: z.string().length(2, 'Country code must be exactly 2 characters').transform(s => s.toUpperCase()).optional(),
  language: z.string().optional(),
  flag: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
})

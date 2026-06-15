import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  // userType is no longer required - the API auto-detects from the database
  userType: z.string().optional(),
})

export type LoginInput = z.infer<typeof loginSchema>

// ─── Registration Schema ────────────────────────────────────────────────────

export const registerSchema = z.object({
  // Basic Information (required for all)
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  phone: z.string().min(5, 'Phone number is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  address: z.string().min(1, 'Address is required'),

  // User Type
  userType: z.enum([
    'patient', 'doctor', 'nurse', 'nanny',
    'pharmacist', 'lab', 'emergency',
    'insurance', 'corporate', 'referral-partner', 'regional-admin',
    'caregiver', 'physiotherapist', 'dentist', 'optometrist', 'nutritionist',
  ]),

  // Referral Information (optional for all)
  referralCode: z.string().optional().default(''),

  // Doctor category (generalist vs specialist)
  doctorCategory: z.enum(['general_practitioner', 'specialist']).optional(),

  // Corporate enrollment (patient enrolling in a company plan)
  enrolledInCompany: z.boolean().optional().default(false),
  companyId: z.string().optional(),

  // Professional Information (conditional)
  licenseNumber: z.string().optional(),
  specialization: z.string().optional(),
  institution: z.string().optional(),
  experience: z.string().optional(),

  // Corporate Administrator specific
  companyName: z.string().optional(),
  companyRegistrationNumber: z.string().optional(),
  companyAddress: z.string().optional(),
  jobTitle: z.string().optional(),

  // Regional Administrator specific
  targetCountry: z.string().optional(),
  targetRegion: z.string().optional(),
  countryCode: z.string().length(2).toUpperCase().optional(),
  businessPlan: z.string().optional(),

  // Referral Partner specific
  businessType: z.string().optional(),
  marketingExperience: z.string().optional(),
  socialMediaHandles: z.string().optional(),

  // Emergency Contact (optional)
  emergencyContactName: z.string().optional().default(''),
  emergencyContactPhone: z.string().optional().default(''),
  emergencyContactRelation: z.string().optional().default(''),

  // Terms and Privacy Agreement
  agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms'),
  agreeToPrivacy: z.boolean().refine(val => val === true, 'You must agree to the privacy policy'),
  agreeToDisclaimer: z.boolean().refine(val => val === true, 'You must agree to the medical disclaimer'),

  // Region
  regionId: z.string().optional(),

  // Profile image URL (uploaded during registration)
  profileImage: z.string().optional(),

  // Document URLs (uploaded during registration, saved to Document table)
  documentUrls: z.array(z.object({
    name: z.string().min(1),
    type: z.string().min(1),
    url: z.string().min(1),
    size: z.number().optional(),
  })).optional().default([]),

  // Document verification results from OCR
  documentVerifications: z.array(z.object({
    documentId: z.string(),
    verified: z.boolean(),
    confidence: z.number(),
  })).optional().default([]),

  // Document IDs the user chose to provide later
  skippedDocuments: z.array(z.string()).optional().default([]),

  // Referral click tracking ID (from referral-tracking API)
  trackingId: z.string().optional(),

  // Subscription plan selection (optional)
  selectedPlanId: z.string().optional(),
  selectedBusinessPlanId: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type RegisterInput = z.infer<typeof registerSchema>

import { Stat, WhyChooseReason } from '@/types'

// SERVICES and SPECIALTIES constants removed - now fetched dynamically
// from /api/roles and /api/search/health-shop (ProviderMarketplace + HealthShopMarketplace)

export const STATS: Stat[] = [
  { number: '500+', label: 'Qualified Doctors', color: 'text-blue-500' },
  { number: '10,000+', label: 'Happy Patients', color: 'text-green-500' },
  { number: '25,000+', label: 'Consultations', color: 'text-purple-500' },
  { number: '20+', label: 'Cities Covered', color: 'text-orange-500' },
]

export const WHY_CHOOSE_REASONS: WhyChooseReason[] = [
  {
    icon: 'FaShieldAlt',
    title: 'Verified Doctors',
    description: 'All doctors are verified and licensed healthcare professionals',
  },
  {
    icon: 'FaClock',
    title: '24/7 Support',
    description: 'Round-the-clock customer support for all your healthcare needs',
  },
  {
    icon: 'FaAward',
    title: 'Quality Care',
    description: 'Committed to providing the highest quality healthcare services',
  },
]

// ---------------------------------------------------------------------------
// Platform-wide configuration constants
// ---------------------------------------------------------------------------

/** Platform fee rates by provider type (fraction, e.g. 0.10 = 10%). */
export const PLATFORM_FEES: Record<string, number> = {
  nurse: 0.10,
  pharmacist: 0.05,
  labTech: 0.08,
  nanny: 0.10,
  doctor: 0.10,
  responder: 0.10,
}

/** Default prices (in MUR) used when no explicit price is provided. */
export const DEFAULT_PRICES = {
  labTest: 500,
  emergencyBooking: 2000,
}

/** Human-readable labels for each UserType enum value. */
export const USER_TYPE_LABELS: Record<string, string> = {
  MEMBER: 'Member',
  PATIENT: 'Member', // legacy alias - MEMBER is the canonical key
  DOCTOR: 'Doctor',
  NURSE: 'Nurse',
  NANNY: 'Nanny',
  PHARMACIST: 'Pharmacist',
  LAB_TECHNICIAN: 'Lab Technician',
  EMERGENCY_WORKER: 'Emergency Worker',
  INSURANCE_REP: 'Insurance Representative',
  CORPORATE_ADMIN: 'Corporate Admin',
  REFERRAL_PARTNER: 'Referral Partner',
  REGIONAL_ADMIN: 'Regional Admin',
}

/** URL path slugs for each UserType (used in routing). */
export const USER_TYPE_SLUGS: Record<string, string> = {
  MEMBER: 'patient', // MEMBER routes under /patient/* for URL stability
  PATIENT: 'patient', // legacy alias
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  NANNY: 'nanny',
  PHARMACIST: 'pharmacist',
  LAB_TECHNICIAN: 'lab-technician',
  EMERGENCY_WORKER: 'responder',
  INSURANCE_REP: 'insurance',
  CORPORATE_ADMIN: 'corporate',
  REFERRAL_PARTNER: 'referral-partner',
  REGIONAL_ADMIN: 'regional',
}
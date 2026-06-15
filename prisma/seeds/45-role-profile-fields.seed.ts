import { PrismaClient } from '@prisma/client'

/**
 * Seeds ProviderRole.profileFields - the DB-driven profile form schema.
 * Replaces the hardcoded switch-case in `components/profile/UserProfile.tsx`
 * so new roles created via regional-admin CRUD don't need a code change.
 *
 * Each entry: { key, label, type: 'text'|'number'|'tags'|'select'|'readonly', options?, suffix?, profileField? }
 */
export async function seedRoleProfileFields(prisma: PrismaClient) {
  const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

  const fieldsByCode: Record<string, unknown[]> = {
    PATIENT: [
      { key: 'bloodType', label: 'Blood Type', type: 'select', options: BLOOD_TYPES, profileField: true },
      { key: 'allergies', label: 'Allergies', type: 'tags', profileField: true },
      { key: 'chronicConditions', label: 'Chronic Conditions', type: 'tags', profileField: true },
      { key: 'healthScore', label: 'Health Score', type: 'readonly', profileField: true },
    ],
    DOCTOR: [
      { key: 'specialty', label: 'Specialty', type: 'text', profileField: true },
      { key: 'licenseNumber', label: 'License Number', type: 'text', profileField: true },
      { key: 'clinicAffiliation', label: 'Clinic Affiliation', type: 'text', profileField: true },
      { key: 'consultationFee', label: 'Consultation Fee', type: 'number', profileField: true, suffix: 'Rs' },
      { key: 'bio', label: 'Bio', type: 'text', profileField: true },
    ],
    NURSE: [
      { key: 'licenseNumber', label: 'License Number', type: 'text', profileField: true },
      { key: 'experience', label: 'Experience (years)', type: 'number', profileField: true },
      { key: 'specializations', label: 'Specializations', type: 'tags', profileField: true },
    ],
    NANNY: [
      { key: 'experience', label: 'Experience (years)', type: 'number', profileField: true },
      { key: 'certifications', label: 'Certifications', type: 'tags', profileField: true },
    ],
    PHARMACIST: [
      { key: 'licenseNumber', label: 'License Number', type: 'text', profileField: true },
      { key: 'pharmacyName', label: 'Pharmacy Name', type: 'text', profileField: true },
    ],
    LAB_TECHNICIAN: [
      { key: 'licenseNumber', label: 'License Number', type: 'text', profileField: true },
      { key: 'labName', label: 'Lab Name', type: 'text', profileField: true },
      { key: 'specializations', label: 'Specializations', type: 'tags', profileField: true },
    ],
    EMERGENCY_WORKER: [
      { key: 'certifications', label: 'Certifications', type: 'tags', profileField: true },
      { key: 'vehicleType', label: 'Vehicle Type', type: 'text', profileField: true },
      { key: 'responseZone', label: 'Response Zone', type: 'text', profileField: true },
      { key: 'emtLevel', label: 'EMT Level', type: 'text', profileField: true },
    ],
    CAREGIVER: [
      { key: 'licenseNumber', label: 'License Number', type: 'text', profileField: true },
      { key: 'experience', label: 'Experience (years)', type: 'number', profileField: true },
      { key: 'specializations', label: 'Specializations', type: 'tags', profileField: true },
      { key: 'certifications', label: 'Certifications', type: 'tags', profileField: true },
    ],
    PHYSIOTHERAPIST: [
      { key: 'licenseNumber', label: 'License Number', type: 'text', profileField: true },
      { key: 'experience', label: 'Experience (years)', type: 'number', profileField: true },
      { key: 'specializations', label: 'Specializations', type: 'tags', profileField: true },
      { key: 'clinicName', label: 'Clinic Name', type: 'text', profileField: true },
      { key: 'clinicAddress', label: 'Clinic Address', type: 'text', profileField: true },
    ],
    DENTIST: [
      { key: 'licenseNumber', label: 'License Number', type: 'text', profileField: true },
      { key: 'experience', label: 'Experience (years)', type: 'number', profileField: true },
      { key: 'specializations', label: 'Specializations', type: 'tags', profileField: true },
      { key: 'clinicName', label: 'Clinic Name', type: 'text', profileField: true },
      { key: 'clinicAddress', label: 'Clinic Address', type: 'text', profileField: true },
    ],
    OPTOMETRIST: [
      { key: 'licenseNumber', label: 'License Number', type: 'text', profileField: true },
      { key: 'experience', label: 'Experience (years)', type: 'number', profileField: true },
      { key: 'specializations', label: 'Specializations', type: 'tags', profileField: true },
      { key: 'clinicName', label: 'Clinic Name', type: 'text', profileField: true },
      { key: 'clinicAddress', label: 'Clinic Address', type: 'text', profileField: true },
    ],
    NUTRITIONIST: [
      { key: 'licenseNumber', label: 'License Number', type: 'text', profileField: true },
      { key: 'experience', label: 'Experience (years)', type: 'number', profileField: true },
      { key: 'specializations', label: 'Specializations', type: 'tags', profileField: true },
      { key: 'certifications', label: 'Certifications', type: 'tags', profileField: true },
    ],
    REFERRAL_PARTNER: [
      { key: 'businessType', label: 'Business Type', type: 'text', profileField: true },
      { key: 'commissionRate', label: 'Commission Rate (%)', type: 'number', profileField: true },
      { key: 'referralCode', label: 'Referral Code', type: 'readonly', profileField: true },
    ],
    REGIONAL_ADMIN: [
      { key: 'region', label: 'Region', type: 'text', profileField: true },
      { key: 'country', label: 'Country', type: 'text', profileField: true },
    ],
  }

  let updated = 0
  for (const [code, fields] of Object.entries(fieldsByCode)) {
    const result = await prisma.providerRole.updateMany({
      where: { code },
      data: { profileFields: fields as any },
    })
    updated += result.count
  }
  console.log(`  Seeded profileFields for ${updated} roles`)
}

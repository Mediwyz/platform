import { describe, it, expect } from 'vitest'

// Mock @prisma/client since it depends on generated code
vi.mock('@prisma/client', () => ({
  UserType: {
    MEMBER: 'MEMBER',
    DOCTOR: 'DOCTOR',
    NURSE: 'NURSE',
    NANNY: 'NANNY',
    PHARMACIST: 'PHARMACIST',
    LAB_TECHNICIAN: 'LAB_TECHNICIAN',
    EMERGENCY_WORKER: 'EMERGENCY_WORKER',
    INSURANCE_REP: 'INSURANCE_REP',
    CORPORATE_ADMIN: 'CORPORATE_ADMIN',
    REFERRAL_PARTNER: 'REFERRAL_PARTNER',
    REGIONAL_ADMIN: 'REGIONAL_ADMIN',
    CAREGIVER: 'CAREGIVER',
    PHYSIOTHERAPIST: 'PHYSIOTHERAPIST',
    DENTIST: 'DENTIST',
    OPTOMETRIST: 'OPTOMETRIST',
    NUTRITIONIST: 'NUTRITIONIST',
  },
}))

import { vi } from 'vitest'
import { cookieToPrismaUserType, prismaUserTypeToCookie, userTypeToProfileRelation } from '../user-type-map'

describe('cookieToPrismaUserType', () => {
  it('maps all cookie types to Prisma enums', () => {
    const expectedMappings: Record<string, string> = {
      'patient': 'MEMBER',
      'doctor': 'DOCTOR',
      'nurse': 'NURSE',
      'child-care-nurse': 'NANNY',
      'pharmacy': 'PHARMACIST',
      'lab': 'LAB_TECHNICIAN',
      'ambulance': 'EMERGENCY_WORKER',
      'admin': 'REGIONAL_ADMIN',
      'regional-admin': 'REGIONAL_ADMIN',
      'corporate': 'CORPORATE_ADMIN',
      'insurance': 'INSURANCE_REP',
      'referral-partner': 'REFERRAL_PARTNER',
      'caregiver': 'CAREGIVER',
      'physiotherapist': 'PHYSIOTHERAPIST',
      'dentist': 'DENTIST',
      'optometrist': 'OPTOMETRIST',
      'nutritionist': 'NUTRITIONIST',
    }

    for (const [cookie, prismaType] of Object.entries(expectedMappings)) {
      expect(cookieToPrismaUserType[cookie]).toBe(prismaType)
    }
  })
})

describe('prismaUserTypeToCookie', () => {
  it('is the reverse of cookieToPrismaUserType', () => {
    // 'admin' is an alias for REGIONAL_ADMIN - the canonical cookie is 'regional-admin'
    const canonical: Record<string, string> = {
      'admin': 'regional-admin',
    }
    for (const [cookie, prismaType] of Object.entries(cookieToPrismaUserType)) {
      const expected = canonical[cookie] || cookie
      expect(prismaUserTypeToCookie[prismaType]).toBe(expected)
    }
  })
})

describe('userTypeToProfileRelation', () => {
  it('maps all types to profile relation names', () => {
    expect(userTypeToProfileRelation['MEMBER']).toBe('patientProfile')
    expect(userTypeToProfileRelation['DOCTOR']).toBe('doctorProfile')
    expect(userTypeToProfileRelation['NURSE']).toBe('nurseProfile')
    expect(userTypeToProfileRelation['NANNY']).toBe('nannyProfile')
    expect(userTypeToProfileRelation['PHARMACIST']).toBe('pharmacistProfile')
    expect(userTypeToProfileRelation['LAB_TECHNICIAN']).toBe('labTechProfile')
    expect(userTypeToProfileRelation['EMERGENCY_WORKER']).toBe('emergencyWorkerProfile')
    expect(userTypeToProfileRelation['INSURANCE_REP']).toBe('insuranceRepProfile')
    expect(userTypeToProfileRelation['CORPORATE_ADMIN']).toBe('corporateAdminProfile')
    expect(userTypeToProfileRelation['REFERRAL_PARTNER']).toBe('referralPartnerProfile')
    expect(userTypeToProfileRelation['REGIONAL_ADMIN']).toBe('regionalAdminProfile')
    expect(userTypeToProfileRelation['CAREGIVER']).toBe('caregiverProfile')
    expect(userTypeToProfileRelation['PHYSIOTHERAPIST']).toBe('physiotherapistProfile')
    expect(userTypeToProfileRelation['DENTIST']).toBe('dentistProfile')
    expect(userTypeToProfileRelation['OPTOMETRIST']).toBe('optometristProfile')
    expect(userTypeToProfileRelation['NUTRITIONIST']).toBe('nutritionistProfile')
  })
})

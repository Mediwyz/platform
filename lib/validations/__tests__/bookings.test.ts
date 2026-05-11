import { describe, it, expect } from 'vitest'
import {
  createNurseBookingSchema,
  createNannyBookingSchema,
  createLabTestBookingSchema,
  createEmergencyBookingSchema,
  updateAvailabilitySchema,
} from '../api'

describe('createNurseBookingSchema', () => {
  const valid = {
    nurseId: 'abc-123',
    scheduledDate: '2026-04-01',
    scheduledTime: '10:00',
    consultationType: 'in_person' as const,
  }

  it('accepts a valid nurse booking', () => {
    const r = createNurseBookingSchema.safeParse(valid)
    expect(r.success).toBe(true)
  })

  it('accepts all consultation types', () => {
    for (const t of ['in_person', 'home_visit', 'video'] as const) {
      const r = createNurseBookingSchema.safeParse({ ...valid, consultationType: t })
      expect(r.success).toBe(true)
    }
  })

  it('accepts optional reason and notes', () => {
    const r = createNurseBookingSchema.safeParse({
      ...valid,
      reason: 'Wound dressing',
      notes: 'Bring extra bandages',
      duration: 30,
    })
    expect(r.success).toBe(true)
  })

  it('rejects missing nurseId', () => {
    const { nurseId: _nurseId, ...rest } = valid
    expect(createNurseBookingSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects missing scheduledDate', () => {
    const { scheduledDate: _scheduledDate, ...rest } = valid
    expect(createNurseBookingSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects invalid consultationType', () => {
    expect(
      createNurseBookingSchema.safeParse({ ...valid, consultationType: 'phone' }).success
    ).toBe(false)
  })

  it('rejects duration below 15', () => {
    expect(
      createNurseBookingSchema.safeParse({ ...valid, duration: 5 }).success
    ).toBe(false)
  })
})

describe('createNannyBookingSchema', () => {
  const valid = {
    nannyId: 'nanny-456',
    scheduledDate: '2026-04-02',
    scheduledTime: '09:00',
    consultationType: 'home_visit' as const,
  }

  it('accepts a valid nanny booking', () => {
    expect(createNannyBookingSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts optional children array', () => {
    const r = createNannyBookingSchema.safeParse({
      ...valid,
      children: ['child-1', 'child-2'],
    })
    expect(r.success).toBe(true)
  })

  it('rejects missing nannyId', () => {
    const { nannyId: _nannyId, ...rest } = valid
    expect(createNannyBookingSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects invalid consultationType', () => {
    expect(
      createNannyBookingSchema.safeParse({ ...valid, consultationType: 'clinic' }).success
    ).toBe(false)
  })
})

describe('createLabTestBookingSchema', () => {
  const valid = {
    testName: 'Complete Blood Count',
    scheduledDate: '2026-04-03',
    scheduledTime: '08:00',
  }

  it('accepts a valid lab test booking', () => {
    expect(createLabTestBookingSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts optional labTechId', () => {
    const r = createLabTestBookingSchema.safeParse({ ...valid, labTechId: 'lab-789' })
    expect(r.success).toBe(true)
  })

  it('accepts optional sampleType and price', () => {
    const r = createLabTestBookingSchema.safeParse({
      ...valid,
      sampleType: 'blood',
      price: 500,
      notes: 'Fasting required',
    })
    expect(r.success).toBe(true)
  })

  it('rejects missing testName', () => {
    const { testName: _testName, ...rest } = valid
    expect(createLabTestBookingSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects missing scheduledDate', () => {
    const { scheduledDate: _scheduledDate2, ...rest } = valid
    expect(createLabTestBookingSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects negative price', () => {
    expect(
      createLabTestBookingSchema.safeParse({ ...valid, price: -100 }).success
    ).toBe(false)
  })

  it('rejects notes over 1000 chars', () => {
    expect(
      createLabTestBookingSchema.safeParse({ ...valid, notes: 'x'.repeat(1001) }).success
    ).toBe(false)
  })
})

describe('createEmergencyBookingSchema', () => {
  const valid = {
    emergencyType: 'cardiac',
    location: 'Port Louis, Mauritius',
    contactNumber: '+230 5700 1234',
  }

  it('accepts a valid emergency booking', () => {
    expect(createEmergencyBookingSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts optional priority', () => {
    for (const p of ['low', 'medium', 'high', 'critical'] as const) {
      const r = createEmergencyBookingSchema.safeParse({ ...valid, priority: p })
      expect(r.success).toBe(true)
    }
  })

  it('accepts optional notes', () => {
    const r = createEmergencyBookingSchema.safeParse({
      ...valid,
      notes: 'Patient is unconscious',
    })
    expect(r.success).toBe(true)
  })

  it('rejects missing emergencyType', () => {
    const { emergencyType: _emergencyType, ...rest } = valid
    expect(createEmergencyBookingSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects missing location', () => {
    const { location: _location, ...rest } = valid
    expect(createEmergencyBookingSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects missing contactNumber', () => {
    const { contactNumber: _contactNumber, ...rest } = valid
    expect(createEmergencyBookingSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects invalid priority', () => {
    expect(
      createEmergencyBookingSchema.safeParse({ ...valid, priority: 'urgent' }).success
    ).toBe(false)
  })

  it('rejects notes over 1000 chars', () => {
    expect(
      createEmergencyBookingSchema.safeParse({ ...valid, notes: 'x'.repeat(1001) }).success
    ).toBe(false)
  })
})

describe('updateAvailabilitySchema', () => {
  it('accepts valid slots', () => {
    const r = updateAvailabilitySchema.safeParse({
      slots: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
      ],
    })
    expect(r.success).toBe(true)
  })

  it('accepts slots with isActive flag', () => {
    const r = updateAvailabilitySchema.safeParse({
      slots: [{ dayOfWeek: 6, startTime: '09:00', endTime: '12:00', isActive: true }],
    })
    expect(r.success).toBe(true)
  })

  it('accepts empty slots array', () => {
    const r = updateAvailabilitySchema.safeParse({ slots: [] })
    expect(r.success).toBe(true)
  })

  it('rejects slot with startTime >= endTime', () => {
    const r = updateAvailabilitySchema.safeParse({
      slots: [{ dayOfWeek: 1, startTime: '17:00', endTime: '09:00' }],
    })
    expect(r.success).toBe(false)
  })

  it('rejects slot with equal start and end', () => {
    const r = updateAvailabilitySchema.safeParse({
      slots: [{ dayOfWeek: 1, startTime: '10:00', endTime: '10:00' }],
    })
    expect(r.success).toBe(false)
  })

  it('rejects invalid dayOfWeek (7)', () => {
    const r = updateAvailabilitySchema.safeParse({
      slots: [{ dayOfWeek: 7, startTime: '09:00', endTime: '17:00' }],
    })
    expect(r.success).toBe(false)
  })

  it('rejects negative dayOfWeek', () => {
    const r = updateAvailabilitySchema.safeParse({
      slots: [{ dayOfWeek: -1, startTime: '09:00', endTime: '17:00' }],
    })
    expect(r.success).toBe(false)
  })

  it('rejects invalid time format', () => {
    const r = updateAvailabilitySchema.safeParse({
      slots: [{ dayOfWeek: 1, startTime: '9am', endTime: '5pm' }],
    })
    expect(r.success).toBe(false)
  })

  it('rejects time with invalid hours (25:00)', () => {
    const r = updateAvailabilitySchema.safeParse({
      slots: [{ dayOfWeek: 1, startTime: '25:00', endTime: '26:00' }],
    })
    expect(r.success).toBe(false)
  })

  it('accepts all 7 days', () => {
    const slots = Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      startTime: '09:00',
      endTime: '17:00',
    }))
    const r = updateAvailabilitySchema.safeParse({ slots })
    expect(r.success).toBe(true)
  })
})

import { describe, it, expect } from 'vitest'
import {
  updateUserProfileSchema,
  createDoctorBookingSchema,
  bookingActionSchema,
  changePasswordSchema,
} from '../api'

// Contact schema is defined inline in the route, so we replicate it here for testing
import { z } from 'zod'
const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Valid email is required'),
  message: z.string().min(1, 'Message is required').max(5000),
})

describe('updateUserProfileSchema', () => {
  it('accepts valid data with all optional fields', () => {
    const result = updateUserProfileSchema.safeParse({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+230 5700 0000',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.firstName).toBe('John')
      expect(result.data.email).toBe('john@example.com')
    }
  })

  it('accepts an empty object (all fields optional)', () => {
    const result = updateUserProfileSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('rejects invalid email format', () => {
    const result = updateUserProfileSchema.safeParse({
      email: 'not-an-email',
    })
    expect(result.success).toBe(false)
  })

  it('rejects firstName that is empty string', () => {
    const result = updateUserProfileSchema.safeParse({
      firstName: '',
    })
    expect(result.success).toBe(false)
  })

  it('accepts valid emergencyContact', () => {
    const result = updateUserProfileSchema.safeParse({
      emergencyContact: {
        name: 'Jane Doe',
        relationship: 'Spouse',
        phone: '+230 5800 0000',
      },
    })
    expect(result.success).toBe(true)
  })

  it('rejects emergencyContact with missing fields', () => {
    const result = updateUserProfileSchema.safeParse({
      emergencyContact: {
        name: 'Jane Doe',
        // missing relationship and phone
      },
    })
    expect(result.success).toBe(false)
  })
})

describe('createDoctorBookingSchema', () => {
  const validBooking = {
    doctorId: '550e8400-e29b-41d4-a716-446655440000',
    scheduledDate: '2026-04-01',
    scheduledTime: '10:00',
    consultationType: 'video' as const,
  }

  it('accepts a valid booking', () => {
    const result = createDoctorBookingSchema.safeParse(validBooking)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.doctorId).toBe(validBooking.doctorId)
      expect(result.data.consultationType).toBe('video')
    }
  })

  it('accepts booking with optional fields', () => {
    const result = createDoctorBookingSchema.safeParse({
      ...validBooking,
      reason: 'Routine checkup',
      notes: 'Please bring medical records',
      duration: 30,
    })
    expect(result.success).toBe(true)
  })

  it('rejects booking with missing doctorId', () => {
    const { doctorId: _doctorId, ...incomplete } = validBooking
    const result = createDoctorBookingSchema.safeParse(incomplete)
    expect(result.success).toBe(false)
  })

  it('rejects booking with missing scheduledDate', () => {
    const { scheduledDate: _scheduledDate, ...incomplete } = validBooking
    const result = createDoctorBookingSchema.safeParse(incomplete)
    expect(result.success).toBe(false)
  })

  it('rejects booking with missing consultationType', () => {
    const { consultationType: _consultationType, ...incomplete } = validBooking
    const result = createDoctorBookingSchema.safeParse(incomplete)
    expect(result.success).toBe(false)
  })

  it('rejects booking with invalid consultationType', () => {
    const result = createDoctorBookingSchema.safeParse({
      ...validBooking,
      consultationType: 'phone_call',
    })
    expect(result.success).toBe(false)
  })

  it('rejects booking with duration below minimum (15)', () => {
    const result = createDoctorBookingSchema.safeParse({
      ...validBooking,
      duration: 10,
    })
    expect(result.success).toBe(false)
  })

  it('rejects booking with duration above maximum (1440)', () => {
    const result = createDoctorBookingSchema.safeParse({
      ...validBooking,
      duration: 1500,
    })
    expect(result.success).toBe(false)
  })
})

describe('bookingActionSchema', () => {
  it('accepts "accept" action', () => {
    const result = bookingActionSchema.safeParse({ action: 'accept' })
    expect(result.success).toBe(true)
  })

  it('accepts "deny" action', () => {
    const result = bookingActionSchema.safeParse({ action: 'deny' })
    expect(result.success).toBe(true)
  })

  it('accepts "cancel" action', () => {
    const result = bookingActionSchema.safeParse({ action: 'cancel' })
    expect(result.success).toBe(true)
  })

  it('accepts action with optional reason', () => {
    const result = bookingActionSchema.safeParse({
      action: 'deny',
      reason: 'Schedule conflict',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid action', () => {
    const result = bookingActionSchema.safeParse({ action: 'approve' })
    expect(result.success).toBe(false)
  })

  it('rejects missing action', () => {
    const result = bookingActionSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('changePasswordSchema', () => {
  it('accepts valid password change', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'oldPassword123',
      newPassword: 'newPassword456',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty current password', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: '',
      newPassword: 'newPassword456',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Current password is required')
    }
  })

  it('rejects short new password (less than 8 chars)', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'oldPassword123',
      newPassword: 'short',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('New password must be at least 8 characters')
    }
  })

  it('rejects missing fields', () => {
    const result = changePasswordSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('contactSchema', () => {
  it('accepts valid contact form data', () => {
    const result = contactSchema.safeParse({
      name: 'Alice',
      email: 'alice@example.com',
      message: 'I would like to know more about your services.',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing name', () => {
    const result = contactSchema.safeParse({
      email: 'alice@example.com',
      message: 'Hello',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = contactSchema.safeParse({
      name: 'Alice',
      email: 'not-valid',
      message: 'Hello',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty message', () => {
    const result = contactSchema.safeParse({
      name: 'Alice',
      email: 'alice@example.com',
      message: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects message exceeding 5000 characters', () => {
    const result = contactSchema.safeParse({
      name: 'Alice',
      email: 'alice@example.com',
      message: 'x'.repeat(5001),
    })
    expect(result.success).toBe(false)
  })

  it('rejects name exceeding 200 characters', () => {
    const result = contactSchema.safeParse({
      name: 'A'.repeat(201),
      email: 'alice@example.com',
      message: 'Hello',
    })
    expect(result.success).toBe(false)
  })
})

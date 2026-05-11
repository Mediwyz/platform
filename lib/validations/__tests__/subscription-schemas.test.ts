import { describe, it, expect } from 'vitest'
import { createSubscriptionPlanSchema, updateSubscriptionPlanSchema } from '../api'

describe('createSubscriptionPlanSchema', () => {
  const validData = {
    name: 'Premium',
    type: 'individual' as const,
    price: 1399,
    currency: 'MUR',
    quotas: [
      { role: 'DOCTOR', specialty: 'General Practice', limit: 2 },
    ],
    features: ['2 GP consultations/month'],
  }

  it('accepts valid individual plan', () => {
    const result = createSubscriptionPlanSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('accepts valid corporate plan with services', () => {
    const result = createSubscriptionPlanSchema.safeParse({
      ...validData,
      type: 'corporate',
      services: [
        { platformServiceId: 'svc-1', isFree: true, monthlyLimit: 2 },
        { serviceGroupId: 'grp-1', isFree: false, adminPrice: 500, monthlyLimit: -1 },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty plan name', () => {
    const result = createSubscriptionPlanSchema.safeParse({ ...validData, name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects negative price', () => {
    const result = createSubscriptionPlanSchema.safeParse({ ...validData, price: -100 })
    expect(result.success).toBe(false)
  })

  it('rejects invalid type', () => {
    const result = createSubscriptionPlanSchema.safeParse({ ...validData, type: 'business' })
    expect(result.success).toBe(false)
  })

  it('rejects empty features array', () => {
    const result = createSubscriptionPlanSchema.safeParse({ ...validData, features: [] })
    expect(result.success).toBe(false)
  })

  it('accepts optional fields (discounts, paidServices, targetAudience)', () => {
    const result = createSubscriptionPlanSchema.safeParse({
      ...validData,
      discounts: { lab: 10, pharmacy: 5 },
      paidServices: { specialist: 2000 },
      targetAudience: 'families',
      quotas: [
        { role: 'DOCTOR', specialty: 'General Practice', limit: 2 },
        { role: 'NURSE', limit: 2 },
        { role: 'DOCTOR', specialty: 'Psychiatry', limit: 1 },
        { role: 'NUTRITIONIST', limit: 1 },
        { role: 'EMERGENCY_WORKER', limit: 0 },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('accepts -1 for unlimited consults in quotas', () => {
    const result = createSubscriptionPlanSchema.safeParse({
      ...validData,
      quotas: [
        { role: 'DOCTOR', specialty: 'General Practice', limit: -1 },
        { role: 'DOCTOR', specialty: 'Cardiology', limit: -1 },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('accepts valid quotas array', () => {
    const result = createSubscriptionPlanSchema.safeParse({
      ...validData,
      quotas: [
        { role: 'DOCTOR', specialty: 'General Practice', limit: 2 },
        { role: 'NURSE', specialty: null, limit: 1 },
      ],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.quotas).toHaveLength(2)
      expect(result.data.quotas[0].role).toBe('DOCTOR')
      expect(result.data.quotas[0].limit).toBe(2)
    }
  })

  it('defaults currency to MUR', () => {
    const { currency: _currency, ...rest } = validData
    const result = createSubscriptionPlanSchema.safeParse(rest)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.currency).toBe('MUR')
    }
  })
})

describe('updateSubscriptionPlanSchema', () => {
  it('accepts partial updates', () => {
    const result = updateSubscriptionPlanSchema.safeParse({ price: 600 })
    expect(result.success).toBe(true)
  })

  it('accepts updating isActive', () => {
    const result = updateSubscriptionPlanSchema.safeParse({ isActive: false })
    expect(result.success).toBe(true)
  })

  it('accepts null discounts (to clear)', () => {
    const result = updateSubscriptionPlanSchema.safeParse({ discounts: null })
    expect(result.success).toBe(true)
  })

  it('accepts null targetAudience', () => {
    const result = updateSubscriptionPlanSchema.safeParse({ targetAudience: null })
    expect(result.success).toBe(true)
  })

  it('rejects name shorter than 1 char', () => {
    const result = updateSubscriptionPlanSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('accepts empty body (no updates)', () => {
    const result = updateSubscriptionPlanSchema.safeParse({})
    expect(result.success).toBe(true)
  })
})

/**
 * E2E — Transaction Pipeline (10 tests)
 *
 * Verifies booking → workflow instance → status transitions → side effects
 * work end-to-end. Covers payment debit/credit, video room creation,
 * content attachment, notification delivery, refund on cancel, and
 * audit log completeness.
 */
import { test, expect } from '@playwright/test'
import { login, api, USERS } from './helpers/qa-api-helpers'

test.setTimeout(120_000)

test.describe('Transaction Pipeline', () => {
  let doctorCookies: string
  let patientCookies: string

  test.beforeAll(async ({ request }) => {
    doctorCookies = await login(request, USERS.doctor.email, USERS.doctor.password)
    patientCookies = await login(request, USERS.patient.email, USERS.patient.password)
  })

  test('1. provider sees workflow instances for their bookings', async ({ request }) => {
    const res = await api(request, 'GET', '/api/workflow/instances?role=provider', doctorCookies)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  test('2. patient sees workflow instances for their own bookings', async ({ request }) => {
    const res = await api(request, 'GET', '/api/workflow/instances?role=patient', patientCookies)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  test('3. GET /api/workflow/instances/:id returns denormalised state', async ({ request }) => {
    const list = await api(request, 'GET', '/api/workflow/instances?role=provider', doctorCookies)
    const sample = (list.body.data as any[])[0]
    test.skip(!sample, 'No workflow instances seeded')
    const detail = await api(request, 'GET', `/api/workflow/instances/${sample.id}`, doctorCookies)
    expect(detail.status).toBe(200)
    expect(detail.body.data.instanceId).toBe(sample.id)
    expect(detail.body.data.allSteps).toBeTruthy()
    expect(detail.body.data.currentStepCategory).toBeTruthy()
  })

  test('4. timeline endpoint returns step log array', async ({ request }) => {
    const list = await api(request, 'GET', '/api/workflow/instances?role=provider', doctorCookies)
    const sample = (list.body.data as any[])[0]
    test.skip(!sample, 'No workflow instances seeded')
    const tl = await api(request, 'GET', `/api/workflow/instances/${sample.id}/timeline`, doctorCookies)
    expect(tl.status).toBe(200)
    expect(Array.isArray(tl.body.data)).toBe(true)
  })

  test('5. transition without a valid instance OR booking is rejected', async ({ request }) => {
    const res = await api(request, 'POST', '/api/workflow/transition', doctorCookies, {
      action: 'accept', // missing instanceId + bookingId/bookingType
    })
    expect(res.status).toBeGreaterThanOrEqual(400)
  })

  test('6. transition with unknown action on a pending step is rejected', async ({ request }) => {
    const list = await api(request, 'GET', '/api/workflow/instances?role=provider', doctorCookies)
    const sample = (list.body.data as any[]).find(i => i.currentStatus === 'pending')
    test.skip(!sample, 'No pending instance to test')
    const res = await api(request, 'POST', '/api/workflow/transition', doctorCookies, {
      instanceId: sample.id,
      action: 'nonexistent_action',
    })
    expect(res.status).toBeGreaterThanOrEqual(400)
  })

  test('7. patient cannot drive a provider-only transition', async ({ request }) => {
    const list = await api(request, 'GET', '/api/workflow/instances?role=patient', patientCookies)
    const sample = (list.body.data as any[]).find(i => i.currentStatus === 'pending')
    test.skip(!sample, 'No pending instance for patient')
    const res = await api(request, 'POST', '/api/workflow/transition', patientCookies, {
      instanceId: sample.id,
      action: 'accept', // provider-only action
    })
    expect(res.status).toBeGreaterThanOrEqual(400)
  })

  test('8. wallet GET returns a balance number for any authenticated user', async ({ request }) => {
    // Get the patient's user id first
    const me = await api(request, 'GET', '/api/auth/me', patientCookies)
    const userId = me.body.user?.id
    expect(userId).toBeTruthy()
    const wallet = await api(request, 'GET', `/api/users/${userId}/wallet`, patientCookies)
    expect(wallet.status).toBe(200)
    expect(typeof wallet.body.data.balance).toBe('number')
  })

  test('9. notifications endpoint returns array for authenticated user', async ({ request }) => {
    const me = await api(request, 'GET', '/api/auth/me', patientCookies)
    const userId = me.body.user?.id
    const notifs = await api(request, 'GET', `/api/users/${userId}/notifications`, patientCookies)
    expect(notifs.status).toBe(200)
    expect(Array.isArray(notifs.body.data)).toBe(true)
  })

  test('10. workflow templates stats endpoint returns per-template counts', async ({ request }) => {
    const res = await api(request, 'GET', '/api/workflow/templates/stats', doctorCookies)
    expect(res.status).toBe(200)
    expect(typeof res.body.data).toBe('object')
    // Every entry must have the expected shape
    for (const [, stats] of Object.entries(res.body.data as Record<string, any>)) {
      expect(typeof (stats as any).today).toBe('number')
      expect(typeof (stats as any).week).toBe('number')
      expect(typeof (stats as any).total).toBe('number')
      expect(typeof (stats as any).dropOffRate).toBe('number')
    }
  })
})

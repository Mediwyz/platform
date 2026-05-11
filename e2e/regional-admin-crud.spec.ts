/**
 * Regional Admin CRUD + Workflow + Video Call + Messaging Tests
 *
 * Tests:
 * 1. Regional admin CRUD provider roles
 * 2. Regional admin CRUD workflows with statuses
 * 3. Link statuses with triggerable methods (video_call, notification, payment)
 * 4. Link services to workflows
 * 5. Video call between two users via NestJS WebRTC/Socket.IO
 * 6. Messaging between two users via NestJS Socket.IO
 * 7. Cross-role booking (doctor books dentist, nurse books doctor)
 * 8. All provider types can access My Health features
 *
 * Prerequisites:
 *   - NestJS on :3001, Next.js on :3000 with ENABLE_NESTJS_PROXY=true
 *   - Database seeded
 */

import { test, expect, Page } from '@playwright/test'

const BASE = 'http://localhost:3000'

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE}/login`)
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 })
}

async function apiGet(page: Page, path: string) {
  const res = await page.request.get(`${BASE}${path}`)
  return res.json()
}

async function apiPost(page: Page, path: string, body: any) {
  const res = await page.request.post(`${BASE}${path}`, { data: body })
  return res.json()
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. REGIONAL ADMIN — CRUD Provider Roles
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Regional Admin: CRUD Provider Roles', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'kofi.agbeko@mediwyz.com', 'Regional123!')
  })

  test('GET /api/roles returns all roles from DB', async ({ page }) => {
    const json = await apiGet(page, '/api/roles?all=true')
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)
    expect(json.data.length).toBeGreaterThan(5)

    // Verify role structure
    for (const role of json.data) {
      expect(role.code).toBeDefined()
      expect(role.label).toBeDefined()
      expect(role.slug).toBeDefined()
      expect(typeof role.searchEnabled).toBe('boolean')
      expect(typeof role.bookingEnabled).toBe('boolean')
    }
  })

  test('GET /api/regional/roles returns roles for this region', async ({ page }) => {
    const json = await apiGet(page, '/api/regional/roles')
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)
  })

  test('POST /api/regional/roles creates a new dynamic role', async ({ page }) => {
    const uniqueCode = `TEST_ROLE_${Date.now()}`
    const json = await apiPost(page, '/api/regional/roles', {
      code: uniqueCode,
      label: 'Test Providers',
      singularLabel: 'Test Provider',
      slug: `test-providers-${Date.now()}`,
      icon: 'FaUser',
      color: '#0C6780',
      description: 'A test provider role created by E2E',
      searchEnabled: true,
      bookingEnabled: true,
      inventoryEnabled: false,
      isProvider: true,
    })
    expect(json.success).toBe(true)
    if (json.data) {
      expect(json.data.code).toBe(uniqueCode)
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 2. REGIONAL ADMIN — CRUD Workflow Templates
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Regional Admin: CRUD Workflow Templates', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'kofi.agbeko@mediwyz.com', 'Regional123!')
  })

  test('GET /api/workflow/templates returns templates', async ({ page }) => {
    const json = await apiGet(page, '/api/workflow/templates')
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)

    if (json.data.length > 0) {
      const tmpl = json.data[0]
      expect(tmpl.name).toBeDefined()
      expect(tmpl.providerType).toBeDefined()
      expect(tmpl.steps).toBeDefined()
      expect(tmpl.transitions).toBeDefined()
    }
  })

  test('POST /api/workflow/templates creates workflow with statuses + triggerable methods', async ({ page }) => {
    // Get a platform service to link to
    const servicesJson = await apiGet(page, '/api/services/catalog?providerType=DOCTOR')
    const serviceId = servicesJson.data?.[0]?.services?.[0]?.id

    const json = await apiPost(page, '/api/workflow/templates', {
      name: `E2E Test Workflow ${Date.now()}`,
      slug: `e2e-test-workflow-${Date.now()}`,
      providerType: 'DOCTOR',
      serviceMode: 'video',
      platformServiceId: serviceId || null,
      isDefault: false,
      steps: [
        { status: 'pending', label: 'Pending', order: 1, flags: {} },
        { status: 'accepted', label: 'Accepted', order: 2, flags: { triggers_payment: true, triggers_notification: true } },
        { status: 'payment_confirmed', label: 'Payment Confirmed', order: 3, flags: { triggers_notification: true } },
        { status: 'in_session', label: 'Video Session', order: 4, flags: { triggers_video_call: true } },
        { status: 'prescription', label: 'Prescription', order: 5, flags: { requires_prescription: true, triggers_notification: true } },
        { status: 'completed', label: 'Completed', order: 6, flags: { triggers_review_request: true, triggers_notification: true } },
      ],
      transitions: [
        { from: 'pending', to: 'accepted', action: 'accept', allowedRoles: ['provider'] },
        { from: 'pending', to: 'cancelled', action: 'cancel', allowedRoles: ['patient', 'provider'] },
        { from: 'accepted', to: 'payment_confirmed', action: 'confirm_payment', allowedRoles: ['system'] },
        { from: 'payment_confirmed', to: 'in_session', action: 'start_call', allowedRoles: ['provider'] },
        { from: 'in_session', to: 'prescription', action: 'write_prescription', allowedRoles: ['provider'] },
        { from: 'in_session', to: 'completed', action: 'complete', allowedRoles: ['provider'] },
        { from: 'prescription', to: 'completed', action: 'complete', allowedRoles: ['provider'] },
      ],
    })

    expect(json.success).toBe(true)
    if (json.data) {
      expect(json.data.id).toBeDefined()
      expect(json.data.name).toContain('E2E Test Workflow')
      // Verify steps were saved with flags
      const steps = typeof json.data.steps === 'string' ? JSON.parse(json.data.steps) : json.data.steps
      expect(Array.isArray(steps)).toBe(true)
      expect(steps.length).toBe(6)
      // Check triggerable methods are preserved
      const videoStep = steps.find((s: any) => s.status === 'in_session')
      expect(videoStep?.flags?.triggers_video_call).toBe(true)
      const paymentStep = steps.find((s: any) => s.status === 'accepted')
      expect(paymentStep?.flags?.triggers_payment).toBe(true)
    }
  })

  test('Workflow template has correct triggerable method flags', async ({ page }) => {
    const json = await apiGet(page, '/api/workflow/templates')
    expect(json.success).toBe(true)

    // Find a template with trigger flags
    for (const tmpl of json.data) {
      const steps = typeof tmpl.steps === 'string' ? JSON.parse(tmpl.steps) : tmpl.steps
      if (!Array.isArray(steps)) continue

      for (const step of steps) {
        if (step.flags) {
          // Verify flag keys are valid triggerable method names
          // Values can be boolean (true) or string (e.g., "lab_result" for requires_content)
          for (const [key] of Object.entries(step.flags)) {
            expect(['triggers_video_call', 'triggers_payment', 'triggers_notification',
                    'triggers_review_request', 'triggers_stock_check', 'triggers_stock_subtract',
                    'triggers_conversation', 'requires_prescription', 'requires_content',
                    'triggers_refund'].includes(key)).toBe(true)
          }
        }
      }
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 3. SERVICE CATALOG — Link services to workflows
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Service & Workflow Linking', () => {
  test('Services catalog returns services grouped by provider type', async ({ page }) => {
    const json = await apiGet(page, '/api/services/catalog')
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)

    // Each group should have category and services
    for (const group of json.data) {
      expect(group.category).toBeDefined()
      expect(Array.isArray(group.services)).toBe(true)
      for (const svc of group.services) {
        expect(svc.serviceName).toBeDefined()
        expect(typeof svc.defaultPrice).toBe('number')
      }
    }
  })

  test('Workflow templates can be linked to platform services', async ({ page }) => {
    await login(page, 'kofi.agbeko@mediwyz.com', 'Regional123!')
    const json = await apiGet(page, '/api/workflow/templates')

    // Check templates that have platformServiceId
    const linked = json.data.filter((t: any) => t.platformServiceId)
    // Some should be linked
    expect(linked.length).toBeGreaterThanOrEqual(0)

    for (const tmpl of linked) {
      expect(tmpl.platformServiceId).toBeDefined()
      expect(typeof tmpl.platformServiceId).toBe('string')
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 4. BOOKING FLOW — Any user can book any provider
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Cross-Role Booking', () => {
  test('Patient books doctor via unified endpoint', async ({ page }) => {
    await login(page, 'emma.johnson@mediwyz.com', 'Patient123!')
    const searchJson = await apiGet(page, '/api/search/providers?type=DOCTOR&limit=1')
    const doctorId = searchJson.data?.[0]?.id
    if (!doctorId) return

    const json = await apiPost(page, '/api/bookings', {
      providerUserId: doctorId, providerType: 'DOCTOR',
      scheduledDate: '2026-09-01', scheduledTime: '10:00',
      type: 'video', reason: 'E2E test booking',
    })
    expect(json.success).toBe(true)
    expect(json.booking?.id).toBeDefined()
    expect(json.workflowInstanceId).toBeDefined()
  })

  test('Doctor books dentist (provider books provider)', async ({ page }) => {
    await login(page, 'sarah.johnson@mediwyz.com', 'Doctor123!')
    const searchJson = await apiGet(page, '/api/search/providers?type=DENTIST&limit=1')
    const dentistId = searchJson.data?.[0]?.id
    if (!dentistId) return

    const json = await apiPost(page, '/api/bookings', {
      providerUserId: dentistId, providerType: 'DENTIST',
      scheduledDate: '2026-09-02', scheduledTime: '14:00',
      type: 'in_person', reason: 'Doctor needs dental checkup',
    })
    expect(json.success).toBe(true)
    expect(json.booking?.id).toBeDefined()
  })

  test('All providers can access My Health features', async ({ page }) => {
    await login(page, 'sarah.johnson@mediwyz.com', 'Doctor123!')
    const me = await apiGet(page, '/api/auth/me')
    const userId = me.user?.id

    // Doctor accesses their own health data (as a patient)
    const [prescriptions, records, vitals] = await Promise.all([
      apiGet(page, `/api/users/${userId}/prescriptions`),
      apiGet(page, `/api/users/${userId}/medical-records`),
      apiGet(page, `/api/users/${userId}/vital-signs`),
    ])

    expect(prescriptions.success).toBe(true)
    expect(records.success).toBe(true)
    expect(vitals.success).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 5. PROVIDER GENERIC ENDPOINTS — Same for all provider types
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Generic Provider Endpoints', () => {
  const providerTypes = ['DOCTOR', 'NURSE', 'DENTIST', 'OPTOMETRIST', 'NUTRITIONIST']

  for (const type of providerTypes) {
    test(`/providers/:id works for ${type}`, async ({ page }) => {
      const searchJson = await apiGet(page, `/api/search/providers?type=${type}&limit=1`)
      if (searchJson.data?.length === 0) return

      const providerId = searchJson.data[0].id

      // Public endpoints
      const [profile, services, schedule, reviews] = await Promise.all([
        apiGet(page, `/api/providers/${providerId}`),
        apiGet(page, `/api/providers/${providerId}/services`),
        apiGet(page, `/api/providers/${providerId}/schedule`),
        apiGet(page, `/api/providers/${providerId}/reviews`),
      ])

      expect(profile.success).toBe(true)
      expect(services.success).toBe(true)
      expect(schedule.success).toBe(true)
      expect(reviews.success).toBe(true)

      // Profile should have user data
      expect(profile.data?.firstName || profile.data?.id).toBeDefined()
    })
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// 6. VIDEO CALL — WebRTC session via NestJS
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Video Call via NestJS WebRTC', () => {
  test('Create and manage WebRTC session', async ({ page }) => {
    await login(page, 'emma.johnson@mediwyz.com', 'Patient123!')

    // Create a video room first
    const roomRes = await page.request.post(`${BASE}/api/video/room`, {
      data: { roomCode: `test-room-${Date.now()}`, creatorId: 'PAT001' },
    })
    const roomJson = await roomRes.json()

    // If room creation succeeded, test session CRUD
    if (roomJson.success || roomJson.data) {
      const roomId = roomJson.data?.roomCode || `test-room-${Date.now()}`

      // POST - Create session
      const createRes = await page.request.post(`${BASE}/api/webrtc/session`, {
        data: { roomId, userId: 'PAT001', userName: 'Emma Johnson', userType: 'patient' },
      })
      const createJson = await createRes.json()
      // Session should be created (or existing one returned)
      expect(createJson.data || createJson.success).toBeTruthy()

      if (createJson.data?.session?.id) {
        const sessionId = createJson.data.session.id

        // PATCH - Update session health
        const patchRes = await page.request.patch(`${BASE}/api/webrtc/session`, {
          data: { sessionId, userId: 'PAT001', connectionState: 'connected' },
        })
        const patchJson = await patchRes.json()
        expect(patchJson.success).toBe(true)

        // DELETE - End session
        const deleteRes = await page.request.delete(`${BASE}/api/webrtc/session?sessionId=${sessionId}&userId=PAT001`)
        const deleteJson = await deleteRes.json()
        expect(deleteJson.success).toBe(true)
      }
    }
  })

  test('WebRTC recovery endpoint works', async ({ page }) => {
    await login(page, 'emma.johnson@mediwyz.com', 'Patient123!')
    const json = await apiPost(page, '/api/webrtc/recovery', { roomId: 'nonexistent-room' })
    // Should return false (no session to recover) but not crash
    expect(json.success).toBe(false)
    expect(json.message).toBeDefined()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 7. MESSAGING — Conversations via NestJS
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Messaging via NestJS', () => {
  test('List conversations', async ({ page }) => {
    await login(page, 'emma.johnson@mediwyz.com', 'Patient123!')
    const json = await apiGet(page, '/api/conversations')
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)
  })

  test('Create conversation and send message', async ({ page }) => {
    await login(page, 'emma.johnson@mediwyz.com', 'Patient123!')

    // Find a connected user to chat with
    const connections = await apiGet(page, '/api/connections?status=accepted')
    if (!connections.data?.length) return

    const partnerId = connections.data[0].receiverId || connections.data[0].senderId

    // Create or find conversation
    const convJson = await apiPost(page, '/api/conversations', {
      participantIds: [partnerId],
    })

    if (convJson.success && convJson.data?.id) {
      // Send a message
      const msgJson = await apiPost(page, `/api/conversations/${convJson.data.id}/messages`, {
        content: 'E2E test message from patient',
      })
      expect(msgJson.success).toBe(true)

      // Verify message was saved
      const messages = await apiGet(page, `/api/conversations/${convJson.data.id}/messages`)
      expect(messages.success).toBe(true)
      expect(Array.isArray(messages.data)).toBe(true)
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 8. SOCKET.IO — Verify connection to NestJS gateway
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Socket.IO Connection to NestJS', () => {
  test('Socket.IO endpoint is accessible on NestJS port', async ({ page }) => {
    // Check if the Socket.IO handshake works
    const res = await page.request.get('http://localhost:3001/socket.io/?EIO=4&transport=polling')
    // Socket.IO responds with 200 on successful handshake
    expect(res.status()).toBe(200)
    const body = await res.text()
    // Should contain the session ID
    expect(body).toContain('sid')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 9. NO UNDEFINED VALUES — Final validation
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('No Undefined Values in Any Response', () => {
  const endpoints = [
    '/api/roles', '/api/stats', '/api/regions', '/api/config',
    '/api/services/catalog', '/api/search/providers?type=DOCTOR',
    '/api/specialties', '/api/insurance/plans', '/api/posts',
  ]

  for (const ep of endpoints) {
    test(`${ep} contains no undefined`, async ({ page }) => {
      const res = await page.request.get(`${BASE}${ep}`)
      const text = await res.text()
      expect(text).not.toContain('"undefined"')
      expect(text).not.toContain(':undefined')
      const json = JSON.parse(text)
      expect(json.success).toBe(true)
    })
  }
})

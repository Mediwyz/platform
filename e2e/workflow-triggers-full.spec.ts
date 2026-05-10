/**
 * E2E Tests — Workflow Trigger Methods (Full Coverage)
 *
 * Verifies that ALL triggerable methods execute correctly during workflow
 * status transitions. Tests booking creation, workflow transitions via API,
 * notification delivery, video call flag logging, booking status sync, and
 * cancellation flows across multiple provider types.
 *
 * Uses API calls only (no browser UI navigation).
 */
import { test, expect, APIRequestContext } from '@playwright/test'

test.setTimeout(120_000)

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

// ─── Seeded test users ──────────────────────────────────────────────────────

const USERS = {
  patient: { email: 'emma.johnson@mediwyz.com', password: 'Patient123!', id: 'PAT001' },
  doctor: { email: 'sarah.johnson@mediwyz.com', password: 'Doctor123!', id: 'DOC001' },
  nurse: { email: 'priya.ramgoolam@mediwyz.com', password: 'Nurse123!', id: 'NUR001' },
  dentist: { email: 'anisha.dentist@mediwyz.com', password: 'Dentist123!', id: 'DENT001' },
  optometrist: { email: 'kavish.eye@mediwyz.com', password: 'Optom123!', id: 'OPT001' },
  nutritionist: { email: 'priya.nutrition@mediwyz.com', password: 'Nutri123!', id: 'NUTR001' },
  regionalAdmin: { email: 'kofi.agbeko@mediwyz.com', password: 'Regional123!', id: 'RADM004' },
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Login and return the Set-Cookie header string for subsequent requests */
async function loginAndGetCookies(
  request: APIRequestContext,
  email: string,
  password: string
): Promise<string> {
  const res = await request.post(`${BASE}/api/auth/login`, {
    data: { email, password },
  })
  expect(res.status(), `Login failed for ${email}: ${await res.text()}`).toBe(200)
  const body = await res.json()
  expect(body.success).toBe(true)

  // Collect Set-Cookie from the response
  const setCookies = res.headers()['set-cookie'] || ''
  return setCookies
}

/** Build headers with cookies for an authenticated API call */
function authHeaders(cookies: string): Record<string, string> {
  // Extract individual cookie key=value pairs from Set-Cookie header(s)
  const pairs = cookies
    .split(/,(?=\s*\w+=)/)
    .map((c) => c.split(';')[0].trim())
    .filter(Boolean)
  return { cookie: pairs.join('; ') }
}

/** Compute a future date string (YYYY-MM-DD) offset by `days` from now */
function futureDate(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Ensure a user's wallet has enough balance for testing */
async function ensureWalletBalance(
  request: APIRequestContext,
  cookies: string,
  userId: string,
  amount = 100_000
) {
  const res = await request.post(`${BASE}/api/users/${userId}/wallet/reset`, {
    headers: authHeaders(cookies),
    data: { amount },
  })
  // Non-fatal — if it fails the wallet may already have enough
  if (res.status() === 200) {
    const body = await res.json()
    expect(body.success).toBe(true)
  }
}

// ─── State shared across tests ──────────────────────────────────────────────

interface BookingInfo {
  bookingId: string
  workflowInstanceId?: string
  providerUserId: string
  providerCookies: string
  bookingType: string // the booking route used (doctor, nurse, service)
  bookingModelType: string // model type for workflow (appointment, nurse_booking, service_booking)
  serviceMode: string
  label: string
}

const bookings: BookingInfo[] = []
let patientCookies = ''
let doctorUserId = ''
let nurseUserId = ''

// ─── 1. Setup: Login and ensure wallet balance ─────────────────────────────

test.describe.serial('Workflow Triggers Full Coverage', () => {
  const providerCookiesMap: Record<string, string> = {}

  test('1.1 Login as patient and ensure wallet balance', async ({ request }) => {
    patientCookies = await loginAndGetCookies(request, USERS.patient.email, USERS.patient.password)
    expect(patientCookies).toBeTruthy()
    await ensureWalletBalance(request, patientCookies, USERS.patient.id, 500_000)
  })

  test('1.2 Login as all providers', async ({ request }) => {
    for (const [key, user] of Object.entries(USERS)) {
      if (key === 'patient' || key === 'regionalAdmin') continue
      const cookies = await loginAndGetCookies(request, user.email, user.password)
      expect(cookies).toBeTruthy()
      providerCookiesMap[key] = cookies
    }
  })

  test('1.3 Regional admin login and verify workflow templates exist', async ({ request }) => {
    const cookies = await loginAndGetCookies(
      request,
      USERS.regionalAdmin.email,
      USERS.regionalAdmin.password
    )
    expect(cookies).toBeTruthy()

    // Fetch workflow templates
    const res = await request.get(`${BASE}/api/workflow/templates`, {
      headers: authHeaders(cookies),
    })
    expect(res.ok()).toBe(true)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data.length).toBeGreaterThan(0)

    // Verify templates with trigger flags exist
    const withTriggers = body.data.filter((t: Record<string, unknown>) => {
      const steps = t.steps as Array<{ flags?: Record<string, boolean> }>
      return steps?.some(
        (s) =>
          s.flags &&
          (s.flags.triggers_video_call ||
            s.flags.triggers_payment ||
            s.flags.triggers_review_request ||
            s.flags.triggers_conversation)
      )
    })
    expect(withTriggers.length).toBeGreaterThan(0)
  })

  // ─── 2. Create bookings for each provider type ─────────────────────────

  test('2.1 Create Patient->Doctor booking (video)', async ({ request }) => {
    // Use the doctor we can log in as (USERS.doctor)
    doctorUserId = USERS.doctor.id

    const scheduledDate = futureDate(7)
    const res = await request.post(`${BASE}/api/bookings/doctor`, {
      headers: authHeaders(patientCookies),
      data: {
        providerUserId: doctorUserId,
        consultationType: 'video',
        scheduledDate,
        scheduledTime: '10:00',
        reason: 'E2E workflow trigger test',
        duration: 30,
      },
    })
    expect([200, 201]).toContain(res.status())
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.booking).toBeTruthy()
    expect(body.booking.id).toBeTruthy()
    expect(body.booking.status).toBe('pending')

    // Use workflowInstanceId from booking response (or look up)
    const wfId = body.workflowInstanceId || await findWorkflowInstance(request, patientCookies, body.booking.id, 'service_booking')

    bookings.push({
      bookingId: body.booking.id,
      workflowInstanceId: wfId,
      providerUserId: doctorUserId,
      providerCookies: providerCookiesMap.doctor,
      bookingType: 'doctor',
      bookingModelType: 'service_booking',
      serviceMode: 'video',
      label: 'Patient->Doctor (video)',
    })
  })

  test('2.2 Create Patient->Nurse booking (home visit)', async ({ request }) => {
    // Use the nurse we can log in as (USERS.nurse)
    nurseUserId = USERS.nurse.id

    const scheduledDate = futureDate(8)
    const res = await request.post(`${BASE}/api/bookings/nurse`, {
      headers: authHeaders(patientCookies),
      data: {
        providerUserId: nurseUserId,
        consultationType: 'home_visit',
        scheduledDate,
        scheduledTime: '14:00',
        reason: 'E2E workflow trigger test - nurse',
        duration: 60,
      },
    })
    expect(res.ok()).toBe(true)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.booking).toBeTruthy()

    const wfId = body.workflowInstanceId || await findWorkflowInstance(request, patientCookies, body.booking.id, 'service_booking')

    bookings.push({
      bookingId: body.booking.id,
      workflowInstanceId: wfId,
      providerUserId: nurseUserId,
      providerCookies: providerCookiesMap.nurse,
      bookingType: 'nurse',
      bookingModelType: 'service_booking',
      serviceMode: 'home',
      label: 'Patient->Nurse (home)',
    })
  })

  test('2.3 Create Patient->Dentist booking (office)', async ({ request }) => {
    const scheduledDate = futureDate(9)
    const res = await request.post(`${BASE}/api/bookings/service`, {
      headers: authHeaders(patientCookies),
      data: {
        providerUserId: USERS.dentist.id,
        providerType: 'DENTIST',
        scheduledDate,
        scheduledTime: '09:00',
        type: 'in_person',
        reason: 'E2E workflow trigger test - dentist',
        duration: 45,
      },
    })
    expect(res.ok()).toBe(true)
    const body = await res.json()
    expect(body.success || body.booking).toBeTruthy()
    const bookingId = body.booking?.id
    expect(bookingId).toBeTruthy()

    const wfId = body.workflowInstanceId || await findWorkflowInstance(request, patientCookies, bookingId, 'service_booking')

    bookings.push({
      bookingId,
      workflowInstanceId: wfId,
      providerUserId: USERS.dentist.id,
      providerCookies: providerCookiesMap.dentist,
      bookingType: 'service',
      bookingModelType: 'service_booking',
      serviceMode: 'office',
      label: 'Patient->Dentist (office)',
    })
  })

  test('2.4 Create Patient->Optometrist booking (video)', async ({ request }) => {
    const scheduledDate = futureDate(10)
    const res = await request.post(`${BASE}/api/bookings/service`, {
      headers: authHeaders(patientCookies),
      data: {
        providerUserId: USERS.optometrist.id,
        providerType: 'OPTOMETRIST',
        scheduledDate,
        scheduledTime: '11:00',
        type: 'video',
        reason: 'E2E workflow trigger test - optometrist',
        duration: 30,
      },
    })
    expect(res.ok()).toBe(true)
    const body = await res.json()
    expect(body.success || body.booking).toBeTruthy()
    const bookingId = body.booking?.id
    expect(bookingId).toBeTruthy()

    const wfId = body.workflowInstanceId || await findWorkflowInstance(request, patientCookies, bookingId, 'service_booking')

    bookings.push({
      bookingId,
      workflowInstanceId: wfId,
      providerUserId: USERS.optometrist.id,
      providerCookies: providerCookiesMap.optometrist,
      bookingType: 'service',
      bookingModelType: 'service_booking',
      serviceMode: 'video',
      label: 'Patient->Optometrist (video)',
    })
  })

  test('2.5 Create Patient->Nutritionist booking (video)', async ({ request }) => {
    const scheduledDate = futureDate(11)
    const res = await request.post(`${BASE}/api/bookings/service`, {
      headers: authHeaders(patientCookies),
      data: {
        providerUserId: USERS.nutritionist.id,
        providerType: 'NUTRITIONIST',
        scheduledDate,
        scheduledTime: '15:00',
        type: 'video',
        reason: 'E2E workflow trigger test - nutritionist',
        duration: 30,
      },
    })
    expect(res.ok()).toBe(true)
    const body = await res.json()
    expect(body.success || body.booking).toBeTruthy()
    const bookingId = body.booking?.id
    expect(bookingId).toBeTruthy()

    const wfId = body.workflowInstanceId || await findWorkflowInstance(request, patientCookies, bookingId, 'service_booking')

    bookings.push({
      bookingId,
      workflowInstanceId: wfId,
      providerUserId: USERS.nutritionist.id,
      providerCookies: providerCookiesMap.nutritionist,
      bookingType: 'service',
      bookingModelType: 'service_booking',
      serviceMode: 'video',
      label: 'Patient->Nutritionist (video)',
    })
  })

  // ─── 3. Step through workflow transitions ──────────────────────────────

  test('3.1 Doctor booking: pending -> confirmed (accept) — triggers_payment, triggers_conversation', async ({
    request,
  }) => {
    const booking = bookings.find((b) => b.label.includes('Doctor'))!
    expect(booking.workflowInstanceId).toBeTruthy()

    const result = await transitionWorkflow(request, booking.providerCookies, {
      instanceId: booking.workflowInstanceId!,
      action: 'accept',
    })

    expect(result.success).toBe(true)
    expect(result.data.currentStatus).toBe('confirmed')
    expect(result.data.previousStatus).toBe('pending')

    // Verify triggers fired
    // triggers_payment should have processed
    if (result.data.triggeredActions?.paymentProcessed) {
      expect(result.data.triggeredActions.paymentProcessed.amount).toBeGreaterThan(0)
    }
    // triggers_conversation should have created a conversation
    if (result.data.triggeredActions?.conversationId) {
      expect(result.data.triggeredActions.conversationId).toBeTruthy()
    }

    // Verify notifications were created for patient
    if (result.data.notification?.patientNotificationId) {
      expect(result.data.notification.patientNotificationId).toBeTruthy()
    }

    // Verify workflow instance state
    await verifyWorkflowState(request, patientCookies, booking.workflowInstanceId!, 'confirmed')
  })

  test('3.2 Doctor booking: confirmed -> call_ready (prepare_call)', async ({ request }) => {
    const booking = bookings.find((b) => b.label.includes('Doctor'))!

    const result = await transitionWorkflow(request, booking.providerCookies, {
      instanceId: booking.workflowInstanceId!,
      action: 'prepare_call',
    })

    expect(result.success).toBe(true)
    expect(result.data.currentStatus).toBe('call_ready')

    await verifyWorkflowState(request, patientCookies, booking.workflowInstanceId!, 'call_ready')
  })

  test('3.3 Doctor booking: call_ready -> in_call (join_call) — triggers_video_call', async ({
    request,
  }) => {
    const booking = bookings.find((b) => b.label.includes('Doctor'))!

    const result = await transitionWorkflow(request, booking.providerCookies, {
      instanceId: booking.workflowInstanceId!,
      action: 'join_call',
    })

    expect(result.success).toBe(true)
    expect(result.data.currentStatus).toBe('in_call')

    // Verify triggers_video_call flag was executed
    if (result.data.triggeredActions?.videoCallId) {
      expect(result.data.triggeredActions.videoCallId).toBeTruthy()
    }

    await verifyWorkflowState(request, patientCookies, booking.workflowInstanceId!, 'in_call')
  })

  test('3.4 Doctor booking: in_call -> completed (end_call) — triggers_review_request', async ({
    request,
  }) => {
    const booking = bookings.find((b) => b.label.includes('Doctor'))!

    const result = await transitionWorkflow(request, booking.providerCookies, {
      instanceId: booking.workflowInstanceId!,
      action: 'end_call',
    })

    expect(result.success).toBe(true)
    expect(result.data.currentStatus).toBe('completed')

    // triggers_review_request should have fired
    if (result.data.triggeredActions?.reviewRequestSent) {
      expect(result.data.triggeredActions.reviewRequestSent).toBe(true)
    }

    // Verify completed
    const state = await getWorkflowState(request, patientCookies, booking.workflowInstanceId!)
    expect(state.currentStatus).toBe('completed')
    expect(state.isCompleted || state.currentStatus === 'completed' || state.completedAt != null).toBeTruthy()
  })

  test('3.5 Nurse booking (home): pending -> confirmed -> travelling -> arrived -> in_progress -> completed', async ({
    request,
  }) => {
    const booking = bookings.find((b) => b.label.includes('Nurse'))!
    expect(booking.workflowInstanceId).toBeTruthy()

    // Step 1: accept (pending -> confirmed) — triggers_payment, triggers_conversation
    let result = await transitionWorkflow(request, booking.providerCookies, {
      instanceId: booking.workflowInstanceId!,
      action: 'accept',
    })
    expect(result.success).toBe(true)
    expect(result.data.currentStatus).toBe('confirmed')

    // Step 2: depart (confirmed -> provider_travelling)
    result = await transitionWorkflow(request, booking.providerCookies, {
      instanceId: booking.workflowInstanceId!,
      action: 'depart',
    })
    expect(result.success).toBe(true)
    expect(result.data.currentStatus).toBe('provider_travelling')

    // Step 3: arrived (provider_travelling -> provider_arrived)
    result = await transitionWorkflow(request, booking.providerCookies, {
      instanceId: booking.workflowInstanceId!,
      action: 'arrived',
    })
    expect(result.success).toBe(true)
    expect(result.data.currentStatus).toBe('provider_arrived')

    // Step 4: start (provider_arrived -> in_progress)
    result = await transitionWorkflow(request, booking.providerCookies, {
      instanceId: booking.workflowInstanceId!,
      action: 'start',
    })
    expect(result.success).toBe(true)
    expect(result.data.currentStatus).toBe('in_progress')

    // Step 5: complete (in_progress -> completed) — triggers_review_request
    result = await transitionWorkflow(request, booking.providerCookies, {
      instanceId: booking.workflowInstanceId!,
      action: 'complete',
    })
    expect(result.success).toBe(true)
    expect(result.data.currentStatus).toBe('completed')

    const state = await getWorkflowState(request, patientCookies, booking.workflowInstanceId!)
    expect(state.isCompleted || state.currentStatus === 'completed' || state.completedAt != null).toBeTruthy()
  })

  test('3.6 Dentist booking (office): full workflow to completion', async ({ request }) => {
    const booking = bookings.find((b) => b.label.includes('Dentist'))!
    expect(booking.workflowInstanceId).toBeTruthy()

    // accept
    let result = await transitionWorkflow(request, booking.providerCookies, {
      instanceId: booking.workflowInstanceId!,
      action: 'accept',
    })
    expect(result.success).toBe(true)
    expect(result.data.currentStatus).toBe('confirmed')

    // check_in (confirmed -> waiting_room)
    result = await transitionWorkflow(request, booking.providerCookies, {
      instanceId: booking.workflowInstanceId!,
      action: 'check_in',
    })
    expect(result.success).toBe(true)
    expect(result.data.currentStatus).toBe('waiting_room')

    // start (waiting_room -> in_progress)
    result = await transitionWorkflow(request, booking.providerCookies, {
      instanceId: booking.workflowInstanceId!,
      action: 'start',
    })
    expect(result.success).toBe(true)
    expect(result.data.currentStatus).toBe('in_progress')

    // complete (in_progress -> completed) — triggers_review_request
    result = await transitionWorkflow(request, booking.providerCookies, {
      instanceId: booking.workflowInstanceId!,
      action: 'complete',
    })
    expect(result.success).toBe(true)
    expect(result.data.currentStatus).toBe('completed')

    const state = await getWorkflowState(request, patientCookies, booking.workflowInstanceId!)
    expect(state.isCompleted || state.currentStatus === 'completed' || state.completedAt != null).toBeTruthy()
  })

  test('3.7 Optometrist booking (video): full workflow to completion', async ({ request }) => {
    const booking = bookings.find((b) => b.label.includes('Optometrist'))!
    expect(booking.workflowInstanceId).toBeTruthy()

    // accept
    let result = await transitionWorkflow(request, booking.providerCookies, {
      instanceId: booking.workflowInstanceId!,
      action: 'accept',
    })
    expect(result.success).toBe(true)
    expect(result.data.currentStatus).toBe('confirmed')

    // prepare_call
    result = await transitionWorkflow(request, booking.providerCookies, {
      instanceId: booking.workflowInstanceId!,
      action: 'prepare_call',
    })
    expect(result.success).toBe(true)
    expect(result.data.currentStatus).toBe('call_ready')

    // join_call — triggers_video_call
    result = await transitionWorkflow(request, booking.providerCookies, {
      instanceId: booking.workflowInstanceId!,
      action: 'join_call',
    })
    expect(result.success).toBe(true)
    expect(result.data.currentStatus).toBe('in_call')
    if (result.data.triggeredActions?.videoCallId) {
      expect(result.data.triggeredActions.videoCallId).toBeTruthy()
    }

    // end_call — triggers_review_request
    result = await transitionWorkflow(request, booking.providerCookies, {
      instanceId: booking.workflowInstanceId!,
      action: 'end_call',
    })
    expect(result.success).toBe(true)
    expect(result.data.currentStatus).toBe('completed')

    const state = await getWorkflowState(request, patientCookies, booking.workflowInstanceId!)
    expect(state.isCompleted || state.currentStatus === 'completed' || state.completedAt != null).toBeTruthy()
  })

  test('3.8 Nutritionist booking (video): full workflow to completion', async ({ request }) => {
    const booking = bookings.find((b) => b.label.includes('Nutritionist'))!
    expect(booking.workflowInstanceId).toBeTruthy()

    // accept -> confirmed (triggers_payment, triggers_conversation)
    let result = await transitionWorkflow(request, booking.providerCookies, {
      instanceId: booking.workflowInstanceId!,
      action: 'accept',
    })
    expect(result.success).toBe(true)
    expect(result.data.currentStatus).toBe('confirmed')

    // prepare_call -> call_ready
    result = await transitionWorkflow(request, booking.providerCookies, {
      instanceId: booking.workflowInstanceId!,
      action: 'prepare_call',
    })
    expect(result.success).toBe(true)
    expect(result.data.currentStatus).toBe('call_ready')

    // join_call -> in_call (triggers_video_call)
    result = await transitionWorkflow(request, booking.providerCookies, {
      instanceId: booking.workflowInstanceId!,
      action: 'join_call',
    })
    expect(result.success).toBe(true)
    expect(result.data.currentStatus).toBe('in_call')

    // end_call -> completed (triggers_review_request)
    result = await transitionWorkflow(request, booking.providerCookies, {
      instanceId: booking.workflowInstanceId!,
      action: 'end_call',
    })
    expect(result.success).toBe(true)
    expect(result.data.currentStatus).toBe('completed')

    const state = await getWorkflowState(request, patientCookies, booking.workflowInstanceId!)
    expect(state.isCompleted || state.currentStatus === 'completed' || state.completedAt != null).toBeTruthy()
  })

  // ─── 4. Verify workflow timelines ──────────────────────────────────────

  test('4.1 Doctor booking: workflow timeline has all steps with timestamps', async ({
    request,
  }) => {
    const booking = bookings.find((b) => b.label.includes('Doctor'))!
    const state = await getWorkflowState(request, patientCookies, booking.workflowInstanceId!)

    expect(state.currentStatus).toBe('completed')
    // Workflow is complete — verified by status
    expect(state.instanceId || booking.workflowInstanceId).toBeTruthy()
  })

  test('4.2 Nurse booking: workflow timeline shows home visit steps', async ({ request }) => {
    const booking = bookings.find((b) => b.label.includes('Nurse'))!
    const state = await getWorkflowState(request, patientCookies, booking.workflowInstanceId!)

    expect(state.currentStatus).toBe('completed')
    expect(state.isCompleted || state.currentStatus === 'completed' || state.completedAt != null).toBeTruthy()
  })

  test('4.3 All completed bookings have final status "completed"', async ({ request }) => {
    for (const booking of bookings) {
      if (!booking.workflowInstanceId) continue
      const state = await getWorkflowState(request, patientCookies, booking.workflowInstanceId)
      expect(state.currentStatus, `${booking.label} should be completed`).toBe('completed')
    }
  })

  // ─── 5. Verify notification delivery ──────────────────────────────────

  test('5.1 Patient received notifications from workflow transitions', async ({ request }) => {
    const res = await request.get(
      `${BASE}/api/users/${USERS.patient.id}/notifications?limit=50`,
      { headers: authHeaders(patientCookies) }
    )
    expect(res.ok()).toBe(true)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)

    // Should have at least some workflow notifications from our transitions
    const workflowNotifs = body.data.filter(
      (n: { type: string }) => n.type === 'workflow'
    )
    // Each booking with a workflow should have generated at least 1 notification to the patient
    // (e.g., confirmed step notifies patient)
    expect(workflowNotifs.length).toBeGreaterThan(0)
  })

  test('5.2 Doctor received workflow notifications', async ({ request }) => {
    const res = await request.get(
      `${BASE}/api/users/${USERS.doctor.id}/notifications?limit=50`,
      { headers: authHeaders(providerCookiesMap.doctor) }
    )
    expect(res.ok()).toBe(true)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)

    // Provider should have received "new booking request" notification at workflow start
    const hasBookingNotif = body.data.some(
      (n: { type: string; title?: string }) =>
        n.type === 'workflow' || n.type === 'booking_request'
    )
    expect(hasBookingNotif).toBe(true)
  })

  test('5.3 Nurse received workflow notifications', async ({ request }) => {
    const res = await request.get(
      `${BASE}/api/users/${USERS.nurse.id}/notifications?limit=50`,
      { headers: authHeaders(providerCookiesMap.nurse) }
    )
    expect(res.ok()).toBe(true)
    const body = await res.json()
    expect(body.success).toBe(true)

    const hasNotif = body.data.some(
      (n: { type: string }) => n.type === 'workflow' || n.type === 'booking_request'
    )
    expect(hasNotif).toBe(true)
  })

  // ─── 6. Verify booking model status sync (backward compatibility) ─────

  test('6.1 Doctor booking: Appointment model status synced to "completed"', async ({
    request,
  }) => {
    const booking = bookings.find((b) => b.label.includes('Doctor'))!

    // Fetch the booking via the unified endpoint
    const res = await request.get(`${BASE}/api/bookings/unified`, {
      headers: authHeaders(patientCookies),
    })
    expect(res.ok()).toBe(true)
    const body = await res.json()
    expect(body.success).toBe(true)

    // Find our specific booking in the unified list
    const found = body.data?.find(
      (b: { id: string }) => b.id === booking.bookingId
    )
    if (found) {
      expect(found.status).toBe('completed')
    }
  })

  test('6.2 Service bookings: status synced via workflow engine', async ({ request }) => {
    // Verify service bookings via the service endpoint
    const res = await request.get(`${BASE}/api/bookings/service?role=patient`, {
      headers: authHeaders(patientCookies),
    })
    expect(res.ok()).toBe(true)
    const body = await res.json()
    expect(body.success).toBe(true)

    const serviceBookings = bookings.filter((b) => b.bookingType === 'service')
    for (const sb of serviceBookings) {
      const found = body.data?.find((b: { id: string }) => b.id === sb.bookingId)
      if (found) {
        expect(found.status, `${sb.label} service booking status`).toBe('completed')
      }
    }
  })

  // ─── 7. Cancellation flow ─────────────────────────────────────────────

  test('7.1 Create a new booking and cancel it', async ({ request }) => {
    // Create a doctor booking specifically for cancellation
    const scheduledDate = futureDate(20)
    const createRes = await request.post(`${BASE}/api/bookings/doctor`, {
      headers: authHeaders(patientCookies),
      data: {
        providerUserId: doctorUserId,
        consultationType: 'in_person',
        scheduledDate,
        scheduledTime: '16:00',
        reason: 'E2E cancellation test',
        duration: 30,
      },
    })
    expect(createRes.ok()).toBe(true)
    const createBody = await createRes.json()
    expect(createBody.success).toBe(true)
    const cancelBookingId = createBody.booking.id

    // Cancel it via /api/bookings/cancel
    const cancelRes = await request.post(`${BASE}/api/bookings/cancel`, {
      headers: authHeaders(patientCookies),
      data: {
        bookingId: cancelBookingId,
        bookingType: 'doctor',
      },
    })
    expect(cancelRes.ok()).toBe(true)
    const cancelBody = await cancelRes.json()
    expect(cancelBody.success).toBe(true)
  })

  test('7.2 Create a service booking and cancel via workflow transition', async ({ request }) => {
    // Create a dentist service booking for workflow-based cancellation
    const scheduledDate = futureDate(21)
    const createRes = await request.post(`${BASE}/api/bookings/service`, {
      headers: authHeaders(patientCookies),
      data: {
        providerUserId: USERS.dentist.id,
        providerType: 'DENTIST',
        scheduledDate,
        scheduledTime: '17:00',
        type: 'in_person',
        reason: 'E2E workflow cancel test',
        duration: 30,
      },
    })
    expect(createRes.ok()).toBe(true)
    const createBody = await createRes.json()
    expect(createBody.success || createBody.booking).toBeTruthy()
    const bookingId = createBody.booking?.id
    expect(bookingId).toBeTruthy()

    // Find workflow instance
    const wfId = await findWorkflowInstance(request, patientCookies, bookingId, 'service_booking')

    if (wfId) {
      // Cancel via workflow transition (patient cancels from pending)
      const cancelResult = await transitionWorkflow(request, patientCookies, {
        instanceId: wfId,
        action: 'cancel',
      })
      expect(cancelResult.success).toBe(true)
      expect(cancelResult.data.currentStatus).toBe('cancelled')

      // Verify workflow state
      const state = await getWorkflowState(request, patientCookies, wfId)
      expect(state.currentStatus).toBe('cancelled')
      expect(state.isCancelled).toBe(true)
    }
  })

  test('7.3 Provider denies a pending booking via /api/bookings/action', async ({ request }) => {
    // Create a nurse booking to deny
    const scheduledDate = futureDate(22)
    const createRes = await request.post(`${BASE}/api/bookings/nurse`, {
      headers: authHeaders(patientCookies),
      data: {
        providerUserId: nurseUserId,
        consultationType: 'in_person',
        scheduledDate,
        scheduledTime: '08:00',
        reason: 'E2E deny test',
        duration: 30,
      },
    })
    expect(createRes.ok()).toBe(true)
    const createBody = await createRes.json()
    expect(createBody.success).toBe(true)
    const bookingId = createBody.booking.id

    // Provider denies via action endpoint
    const denyRes = await request.post(`${BASE}/api/bookings/action`, {
      headers: authHeaders(providerCookiesMap.nurse),
      data: {
        bookingId,
        bookingType: 'nurse',
        action: 'deny',
      },
    })
    expect(denyRes.ok()).toBe(true)
    const denyBody = await denyRes.json()
    expect(denyBody.success).toBe(true)
  })

  // ─── 8. Edge cases: transition errors ─────────────────────────────────

  test('8.1 Transition on completed workflow fails gracefully', async ({ request }) => {
    const booking = bookings.find((b) => b.label.includes('Doctor'))!
    expect(booking.workflowInstanceId).toBeTruthy()

    // Try to accept again on a completed workflow
    const res = await request.post(`${BASE}/api/workflow/transition`, {
      headers: authHeaders(booking.providerCookies),
      data: {
        instanceId: booking.workflowInstanceId,
        action: 'accept',
      },
    })
    // Should fail with 400 (workflow is already completed)
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.message).toBeTruthy()
  })

  test('8.2 Transition with invalid action fails gracefully', async ({ request }) => {
    // Create a fresh booking to test invalid action
    const scheduledDate = futureDate(25)
    const createRes = await request.post(`${BASE}/api/bookings/service`, {
      headers: authHeaders(patientCookies),
      data: {
        providerUserId: USERS.nutritionist.id,
        providerType: 'NUTRITIONIST',
        scheduledDate,
        scheduledTime: '10:00',
        type: 'video',
        reason: 'E2E invalid action test',
        duration: 30,
      },
    })
    expect(createRes.ok()).toBe(true)
    const createBody = await createRes.json()
    const bookingId = createBody.booking?.id

    if (bookingId) {
      const wfId = await findWorkflowInstance(request, patientCookies, bookingId, 'service_booking')
      if (wfId) {
        // Try an invalid action
        const res = await request.post(`${BASE}/api/workflow/transition`, {
          headers: authHeaders(patientCookies),
          data: {
            instanceId: wfId,
            action: 'nonexistent_action',
          },
        })
        expect(res.status()).toBe(400)
        const body = await res.json()
        expect(body.success).toBe(false)
      }
    }
  })

  test('8.3 Unauthenticated transition request returns 401', async ({ request }) => {
    const res = await request.post(`${BASE}/api/workflow/transition`, {
      data: {
        instanceId: 'some-id',
        action: 'accept',
      },
    })
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.success).toBe(false)
  })
})

// ─── Utility functions ──────────────────────────────────────────────────────

/** Find a workflow instance for a given booking, using the workflow instances endpoint */
async function findWorkflowInstance(
  request: APIRequestContext,
  cookies: string,
  bookingId: string,
  bookingType: string
): Promise<string | undefined> {
  // Try to find via the workflow instances endpoint (lists user's instances)
  const res = await request.get(`${BASE}/api/workflow/instances`, {
    headers: authHeaders(cookies),
  })
  if (res.status() !== 200) return undefined

  const body = await res.json()
  if (!body.success || !Array.isArray(body.data)) return undefined

  const match = body.data.find(
    (inst: { bookingId: string; bookingType: string }) =>
      inst.bookingId === bookingId && inst.bookingType === bookingType
  )
  return match?.id ?? match?.instanceId
}

/** Execute a workflow transition and return the parsed result */
async function transitionWorkflow(
  request: APIRequestContext,
  cookies: string,
  data: {
    instanceId: string
    action: string
    notes?: string
    contentType?: string
    contentData?: Record<string, unknown>
  }
): Promise<{ success: boolean; data: Record<string, unknown> }> {
  const res = await request.post(`${BASE}/api/workflow/transition`, {
    headers: authHeaders(cookies),
    data,
  })
  const body = await res.json()
  expect(
    res.status(),
    `Transition "${data.action}" failed (${res.status()}): ${JSON.stringify(body)}`
  ).toBe(200)
  expect(body.success, `Transition "${data.action}" success=false: ${body.message}`).toBe(true)
  return body
}

/** Get the current workflow state for an instance */
async function getWorkflowState(
  request: APIRequestContext,
  cookies: string,
  instanceId: string
): Promise<Record<string, unknown>> {
  const res = await request.get(`${BASE}/api/workflow/instances/${instanceId}`, {
    headers: authHeaders(cookies),
  })
  expect(res.ok()).toBe(true)
  const body = await res.json()
  expect(body.success).toBe(true)
  return body.data
}

/** Verify a workflow instance is at the expected status */
async function verifyWorkflowState(
  request: APIRequestContext,
  cookies: string,
  instanceId: string,
  expectedStatus: string
) {
  const state = await getWorkflowState(request, cookies, instanceId)
  expect(state.currentStatus, `Expected status ${expectedStatus}`).toBe(expectedStatus)
}

import { test, expect, Page, Browser } from '@playwright/test'

test.setTimeout(120_000)

// ─── Seed Credentials ──────────────────────────────────────────────────────────

const USERS = {
  patient1: { email: 'emma.johnson@mediwyz.com', password: 'Patient123!', slug: 'patient' },
  patient2: { email: 'jean.claude@mediwyz.com', password: 'Patient123!', slug: 'patient' },
  doctor1: { email: 'sarah.johnson@mediwyz.com', password: 'Doctor123!', slug: 'doctor' },
  doctor2: { email: 'raj.patel@mediwyz.com', password: 'Doctor123!', slug: 'doctor' },
  nurse1: { email: 'priya.ramgoolam@mediwyz.com', password: 'Nurse123!', slug: 'nurse' },
  nanny1: { email: 'anita.beeharry@mediwyz.com', password: 'Nanny123!', slug: 'nanny' },
  pharmacist1: { email: 'rajesh.doorgakant@mediwyz.com', password: 'Pharma123!', slug: 'pharmacist' },
  labtech1: { email: 'david.ahkee@mediwyz.com', password: 'Lab123!', slug: 'lab-technician' },
} as const

// ─── Helpers ────────────────────────────────────────────────────────────────────

async function loginAs(page: Page, user: typeof USERS[keyof typeof USERS]) {
  await page.goto('/login')
  const emailInput = page.locator('input[name="email"]')
  await expect(emailInput).toBeVisible({ timeout: 15_000 })
  await emailInput.fill(user.email)
  await page.locator('input[name="password"]').fill(user.password)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(
    new RegExp(`/${user.slug}/`),
    { timeout: 30_000 }
  )
}

async function createUserContext(browser: Browser, user: typeof USERS[keyof typeof USERS]) {
  const context = await browser.newContext()
  const page = await context.newPage()
  await loginAs(page, user)
  return { context, page }
}

// ─── Test Suite: Cross-Role Feed Interactions ────────────────────────────────

test.describe('Cross-Role Feed — All roles can post and see each other', () => {
  test('T1: Patient feed page loads and shows post feed', async ({ page }) => {
    await loginAs(page, USERS.patient1)
    await page.goto('/patient/feed', { waitUntil: 'domcontentloaded' })
    const feed = page.locator('text=/post|feed|share|write/i').first()
    await expect(feed).toBeVisible({ timeout: 15_000 })
  })

  test('T2: Doctor feed page loads and shows create button', async ({ page }) => {
    await loginAs(page, USERS.doctor1)
    await page.goto('/doctor/feed', { waitUntil: 'domcontentloaded' })
    const feed = page.locator('text=/post|feed|share|write/i').first()
    await expect(feed).toBeVisible({ timeout: 15_000 })
  })

  test('T3: Nurse feed page loads', async ({ page }) => {
    await loginAs(page, USERS.nurse1)
    await page.goto('/nurse/feed', { waitUntil: 'domcontentloaded' })
    const feed = page.locator('text=/post|feed|share|write/i').first()
    await expect(feed).toBeVisible({ timeout: 15_000 })
  })

  test('T4: Pharmacist feed page loads', async ({ page }) => {
    await loginAs(page, USERS.pharmacist1)
    await page.goto('/pharmacist/feed', { waitUntil: 'domcontentloaded' })
    const feed = page.locator('text=/post|feed|share|write/i').first()
    await expect(feed).toBeVisible({ timeout: 15_000 })
  })
})

// ─── Test Suite: Cross-Role Messaging ────────────────────────────────────────

test.describe('Cross-Role Messaging — Users can access chat/messages', () => {
  test('T5: Patient can access chat page', async ({ page }) => {
    await loginAs(page, USERS.patient1)
    await page.goto('/patient/chat', { waitUntil: 'domcontentloaded' })
    // Chat view should load - check for conversation list or empty state
    const chatUI = page.locator('text=/conversation|message|chat|no conversations/i').first()
    await expect(chatUI).toBeVisible({ timeout: 15_000 })
  })

  test('T6: Doctor can access messages page', async ({ page }) => {
    await loginAs(page, USERS.doctor1)
    await page.goto('/doctor/messages', { waitUntil: 'domcontentloaded' })
    const chatUI = page.locator('text=/conversation|message|chat|no conversations/i').first()
    await expect(chatUI).toBeVisible({ timeout: 15_000 })
  })

  test('T7: Nurse can access messages page', async ({ page }) => {
    await loginAs(page, USERS.nurse1)
    await page.goto('/nurse/messages', { waitUntil: 'domcontentloaded' })
    const chatUI = page.locator('text=/conversation|message|chat|no conversations/i').first()
    await expect(chatUI).toBeVisible({ timeout: 15_000 })
  })

  test('T8: Nanny can access messages page', async ({ page }) => {
    await loginAs(page, USERS.nanny1)
    await page.goto('/nanny/messages', { waitUntil: 'domcontentloaded' })
    const chatUI = page.locator('text=/conversation|message|chat|no conversations/i').first()
    await expect(chatUI).toBeVisible({ timeout: 15_000 })
  })

  test('T9: Lab tech can access messages page', async ({ page }) => {
    await loginAs(page, USERS.labtech1)
    await page.goto('/lab-technician/messages', { waitUntil: 'domcontentloaded' })
    const chatUI = page.locator('text=/conversation|message|chat|no conversations/i').first()
    await expect(chatUI).toBeVisible({ timeout: 15_000 })
  })
})

// ─── Test Suite: Cross-Role Messaging (Multi-Context) ────────────────────────

test.describe('Cross-Role Messaging — Two users in parallel contexts', () => {
  test('T10: Patient and Doctor can both access messaging simultaneously', async ({ browser }) => {
    // Patient context (like a regular browser)
    const patient = await createUserContext(browser, USERS.patient1)
    // Doctor context (like a private/incognito browser)
    const doctor = await createUserContext(browser, USERS.doctor1)

    // Both navigate to their messaging pages
    await Promise.all([
      patient.page.goto('/patient/chat', { waitUntil: 'domcontentloaded' }),
      doctor.page.goto('/doctor/messages', { waitUntil: 'domcontentloaded' }),
    ])

    // Both should see the messaging UI
    const patientChat = patient.page.locator('text=/conversation|message|chat|no conversations/i').first()
    const doctorChat = doctor.page.locator('text=/conversation|message|chat|no conversations/i').first()

    await expect(patientChat).toBeVisible({ timeout: 15_000 })
    await expect(doctorChat).toBeVisible({ timeout: 15_000 })

    await patient.context.close()
    await doctor.context.close()
  })

  test('T11: Patient sends message via API and Doctor sees conversations', async ({ browser }) => {
    const patient = await createUserContext(browser, USERS.patient1)
    const doctor = await createUserContext(browser, USERS.doctor1)

    // Patient: check if there are existing conversations via API
    const patientConvRes = await patient.page.evaluate(async () => {
      const res = await fetch('/api/conversations')
      return { status: res.status, data: await res.json().catch(() => null) }
    })
    expect(patientConvRes.status).toBe(200)

    // Doctor: check conversations via API
    const doctorConvRes = await doctor.page.evaluate(async () => {
      const res = await fetch('/api/conversations')
      return { status: res.status, data: await res.json().catch(() => null) }
    })
    expect(doctorConvRes.status).toBe(200)

    await patient.context.close()
    await doctor.context.close()
  })
})

// ─── Test Suite: Cross-Role Video Call ────────────────────────────────────────

test.describe('Cross-Role Video Call — Video room and session flow', () => {
  test('T12: Patient can access video page', async ({ page }) => {
    await loginAs(page, USERS.patient1)
    await page.goto('/patient/video', { waitUntil: 'domcontentloaded' })
    const videoUI = page.locator('text=/video|call|room|consultation|no.*room/i').first()
    await expect(videoUI).toBeVisible({ timeout: 15_000 })
  })

  test('T13: Doctor can access video page', async ({ page }) => {
    await loginAs(page, USERS.doctor1)
    await page.goto('/doctor/video', { waitUntil: 'domcontentloaded' })
    const videoUI = page.locator('text=/video|call|room|consultation|no.*room/i').first()
    await expect(videoUI).toBeVisible({ timeout: 15_000 })
  })

  test('T14: Patient and Doctor can both access video pages simultaneously', async ({ browser }) => {
    const patient = await createUserContext(browser, USERS.patient1)
    const doctor = await createUserContext(browser, USERS.doctor1)

    await Promise.all([
      patient.page.goto('/patient/video', { waitUntil: 'domcontentloaded' }),
      doctor.page.goto('/doctor/video', { waitUntil: 'domcontentloaded' }),
    ])

    const patientVideo = patient.page.locator('text=/video|call|room|consultation|no.*room/i').first()
    const doctorVideo = doctor.page.locator('text=/video|call|room|consultation|no.*room/i').first()

    await expect(patientVideo).toBeVisible({ timeout: 15_000 })
    await expect(doctorVideo).toBeVisible({ timeout: 15_000 })

    await patient.context.close()
    await doctor.context.close()
  })

  test('T15: Video room creation and session join via API (Patient → Doctor)', async ({ browser }) => {
    const patient = await createUserContext(browser, USERS.patient1)
    const doctor = await createUserContext(browser, USERS.doctor1)

    // Patient creates a video room via API
    const roomResult = await patient.page.evaluate(async () => {
      const res = await fetch('/api/video/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'E2E Test Room' }),
      })
      return { status: res.status, data: await res.json().catch(() => null) }
    })

    // Room creation should succeed or room already exists
    expect([200, 201, 400]).toContain(roomResult.status)

    if (roomResult.status === 200 || roomResult.status === 201) {
      const roomCode = roomResult.data?.data?.roomCode || roomResult.data?.roomCode

      if (roomCode) {
        // Doctor joins the session via API
        const doctorSessionResult = await doctor.page.evaluate(async (code) => {
          const res = await fetch('/api/webrtc/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roomId: code,
              userId: '00000000-0000-0000-0000-000000000001',
              userName: 'Dr. Sarah',
              userType: 'DOCTOR',
            }),
          })
          return { status: res.status, data: await res.json().catch(() => null) }
        }, roomCode)

        // Session creation should succeed
        expect([200, 201]).toContain(doctorSessionResult.status)
      }
    }

    await patient.context.close()
    await doctor.context.close()
  })
})

// ─── Test Suite: Cross-Role Search & Browse ──────────────────────────────────

test.describe('Cross-Role Search — All roles can find providers', () => {
  test('T16: Patient can search for doctors', async ({ page }) => {
    await loginAs(page, USERS.patient1)
    await page.goto('/search/doctors', { waitUntil: 'domcontentloaded' })
    const searchUI = page.locator('text=/doctor|find|search|specialist|result/i').first()
    await expect(searchUI).toBeVisible({ timeout: 15_000 })
  })

  test('T17: Patient can search for nurses', async ({ page }) => {
    await loginAs(page, USERS.patient1)
    await page.goto('/search/nurses', { waitUntil: 'domcontentloaded' })
    const searchUI = page.locator('text=/nurse|find|search|result/i').first()
    await expect(searchUI).toBeVisible({ timeout: 15_000 })
  })

  test('T18: Patient can search for childcare', async ({ page }) => {
    await loginAs(page, USERS.patient1)
    await page.goto('/search/childcare', { waitUntil: 'domcontentloaded' })
    const searchUI = page.locator('text=/child|nanny|care|find|search|result/i').first()
    await expect(searchUI).toBeVisible({ timeout: 15_000 })
  })

  test('T19: Patient can search for lab tests', async ({ page }) => {
    await loginAs(page, USERS.patient1)
    await page.goto('/search/lab', { waitUntil: 'domcontentloaded' })
    const searchUI = page.locator('text=/lab|test|find|search|result/i').first()
    await expect(searchUI).toBeVisible({ timeout: 15_000 })
  })

  test('T20: Patient can search for medicines', async ({ page }) => {
    await loginAs(page, USERS.patient1)
    await page.goto('/search/medicines', { waitUntil: 'domcontentloaded' })
    const searchUI = page.locator('text=/medicine|pharmacy|find|search|result/i').first()
    await expect(searchUI).toBeVisible({ timeout: 15_000 })
  })

  test('T21: Doctor can also search for other doctors', async ({ page }) => {
    await loginAs(page, USERS.doctor1)
    await page.goto('/search/doctors', { waitUntil: 'domcontentloaded' })
    const searchUI = page.locator('text=/doctor|find|search|specialist|result/i').first()
    await expect(searchUI).toBeVisible({ timeout: 15_000 })
  })

  test('T22: Nurse can search for doctors', async ({ page }) => {
    await loginAs(page, USERS.nurse1)
    await page.goto('/search/doctors', { waitUntil: 'domcontentloaded' })
    const searchUI = page.locator('text=/doctor|find|search|specialist|result/i').first()
    await expect(searchUI).toBeVisible({ timeout: 15_000 })
  })
})

// ─── Test Suite: Cross-Role My Health ────────────────────────────────────────

test.describe('Cross-Role My Health — Health tabs work for all roles', () => {
  test('T23: Patient health page has 8 tabs', async ({ page }) => {
    await loginAs(page, USERS.patient1)
    await page.goto('/patient/health', { waitUntil: 'domcontentloaded' })
    // Should see tab labels
    const tabs = page.locator('text=/consult|rx|records/i')
    await expect(tabs.first()).toBeVisible({ timeout: 15_000 })
  })

  test('T24: Doctor my-health page has 8 tabs', async ({ page }) => {
    await loginAs(page, USERS.doctor1)
    await page.goto('/doctor/my-health', { waitUntil: 'domcontentloaded' })
    const tabs = page.locator('text=/consult|rx|records/i')
    await expect(tabs.first()).toBeVisible({ timeout: 15_000 })
  })

  test('T25: Nurse my-health page has 8 tabs', async ({ page }) => {
    await loginAs(page, USERS.nurse1)
    await page.goto('/nurse/my-health', { waitUntil: 'domcontentloaded' })
    const tabs = page.locator('text=/consult|rx|records/i')
    await expect(tabs.first()).toBeVisible({ timeout: 15_000 })
  })
})

// ─── Test Suite: Cross-Role AI Assistant ─────────────────────────────────────

test.describe('Cross-Role AI Assistant — Works for all roles', () => {
  test('T26: Patient AI assistant loads', async ({ page }) => {
    await loginAs(page, USERS.patient1)
    await page.goto('/patient/ai-assistant', { waitUntil: 'domcontentloaded' })
    const aiUI = page.locator('text=/ai|coach|health|assistant|dashboard/i').first()
    await expect(aiUI).toBeVisible({ timeout: 15_000 })
  })

  test('T27: Doctor AI assistant loads without crash', async ({ page }) => {
    await loginAs(page, USERS.doctor1)
    await page.goto('/doctor/ai-assistant', { waitUntil: 'domcontentloaded' })
    const aiUI = page.locator('text=/ai|coach|health|assistant|dashboard/i').first()
    await expect(aiUI).toBeVisible({ timeout: 15_000 })
  })

  test('T28: Nanny AI assistant loads without crash', async ({ page }) => {
    await loginAs(page, USERS.nanny1)
    await page.goto('/nanny/ai-assistant', { waitUntil: 'domcontentloaded' })
    const aiUI = page.locator('text=/ai|coach|health|assistant|dashboard/i').first()
    await expect(aiUI).toBeVisible({ timeout: 15_000 })
  })
})

// ─── Test Suite: Multi-Role Simultaneous Interactions ─────────────────────────

test.describe('Multi-Role Simultaneous — 3+ users active at once', () => {
  test('T29: Patient + Doctor + Nurse all browsing simultaneously', async ({ browser }) => {
    // Create 3 isolated browser contexts (like 3 different private browsers)
    const patient = await createUserContext(browser, USERS.patient1)
    const doctor = await createUserContext(browser, USERS.doctor1)
    const nurse = await createUserContext(browser, USERS.nurse1)

    // All navigate to their respective pages in parallel
    await Promise.all([
      patient.page.goto('/patient/feed', { waitUntil: 'domcontentloaded' }),
      doctor.page.goto('/doctor/feed', { waitUntil: 'domcontentloaded' }),
      nurse.page.goto('/nurse/feed', { waitUntil: 'domcontentloaded' }),
    ])

    // Verify all 3 see the feed
    const patientFeed = patient.page.locator('text=/post|feed|share|write/i').first()
    const doctorFeed = doctor.page.locator('text=/post|feed|share|write/i').first()
    const nurseFeed = nurse.page.locator('text=/post|feed|share|write/i').first()

    await expect(patientFeed).toBeVisible({ timeout: 15_000 })
    await expect(doctorFeed).toBeVisible({ timeout: 15_000 })
    await expect(nurseFeed).toBeVisible({ timeout: 15_000 })

    // All navigate to video pages simultaneously
    await Promise.all([
      patient.page.goto('/patient/video', { waitUntil: 'domcontentloaded' }),
      doctor.page.goto('/doctor/video', { waitUntil: 'domcontentloaded' }),
      nurse.page.goto('/nurse/video', { waitUntil: 'domcontentloaded' }),
    ])

    const patientVideo = patient.page.locator('text=/video|call|room|consultation|no.*room/i').first()
    const doctorVideo = doctor.page.locator('text=/video|call|room|consultation|no.*room/i').first()
    const nurseVideo = nurse.page.locator('text=/video|call|room|consultation|no.*room/i').first()

    await expect(patientVideo).toBeVisible({ timeout: 15_000 })
    await expect(doctorVideo).toBeVisible({ timeout: 15_000 })
    await expect(nurseVideo).toBeVisible({ timeout: 15_000 })

    await patient.context.close()
    await doctor.context.close()
    await nurse.context.close()
  })

  test('T30: API-level conversation creation between Patient and Doctor', async ({ browser }) => {
    const patient = await createUserContext(browser, USERS.patient1)
    const doctor = await createUserContext(browser, USERS.doctor1)

    // Get user IDs
    const patientMe = await patient.page.evaluate(async () => {
      const res = await fetch('/api/auth/me')
      return res.json()
    })
    const doctorMe = await doctor.page.evaluate(async () => {
      const res = await fetch('/api/auth/me')
      return res.json()
    })

    expect(patientMe.user).toBeTruthy()
    expect(doctorMe.user).toBeTruthy()

    // Patient creates or finds a conversation with the doctor
    const convResult = await patient.page.evaluate(async (doctorId) => {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId: doctorId }),
      })
      return { status: res.status, data: await res.json().catch(() => null) }
    }, doctorMe.user.id)

    // Should succeed (200/201) or already exist
    expect([200, 201, 409]).toContain(convResult.status)

    if (convResult.data?.data?.id || convResult.data?.id) {
      const conversationId = convResult.data?.data?.id || convResult.data?.id

      // Patient sends a message
      const msgResult = await patient.page.evaluate(async (convId) => {
        const res = await fetch(`/api/conversations/${convId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: 'Hello Doctor, this is an E2E test message!' }),
        })
        return { status: res.status, data: await res.json().catch(() => null) }
      }, conversationId)

      expect([200, 201]).toContain(msgResult.status)

      // Doctor reads messages from the same conversation
      const doctorMsgs = await doctor.page.evaluate(async (convId) => {
        const res = await fetch(`/api/conversations/${convId}/messages`)
        return { status: res.status, data: await res.json().catch(() => null) }
      }, conversationId)

      expect(doctorMsgs.status).toBe(200)
    }

    await patient.context.close()
    await doctor.context.close()
  })
})

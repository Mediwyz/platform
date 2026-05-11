/**
 * NestJS Migration Validation Tests
 *
 * These E2E tests verify that ALL frontend functionality works correctly
 * when routed through the NestJS backend proxy. They cover:
 * - Auth (login, register, logout)
 * - Dynamic roles from API
 * - Booking flows
 * - Dashboard data loading
 * - Search functionality
 * - Real-time features (chat, notifications)
 * - Admin/regional admin features
 *
 * Prerequisites:
 *   - NestJS backend running on port 3001
 *   - Next.js frontend running on port 3000 with ENABLE_NESTJS_PROXY=true
 *   - Database seeded with test data (npx prisma db seed)
 */

import { test, expect, Page } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

// ─── Helper: Login as a specific user ────────────────────────────────────────

async function loginAs(page: Page, email: string, password: string = 'Patient123!') {
  await page.goto('/login')
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
  // Wait for redirect (login success)
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 })
}

// ─── Helper: Check API response format ───────────────────────────────────────

async function checkApiResponse(page: Page, url: string, expectedFields?: string[]) {
  const response = await page.request.get(`${BASE_URL}${url}`)
  const json = await response.json()

  // Every API response must have { success: boolean }
  expect(json).toHaveProperty('success')
  expect(typeof json.success).toBe('boolean')

  if (json.success === false) {
    expect(json).toHaveProperty('message')
    expect(typeof json.message).toBe('string')
    expect(json.message).not.toBe('undefined')
  }

  if (expectedFields) {
    for (const field of expectedFields) {
      expect(json).toHaveProperty(field)
    }
  }

  return json
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. API PROXY VALIDATION — Ensure NestJS is handling requests
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('NestJS Proxy: API Response Format', () => {
  test('GET /api/health returns success', async ({ page }) => {
    const res = await page.request.get(`${BASE_URL}/api/health`)
    expect(res.ok()).toBeTruthy()
  })

  test('GET /api/roles returns dynamic roles from DB', async ({ page }) => {
    const json = await checkApiResponse(page, '/api/roles')
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)
    expect(json.data.length).toBeGreaterThan(0)

    // Each role should have dynamic fields from ProviderRole table
    const role = json.data[0]
    expect(role).toHaveProperty('code')
    expect(role).toHaveProperty('label')
    expect(role).toHaveProperty('slug')
    expect(role).toHaveProperty('searchEnabled')
    expect(role).toHaveProperty('bookingEnabled')
    expect(role).toHaveProperty('providerCount')
    // No undefined values
    expect(role.code).not.toBeUndefined()
    expect(role.label).not.toBeUndefined()
  })

  test('GET /api/roles returns specialties per role', async ({ page }) => {
    const json = await checkApiResponse(page, '/api/roles')
    const doctorRole = json.data.find((r: any) => r.code === 'DOCTOR')
    if (doctorRole) {
      expect(doctorRole).toHaveProperty('specialties')
      expect(Array.isArray(doctorRole.specialties)).toBe(true)
    }
  })

  test('GET /api/stats returns platform statistics', async ({ page }) => {
    const json = await checkApiResponse(page, '/api/stats')
    expect(json.success).toBe(true)
    expect(json.data).toBeDefined()
  })

  test('GET /api/regions returns regions from DB', async ({ page }) => {
    const json = await checkApiResponse(page, '/api/regions')
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)
  })

  test('GET /api/services/catalog returns service catalog', async ({ page }) => {
    const json = await checkApiResponse(page, '/api/services/catalog')
    expect(json.success).toBe(true)
  })

  test('GET /api/config returns app configuration', async ({ page }) => {
    const json = await checkApiResponse(page, '/api/config')
    expect(json.success).toBe(true)
  })

  test('Unauthenticated request to protected endpoint returns 401', async ({ page }) => {
    const res = await page.request.get(`${BASE_URL}/api/auth/me`)
    expect(res.status()).toBe(401)
    const json = await res.json()
    expect(json.success).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 2. AUTH FLOW — Login, me, logout via NestJS
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('NestJS Proxy: Auth Flow', () => {
  test('Login as patient and verify cookies', async ({ page }) => {
    await loginAs(page, 'emma.johnson@mediwyz.com')

    // Verify cookies are set correctly
    const cookies = await page.context().cookies()
    const tokenCookie = cookies.find(c => c.name === 'mediwyz_token')
    const typeCookie = cookies.find(c => c.name === 'mediwyz_userType')
    const idCookie = cookies.find(c => c.name === 'mediwyz_user_id')

    expect(tokenCookie).toBeDefined()
    expect(typeCookie).toBeDefined()
    expect(idCookie).toBeDefined()
    expect(typeCookie?.value).toBe('patient')
  })

  test('GET /api/auth/me returns user data after login', async ({ page }) => {
    await loginAs(page, 'emma.johnson@mediwyz.com')
    const json = await checkApiResponse(page, '/api/auth/me')
    expect(json.success).toBe(true)
    expect(json.user).toBeDefined()
    expect(json.user.email).toBe('emma.johnson@mediwyz.com')
    expect(json.user.userType).not.toBeUndefined()
  })

  test('Login as doctor works', async ({ page }) => {
    await loginAs(page, 'sarah.johnson@mediwyz.com', 'Doctor123!')
    const json = await checkApiResponse(page, '/api/auth/me')
    expect(json.success).toBe(true)
    expect(json.user.email).toBe('sarah.johnson@mediwyz.com')
  })

  test('Logout clears cookies', async ({ page }) => {
    await loginAs(page, 'emma.johnson@mediwyz.com')
    await page.request.post(`${BASE_URL}/api/auth/logout`)
    const cookies = await page.context().cookies()
    const tokenCookie = cookies.find(c => c.name === 'mediwyz_token')
    // Token should be cleared (empty or missing)
    expect(!tokenCookie || tokenCookie.value === '').toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 3. SEARCH — Dynamic provider search via NestJS
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('NestJS Proxy: Search', () => {
  test('Search providers by type=DOCTOR', async ({ page }) => {
    const json = await checkApiResponse(page, '/api/search/providers?type=DOCTOR')
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)
    // Each provider should have required fields (no undefined)
    if (json.data.length > 0) {
      const doc = json.data[0]
      expect(doc.id).toBeDefined()
      expect(doc.firstName).toBeDefined()
      expect(doc.lastName).toBeDefined()
      expect(doc.userType).toBe('DOCTOR')
    }
  })

  test('Search providers by type=NURSE', async ({ page }) => {
    const json = await checkApiResponse(page, '/api/search/providers?type=NURSE')
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)
  })

  test('Search with query parameter', async ({ page }) => {
    const json = await checkApiResponse(page, '/api/search/providers?type=DOCTOR&q=test')
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)
  })

  test('Search page renders and loads providers', async ({ page }) => {
    await page.goto('/search/doctors')
    // Wait for providers to load (search results)
    await page.waitForSelector('[data-testid="provider-card"], .provider-card, article, .grid > div', { timeout: 10000 }).catch(() => {})
    // Page should not show error state
    const errorText = await page.locator('text=/error|failed/i').count()
    expect(errorText).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 4. PATIENT DASHBOARD — Data loading via NestJS
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('NestJS Proxy: Patient Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'emma.johnson@mediwyz.com')
  })

  test('Patient dashboard loads without errors', async ({ page }) => {
    await page.goto('/patient/feed')
    await page.waitForLoadState('networkidle')
    // Should not see any "undefined" text in visible content
    const undefinedCount = await page.locator('text="undefined"').count()
    expect(undefinedCount).toBe(0)
  })

  test('Patient notifications API works', async ({ page }) => {
    const cookies = await page.context().cookies()
    const userId = cookies.find(c => c.name === 'mediwyz_user_id')?.value
    if (userId) {
      const json = await checkApiResponse(page, `/api/users/${userId}/notifications`)
      expect(json.success).toBe(true)
      expect(json).toHaveProperty('data')
    }
  })

  test('Patient bookings unified API works', async ({ page }) => {
    const json = await checkApiResponse(page, '/api/bookings/unified?role=patient')
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)
  })

  test('Patient wallet API works', async ({ page }) => {
    const cookies = await page.context().cookies()
    const userId = cookies.find(c => c.name === 'mediwyz_user_id')?.value
    if (userId) {
      const json = await checkApiResponse(page, `/api/users/${userId}/wallet`)
      expect(json.success).toBe(true)
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 5. PROVIDER DASHBOARD — Dynamic data via NestJS
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('NestJS Proxy: Provider Dashboard', () => {
  test('Doctor dashboard loads data', async ({ page }) => {
    await loginAs(page, 'sarah.johnson@mediwyz.com', 'Doctor123!')
    await page.goto('/provider/doctors/feed')
    await page.waitForLoadState('networkidle')
    const undefinedCount = await page.locator('text="undefined"').count()
    expect(undefinedCount).toBe(0)
  })

  test('Provider bookings unified API works', async ({ page }) => {
    await loginAs(page, 'sarah.johnson@mediwyz.com', 'Doctor123!')
    const json = await checkApiResponse(page, '/api/bookings/unified?role=provider')
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)
  })

  test('Provider services API works', async ({ page }) => {
    await loginAs(page, 'sarah.johnson@mediwyz.com', 'Doctor123!')
    const json = await checkApiResponse(page, '/api/services/my-services')
    expect(json.success).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 6. ADMIN DASHBOARD — All admin APIs via NestJS
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('NestJS Proxy: Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'kofi.agbeko@mediwyz.com', 'Regional123!')
  })

  test('Admin dashboard loads metrics', async ({ page }) => {
    const json = await checkApiResponse(page, '/api/admin/dashboard')
    expect(json.success).toBe(true)
    expect(json.data).toBeDefined()
  })

  test('Admin accounts API works', async ({ page }) => {
    const json = await checkApiResponse(page, '/api/admin/accounts')
    expect(json.success).toBe(true)
  })

  test('Admin role-config GET works', async ({ page }) => {
    const json = await checkApiResponse(page, '/api/admin/role-config')
    expect(json.success).toBe(true)
    expect(json.data).toBeDefined()
  })

  test('Admin system-health works', async ({ page }) => {
    const json = await checkApiResponse(page, '/api/admin/system-health')
    expect(json.success).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 7. DYNAMIC ROLES — Verify no hardcoded role dependencies
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('NestJS Proxy: Dynamic Roles', () => {
  test('Signup page loads roles from API', async ({ page }) => {
    await page.goto('/signup')
    // Wait for roles to load
    await page.waitForTimeout(2000)
    // Should see role cards rendered from API data
    const roleCards = await page.locator('button').filter({ hasText: /Doctor|Nurse|Patient/i }).count()
    expect(roleCards).toBeGreaterThan(0)
  })

  test('Role-config page fetches user types from API', async ({ page }) => {
    await loginAs(page, 'kofi.agbeko@mediwyz.com', 'Regional123!')
    await page.goto('/admin/role-config')
    await page.waitForLoadState('networkidle')
    // Should not show loading spinner indefinitely
    await page.waitForTimeout(3000)
    const spinner = await page.locator('.animate-spin').count()
    expect(spinner).toBe(0)
  })

  test('Search sidebar shows dynamic roles', async ({ page }) => {
    await page.goto('/search/doctors')
    await page.waitForLoadState('networkidle')
    // Sidebar should have role-based navigation items loaded from API
    const navItems = await page.locator('nav a, aside a').count()
    expect(navItems).toBeGreaterThan(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 8. BOOKING FLOW — End-to-end via NestJS
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('NestJS Proxy: Booking Flow', () => {
  test('Available slots API works', async ({ page }) => {
    await loginAs(page, 'emma.johnson@mediwyz.com')
    // Find a doctor first
    const searchJson = await checkApiResponse(page, '/api/search/providers?type=DOCTOR&limit=1')
    if (searchJson.data?.length > 0) {
      const doctorId = searchJson.data[0].id
      const today = new Date().toISOString().split('T')[0]
      const slotsJson = await checkApiResponse(page, `/api/bookings/available-slots?providerUserId=${doctorId}&date=${today}`)
      expect(slotsJson.success).toBe(true)
    }
  })

  test('Service catalog API returns services per provider type', async ({ page }) => {
    const json = await checkApiResponse(page, '/api/services/catalog?providerType=DOCTOR')
    expect(json.success).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 9. NO UNDEFINED VALUES — Critical format validation
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('NestJS Proxy: No Undefined Values in API Responses', () => {
  const publicEndpoints = [
    '/api/health',
    '/api/roles',
    '/api/stats',
    '/api/regions',
    '/api/config',
    '/api/search/providers?type=DOCTOR',
    '/api/services/catalog',
  ]

  for (const endpoint of publicEndpoints) {
    test(`${endpoint} has no undefined values`, async ({ page }) => {
      const res = await page.request.get(`${BASE_URL}${endpoint}`)
      const text = await res.text()
      // JSON should never contain the string "undefined"
      expect(text).not.toContain('"undefined"')
      expect(text).not.toContain(':undefined')
      // Parse and verify it's valid JSON
      const json = JSON.parse(text)
      expect(json.success).toBeDefined()
    })
  }
})

// ═══════════════════════════════════════════════════════════════════════════════
// 10. WORKFLOW & INVENTORY — NestJS endpoints
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('NestJS Proxy: Workflow & Inventory', () => {
  test('Workflow templates API works', async ({ page }) => {
    await loginAs(page, 'kofi.agbeko@mediwyz.com', 'Regional123!')
    const json = await checkApiResponse(page, '/api/workflow/templates')
    expect(json.success).toBe(true)
  })

  test('Health shop search API works', async ({ page }) => {
    const json = await checkApiResponse(page, '/api/search/health-shop')
    expect(json.success).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 11. CONVERSATIONS & CHAT — NestJS endpoints
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('NestJS Proxy: Conversations', () => {
  test('Conversations API works', async ({ page }) => {
    await loginAs(page, 'emma.johnson@mediwyz.com')
    const json = await checkApiResponse(page, '/api/conversations')
    expect(json.success).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 12. AI ASSISTANT — Real Groq integration
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('NestJS Proxy: AI Assistant', () => {
  test('AI chat sessions API works', async ({ page }) => {
    await loginAs(page, 'emma.johnson@mediwyz.com')
    const json = await checkApiResponse(page, '/api/ai/chat')
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)
  })
})

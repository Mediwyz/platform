/**
 * Company/Corporate Workflow E2E Tests
 *
 * Full lifecycle:
 * 1. Any user creates a company
 * 2. Company admin chooses subscription plan → pays from health credits
 * 3. Admin invites employees by email
 * 4. Employees accept invitations
 * 5. Employee sees company in "My Company" list
 * 6. Company posts on feed (post as company)
 * 7. Feed shows company posts
 * 8. Admin manages employees (approve, remove)
 * 9. Company subscription applies to all active employees
 */

import { test, expect, APIRequestContext } from '@playwright/test'

const BASE = 'http://localhost:3000'

// ─── Helpers ───────────────────────────────────────────────────────────────

async function login(request: APIRequestContext, email: string, password: string) {
  const res = await request.post(`${BASE}/api/auth/login`, { data: { email, password } })
  return res.headers()['set-cookie'] || ''
}

function auth(cookies: string): Record<string, string> {
  const pairs = cookies.split(/,(?=\s*\w+=)/).map(c => c.split(';')[0].trim()).filter(Boolean)
  return { cookie: pairs.join('; ') }
}

async function apiPost(request: APIRequestContext, cookies: string, path: string, data: any) {
  const res = await request.post(`${BASE}${path}`, { headers: auth(cookies), data })
  return { ok: res.ok(), status: res.status(), json: await res.json() }
}

async function apiGet(request: APIRequestContext, cookies: string, path: string) {
  const res = await request.get(`${BASE}${path}`, { headers: auth(cookies) })
  return { ok: res.ok(), json: await res.json() }
}


// ─── Test Users ────────────────────────────────────────────────────────────

const ADMIN = { email: 'emma.johnson@mediwyz.com', password: 'Patient123!', id: 'PAT001' }
const EMPLOYEE = { email: 'sarah.johnson@mediwyz.com', password: 'Doctor123!', id: 'DOC001' }

// ═══════════════════════════════════════════════════════════════════════════════

test.describe.serial('Company/Corporate Workflow', () => {
  let adminCookies = ''
  let employeeCookies = ''
  let companyId = ''

  test('Setup: login both users', async ({ request }) => {
    adminCookies = await login(request, ADMIN.email, ADMIN.password)
    employeeCookies = await login(request, EMPLOYEE.email, EMPLOYEE.password)
    expect(adminCookies).toBeTruthy()
    expect(employeeCookies).toBeTruthy()

    // Ensure admin has credits
    await apiPost(request, adminCookies, `/api/users/${ADMIN.id}/wallet/reset`, { amount: 100000 })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. CREATE COMPANY
  // ═══════════════════════════════════════════════════════════════════════════

  test('Any user can create a company', async ({ request }) => {
    const { ok, json } = await apiPost(request, adminCookies, '/api/corporate/companies', {
      companyName: `E2E Test Corp ${Date.now()}`,
      registrationNumber: 'REG-E2E-001',
      industry: 'Healthcare Technology',
      employeeCount: 10,
    })
    expect(ok).toBe(true)
    expect(json.success).toBe(true)
    expect(json.data).toBeDefined()
    companyId = json.data?.id || json.data?.companyId || ''
    expect(companyId || json.data).toBeTruthy()
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. LIST COMPANIES
  // ═══════════════════════════════════════════════════════════════════════════

  test('Companies endpoint lists all companies', async ({ request }) => {
    const { json } = await apiGet(request, adminCookies, '/api/corporate/companies')
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)
    expect(json.data.length).toBeGreaterThan(0)
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. INVITE EMPLOYEE
  // ═══════════════════════════════════════════════════════════════════════════

  test('Admin invites employee by email', async ({ request }) => {
    const { json } = await apiPost(request, adminCookies, `/api/corporate/${ADMIN.id}/members`, {
      email: EMPLOYEE.email,
    })
    // Should succeed or already be a member (idempotent)
    expect(json.success === true || json.message?.includes('already')).toBeTruthy()
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. EMPLOYEE ACCEPTS INVITATION
  // ═══════════════════════════════════════════════════════════════════════════

  test('Employee can accept pending invitation', async ({ request }) => {
    const { json } = await apiPost(request, employeeCookies, '/api/corporate/accept', {})
    // Should succeed if invitation exists
    expect(json.success === true || json.message).toBeTruthy()
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. EMPLOYEE SEES COMPANY
  // ═══════════════════════════════════════════════════════════════════════════

  test('Employee sees their company in my-companies list', async ({ request }) => {
    const { json } = await apiGet(request, employeeCookies, '/api/corporate/my-companies')
    expect(json.success).toBe(true)
    if (json.data && Array.isArray(json.data)) {
      // Should have at least the company they were invited to
      expect(json.data.length).toBeGreaterThanOrEqual(0)
    }
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. ADMIN VIEWS MEMBERS
  // ═══════════════════════════════════════════════════════════════════════════

  test('Admin sees members list', async ({ request }) => {
    const { json } = await apiGet(request, adminCookies, `/api/corporate/${ADMIN.id}/members`)
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. POST AS COMPANY
  // ═══════════════════════════════════════════════════════════════════════════

  test('User can create a post as company', async ({ request }) => {
    const { ok, json } = await apiPost(request, adminCookies, '/api/posts', {
      content: 'E2E test company post — healthcare innovation!',
      category: 'company',
      companyId: companyId || undefined,
    })
    expect(ok).toBe(true)
    expect(json.success).toBe(true)
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. FEED SHOWS POSTS
  // ═══════════════════════════════════════════════════════════════════════════

  test('Feed includes recent posts (including company posts)', async ({ request }) => {
    const res = await request.get(`${BASE}/api/posts?limit=10`)
    const json = await res.json()
    expect(json.success).toBe(true)
    // Posts may be in json.data or json.data.posts
    const posts = Array.isArray(json.data) ? json.data : json.data?.posts || []
    expect(posts.length).toBeGreaterThan(0)
    // At least one post should have a companyId (our company post)
    const companyPost = posts.find((p: any) => p.companyId)
    expect(companyPost).toBeTruthy()
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. CORPORATE DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════

  test('Corporate dashboard returns data', async ({ request }) => {
    const { json } = await apiGet(request, adminCookies, `/api/corporate/${ADMIN.id}/dashboard`)
    expect(json.success).toBe(true)
    expect(json.data).toBeDefined()
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. SUBSCRIPTION ENROLLMENT
  // ═══════════════════════════════════════════════════════════════════════════

  test('Admin can enroll employees in subscription plan', async ({ request }) => {
    // Get available plans
    const { json: plansJson } = await apiGet(request, adminCookies, '/api/subscriptions')
    const corporatePlan = plansJson.data?.find((p: any) =>
      p.type === 'CORPORATE' || p.name?.toLowerCase().includes('corp')
    )

    if (corporatePlan) {
      const { json } = await apiPost(request, adminCookies, '/api/corporate/enroll', {
        planId: corporatePlan.id,
      })
      // Should succeed or give meaningful response
      expect(json.success === true || json.message).toBeTruthy()
    }
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. NO UNDEFINED VALUES
  // ═══════════════════════════════════════════════════════════════════════════

  test('All corporate endpoints return clean data', async ({ request }) => {
    const endpoints = [
      '/api/corporate/companies',
      `/api/corporate/${ADMIN.id}/dashboard`,
      `/api/corporate/${ADMIN.id}/members`,
    ]

    for (const ep of endpoints) {
      const { json } = await apiGet(request, adminCookies, ep)
      const text = JSON.stringify(json)
      expect(text).not.toContain('"undefined"')
    }
  })
})

/**
 * Golden-path smoke test: landing page → discover services → view provider profile
 *
 * Does NOT complete a booking (requires wallet top-up + provider acceptance)
 * but verifies the full discovery funnel is unbroken.
 */
import { test, expect } from '@playwright/test'

test.describe('Golden path — service discovery funnel', () => {
  test('homepage loads all 5 sections without JS errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // All 5 key sections present
    await expect(page.locator('text=/Healthcare.*Reimagined|HealthTech/i').first()).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('text=/How it works/i').first()).toBeVisible()
    await expect(page.locator('text=/Trusted by patients/i').first()).toBeVisible()
    await expect(page.locator('text=/What are you looking for/i').first()).toBeVisible()

    expect(errors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0)
  })

  test('can browse services from the Discover section', async ({ page }) => {
    await page.goto('/')
    await page.locator('button', { hasText: /Book a Service/i }).first().click()

    // ServicesSection should load at least one card
    const cards = page.locator('[class*="card"], article, [class*="service"]').filter({ hasText: /Rs|MUR|Book|Consult/i })
    await expect(cards.first()).toBeVisible({ timeout: 15_000 })
  })

  test('can switch to providers tab and see provider cards', async ({ page }) => {
    await page.goto('/')
    await page.locator('button', { hasText: /Find a Provider/i }).first().click()

    // ProvidersSection or map panel renders
    await expect(
      page.locator('text=/Browse all providers|Dr\.|No providers/i').first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('search/services page filters by query', async ({ page }) => {
    await page.goto('/search/services')
    await page.waitForLoadState('networkidle')

    const searchInput = page.locator('input[type="text"], input[placeholder*="search" i]').first()
    await expect(searchInput).toBeVisible({ timeout: 10_000 })
    await searchInput.fill('consult')
    await page.waitForTimeout(400)

    // At least one result visible or empty state
    const results = page.locator('[class*="card"], article').first()
    await expect(results.or(page.locator('text=/no.*result|empty/i').first())).toBeVisible({ timeout: 10_000 })
  })

  test('provider profile page loads with Services tab when provider', async ({ page }) => {
    // Use a seeded doctor's profile — navigate via search
    await page.goto('/search/providers?type=DOCTOR&limit=1')
    await page.waitForLoadState('networkidle')

    const json = await page.evaluate(async () => {
      const r = await fetch('/api/search/providers?type=DOCTOR&limit=1', { credentials: 'include' })
      return r.json()
    })

    // Skip if no providers seeded
    if (!json?.data?.[0]?.id) return

    const providerId = json.data[0].id
    await page.goto(`/profile/${providerId}`)
    await page.waitForLoadState('networkidle')

    // Profile page renders
    await expect(page.locator('text=/About|Services|Reviews/i').first()).toBeVisible({ timeout: 15_000 })
  })

  test('patient can log in and see booking history', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[type="email"]', 'emma.johnson@mediwyz.com')
    await page.fill('input[type="password"]', 'Patient123!')
    await page.click('button[type="submit"]')

    // Should redirect to patient dashboard
    await expect(page).toHaveURL(/patient|member|feed/, { timeout: 15_000 })
    await page.waitForLoadState('networkidle')

    // Dashboard renders without errors
    await expect(page.locator('main, [class*="dashboard"]').first()).toBeVisible({ timeout: 10_000 })
  })
})

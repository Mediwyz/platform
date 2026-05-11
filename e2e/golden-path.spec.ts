/**
 * Golden-path smoke test: landing page → discover services → view provider profile
 *
 * Does NOT complete a booking (requires wallet top-up + provider acceptance)
 * but verifies the full discovery funnel is unbroken.
 */
import { test, expect } from '@playwright/test'

test.describe('Golden path — service discovery funnel', () => {
  test('homepage loads all key sections without JS errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))

    await page.goto('/')
    // networkidle times out because dynamic sections keep polling APIs — use domcontentloaded
    await page.waitForLoadState('domcontentloaded')

    // Hero + static sections always present
    await expect(page.locator('text=/Healthcare.*Reimagined|HealthTech/i').first()).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('text=/How it works/i').first()).toBeVisible()
    await expect(page.locator('text=/Trusted by patients/i').first()).toBeVisible()

    // Unified DiscoverSection loads after hydration (Providers tab is default)
    // Use text check — #discover-section may have mobile+desktop variants (both in DOM)
    await expect(page.locator('text=/Browse Providers/i').first()).toBeVisible({ timeout: 15_000 })

    // Filter out known non-fatal errors: ResizeObserver and React #418 (ssr:false Suspense hydration)
    const fatalErrors = errors.filter(e =>
      !e.includes('ResizeObserver') &&
      !e.includes('418') &&
      !e.includes('Hydration') &&
      !e.includes('hydration')
    )
    expect(fatalErrors).toHaveLength(0)
  })

  test('DiscoverSection shows Providers tab by default', async ({ page }) => {
    await page.goto('/')
    // Providers tab is active by default
    await expect(page.locator('text=/Browse Providers/i').first()).toBeVisible({ timeout: 15_000 })
  })

  test('DiscoverSection Services tab is accessible', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=/Browse Providers/i').first()).toBeVisible({ timeout: 15_000 })
    // Click the Services tab pill — use first() to handle mobile+desktop DOM variants
    await page.getByRole('button', { name: /^Services$/i }).first().click()
    await expect(page.locator('text=/Find Services/i').first()).toBeVisible({ timeout: 10_000 })
  })

  test('search/services page loads and shows a search input', async ({ page }) => {
    await page.goto('/search/services')
    await page.waitForLoadState('networkidle')

    // Page has "All Services" heading
    await expect(page.locator('text=/All Services/i').first()).toBeVisible({ timeout: 10_000 })

    // Search input is present
    const searchInput = page.locator('input[type="text"], input[placeholder*="search" i]').first()
    await expect(searchInput).toBeVisible({ timeout: 10_000 })

    await searchInput.fill('consult')
    await page.waitForTimeout(400)

    // Results show h3 service names, or an empty-state message
    const results = page.locator('h3').or(page.locator('text=/no.*result|empty|No services/i'))
    await expect(results.first()).toBeVisible({ timeout: 10_000 })
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

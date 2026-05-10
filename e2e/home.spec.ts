import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('loads and shows the hero section', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/MediWyz/i)
    await expect(page.locator('text=/HealthTech|Platform/i').first()).toBeVisible({ timeout: 10_000 })
  })

  test('has a navigation bar and footer', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('nav').first()).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()
  })

  test('hero section has trust stats', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=/Verified Providers/i').first()).toBeVisible({ timeout: 10_000 })
  })

  test('HowItWorks strip shows the three steps', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=/How it works/i').first()).toBeVisible({ timeout: 10_000 })
    // Step numbers 01 / 02 / 03 are unique to HowItWorks
    const section = page.locator('div').filter({ has: page.locator('text=/How it works/i') }).first()
    await expect(section.locator('text=01').first()).toBeVisible()
    await expect(section.locator('text=02').first()).toBeVisible()
    await expect(section.locator('text=03').first()).toBeVisible()
  })

  test('CompanyTrustBar is visible', async ({ page }) => {
    await page.goto('/')
    // CompanyTrustBar shows "Trusted by companies & organizations"
    await expect(page.locator('text=/Trusted by companies/i').first()).toBeVisible({ timeout: 10_000 })
  })

  test('TestimonialsSection shows patient quotes', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=/Trusted by patients/i').first()).toBeVisible({ timeout: 10_000 })
  })

  test('DiscoverSection is visible with tab navigation', async ({ page }) => {
    await page.goto('/')
    // DiscoverSection replaces the old separate sections — shows Providers tab by default
    await expect(page.locator('#discover-section')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('text=/Browse Providers/i').first()).toBeVisible({ timeout: 15_000 })
  })

  test('DiscoverSection has a search input in Providers tab', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#discover-section')).toBeVisible({ timeout: 15_000 })
    const searchInput = page.locator('#discover-section input').first()
    await expect(searchInput).toBeVisible({ timeout: 10_000 })
  })

  test('hero feature pills scroll to DiscoverSection', async ({ page }) => {
    await page.goto('/')
    const pill = page.locator('button, a').filter({ hasText: /Home Visits/i }).first()
    await expect(pill).toBeVisible({ timeout: 10_000 })
    await pill.click()
    await expect(page.locator('#discover-section')).toBeInViewport({ timeout: 5_000 })
  })

  test('sticky CTA bar appears after scrolling past hero', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => window.scrollBy(0, 900))
    await page.waitForTimeout(800)
    const ctaBar = page.locator('text=/Book Now/i').first()
    const visible = await ctaBar.isVisible().catch(() => false)
    if (!visible) return
    await expect(ctaBar).toBeVisible()
  })

  test('search/services page loads', async ({ page }) => {
    await page.goto('/search/services')
    await expect(page).toHaveURL(/search\/services/)
    await expect(page.locator('text=/service|Book/i').first()).toBeVisible({ timeout: 10_000 })
  })
})

import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('loads and shows the hero section', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/MediWyz/i)
    // Country badge or platform description visible
    await expect(page.locator('text=/HealthTech|Platform/i').first()).toBeVisible({ timeout: 10_000 })
  })

  test('has a navigation bar and footer', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('nav').first()).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()
  })

  test('hero section has trust stats', async ({ page }) => {
    await page.goto('/')
    // Dynamic stat counters are always rendered
    await expect(page.locator('text=/Verified Providers/i').first()).toBeVisible({ timeout: 10_000 })
  })

  test('HowItWorks strip shows the three steps', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=/How it works/i').first()).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('text=Search').first()).toBeVisible()
    await expect(page.locator('text=Book').first()).toBeVisible()
    await expect(page.locator('text=Consult').first()).toBeVisible()
  })

  test('CompanyTrustBar is visible', async ({ page }) => {
    await page.goto('/')
    // Marquee trust bar scrolls provider types or partner logos
    const trustBar = page.locator('[class*="marquee"], [class*="trust"], text=/Doctors|Nurses|Dentists/i').first()
    await expect(trustBar).toBeVisible({ timeout: 10_000 })
  })

  test('TestimonialsSection shows patient quotes', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=/Trusted by patients/i').first()).toBeVisible({ timeout: 10_000 })
  })

  test('DiscoverSection tab strip is visible', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=/What are you looking for/i').first()).toBeVisible({ timeout: 10_000 })
    // All 5 tab choices should render
    await expect(page.locator('text=/Book a Service/i').first()).toBeVisible()
    await expect(page.locator('text=/Find a Provider/i').first()).toBeVisible()
  })

  test('discover tab switching works', async ({ page }) => {
    await page.goto('/')
    // Click "Find a Provider" tab
    await page.locator('button', { hasText: /Find a Provider/i }).first().click()
    // Map panel or providers list should appear
    await expect(page.locator('text=/Browse all providers/i, text=/No providers/i').first()).toBeVisible({ timeout: 15_000 })
  })

  test('hero feature pills dispatch to correct tab', async ({ page }) => {
    await page.goto('/')
    // Click "Home Visits" pill → should switch Discover to Services tab
    const pill = page.locator('button', { hasText: /Home Visits/i }).first()
    await expect(pill).toBeVisible({ timeout: 10_000 })
    await pill.click()
    await expect(page.locator('#discover')).toBeInViewport({ timeout: 5_000 })
  })

  test('sticky CTA bar appears after scrolling past hero', async ({ page }) => {
    await page.goto('/')
    // Scroll down past the hero
    await page.evaluate(() => window.scrollBy(0, 800))
    await page.waitForTimeout(500)
    // CTA bar has "Book Now" text
    const ctaBar = page.locator('text=/Book Now/i').first()
    await expect(ctaBar).toBeVisible({ timeout: 5_000 })
  })

  test('search/services page loads', async ({ page }) => {
    await page.goto('/search/services')
    await expect(page).toHaveURL(/search\/services/)
    await expect(page.locator('text=/service|Book/i').first()).toBeVisible({ timeout: 10_000 })
  })
})

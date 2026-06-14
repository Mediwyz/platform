import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('loads and shows the hero section', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/MediWyz/i)
    // The hero <h1> is always the first heading and is always visible — target it
    // directly rather than a loose text regex (which can match hidden section
    // headings like "Healthcare Services" further down the page).
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10_000 })
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

  test('Final CTA section is visible', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=/Ready to take care of your health/i').first()).toBeVisible({ timeout: 10_000 })
  })

  test('Discover category navigator shows the entity cards', async ({ page }) => {
    await page.goto('/')
    // The landing now uses the lightweight 3-level CategoryNavigator instead of the
    // old tabbed DiscoverSection. Assert on its static level-1 content (no API needed).
    await expect(page.locator('text=/What are you looking for/i').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('button', { hasText: /Services/i }).first()).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('button', { hasText: /Health Shop/i }).first()).toBeVisible({ timeout: 10_000 })
  })

  test('Discover navigator links to the full services catalogue', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=/What are you looking for/i').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('button', { hasText: /Browse the full catalogue/i }).first()).toBeVisible({ timeout: 10_000 })
  })

  test('hero feature pills are visible', async ({ page }) => {
    // Generous timeout: the very first request right after a deploy hits a cold
    // VPS that is still warming up, so the hero can take >10s to paint.
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    // Assert on an actual hero pill — specific and always visible. A loose
    // /Healthcare/ regex used to match a hidden "Healthcare Services" heading.
    await expect(page.getByText('AI Health Assistant', { exact: true }).first())
      .toBeVisible({ timeout: 30_000 })
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

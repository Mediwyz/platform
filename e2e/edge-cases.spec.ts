import { test, expect } from '@playwright/test'

test.setTimeout(90_000)

test.describe('M. Edge Cases', () => {
  test('M1: Login with wrong password shows error', async ({ page }) => {
    await page.goto('/login')
    const emailInput = page.locator('input[name="email"]')
    await expect(emailInput).toBeVisible({ timeout: 10_000 })
    await emailInput.fill('emma.johnson@mediwyz.com')
    await page.locator('input[name="password"]').fill('WrongPassword999!')
    await page.locator('button[type="submit"]').click()

    // Should show error div (bg-red-50) and NOT navigate away from login
    const error = page.locator('.bg-red-50').first()
    await expect(error).toBeVisible({ timeout: 15_000 })
    // Confirm still on login page
    expect(page.url()).toContain('/login')
  })

  test('M2: Login with non-existent email shows error', async ({ page }) => {
    await page.goto('/login')
    const emailInput = page.locator('input[name="email"]')
    await expect(emailInput).toBeVisible({ timeout: 10_000 })
    await emailInput.fill('nonexistent.user.xyz@example.com')
    await page.locator('input[name="password"]').fill('Test1234!')
    await page.locator('button[type="submit"]').click()

    // Should show error div (bg-red-50) and NOT navigate away
    const error = page.locator('.bg-red-50').first()
    await expect(error).toBeVisible({ timeout: 15_000 })
    expect(page.url()).toContain('/login')
  })

  test('M3: Accessing protected route without auth redirects to login', async ({ page }) => {
    // Try to access patient dashboard without logging in
    await page.goto('/patient/bookings', { waitUntil: 'domcontentloaded' })

    // Should redirect to login page or show login form
    await page.waitForURL(/\/(login|$)/, { timeout: 15_000 })
    const loginInput = page.locator('input[name="email"]')
    await expect(loginInput).toBeVisible({ timeout: 10_000 })
  })

  test('M4: 404 page renders for invalid route', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-xyz-12345', { waitUntil: 'domcontentloaded' })

    // Should show a 404 or "not found" message
    const notFound = page.locator('text=/not found|404|page.*exist|doesn.*exist/i').first()
    await expect(notFound).toBeVisible({ timeout: 15_000 })
  })

  test('M5: Empty search query returns results page', async ({ page }) => {
    await page.goto('/search/results', { waitUntil: 'domcontentloaded' })

    // Search page should still render with empty query
    const heading = page.locator('text=/search healthcare/i').first()
    await expect(heading).toBeVisible({ timeout: 10_000 })

    // Submit empty search
    const form = page.locator('form').filter({ has: page.locator('input[placeholder*="Search doctors, nurses"]') })
    const submitButton = form.locator('button[type="submit"]').first()
    await submitButton.click()

    // Page should still be functional (not crash)
    await expect(heading).toBeVisible({ timeout: 5_000 })
  })
})

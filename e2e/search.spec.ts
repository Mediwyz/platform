import { test, expect } from '@playwright/test'

test.describe('Search Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/search/doctors')
  })

  test('renders the search page', async ({ page }) => {
    // ProviderSearchPage renders a role-specific title (e.g. "Find Doctors")
    const heading = page.locator('h1, h2, h3, [class*="title"], [class*="heading"]')
      .filter({ hasText: /Find/i })
      .first()
    await expect(heading).toBeVisible({ timeout: 10_000 })
  })

  test('has a search input field', async ({ page }) => {
    // Placeholder is "Search doctors by name, specialty, or location..."
    const searchInput = page.locator('input[placeholder*="Search doctors"]').first()
    await expect(searchInput).toBeVisible({ timeout: 10_000 })
  })

  test('can type in the search box', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search doctors"]').first()
    await searchInput.fill('Cardiology')
    await expect(searchInput).toHaveValue('Cardiology')
  })

  test('has a search submit button', async ({ page }) => {
    const form = page.locator('form').filter({ has: page.locator('input[placeholder*="Search doctors"]') })
    const submitButton = form.locator('button[type="submit"]').first()
    await expect(submitButton).toBeVisible({ timeout: 10_000 })
  })

  test('can submit a search query', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search doctors"]').first()
    await searchInput.fill('cardiologist')

    const form = page.locator('form').filter({ has: page.locator('input[placeholder*="Search doctors"]') })
    const submitButton = form.locator('button[type="submit"]').first()
    await submitButton.click()

    // URL updates via router.replace after form submit
    await expect(page).toHaveURL(/q=cardiologist/i, { timeout: 10_000 })
  })

  test('displays a back to home link', async ({ page }) => {
    // May be a breadcrumb or "← Home" link
    const backLink = page.locator('a[href="/"]').first()
    await expect(backLink).toBeVisible({ timeout: 10_000 })
  })

  test('navigating back to home works', async ({ page }) => {
    const backLink = page.locator('a[href="/"]').first()
    await backLink.click()
    await expect(page).toHaveURL('/', { timeout: 10_000 })
  })

  test('search with query param pre-fills the input', async ({ page }) => {
    await page.goto('/search/doctors?q=Neurology')
    const searchInput = page.locator('input[placeholder*="Search doctors"]').first()
    await expect(searchInput).toHaveValue('Neurology', { timeout: 10_000 })
  })

  test('clear button appears when text is entered', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search doctors"]').first()
    await searchInput.fill('test query')

    // A clear button should appear inside the form near the input
    const form = page.locator('form').filter({ has: page.locator('input[placeholder*="Search doctors"]') })
    const clearButton = form.locator('button').filter({ hasNot: page.locator('[type="submit"]') }).first()
    await expect(clearButton).toBeVisible()
  })
})

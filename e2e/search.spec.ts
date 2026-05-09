import { test, expect } from '@playwright/test'

test.describe('Search Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/search/doctors')
    // Wait for the client component to hydrate
    await page.waitForLoadState('domcontentloaded')
  })

  test('renders the search page', async ({ page }) => {
    // ProviderSearchPage renders a search input — no visible h1/h2 heading
    const searchInput = page.locator('input[placeholder*="Search doctors"]').first()
    await expect(searchInput).toBeVisible({ timeout: 10_000 })
  })

  test('has a search input field', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search doctors"]').first()
    await expect(searchInput).toBeVisible({ timeout: 10_000 })
  })

  test('can type in the search box', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search doctors"]').first()
    await searchInput.fill('Cardiology')
    await expect(searchInput).toHaveValue('Cardiology')
  })

  test('has a search submit button', async ({ page }) => {
    // Submit button id is "{slug}-search-btn" (e.g. "doctors-search-btn")
    const submitButton = page.locator('button[type="submit"]').first()
    await expect(submitButton).toBeVisible({ timeout: 10_000 })
  })

  test('can submit a search query', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search doctors"]').first()
    await searchInput.fill('cardiologist')
    // Press Enter to submit — more reliable than clicking the submit button
    await searchInput.press('Enter')
    // URL updates after the async fetchProviders resolves
    await expect(page).toHaveURL(/q=cardiologist/i, { timeout: 15_000 })
  })

  test('displays a back to home link', async ({ page }) => {
    // Nav bar always has a link to home
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
    // useSearchParams reads the param after Suspense hydration
    const searchInput = page.locator('input[placeholder*="Search doctors"]').first()
    await expect(searchInput).toHaveValue('Neurology', { timeout: 15_000 })
  })

  test('clear button appears when text is entered', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search doctors"]').first()
    await searchInput.fill('test query')

    const form = page.locator('form').filter({ has: page.locator('input[placeholder*="Search doctors"]') })
    const clearButton = form.locator('button').filter({ hasNot: page.locator('[type="submit"]') }).first()
    await expect(clearButton).toBeVisible()
  })
})

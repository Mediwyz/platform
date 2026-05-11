import { test, expect } from '@playwright/test'

// The ProviderSearchPage input has placeholder "Search doctors by name, specialty, or location..."
// The Navbar also has a SearchAutocomplete with "Search doctors, medicines..." — always use the
// more-specific "by name, specialty" substring so we never accidentally match the nav input.
const PAGE_SEARCH = 'input[placeholder*="by name, specialty"]'

test.describe('Search Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/search/doctors')
    await page.waitForLoadState('domcontentloaded')
  })

  test('renders the search page', async ({ page }) => {
    await expect(page.locator(PAGE_SEARCH).first()).toBeVisible({ timeout: 10_000 })
  })

  test('has a search input field', async ({ page }) => {
    await expect(page.locator(PAGE_SEARCH).first()).toBeVisible({ timeout: 10_000 })
  })

  test('can type in the search box', async ({ page }) => {
    const searchInput = page.locator(PAGE_SEARCH).first()
    await searchInput.fill('Cardiology')
    await expect(searchInput).toHaveValue('Cardiology')
  })

  test('has a search submit button', async ({ page }) => {
    // Submit button id is "{slug}-search-btn" (e.g. "doctors-search-btn")
    await expect(page.locator('#doctors-search-btn')).toBeVisible({ timeout: 10_000 })
  })

  test('can submit a search query', async ({ page }) => {
    const searchInput = page.locator(PAGE_SEARCH).first()
    await searchInput.fill('cardiologist')
    // Press Enter to submit — more reliable than clicking the submit button
    await searchInput.press('Enter')
    // URL updates after the async fetchProviders resolves
    await expect(page).toHaveURL(/q=cardiologist/i, { timeout: 15_000 })
  })

  test('displays a back to home link', async ({ page }) => {
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
    await page.waitForLoadState('domcontentloaded')
    const searchInput = page.locator(PAGE_SEARCH).first()
    await expect(searchInput).toHaveValue('Neurology', { timeout: 15_000 })
  })

  test('clear button appears when text is entered', async ({ page }) => {
    const searchInput = page.locator(PAGE_SEARCH).first()
    await searchInput.fill('test query')

    const form = page.locator('form').filter({ has: page.locator(PAGE_SEARCH) })
    const clearButton = form.locator('button').filter({ hasNot: page.locator('[type="submit"]') }).first()
    await expect(clearButton).toBeVisible()
  })
})

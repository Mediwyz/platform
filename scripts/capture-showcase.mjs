/**
 * Capture landing-page showcase screenshots from the live site.
 *
 *   SHOWCASE_BASE_URL=https://mediwyz.com node scripts/capture-showcase.mjs
 *
 * Logs in as a seeded demo member and a seeded demo doctor, then screenshots
 * the key Member-journey and Provider-tools pages into public/showcase/*.png.
 * Re-run whenever the UI changes to refresh the landing-page gallery.
 *
 * Demo accounts are the seeded demo data (safe to use): emma.johnson (member),
 * sarah.johnson (doctor). Never put real user credentials here.
 */
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.SHOWCASE_BASE_URL || 'https://mediwyz.com'
const OUT = path.join(process.cwd(), 'public', 'showcase')
fs.mkdirSync(OUT, { recursive: true })

const MEMBER = { email: 'emma.johnson@mediwyz.com', password: 'Patient123!' }
const DOCTOR = { email: 'sarah.johnson@mediwyz.com', password: 'Doctor123!' }

async function shoot(page, key, urlPath) {
  try {
    await page.goto(BASE + urlPath, { waitUntil: 'domcontentloaded', timeout: 60_000 })
    // Best-effort wait for client data fetches to settle (dashboards poll, so
    // networkidle may not fire — the splash gate below is the real check).
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})

    // Block until the loading splash + skeleton placeholders clear, so we
    // capture the REAL page content and not a spinner. Falls through after the
    // timeout so a genuinely-slow page still gets a best-effort shot.
    await page.waitForFunction(() => {
      const txt = document.body?.innerText || ''
      if (/Loading your dashboard|Loading\.\.\.|Chargement/i.test(txt)) return false
      if (document.querySelector('.animate-spin')) return false
      // A skeleton screen shows many pulsing placeholders; a couple is fine.
      return document.querySelectorAll('.animate-pulse').length < 3
    }, { timeout: 20_000 }).catch(() => {})

    // Final settle for images/charts to paint.
    await page.waitForTimeout(2500)

    // Don't capture an error/not-found page (better to keep the old shot).
    const bad =
      (await page.getByText(/Page Not Found|Something went wrong|Access Denied/i).count().catch(() => 0)) > 0 ||
      page.url().includes('/login')
    if (bad) {
      console.warn('  ⚠ skipped', key, '— page was 404/login/error at', urlPath)
      return
    }
    await page.screenshot({ path: path.join(OUT, `${key}.png`) })
    console.log('  ✓ captured', key)
  } catch (e) {
    console.warn('  ⚠ skipped', key, '-', e.message)
  }
}

async function login(page, creds) {
  // Authenticate via the API directly. The login form does a native GET submit
  // when clicked before React hydrates (race), which silently fails. The API
  // call sets the session cookies (used by data fetches) on the shared context.
  const resp = await page.context().request.post(BASE + '/api/auth/login', {
    headers: { 'Content-Type': 'application/json' },
    data: { email: creds.email, password: creds.password },
  }).catch(() => null)
  const cookies = await page.context().cookies()
  const okCookie = !!resp && resp.ok() && cookies.some((c) => c.name === 'mediwyz_token')

  // useUser() reads the current user from localStorage['mediwyz_user'] — the API
  // call only sets cookies, so without this the dashboard sees no user and
  // redirects to /login (showing an endless "Loading your dashboard…" splash).
  // Seed localStorage before any page script runs so useUser resolves the user.
  let user = null
  try { user = (await resp.json())?.user } catch { /* ignore */ }
  if (user) {
    await page.addInitScript((u) => {
      try {
        localStorage.setItem('mediwyz_user', JSON.stringify(u))
        if (u.userType) localStorage.setItem('mediwyz_userType', u.userType)
        if (u.redirectPath) localStorage.setItem('mediwyz_redirectPath', u.redirectPath)
      } catch { /* ignore */ }
    }, user)
  }
  await page.waitForTimeout(300)
  console.log(okCookie && user
    ? `  → logged in as ${creds.email}`
    : `  ⚠ login failed for ${creds.email} (status ${resp ? resp.status() : 'none'})`)
}

const browser = await chromium.launch()
// Capture on a MOBILE viewport — the landing gallery shows the app in a phone
// frame, which is more attractive than desktop screenshots.
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
})
const page = await ctx.newPage()

console.log('Capturing public pages…')
await shoot(page, 'home', '/')
await shoot(page, 'find-providers', '/search/doctors')
await shoot(page, 'health-shop', '/search/health-shop')

console.log('Capturing member journey…')
// Members log in to /provider/patients/* (see auth.service redirectPath).
await login(page, MEMBER)
await shoot(page, 'member-dashboard', '/provider/patients/feed')
await shoot(page, 'member-consultations', '/provider/patients/my-consultations')
await shoot(page, 'member-billing', '/provider/patients/billing')
await shoot(page, 'member-health', '/provider/patients/ai-assistant')
await shoot(page, 'member-video', '/provider/patients/video')

console.log('Capturing provider tools…')
await ctx.clearCookies()
await login(page, DOCTOR)
await shoot(page, 'provider-dashboard', '/provider/doctors')
await shoot(page, 'provider-services', '/provider/doctors/services')
await shoot(page, 'provider-workflows', '/provider/doctors/workflows')
await shoot(page, 'provider-inventory', '/provider/doctors/inventory')
await shoot(page, 'provider-availability', '/provider/doctors/availability')

await browser.close()
console.log('Done →', OUT)

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
    // Let client data + hydration settle so cards/charts are populated.
    await page.waitForTimeout(3000)
    await page.screenshot({ path: path.join(OUT, `${key}.png`) })
    console.log('  ✓ captured', key)
  } catch (e) {
    console.warn('  ⚠ skipped', key, '-', e.message)
  }
}

async function login(page, creds) {
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page.fill('input[type="email"]', creds.email)
  await page.fill('input[type="password"]', creds.password)
  await page.click('button[type="submit"]')
  await page.waitForURL((u) => !u.pathname.endsWith('/login'), { timeout: 60_000 }).catch(() => {})
  await page.waitForTimeout(2500)
}

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1280, height: 820 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()

console.log('Capturing public pages…')
await shoot(page, 'home', '/')
await shoot(page, 'find-providers', '/search/doctors')
await shoot(page, 'health-shop', '/search/health-shop')

console.log('Capturing member journey…')
await login(page, MEMBER)
await shoot(page, 'member-dashboard', '/patient')
await shoot(page, 'member-consultations', '/patient/consultations')
await shoot(page, 'member-billing', '/patient/billing')
await shoot(page, 'member-health', '/patient/ai-assistant')
await shoot(page, 'member-video', '/patient/video')

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

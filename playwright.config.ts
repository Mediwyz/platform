import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  // Per-test timeout MUST exceed navigationTimeout below, otherwise a slow
  // first cold-start navigation (allowed up to 90s) is killed by the test
  // timeout before it can finish. 150s leaves headroom for nav + assertions.
  timeout: process.env.CI ? 150_000 : 30_000,
  globalTimeout: process.env.CI ? 20 * 60 * 1000 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: process.env.CI ? 30_000 : 15_000,
    // 90s in CI: VPS cold-start after deploy can be slow (Next.js JIT + chunk serving)
    navigationTimeout: process.env.CI ? 90_000 : 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120_000,
      },
})

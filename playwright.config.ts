import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // e2e/stack runs against booted production images via playwright.stack.config.ts.
  testIgnore: ['stack/**'],
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    // localhost, not 127.0.0.1: with NEXT_PUBLIC_SITE_URL unset (as in .env.example), the cart
    // routes' same-origin check falls back to request.url, which Next reports as
    // http://localhost:<port>, so writes from 127.0.0.1 get 403 (audit N11).
    baseURL: 'http://localhost:3017',
    trace: 'retain-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : undefined,
    ...devices['Desktop Chrome'],
  },
  webServer: [
    {
      // Fictional catalogue for PDP and bag tests (e2e/support/mock-medusa.mjs); no Medusa needed.
      command: 'node e2e/support/mock-medusa.mjs 9100',
      url: 'http://127.0.0.1:9100/health',
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: 'pnpm exec dotenv -e .env -- pnpm --filter @lopaworld/storefront exec next dev --hostname 127.0.0.1 --port 3017',
      url: 'http://localhost:3017',
      reuseExistingServer: false,
      timeout: 120_000,
      // dotenv-cli does not override variables that are already set, so these win over .env.
      env: { MEDUSA_BACKEND_URL: 'http://127.0.0.1:9100', NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: 'pk_e2e_mock' },
    },
  ],
});

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
    // localhost, not 127.0.0.1: Next reports request.url as http://localhost:<port>, and the cart
    // routes' same-origin check compares Origin with it, so writes from 127.0.0.1 get 403. That
    // check is wrong behind a proxy too; it is tracked separately (see docs/evidence/phase-2.md).
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

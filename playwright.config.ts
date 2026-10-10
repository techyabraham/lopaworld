import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:3017',
    trace: 'retain-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : undefined,
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'pnpm exec dotenv -e .env -- pnpm --filter @lopaworld/storefront exec next dev --hostname 127.0.0.1 --port 3017',
    url: 'http://127.0.0.1:3017',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});

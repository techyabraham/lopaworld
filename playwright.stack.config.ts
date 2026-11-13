import { defineConfig, devices } from '@playwright/test';

// Smoke tests against an already running production stack (the Images workflow's `stack` job boots
// the built images). No web server is started here.
export default defineConfig({
  testDir: './e2e/stack',
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.STACK_BASE_URL ?? 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
});

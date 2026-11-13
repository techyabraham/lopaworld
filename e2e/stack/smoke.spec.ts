import { expect, test } from '@playwright/test';

const medusaBaseUrl = process.env.STACK_MEDUSA_URL ?? 'http://127.0.0.1:9000';

test('health and readiness report a working stack', async ({ request }) => {
  const health = await request.get('/api/health');
  expect(health.status()).toBe(200);
  expect(await health.json()).toEqual({ status: 'ok' });

  const ready = await request.get('/api/ready');
  expect(ready.status()).toBe(200);
  expect(await ready.json()).toEqual({ status: 'ready', checks: { database: 'ok', medusa: 'ok' } });
});

test('homepage renders the site shell', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/Lopaworld/);
  await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Shop' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Open bag/ })).toBeVisible();
});

test('an empty bag shows its empty state', async ({ page }) => {
  const response = await page.goto('/bag');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Your bag is empty' })).toBeVisible();
});

test('the shop listing degrades instead of erroring without a catalogue', async ({ page }) => {
  // CI has no publishable key or products, so the listing must render its unavailable state, not a 5xx.
  const response = await page.goto('/shop');
  expect(response?.status()).toBeLessThan(500);
  await expect(page.locator('main')).toBeVisible();
});

test('both admin applications load', async ({ page, request }) => {
  const payload = await page.goto('/admin');
  expect(payload?.status()).toBe(200);
  await expect(page).toHaveTitle(/Payload/);

  const medusa = await request.get(`${medusaBaseUrl}/app`);
  expect(medusa.status()).toBe(200);
});

test('the development galleries are not served in production', async ({ request }) => {
  for (const path of ['/dev/ui', '/dev/type']) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
});

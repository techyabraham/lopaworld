import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Fictional catalogue from e2e/support/mock-medusa.mjs. The mock has no shipping options or payment,
// so the full payment happy path is not exercised here; these tests cover the restyled pages.
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const PLACEHOLDER = /Image pending|Price unavailable|Calculated by Medusa|will be added|being confirmed|not yet supplied/i;

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => { try { localStorage.setItem('lopaworld-analytics-consent', 'rejected'); } catch { /* storage blocked */ } });
});

async function fillBag(page: Page) {
  await page.goto('/bag');
  for (const [handle, variantId] of [['test-agbada', 'prod_test_agbada_var_3'], ['test-cap', 'prod_test_cap_var_0']]) {
    const status = await page.evaluate(async ([h, v]) => (await fetch('/api/cart/items', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ handle: h, variantId: v, quantity: 1 }) })).status, [handle, variantId]);
    expect(status).toBe(200);
  }
}

async function axe(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  expect(results.violations.map(({ id, impact, nodes }) => `${impact} ${id}: ${nodes.map(({ target }) => target.join(' ')).join(', ')}`), label).toEqual([]);
}

test('an empty bag shows the empty state and no placeholder copy', async ({ page }) => {
  await page.goto('/bag');
  await expect(page.getByRole('heading', { level: 2, name: 'Your bag is empty' })).toBeVisible();
  await expect(page.locator('main')).not.toContainText(PLACEHOLDER);
  await axe(page, 'empty bag');
});

test('the bag lists lines with totals and links to checkout', async ({ page }) => {
  await fillBag(page);
  await page.goto('/bag');
  await expect(page.locator('.cart-line')).toHaveCount(2);
  await expect(page.locator('.cart-totals')).toContainText('₦475,000');
  await expect(page.getByRole('link', { name: 'Continue to checkout' })).toHaveAttribute('href', '/checkout');
  await expect(page.locator('main')).not.toContainText(PLACEHOLDER);
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `overflow at ${width}`).toBeLessThanOrEqual(width);
    await axe(page, `bag ${width}`);
  }
});

test('checkout shows labelled fields and a hairline summary table', async ({ page }) => {
  await fillBag(page);
  await page.goto('/checkout');
  await expect(page.getByLabel('Email address')).toBeVisible();
  await expect(page.getByLabel('Street address')).toHaveAttribute('autocomplete', 'address-line1');
  const summary = page.getByRole('table', { name: 'Order summary' });
  await expect(summary.getByRole('row')).toHaveCount(3);
  await expect(summary).toContainText('₦475,000');
  await expect(page.getByRole('button', { name: 'Continue to secure payment' })).toBeDisabled();
  await expect(page.locator('main')).not.toContainText(PLACEHOLDER);
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `overflow at ${width}`).toBeLessThanOrEqual(width);
    await axe(page, `checkout ${width}`);
  }
});

test('customer and editorial pages carry no placeholder copy and pass axe', async ({ page }) => {
  for (const path of ['/wishlist', '/track-order', '/stories', '/checkout/confirmation/order_unknown']) {
    await page.goto(path);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).not.toContainText(PLACEHOLDER);
    await axe(page, path);
  }
});

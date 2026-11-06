import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Fictional catalogue from e2e/support/mock-medusa.mjs, including one flat delivery option and a
// Paystack stand-in whose checkout.paystack.com redirect is intercepted (no real payment is made).
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
  // Disabled until a delivery option is chosen.
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

test('checkout happy path: details, delivery, payment redirect, return, confirmation (regression)', async ({ page }) => {
  await fillBag(page);
  await page.goto('/checkout');
  await page.getByLabel('Email address').fill('guest@example.com');
  await page.getByLabel('First name').fill('Test');
  await page.getByLabel('Last name').fill('Guest');
  await page.getByLabel('Phone').fill('08000000000');
  await page.getByLabel('Street address').fill('1 Test Street');
  await page.getByLabel('City').fill('Lagos');
  await page.getByLabel('State').fill('Lagos');
  await page.getByRole('button', { name: 'Save delivery details' }).click();
  const delivery = page.getByRole('radio', { name: /Test delivery/ });
  await expect(delivery).toBeVisible();
  // Controlled radio: checkout confirms the price with the server before marking it selected.
  await delivery.click();
  await expect(delivery).toBeChecked();
  const summary = page.getByRole('table', { name: 'Order summary' });
  await expect(summary.getByRole('row', { name: /Delivery/ })).toContainText('₦5,000');
  await expect(summary.getByRole('row', { name: /Total/ })).toContainText('₦480,000');

  // Paystack is never contacted: answer the redirect with a stub page.
  await page.route('https://checkout.paystack.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Paystack (stub)</title><p>stub</p>' }));
  const pay = page.getByRole('button', { name: 'Continue to secure payment' });
  await expect(pay).toBeEnabled();
  await pay.click();
  await expect(page).toHaveURL(/^https:\/\/checkout\.paystack\.com\/mock-cart_test_/);

  await page.goto('/checkout/return');
  await expect(page).toHaveURL(/\/checkout\/confirmation\/order_test_\d+$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Thank you for your order' })).toBeVisible();
  await expect(page.locator('.order-reference')).toHaveText(/^order_test_\d+$/);
  await axe(page, 'confirmation');
  // The completed cart is gone: the bag is empty again.
  await page.goto('/bag');
  await expect(page.getByRole('heading', { level: 2, name: 'Your bag is empty' })).toBeVisible();
});

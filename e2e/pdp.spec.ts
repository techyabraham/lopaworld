import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Runs against the fictional catalogue in e2e/support/mock-medusa.mjs (started by playwright.config.ts).
// `test-agbada`: colours Forest / Ivory gold / Midnight; sizes 38-48 with 38 and 48 sold out and 42 at 1 left;
// complete_the_look lists three single-variant pieces.
const PDP = '/p/test-agbada';

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => { try { localStorage.setItem('lopaworld-analytics-consent', 'rejected'); } catch { /* storage blocked */ } });
});

async function openPdp(page: Page) {
  await page.goto(PDP);
  // Wait for hydration: the size buttons only respond once React has attached.
  await expect(page.locator('.purchase-panel')).toBeVisible();
  await page.waitForFunction(() => Object.keys(document.querySelector('.lw-size-selector button') ?? {}).some((key) => key.startsWith('__react')));
}

const cta = (page: Page) => page.locator('.purchase-panel .add-to-bag');

test('size selection updates the add-to-bag text and sold-out sizes are disabled', async ({ page }) => {
  await openPdp(page);
  await expect(cta(page)).toHaveText('Choose a size');
  await expect(cta(page)).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Size 38, sold out' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Size 48, sold out' })).toBeDisabled();
  await page.getByRole('button', { name: 'Size 44' }).click();
  await expect(cta(page)).toHaveText('Add to bag — size 44');
  await expect(cta(page)).toBeEnabled();
  await page.getByRole('button', { name: 'Size 42, 1 left' }).click();
  await expect(page.locator('.product-option-size legend')).toHaveText('Size — 42 · last one');
});

test('add to bag shows the success strip and updates the bag count', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPdp(page);
  await page.getByRole('button', { name: 'Size 44' }).click();
  await cta(page).click();
  await expect(page.locator('.product-success')).toContainText('Added to bag — Test agbada, Forest, size 44.');
  await expect(page.locator('.product-success').getByRole('link', { name: 'View bag' })).toHaveAttribute('href', '/bag');
  await expect(page.locator('.header-bag')).toContainText('1');
});

test('Complete the Entrance adds every piece and updates the bag count', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPdp(page);
  const section = page.getByRole('region', { name: /Complete the entrance/i });
  await expect(section.getByRole('listitem')).toHaveCount(3);
  await section.getByRole('button', { name: /^Add all three · / }).click();
  await expect(section.getByRole('status')).toContainText('Added all 3 pieces to your bag.');
  await expect(page.locator('.header-bag')).toContainText('3');
});

test('the PDP hides unconfirmed modules', async ({ page }) => {
  await openPdp(page);
  const body = page.locator('main');
  await expect(body).not.toContainText(/WhatsApp|Made to measure|Ships in|duties|delivering to/i);
  // No published `returns` page in the test database, so no Returns accordion.
  await expect(page.locator('summary', { hasText: 'Returns' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Save for later' })).toBeVisible();
});

test('the phone sticky bar asks for a size and takes the customer to the size selector', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openPdp(page);
  const sticky = page.locator('.sticky-add-bar');
  await expect(sticky).toBeVisible();
  await sticky.getByRole('button', { name: 'Choose a size' }).click();
  await expect(page.getByRole('button', { name: 'Size 40' })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('the PDP has no WCAG 2.2 AA axe violations at phone and desktop widths', async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await openPdp(page);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations.map(({ id, impact, nodes }) => `${impact} ${id}: ${nodes.map(({ target }) => target.join(' ')).join(', ')}`), `axe at ${width}px`).toEqual([]);
  }
});

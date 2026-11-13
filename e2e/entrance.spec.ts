import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// §8: hero label switch, mobile tab bar, label category rail, Data Saver, dev gallery.
// Fictional data: e2e/support/mock-medusa.mjs and components/dev/gallery-fixtures.ts.
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => { try { localStorage.setItem('lopaworld-analytics-consent', 'rejected'); } catch { /* blocked */ } });
});

const hydrated = (page: Page, selector: string) => page.waitForFunction((sel) => Object.keys(document.querySelector(sel) ?? {}).some((key) => key.startsWith('__react')), selector);

test('the hero label switch re-casts data-label and the CTA, by pointer and keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/dev/ui');
  const hero = page.locator('.entrance-hero');
  await hydrated(page, '.entrance-index [role="tab"]');
  await expect(hero).toHaveAttribute('data-label', 'trybe');
  await expect(hero.getByRole('link', { name: 'Enter Lopa Trybe' })).toHaveAttribute('href', '/l/trybe');
  await page.getByRole('tab', { name: /Lopa Prime/ }).click();
  await expect(hero).toHaveAttribute('data-label', 'prime');
  await expect(hero.getByRole('link', { name: 'Enter Lopa Prime' })).toHaveAttribute('href', '/l/prime');
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: /Lopa Bridal/ })).toBeFocused();
  await expect(page.getByRole('tab', { name: /Lopa Bridal/ })).toHaveAttribute('aria-selected', 'true');
  await expect(hero).toHaveAttribute('data-label', 'bridal');
  await page.keyboard.press('Home');
  await expect(hero).toHaveAttribute('data-label', 'trybe');
  await page.keyboard.press('Enter');
  await expect(hero).toHaveAttribute('data-label', 'trybe');
});

test('the mobile tab bar navigates and hides while typing in search', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const bar = page.getByRole('navigation', { name: 'App' });
  await expect(bar).toBeVisible();
  await hydrated(page, '.mobile-tab-bar a');
  await bar.getByRole('link', { name: 'Search' }).click();
  await expect(page).toHaveURL(/\/search$/);
  await expect(bar.getByRole('link', { name: 'Search' })).toHaveAttribute('aria-current', 'page');
  const search = page.getByRole('searchbox', { name: 'Search products' });
  await search.focus();
  await page.keyboard.type('agbada');
  await expect(bar).toHaveAttribute('data-hidden', 'true');
  await search.blur();
  await expect(bar).not.toHaveAttribute('data-hidden');
  await expect(bar).toBeInViewport();
  // next dev's issue badge (the CSP eval() notice) sits over the bar's second item; production has no overlay.
  await page.evaluate(() => document.querySelector('nextjs-portal')?.remove());
  await bar.getByRole('link', { name: 'Labels' }).click();
  await expect(page).toHaveURL(/\/labels$/);
});

test('the label page category rail links to its categories and marks the current one', async ({ page }) => {
  await page.goto('/l/trybe');
  const rail = page.locator('.category-rail');
  await expect(rail.getByRole('link', { name: /Agbada/ })).toHaveAttribute('href', '/l/trybe/agbada');
  await rail.getByRole('link', { name: /Agbada/ }).click();
  await expect(page).toHaveURL(/\/l\/trybe\/agbada$/);
  await expect(page.locator('.category-rail a[aria-current]')).toContainText('Agbada');
  await expect(page.locator('main.label-page')).toHaveAttribute('data-label', 'trybe');
  // The Lookbook toggle needs an active campaign, which the schema cannot store yet (ADR-014).
  await expect(page.getByRole('link', { name: 'Lookbook' })).toHaveCount(0);
});

test('Data Saver: a 3G connection skips the tiles\' second images', async ({ page }) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 300, downloadThroughput: 750 * 1024 / 8, uploadThroughput: 250 * 1024 / 8, connectionType: 'cellular3g' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/shop');
  expect(await page.evaluate(() => (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType)).toMatch(/2g|3g/);
  await expect(page.locator('html')).toHaveAttribute('data-save-data', '');
  const alt = page.locator('.product-tile-alt').first();
  await expect(alt).toHaveCount(1);
  expect(await alt.evaluate((img) => getComputedStyle(img).display)).toBe('none');
});

test('without Data Saver the second image stays available for hover', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/shop');
  await expect(page.locator('html')).not.toHaveAttribute('data-save-data', '');
  expect(await page.locator('.product-tile-alt').first().evaluate((img) => getComputedStyle(img).display)).not.toBe('none');
});

test('the dev gallery shows every Entrance pattern and passes axe', async ({ page }) => {
  for (const width of [360, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/dev/ui');
    for (const heading of [/Entrance hero/, /The Drop/, /Occasion tiles/, /Product tile badges/, /Mobile tab bar/, /made to measure/, /group orders/]) {
      await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible();
    }
    for (const badge of ['Sold out', 'Only 2 left', 'Made to order', 'New']) await expect(page.locator('.product-tile-badge', { hasText: badge }).first()).toBeVisible();
    await expect(page.getByRole('tab', { name: /Made to measure/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Dress the whole party/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Size XS, sold out' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Size L, 1 left' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `overflow at ${width}`).toBeLessThanOrEqual(width);
    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    expect(results.violations.map(({ id, impact, nodes }) => `${impact} ${id}: ${nodes.map(({ target }) => target.join(' ')).join(', ')}`), `axe at ${width}`).toEqual([]);
  }
});

test('flagged modules stay off the storefront while their flags are off', async ({ page }) => {
  for (const path of ['/', '/p/test-agbada']) {
    await page.goto(path);
    await expect(page.locator('.mtm, .group-order')).toHaveCount(0);
  }
});

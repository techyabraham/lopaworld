import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const widths = [360, 480, 768, 1024, 1280, 1536];

test('type specimen renders required glyphs without horizontal overflow at every breakpoint', async ({ page }) => {
  await page.goto('/dev/type');
  await expect(page.getByRole('heading', { name: 'Type specimen' })).toBeVisible();
  await expect(page.getByText(/LOPA TRYBE · Modern nativewear · ₦150,000 · Size 36 · Lagos delivery · Ẹ̀wù ọ̀ṣọ́ ṣẹ́ẹ̀ ń/).first()).toBeVisible();

  const fonts = await page.evaluate(async () => {
    const sample = 'LOPA TRYBE · Modern nativewear · ₦150,000 · Size 36 · Lagos delivery · Ẹ̀wù ọ̀ṣọ́ ṣẹ́ẹ̀ ń';
    await Promise.all([
      document.fonts.load('500 24px "Bodoni Moda"', sample),
      document.fonts.load('400 16px "DM Sans"', sample),
      document.fonts.load('400 16px "Noto Serif"', sample),
    ]);
    const names = ['editorialFont', 'interfaceFont', 'glyphFallbackFont'];
    await Promise.all(names.map((name) => document.fonts.load(`400 16px "${name}"`, sample)));
    return names.map((name) => document.fonts.check(`400 16px "${name}"`, sample));
  });
  expect(fonts).toEqual([true, true, true]);

  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `horizontal overflow at ${width}px`).toBeLessThanOrEqual(width);
  }
});

test('type specimen galleries have no WCAG 2.2 AA axe violations', async ({ page }) => {
  for (const width of [360, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/dev/type');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations, `axe violations at ${width}px`).toEqual([]);
  }
});

test('shared component gallery has no WCAG 2.2 AA axe violations at mobile and desktop widths', async ({ page }) => {
  for (const width of [360, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/dev/ui');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations, `axe violations at ${width}px`).toEqual([]);
  }
});

test('modal traps keyboard focus, closes with Escape, and restores focus', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/dev/ui');
  const open = page.getByRole('button', { name: 'Open modal' });
  await open.focus();
  await open.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Size guide' });
  await expect(dialog).toBeVisible();
  const close = page.getByRole('button', { name: 'Close dialog' });
  await expect(close).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Done' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(open).toBeFocused();
});

test('tabs switch with arrow keys and selectors expose their selected state', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/dev/ui');
  const detailsTab = page.getByRole('tab', { name: 'Details' });
  await detailsTab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Care' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel')).toContainText('Care information.');
  await expect(page.getByRole('button', { name: 'M', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Forest' })).toHaveAttribute('aria-pressed', 'true');
});

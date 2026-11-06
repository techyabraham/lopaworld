import { expect, test } from '@playwright/test';

// The analytics prompt is part of the server HTML (so a first visit paints it with the page), and a
// pre-paint script hides it for visitors who already chose.
const KEY = 'lopaworld-analytics-consent';

test('the server HTML carries the consent prompt', async ({ request }) => {
  const html = await (await request.get('/')).text();
  expect(html).toContain('class="consent-panel"');
  expect(html).toContain('data-consent-answered');
});

for (const stored of [null, 'rejected', 'accepted'] as const) {
  test(`consent prompt before and after hydration (stored: ${stored ?? 'nothing'})`, async ({ page }) => {
    if (stored) await page.addInitScript(([key, value]) => { try { localStorage.setItem(key, value); } catch { /* blocked */ } }, [KEY, stored]);
    // 1. Before hydration: abort the app's scripts so only the server HTML and the inline pre-paint
    //    script run.
    await page.route('**/_next/static/chunks/**/*.js', (route) => route.abort());
    await page.goto('/');
    const panel = page.locator('.consent-panel');
    // The prompt must still be in the DOM (React has not run), so "hidden" can only come from the
    // pre-paint script plus CSS, never from React removing it.
    await expect(panel).toHaveCount(1);
    expect(await page.evaluate(() => Object.keys(document.querySelector('footer button') ?? {}).some((key) => key.startsWith('__react')))).toBe(false);
    if (stored) await expect(panel).toBeHidden(); else await expect(panel).toBeVisible();
    // 2. After hydration: a normal load.
    await page.unroute('**/_next/static/chunks/**/*.js');
    await page.goto('/');
    await page.waitForFunction(() => Object.keys(document.querySelector('footer button') ?? {}).some((key) => key.startsWith('__react')));
    if (stored) {
      await expect(panel).toHaveCount(0);
      await page.getByRole('button', { name: 'Privacy choices' }).click();
      await expect(panel).toBeVisible();
    } else {
      await expect(panel).toBeVisible();
      await panel.getByRole('button', { name: 'Reject optional' }).click();
      await expect(panel).toHaveCount(0);
    }
  });
}

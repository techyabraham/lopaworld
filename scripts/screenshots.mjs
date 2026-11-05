#!/usr/bin/env node
// Full-page screenshots of the key storefront routes for Phase 2 evidence.
// Usage: node scripts/screenshots.mjs <baseUrl> <outDir> [widths=390,1440] [productHandle]
// With no product handle, the first /p/<handle> link found on /shop is used; if there is none
// (no local catalogue), a placeholder handle is captured so the PDP's empty state is recorded.
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const [baseUrl = 'http://127.0.0.1:3000', outDir = 'docs/evidence/phase-2/before', widthArg = '390,1440', handleArg] = process.argv.slice(2);
const widths = widthArg.split(',').map(Number).filter(Boolean);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
try {
  const probe = await browser.newPage();
  await probe.goto(new URL('/shop', baseUrl).href, { waitUntil: 'networkidle' });
  const found = handleArg ?? await probe.locator('a[href^="/p/"]').first().getAttribute('href', { timeout: 2000 }).then((href) => href?.replace('/p/', '')).catch(() => null);
  await probe.close();
  const handle = found ?? 'no-local-catalogue';
  const routes = [['home', '/'], ['label-trybe', '/l/trybe'], ['shop', '/shop'], [`pdp-${handle}`, `/p/${handle}`], ['bag', '/bag'], ['checkout', '/checkout']];

  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    // Pre-answer the analytics prompt (privacy-preserving choice) so it does not cover the page.
    await context.addInitScript(() => { try { localStorage.setItem('lopaworld-analytics-consent', 'rejected'); } catch {} });
    const page = await context.newPage();
    for (const [name, route] of routes) {
      const response = await page.goto(new URL(route, baseUrl).href, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const file = path.join(outDir, `${name}-${width}.png`);
      await page.screenshot({ path: file, fullPage: true });
      console.log(`${String(response?.status()).padEnd(4)} ${width}px ${route} -> ${file}`);
    }
    await context.close();
  }
} finally {
  await browser.close();
}

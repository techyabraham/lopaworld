// Serves the production storefront for Lighthouse CI (`pnpm test:lhci`, ADR-015): the standalone
// server from `pnpm --filter @lopaworld/storefront build` plus the fictional Store API in
// e2e/support/mock-medusa.mjs. Needs a migrated DATABASE_URL (Payload) and a build made with a
// non-placeholder NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY (it is inlined at build time).
import { spawn } from 'node:child_process';
import { cpSync, existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const app = `${root}apps/storefront`;
const standalone = `${app}/.next/standalone/apps/storefront`;
const port = process.env.LHCI_PORT ?? '3000';
const mockPort = process.env.MOCK_MEDUSA_PORT ?? '9100';

if (!existsSync(`${standalone}/server.js`)) {
  console.error('No standalone build. Run `pnpm --filter @lopaworld/storefront build` first.');
  process.exit(1);
}
// server.js serves public/ and .next/static only when they sit beside it (as in the Dockerfile).
for (const [from, to] of [[`${app}/public`, `${standalone}/public`], [`${app}/.next/static`, `${standalone}/.next/static`]]) {
  rmSync(to, { recursive: true, force: true });
  cpSync(from, to, { recursive: true });
}

const children = [];
const start = (args, env) => {
  const child = spawn(process.execPath, args, { cwd: root, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'inherit'] });
  child.stdout.pipe(process.stdout);
  child.on('exit', (code) => { if (code) { console.error(`${args[0]} exited with ${code}`); process.exit(code); } });
  children.push(child);
  return child;
};
const stop = () => { for (const child of children) child.kill(); process.exit(0); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

start(['e2e/support/mock-medusa.mjs', mockPort], {});
// HOSTNAME=127.0.0.1: the cart routes' same-origin check compares Origin with the URL Next reports
// (localhost); see docs/evidence/phase-2.md. Lighthouse only reads pages, so this does not matter here.
start([`${standalone}/server.js`], { NODE_ENV: 'production', PORT: port, HOSTNAME: '127.0.0.1', MEDUSA_BACKEND_URL: `http://127.0.0.1:${mockPort}` });

const base = `http://localhost:${port}`;
for (let attempt = 0; attempt < 120; attempt += 1) {
  try {
    // Warm each audited route once so the first Lighthouse run does not pay Payload's first connect.
    const responses = await Promise.all(['/', '/l/trybe', '/shop', '/p/test-agbada'].map((path) => fetch(base + path)));
    if (responses.every((response) => response.ok)) { console.log(`lhci server ready on ${base}`); break; }
  } catch { /* not up yet */ }
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

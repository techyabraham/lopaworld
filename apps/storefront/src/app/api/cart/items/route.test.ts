import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCookieJar } from '../../../../test/cookie-jar';

const { jar } = vi.hoisted(() => ({ jar: { current: undefined as unknown as ReturnType<typeof createCookieJar> } }));

vi.mock('next/headers', () => ({ cookies: async () => jar.current.store }));
vi.mock('../../../../lib/request-security', () => ({ isSameOriginRequest: () => true }));

const addToBag = () => new Request('http://localhost:3000/api/cart/items', {
  method: 'POST',
  body: JSON.stringify({ handle: 'agbada-test', variantId: 'variant_test', quantity: 1 }),
});

beforeEach(() => {
  vi.resetModules();
  jar.current = createCookieJar();
  // No publishable key: medusaFetch throws an internal configuration message on the first call.
  vi.stubEnv('NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY', '');
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('POST /api/cart/items without a cart cookie (B12)', () => {
  it('returns a generic message and logs the internal detail server-side', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { POST } = await import('./route');

    const response = await POST(addToBag());
    const body = await response.json() as { error: string };

    expect(response.status).toBe(503);
    expect(body.error).toBe('Your bag could not be updated. Please try again.');
    expect(body.error).not.toMatch(/medusa|publishable|key/i);
    expect(JSON.stringify(log.mock.calls)).toContain('Medusa publishable API key is not configured.');
  });
});

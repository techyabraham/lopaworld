import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCookieJar } from '../test/cookie-jar';

const { jar } = vi.hoisted(() => ({ jar: { current: undefined as unknown as ReturnType<typeof createCookieJar> } }));

vi.mock('next/headers', () => ({ cookies: async () => jar.current.store }));
vi.mock('./request-security', () => ({ isSameOriginRequest: () => true }));

type Route = (body: unknown) => { status?: number; json: unknown };
const ngn = { id: 'reg_ngn', currency_code: 'ngn', name: 'Nigeria' };
let routes: Record<string, Route>;
let fetchMock: ReturnType<typeof vi.fn>;

/** Routes Medusa Store API calls by `METHOD /path`; unknown routes fail the test loudly. */
function stubMedusa(extra: Record<string, Route>) {
  routes = { 'GET /store/regions': () => ({ json: { regions: [ngn] } }), ...extra };
  fetchMock = vi.fn(async (url: string, init: RequestInit = {}) => {
    const key = `${init.method ?? 'GET'} ${new URL(url).pathname}`;
    const route = routes[key];
    if (!route) throw new Error(`Unexpected Medusa call: ${key}`);
    const { status = 200, json } = route(init.body ? JSON.parse(String(init.body)) : undefined);
    return new Response(JSON.stringify(json), { status, headers: { 'content-type': 'application/json' } });
  });
  vi.stubGlobal('fetch', fetchMock);
}

const missing: Route = () => ({ status: 404, json: { type: 'not_found', message: 'Cart with id: cart_old was not found' } });
const createsNewCart: Route = () => ({ json: { cart: { id: 'cart_new', region_id: 'reg_ngn' } } });
const calls = (key: string) => fetchMock.mock.calls.filter(([url, init = {}]) => `${(init as RequestInit).method ?? 'GET'} ${new URL(url as string).pathname}` === key).length;

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY', 'pk_test_unit');
  vi.stubEnv('MEDUSA_REGION_ID', '');
  jar.current = createCookieJar();
  jar.current.values.set('lw_cart_id', 'cart_old');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('createOrReadCart (B3)', () => {
  it('replaces a cart Medusa no longer has', async () => {
    stubMedusa({ 'GET /store/carts/cart_old': missing, 'POST /store/carts': createsNewCart });
    const { createOrReadCart } = await import('./cart');

    expect(await createOrReadCart()).toBe('cart_new');
    expect(jar.current.values.get('lw_cart_id')).toBe('cart_new');
  });

  it('replaces a cart that has already been completed', async () => {
    stubMedusa({
      'GET /store/carts/cart_old': () => ({ json: { cart: { id: 'cart_old', region_id: 'reg_ngn', completed_at: '2026-11-01T10:00:00Z' } } }),
      'POST /store/carts': createsNewCart,
    });
    const { createOrReadCart } = await import('./cart');

    expect(await createOrReadCart()).toBe('cart_new');
    expect(jar.current.values.get('lw_cart_id')).toBe('cart_new');
  });

  it('replaces a cart in a different region from the store region', async () => {
    stubMedusa({
      'GET /store/carts/cart_old': () => ({ json: { cart: { id: 'cart_old', region_id: 'reg_retired', completed_at: null } } }),
      'POST /store/carts': createsNewCart,
    });
    const { createOrReadCart } = await import('./cart');

    expect(await createOrReadCart()).toBe('cart_new');
  });

  it('keeps a usable cart', async () => {
    stubMedusa({ 'GET /store/carts/cart_old': () => ({ json: { cart: { id: 'cart_old', region_id: 'reg_ngn', completed_at: null } } }) });
    const { createOrReadCart } = await import('./cart');

    expect(await createOrReadCart()).toBe('cart_old');
    expect(calls('POST /store/carts')).toBe(0);
  });

  it('keeps the cookie and creates nothing when Medusa fails for another reason', async () => {
    stubMedusa({ 'GET /store/carts/cart_old': () => ({ status: 503, json: {} }) });
    const { createOrReadCart } = await import('./cart');

    await expect(createOrReadCart()).rejects.toThrow();
    expect(jar.current.values.get('lw_cart_id')).toBe('cart_old');
    expect(calls('POST /store/carts')).toBe(0);
  });
});

describe('bag and checkout reads (B3)', () => {
  it('GET /api/cart shows an empty bag and clears a stale cookie instead of returning 503', async () => {
    stubMedusa({ 'GET /store/carts/cart_old': missing });
    const { GET } = await import('../app/api/cart/route');

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ cart: null });
    expect(jar.current.values.has('lw_cart_id')).toBe(false);
  });

  it('GET /api/cart returns a usable cart', async () => {
    const cart = { id: 'cart_old', region_id: 'reg_ngn', completed_at: null, items: [] };
    stubMedusa({ 'GET /store/carts/cart_old': () => ({ json: { cart } }) });
    const { GET } = await import('../app/api/cart/route');

    expect(await (await GET()).json()).toEqual({ cart });
  });

  it('GET /api/checkout treats a completed cart as an empty bag', async () => {
    stubMedusa({ 'GET /store/carts/cart_old': () => ({ json: { cart: { id: 'cart_old', region_id: 'reg_ngn', completed_at: '2026-11-01T10:00:00Z' } } }) });
    const { GET } = await import('../app/api/checkout/route');

    const response = await GET();

    expect(response.status).toBe(404);
    expect(jar.current.values.has('lw_cart_id')).toBe(false);
  });
});

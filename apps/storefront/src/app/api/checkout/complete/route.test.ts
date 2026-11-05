import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCookieJar } from '../../../../test/cookie-jar';

const { jar, medusaFetch } = vi.hoisted(() => ({
  jar: { current: undefined as unknown as ReturnType<typeof createCookieJar> },
  medusaFetch: vi.fn(),
}));

vi.mock('next/headers', () => ({ cookies: async () => jar.current.store }));
vi.mock('../../../../lib/store', () => ({ medusaFetch }));
vi.mock('../../../../lib/cart', () => ({ cartCookie: 'lw_cart_id' }));
vi.mock('../../../../lib/request-security', () => ({ isSameOriginRequest: () => true }));

import { POST } from './route';

const request = () => new Request('http://localhost:3000/api/checkout/complete', { method: 'POST' });

beforeEach(() => {
  jar.current = createCookieJar();
  medusaFetch.mockReset();
});

describe('POST /api/checkout/complete (B1)', () => {
  it('completes the current cart even when an order cookie from an earlier checkout exists', async () => {
    jar.current.values.set('lw_order_id', 'order_old');
    jar.current.values.set('lw_cart_id', 'cart_new');
    medusaFetch.mockImplementation(async (path: string) => {
      if (path.startsWith('/store/carts/cart_new?')) return { cart: { email: 'guest@example.com', completed_at: null } };
      if (path === '/store/carts/cart_new/complete') return { type: 'order', order: { id: 'order_new' } };
      throw new Error(`Unexpected Medusa call: ${path}`);
    });

    const response = await POST(request());

    expect(await response.json()).toEqual({ complete: true, orderId: 'order_new' });
    expect(medusaFetch).toHaveBeenCalledWith('/store/carts/cart_new/complete', expect.objectContaining({ method: 'POST' }));
    expect(jar.current.values.get('lw_order_id')).toBe('order_new');
    expect(jar.current.values.has('lw_cart_id')).toBe(false);
  });

  it('reports a pending current cart instead of the earlier order', async () => {
    jar.current.values.set('lw_order_id', 'order_old');
    jar.current.values.set('lw_cart_id', 'cart_new');
    medusaFetch.mockImplementation(async (path: string) => {
      if (path.startsWith('/store/carts/cart_new?')) return { cart: { email: 'guest@example.com', completed_at: null } };
      if (path === '/store/carts/cart_new/complete') return { type: 'cart' };
      throw new Error(`Unexpected Medusa call: ${path}`);
    });

    const response = await POST(request());

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ complete: false, pending: true });
    expect(jar.current.values.get('lw_cart_id')).toBe('cart_new');
  });

  it('returns the order this browser just completed when no cart is awaiting completion', async () => {
    jar.current.values.set('lw_order_id', 'order_done');

    const response = await POST(request());

    expect(await response.json()).toEqual({ complete: true, orderId: 'order_done' });
    expect(medusaFetch).not.toHaveBeenCalled();
  });

  it('returns 404 when there is neither a cart nor a completed order', async () => {
    const response = await POST(request());

    expect(response.status).toBe(404);
    expect(medusaFetch).not.toHaveBeenCalled();
  });
});

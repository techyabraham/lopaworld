import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCookieJar } from '../../../test/cookie-jar';

const { jar, medusaFetch } = vi.hoisted(() => ({
  jar: { current: undefined as unknown as ReturnType<typeof createCookieJar> },
  medusaFetch: vi.fn(),
}));

vi.mock('next/headers', () => ({ cookies: async () => jar.current.store }));
vi.mock('../../../lib/store', () => ({ medusaFetch }));
vi.mock('../../../lib/cart', () => ({ cartCookie: 'lw_cart_id', cartFields: '*items' }));
vi.mock('../../../lib/request-security', () => ({ isSameOriginRequest: () => true }));

import { POST as saveCheckoutDetails } from './route';
import { POST as startPayment } from './payment/route';

const post = (path: string, body: unknown) => new Request(`http://localhost:3000${path}`, { method: 'POST', body: JSON.stringify(body) });

beforeEach(() => {
  jar.current = createCookieJar();
  jar.current.values.set('lw_order_id', 'order_old');
  jar.current.values.set('lw_cart_id', 'cart_new');
  medusaFetch.mockReset();
  medusaFetch.mockRejectedValue(new Error('Medusa unavailable in this test'));
});

describe('starting a new checkout clears the previous order cookie (B1)', () => {
  it('POST /api/checkout', async () => {
    await saveCheckoutDetails(post('/api/checkout', {
      email: 'guest@example.com', first_name: 'Ada', last_name: 'Obi', address_1: '1 Test Street',
      city: 'Lagos', province: 'Lagos', phone: '+2348000000000', country_code: 'NG',
    }));

    expect(jar.current.values.has('lw_order_id')).toBe(false);
  });

  it('POST /api/checkout/payment', async () => {
    await startPayment(post('/api/checkout/payment', { shippingOptionId: 'so_test' }));

    expect(jar.current.values.has('lw_order_id')).toBe(false);
  });
});

import 'server-only';
import { cookies } from 'next/headers';
import { getStoreRegion, MedusaStoreError, medusaFetch } from './store';
import type { StoreCart } from './cart-types';

export const cartCookie = 'lw_cart_id';
export const cartFields = '*items,*items.variant,*items.variant.options,*items.product,*items.product.metadata,*items.metadata,+items.variant.inventory_quantity';

type CartState = { completed_at?: string | null; region_id?: string };

/**
 * Reads the cart named by the cart cookie. A cart Medusa no longer has, one already completed, or
 * one in a different region from the store's is unusable: the cookie is cleared and null returned.
 * Other Medusa failures are rethrown so a temporary outage never discards a customer's bag.
 */
export async function retrieveUsableCart<T extends StoreCart = StoreCart>(fields: string): Promise<(T & CartState) | null> {
  const cookieJar = await cookies();
  const cartId = cookieJar.get(cartCookie)?.value;
  if (!cartId) return null;
  let cart: T & CartState;
  try {
    const params = new URLSearchParams({ fields: `${fields},+completed_at,+region_id` });
    ({ cart } = await medusaFetch<{ cart: T & CartState }>(`/store/carts/${encodeURIComponent(cartId)}?${params}`));
  } catch (error) {
    if (error instanceof MedusaStoreError && error.status === 404) {
      cookieJar.delete(cartCookie);
      return null;
    }
    throw error;
  }
  const region = cart.completed_at ? null : await getStoreRegion();
  if (cart.completed_at || (region && cart.region_id && cart.region_id !== region.id)) {
    cookieJar.delete(cartCookie);
    return null;
  }
  return cart;
}

export async function createOrReadCart() {
  const existing = await retrieveUsableCart('id');
  if (existing) return existing.id;
  const region = await getStoreRegion();
  if (!region) throw new Error('An NGN sales region is not configured in Medusa.');
  const { cart } = await medusaFetch<{ cart: StoreCart }>('/store/carts', {
    method: 'POST',
    body: JSON.stringify({ region_id: region.id }),
  });
  (await cookies()).set(cartCookie, cart.id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return cart.id;
}

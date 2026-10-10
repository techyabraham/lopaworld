import 'server-only';
import { cookies } from 'next/headers';
import { getStoreRegion, medusaFetch } from './store';
import type { StoreCart } from './cart-types';

export const cartCookie = 'lw_cart_id';
export const cartFields = '*items,*items.variant,*items.variant.options,*items.product,*items.product.metadata,*items.metadata,+items.variant.inventory_quantity';

export async function createOrReadCart() {
  const cookieJar = await cookies();
  const existing = cookieJar.get(cartCookie)?.value;
  if (existing) return existing;
  const region = await getStoreRegion();
  if (!region) throw new Error('An NGN sales region is not configured in Medusa.');
  const { cart } = await medusaFetch<{ cart: StoreCart }>('/store/carts', {
    method: 'POST',
    body: JSON.stringify({ region_id: region.id }),
  });
  cookieJar.set(cartCookie, cart.id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return cart.id;
}

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { medusaFetch } from '../../../lib/store';
import type { StoreCart } from '../../../lib/cart-types';
import { cartCookie, cartFields } from '../../../lib/cart';

export async function GET() {
  const cookieJar = await cookies();
  const cartId = cookieJar.get(cartCookie)?.value;
  if (!cartId) return NextResponse.json({ cart: null }, { headers: { 'Cache-Control': 'no-store' } });
  try {
    const params = new URLSearchParams({ fields: cartFields });
    const { cart } = await medusaFetch<{ cart: StoreCart }>(`/store/carts/${encodeURIComponent(cartId)}?${params}`);
    return NextResponse.json({ cart }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Your bag is temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

export async function DELETE() {
  const cookieJar = await cookies();
  cookieJar.delete(cartCookie);
  return NextResponse.json({ cart: null }, { headers: { 'Cache-Control': 'no-store' } });
}

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createOrReadCart, cartCookie, cartFields } from '../../../../lib/cart';
import { medusaFetch, retrieveStoreProduct, variantIsAvailable } from '../../../../lib/store';
import { isSameOriginRequest } from '../../../../lib/request-security';
import type { StoreCart } from '../../../../lib/cart-types';

type CartResponse = { cart: StoreCart };

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'This request could not be verified.' }, { status: 403 });
  const body = await request.json().catch(() => null) as { handle?: unknown; variantId?: unknown; quantity?: unknown; notes?: unknown } | null;
  if (!body || typeof body.handle !== 'string' || typeof body.variantId !== 'string' || !Number.isInteger(body.quantity) || Number(body.quantity) < 1 || Number(body.quantity) > 20) {
    return NextResponse.json({ error: 'Choose a valid product option and quantity.' }, { status: 400 });
  }
  try {
    const product = await retrieveStoreProduct(body.handle);
    const variant = product?.variants?.find(({ id }) => id === body.variantId);
    if (!product || !variant) return NextResponse.json({ error: 'That product option is no longer available.' }, { status: 404 });
    const madeToOrder = product.metadata?.made_to_order === true;
    if (!variantIsAvailable(variant, madeToOrder)) return NextResponse.json({ error: 'This option is sold out.' }, { status: 409 });
    const cartId = await createOrReadCart();
    const params = new URLSearchParams({ fields: cartFields });
    const { cart: current } = await medusaFetch<CartResponse>(`/store/carts/${encodeURIComponent(cartId)}?${params}`);
    const existingQuantity = (current.items ?? []).filter((item) => item.variant?.id === variant.id).reduce((sum, item) => sum + item.quantity, 0);
    if (!madeToOrder && variant.manage_inventory !== false && !variant.allow_backorder && Number.isFinite(variant.inventory_quantity) && existingQuantity + Number(body.quantity) > (variant.inventory_quantity ?? 0)) {
      return NextResponse.json({ error: 'The requested quantity is above current stock.' }, { status: 409 });
    }
    const quantity = Number(body.quantity);
    const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 500) : '';
    const { cart } = await medusaFetch<CartResponse>(`/store/carts/${encodeURIComponent(cartId)}/line-items`, {
      method: 'POST',
      body: JSON.stringify({
        variant_id: variant.id,
        quantity,
        ...(madeToOrder && notes ? { metadata: { made_to_order_notes: notes } } : {}),
      }),
    });
    return NextResponse.json({ cart }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const cookieJar = await cookies();
    if (!cookieJar.get(cartCookie)) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Your bag could not be updated.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Your bag could not be updated. Please try again.' }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'This request could not be verified.' }, { status: 403 });
  const body = await request.json().catch(() => null) as { itemId?: unknown; quantity?: unknown } | null;
  if (!body || typeof body.itemId !== 'string' || !Number.isInteger(body.quantity) || Number(body.quantity) < 1 || Number(body.quantity) > 20) {
    return NextResponse.json({ error: 'Choose a valid quantity.' }, { status: 400 });
  }
  try {
    const cookieJar = await cookies();
    const cartId = cookieJar.get(cartCookie)?.value;
    if (!cartId) return NextResponse.json({ error: 'Your bag is empty.' }, { status: 404 });
    const params = new URLSearchParams({ fields: cartFields });
    const { cart: current } = await medusaFetch<CartResponse>(`/store/carts/${encodeURIComponent(cartId)}?${params}`);
    const item = current.items?.find(({ id }) => id === body.itemId);
    if (!item) return NextResponse.json({ error: 'That item is no longer in your bag.' }, { status: 404 });
    const madeToOrder = item.product?.metadata?.made_to_order === true;
    const variant = item.variant;
    const quantity = Number(body.quantity);
    const otherQuantity = variant?.id ? (current.items ?? []).filter((entry) => entry.id !== item.id && entry.variant?.id === variant.id).reduce((sum, entry) => sum + entry.quantity, 0) : 0;
    if (!madeToOrder && variant && variant.manage_inventory !== false && !variant.allow_backorder && Number.isFinite(variant.inventory_quantity) && otherQuantity + quantity > (variant.inventory_quantity ?? 0)) {
      return NextResponse.json({ error: 'The requested quantity is above current stock.' }, { status: 409 });
    }
    const { cart } = await medusaFetch<CartResponse>(`/store/carts/${encodeURIComponent(cartId)}/line-items/${encodeURIComponent(body.itemId)}`, {
      method: 'POST',
      body: JSON.stringify({ quantity }),
    });
    return NextResponse.json({ cart }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Your bag could not be updated. Please try again.' }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'This request could not be verified.' }, { status: 403 });
  const itemId = new URL(request.url).searchParams.get('itemId');
  const cookieJar = await cookies();
  const cartId = cookieJar.get(cartCookie)?.value;
  if (!cartId || !itemId) return NextResponse.json({ error: 'That item is no longer in your bag.' }, { status: 404 });
  try {
    const result = await medusaFetch<{ parent?: StoreCart }>(`/store/carts/${encodeURIComponent(cartId)}/line-items/${encodeURIComponent(itemId)}`, { method: 'DELETE' });
    return NextResponse.json({ cart: result.parent ?? null }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'That item could not be removed.' }, { status: 503 });
  }
}

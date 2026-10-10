import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { cartCookie, cartFields } from '../../../../lib/cart';
import type { StoreCart } from '../../../../lib/cart-types';
import { medusaFetch } from '../../../../lib/store';
import { isSameOriginRequest } from '../../../../lib/request-security';

type ShippingOption = { id: string; price_type?: string };

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'This request could not be verified.' }, { status: 403 });
  const body = await request.json().catch(() => null) as { shippingOptionId?: unknown } | null;
  const cartId = (await cookies()).get(cartCookie)?.value;
  if (!cartId) return NextResponse.json({ error: 'Your bag is empty.' }, { status: 404 });
  if (typeof body?.shippingOptionId !== 'string' || !body.shippingOptionId) {
    return NextResponse.json({ error: 'Choose an available delivery option.' }, { status: 400 });
  }

  try {
    const { shipping_options = [] } = await medusaFetch<{ shipping_options: ShippingOption[] }>(`/store/shipping-options?cart_id=${encodeURIComponent(cartId)}`);
    const option = shipping_options.find(({ id }) => id === body.shippingOptionId);
    if (!option) return NextResponse.json({ error: 'That delivery option is no longer available. Refresh checkout to see current options.' }, { status: 409 });
    if (option.price_type === 'calculated') {
      await medusaFetch(`/store/shipping-options/${encodeURIComponent(option.id)}/calculate`, {
        method: 'POST',
        body: JSON.stringify({ cart_id: cartId, data: {} }),
      });
    }
    await medusaFetch(`/store/carts/${encodeURIComponent(cartId)}/shipping-methods`, {
      method: 'POST',
      body: JSON.stringify({ option_id: option.id }),
    });
    const params = new URLSearchParams({ fields: `${cartFields},subtotal,shipping_total,tax_total,total,shipping_methods` });
    const { cart } = await medusaFetch<{ cart: StoreCart }>(`/store/carts/${encodeURIComponent(cartId)}?${params}`);
    return NextResponse.json({ cart }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'That delivery price could not be confirmed. Please choose another option or try again.' }, { status: 503 });
  }
}

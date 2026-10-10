import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { cartCookie } from '../../../../lib/cart';
import type { StoreCart } from '../../../../lib/cart-types';
import { medusaFetch } from '../../../../lib/store';
import { isSameOriginRequest } from '../../../../lib/request-security';

type ShippingOption = { id: string; name: string; price_type?: string };
type PaymentCollection = { id: string; payment_sessions?: Array<{ provider_id: string; data?: { authorization_url?: string } }> };

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'This request could not be verified.' }, { status: 403 });
  const body = await request.json().catch(() => null) as { shippingOptionId?: unknown } | null;
  if (typeof body?.shippingOptionId !== 'string' || !body.shippingOptionId) {
    return NextResponse.json({ error: 'Choose an available delivery option.' }, { status: 400 });
  }
  const cartId = (await cookies()).get(cartCookie)?.value;
  if (!cartId) return NextResponse.json({ error: 'Your bag is empty.' }, { status: 404 });

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
    const fields = 'id,region_id,currency_code,email,total,shipping_address,shipping_methods,*payment_collection,*items';
    let { cart } = await medusaFetch<{ cart: StoreCart & { email?: string; shipping_address?: { country_code?: string }; payment_collection?: PaymentCollection } }>(`/store/carts/${encodeURIComponent(cartId)}?fields=${encodeURIComponent(fields)}`);
    if (!cart.shipping_methods?.some(({ shipping_option_id }) => shipping_option_id === option.id)) {
      await medusaFetch(`/store/carts/${encodeURIComponent(cartId)}/shipping-methods`, {
        method: 'POST',
        body: JSON.stringify({ option_id: option.id }),
      });
      ({ cart } = await medusaFetch<{ cart: StoreCart & { email?: string; shipping_address?: { country_code?: string }; payment_collection?: PaymentCollection } }>(`/store/carts/${encodeURIComponent(cartId)}?fields=${encodeURIComponent(fields)}`));
    }
    if (!cart.email || cart.shipping_address?.country_code?.toLowerCase() !== 'ng' || cart.currency_code?.toLowerCase() !== 'ngn') {
      return NextResponse.json({ error: 'Checkout needs a valid email, Nigerian address, and NGN pricing.' }, { status: 400 });
    }

    let collection = cart.payment_collection;
    if (!collection) {
      const created = await medusaFetch<{ payment_collection: PaymentCollection }>('/store/payment-collections', {
        method: 'POST',
        body: JSON.stringify({ cart_id: cartId }),
      });
      collection = created.payment_collection;
    }
    const providerId = 'pp_paystack_paystack';
    const session = await medusaFetch<{ payment_collection: PaymentCollection }>(`/store/payment-collections/${encodeURIComponent(collection.id)}/payment-sessions`, {
      method: 'POST',
      body: JSON.stringify({ provider_id: providerId, data: { email: cart.email } }),
    });
    const paymentSession = session.payment_collection.payment_sessions?.find(({ provider_id }) => provider_id === providerId);
    const authorizationUrl = paymentSession?.data?.authorization_url;
    let isPaystackAuthorizationUrl = false;
    try {
      const parsed = new URL(authorizationUrl ?? '');
      isPaystackAuthorizationUrl = parsed.protocol === 'https:' && parsed.hostname === 'checkout.paystack.com';
    } catch {
      isPaystackAuthorizationUrl = false;
    }
    if (!authorizationUrl || !isPaystackAuthorizationUrl) {
      return NextResponse.json({ error: 'Secure payment could not be started. Please try again later.' }, { status: 503 });
    }
    return NextResponse.json({ authorizationUrl }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Payment is not configured yet. Please contact Lopaworld before placing an order.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

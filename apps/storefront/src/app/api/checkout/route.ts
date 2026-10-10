import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { cartCookie, cartFields } from '../../../lib/cart';
import type { StoreCart } from '../../../lib/cart-types';
import { medusaFetch } from '../../../lib/store';
import { isSameOriginRequest } from '../../../lib/request-security';

type ShippingOption = {
  id: string;
  name: string;
  price_type?: string;
  amount?: number;
  currency_code?: string;
  calculated_price?: { calculated_amount?: number; currency_code?: string } | null;
};

async function listCheckoutShippingOptions(cartId: string) {
  const { shipping_options = [] } = await medusaFetch<{ shipping_options: ShippingOption[] }>(`/store/shipping-options?cart_id=${encodeURIComponent(cartId)}`);
  return Promise.all(shipping_options.map(async (option) => {
    if (option.price_type !== 'calculated') return option;
    try {
      const { shipping_option } = await medusaFetch<{ shipping_option: ShippingOption }>(`/store/shipping-options/${encodeURIComponent(option.id)}/calculate`, {
        method: 'POST',
        body: JSON.stringify({ cart_id: cartId, data: {} }),
      });
      return shipping_option;
    } catch {
      return null;
    }
  }));
}

async function paystackIsEnabled(regionId?: string) {
  if (!regionId) return false;
  try {
    const { payment_providers = [] } = await medusaFetch<{ payment_providers: Array<{ id: string }> }>(`/store/payment-providers?region_id=${encodeURIComponent(regionId)}`);
    return payment_providers.some(({ id }) => id === 'pp_paystack_paystack');
  } catch {
    return false;
  }
}

export async function GET() {
  const cartId = (await cookies()).get(cartCookie)?.value;
  if (!cartId) return NextResponse.json({ error: 'Your bag is empty.' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  try {
    const params = new URLSearchParams({ fields: `${cartFields},email,shipping_address,billing_address,shipping_methods,*shipping_methods.shipping_option,*payment_collection` });
    const { cart } = await medusaFetch<{ cart: StoreCart & { region_id?: string } }>(`/store/carts/${encodeURIComponent(cartId)}?${params}`);
    const [shippingOptions, paymentEnabled] = await Promise.all([
      listCheckoutShippingOptions(cartId),
      paystackIsEnabled(cart.region_id),
    ]);
    return NextResponse.json({ cart, shippingOptions: shippingOptions.filter(Boolean), paymentEnabled }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Checkout is temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'This request could not be verified.' }, { status: 403 });
  const data = await request.json().catch(() => null) as Record<string, unknown> | null;
  const cartId = (await cookies()).get(cartCookie)?.value;
  if (!cartId) return NextResponse.json({ error: 'Your bag is empty.' }, { status: 404 });

  const string = (key: string) => typeof data?.[key] === 'string' ? (data[key] as string).trim() : '';
  const email = string('email');
  const firstName = string('first_name');
  const lastName = string('last_name');
  const address1 = string('address_1');
  const city = string('city');
  const province = string('province');
  const phone = string('phone');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !firstName || !lastName || !address1 || !city || !province || !phone || string('country_code').toUpperCase() !== 'NG') {
    return NextResponse.json({ error: 'Enter a valid email, phone number, recipient name, and complete Nigerian delivery address.' }, { status: 400 });
  }

  const address = {
    first_name: firstName.slice(0, 100),
    last_name: lastName.slice(0, 100),
    address_1: address1.slice(0, 250),
    address_2: string('address_2').slice(0, 250),
    city: city.slice(0, 100),
    province: province.slice(0, 100),
    postal_code: string('postal_code').slice(0, 24),
    country_code: 'ng',
    phone: phone.slice(0, 40),
  };

  try {
    const { cart } = await medusaFetch<{ cart: StoreCart }>(`/store/carts/${encodeURIComponent(cartId)}`, {
      method: 'POST',
      body: JSON.stringify({ email, shipping_address: address, billing_address: address }),
    });
    const [shippingOptions, paymentEnabled] = await Promise.all([
      listCheckoutShippingOptions(cartId),
      paystackIsEnabled((cart as StoreCart & { region_id?: string }).region_id),
    ]);
    return NextResponse.json({ cart, shippingOptions: shippingOptions.filter(Boolean), paymentEnabled }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Your delivery details could not be saved. Please try again.' }, { status: 503 });
  }
}

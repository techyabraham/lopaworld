import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { cartCookie } from '../../../../lib/cart';
import { medusaFetch } from '../../../../lib/store';

const orderCookie = 'lw_order_id';
type CompletedOrder = { id: string };

async function findCompletedOrder(cartId: string) {
  try {
    const { cart } = await medusaFetch<{ cart: { email?: string; completed_at?: string | null } }>(`/store/carts/${encodeURIComponent(cartId)}?fields=email,completed_at`);
    if (!cart.completed_at || !cart.email) return null;
    const result = await medusaFetch<{ orderId?: string | null }>('/store/checkout/orders/lookup', {
      method: 'POST',
      body: JSON.stringify({ cart_id: cartId, email: cart.email }),
    });
    return result.orderId ?? null;
  } catch {
    return null;
  }
}

async function completeResponse(orderId: string) {
  const cookieJar = await cookies();
  cookieJar.set(orderCookie, orderId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  cookieJar.delete(cartCookie);
  return NextResponse.json({ complete: true, orderId }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST() {
  const cookieJar = await cookies();
  const savedOrderId = cookieJar.get(orderCookie)?.value;
  if (savedOrderId) return NextResponse.json({ complete: true, orderId: savedOrderId }, { headers: { 'Cache-Control': 'no-store' } });
  const cartId = cookieJar.get(cartCookie)?.value;
  if (!cartId) return NextResponse.json({ complete: false, error: 'No checkout is awaiting confirmation.' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });

  const completedOrder = await findCompletedOrder(cartId);
  if (completedOrder) return completeResponse(completedOrder);

  try {
    const result = await medusaFetch<{ type?: string; order?: CompletedOrder; error?: { type?: string } }>(`/store/carts/${encodeURIComponent(cartId)}/complete`, { method: 'POST', body: JSON.stringify({}) });
    if (result.type !== 'order' || !result.order?.id) {
      if (result.error?.type === 'payment_authorization_error') {
        return NextResponse.json({ complete: false, failed: true, error: 'Paystack did not confirm this payment. You can return to checkout and try another approved payment method.' }, { status: 402, headers: { 'Cache-Control': 'no-store' } });
      }
      return NextResponse.json({ complete: false, pending: true }, { status: 202, headers: { 'Cache-Control': 'no-store' } });
    }
    return completeResponse(result.order.id);
  } catch {
    // Medusa performs the provider verification during completion. Keep retrying while its
    // provider or webhook is still processing; never infer payment success from the URL.
    const orderId = await findCompletedOrder(cartId);
    if (orderId) return completeResponse(orderId);
    return NextResponse.json({ complete: false, pending: true }, { status: 202, headers: { 'Cache-Control': 'no-store' } });
  }
}

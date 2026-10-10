import { NextResponse } from 'next/server';
import { medusaFetch } from '../../../lib/store';

export async function POST(request: Request) {
  const input = await request.json().catch(() => null) as { orderNumber?: unknown; email?: unknown } | null;
  const orderNumber = typeof input?.orderNumber === 'string' ? input.orderNumber.trim() : '';
  const email = typeof input?.email === 'string' ? input.email.trim().toLowerCase() : '';
  if (!/^\d{1,12}$/.test(orderNumber) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid order number and email address.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }
  try {
    const result = await medusaFetch<{ order?: { orderNumber: number; createdAt: string; status: string; paymentStatus: string; fulfillmentStatus: string } }>('/store/orders/lookup', {
      method: 'POST',
      body: JSON.stringify({ order_number: orderNumber, email }),
    });
    if (!result.order) return NextResponse.json({ error: 'We could not find an order with those details.' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Order tracking is temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

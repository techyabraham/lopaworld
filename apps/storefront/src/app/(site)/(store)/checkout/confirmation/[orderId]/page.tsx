import Link from 'next/link';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { TrackEvent } from '../../../../../../components/site/TrackEvent';
import { orderCookie as orderCookieName } from '../../../../../../lib/order-cookie';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Order confirmation', robots: { index: false, follow: false } };

export default async function OrderConfirmationPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const orderCookie = (await cookies()).get(orderCookieName)?.value;
  if (!orderCookie || orderCookie !== orderId) {
    return <main className="store-page checkout-return"><p className="lw-eyebrow">Order confirmation</p><h1 className="lw-display">Order details unavailable</h1><p>This order confirmation can only be viewed in the browser that completed checkout.</p><Link className="lw-button" href="/shop">Continue shopping</Link></main>;
  }
  return <main className="store-page checkout-return"><TrackEvent name="purchase" params={{ transaction_id: orderId }} /><p className="lw-eyebrow">Order confirmed</p><h1 className="lw-display">Thank you for your order</h1><p>Your order is placed. Keep this reference for your records:</p><p className="order-reference">{orderId}</p><Link className="lw-button" href="/shop">Continue shopping</Link></main>;
}

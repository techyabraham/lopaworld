import Link from 'next/link';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { TrackEvent } from '../../../../../components/site/TrackEvent';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Order confirmation', robots: { index: false, follow: false } };

export default async function OrderConfirmationPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const orderCookie = (await cookies()).get('lw_order_id')?.value;
  if (!orderCookie || orderCookie !== orderId) {
    return <main className="store-page checkout-return"><p className="eyebrow">Order confirmation</p><h1>Order details unavailable</h1><p>This order confirmation can only be viewed in the browser that completed checkout.</p><Link href="/shop">Continue shopping</Link></main>;
  }
  return <main className="store-page checkout-return"><TrackEvent name="purchase" params={{ transaction_id: orderId }} /><p className="eyebrow">Order confirmed</p><h1>Thank you for your order</h1><p>Medusa confirmed your checkout. Keep this order reference for your records:</p><p className="order-reference">{orderId}</p><p>Guest order tracking and transaction emails will be added after their account and service details are confirmed.</p><Link className="lw-button" href="/shop">Continue shopping</Link></main>;
}

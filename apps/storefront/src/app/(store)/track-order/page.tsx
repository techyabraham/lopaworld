import type { Metadata } from 'next';
import { GuestOrderLookup } from '../../../components/account/GuestOrderLookup';

export const metadata: Metadata = { title: 'Track an order | Lopaworld' };

export default function TrackOrderPage() {
  return <main className="page-shell customer-page">
    <p className="eyebrow">Order support</p>
    <h1>Track your order</h1>
    <p>Enter the order number and the email address used at checkout to see its current store status.</p>
    <GuestOrderLookup />
  </main>;
}

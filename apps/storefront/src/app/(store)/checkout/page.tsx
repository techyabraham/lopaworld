import type { Metadata } from 'next';
import { CheckoutForm } from '../../../components/checkout/CheckoutForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Checkout', robots: { index: false, follow: false } };

export default function CheckoutPage() {
  return <main className="store-page checkout-page"><p className="eyebrow">Lopaworld</p><h1>Checkout</h1><CheckoutForm /></main>;
}

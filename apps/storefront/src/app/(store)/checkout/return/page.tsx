import type { Metadata } from 'next';
import { PaymentReturn } from '../../../../components/checkout/PaymentReturn';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Payment status', robots: { index: false, follow: false } };

export default function CheckoutReturnPage() {
  return <main className="store-page"><PaymentReturn /></main>;
}

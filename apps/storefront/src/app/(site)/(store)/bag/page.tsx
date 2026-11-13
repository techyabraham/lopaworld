import type { Metadata } from 'next';
import { CartContents } from '../../../../components/cart/CartContents';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Your bag', robots: { index: false, follow: false } };

export default function BagPage() {
  return <main className="store-page bag-page"><p className="lw-eyebrow">Your selection</p><h1 className="lw-display">Your bag</h1><CartContents showReviewLink={false} showCheckoutLink />
  </main>;
}

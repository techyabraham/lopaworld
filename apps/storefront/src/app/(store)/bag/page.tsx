import { CartContents } from '../../../components/cart/CartContents';

export const dynamic = 'force-dynamic';

export default function BagPage() {
  return <main className="store-page bag-page"><p className="eyebrow">Your selection</p><h1>Your bag</h1><CartContents showReviewLink={false} showCheckoutLink />
  </main>;
}

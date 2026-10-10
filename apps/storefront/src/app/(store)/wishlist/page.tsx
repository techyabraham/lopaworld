import type { Metadata } from 'next';
import { Wishlist } from '../../../components/account/Wishlist';

export const metadata: Metadata = { title: 'Wishlist', robots: { index: false, follow: false } };

export default function WishlistPage() {
  return <main className="page-shell customer-page"><p className="eyebrow">Your saved pieces</p><h1>Wishlist</h1><p>This wishlist is stored in this browser. Account syncing will be added when customer accounts are enabled.</p><Wishlist /></main>;
}

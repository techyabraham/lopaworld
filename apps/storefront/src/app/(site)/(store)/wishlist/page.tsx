import type { Metadata } from 'next';
import { Wishlist } from '../../../../components/account/Wishlist';

export const metadata: Metadata = { title: 'Wishlist', robots: { index: false, follow: false } };

export default function WishlistPage() {
  return <main className="page-shell customer-page"><p className="lw-eyebrow">Your saved pieces</p><h1 className="lw-display">Saved</h1><p>Saved pieces are kept in this browser on this device.</p><Wishlist /></main>;
}

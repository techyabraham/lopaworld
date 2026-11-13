'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { EmptyState } from '@lopaworld/ui';

type SavedItem = { id: string; handle: string; title: string; image?: string };
const KEY = 'lopaworld-wishlist-v1';

export function Wishlist() {
  const [items, setItems] = useState<SavedItem[]>([]);
  useEffect(() => {
    const read = () => {
      try { setItems(JSON.parse(localStorage.getItem(KEY) ?? '[]') as SavedItem[]); }
      catch { setItems([]); }
    };
    read();
    window.addEventListener('lopaworld-wishlist-change', read);
    window.addEventListener('storage', read);
    return () => { window.removeEventListener('lopaworld-wishlist-change', read); window.removeEventListener('storage', read); };
  }, []);

  if (!items.length) return <div className="cart-empty"><EmptyState title="Nothing saved yet" description="Save pieces from their product pages to keep them here on this device." /><Link className="lw-button" href="/shop">Explore the collection</Link></div>;
  return <ul className="wishlist-list">{items.map((item) => <li key={item.id}>
    <Link href={`/p/${encodeURIComponent(item.handle)}`}>
      {item.image ? <img src={item.image} alt="" width="160" height="200" loading="lazy" decoding="async" /> : <span className="wishlist-blank" aria-hidden="true" />}
      <span className="wishlist-title">{item.title}</span>
    </Link>
    <button type="button" className="text-button" aria-label={`Remove ${item.title}`} onClick={() => {
      const next = items.filter(({ id }) => id !== item.id);
      localStorage.setItem(KEY, JSON.stringify(next));
      setItems(next);
      window.dispatchEvent(new Event('lopaworld-wishlist-change'));
    }}>Remove</button>
  </li>)}</ul>;
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

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

  if (!items.length) return <p>Your wishlist is empty. Save pieces from their product pages to keep them here on this device.</p>;
  return <ul className="wishlist-list">{items.map((item) => <li key={item.id}>
    <Link href={`/p/${encodeURIComponent(item.handle)}`}>
      {item.image ? <img src={item.image} alt="" width="160" height="200" /> : <span className="media-placeholder">Image pending</span>}
      <span>{item.title}</span>
    </Link>
    <button type="button" onClick={() => {
      const next = items.filter(({ id }) => id !== item.id);
      localStorage.setItem(KEY, JSON.stringify(next));
      setItems(next);
      window.dispatchEvent(new Event('lopaworld-wishlist-change'));
    }}>Remove</button>
  </li>)}</ul>;
}

'use client';

import { useEffect, useState } from 'react';

const KEY = 'lopaworld-wishlist-v1';
type SavedItem = { id: string; handle: string; title: string; image?: string };

export function WishlistButton({ item }: { item: SavedItem }) {
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const list = JSON.parse(localStorage.getItem(KEY) ?? '[]') as SavedItem[];
    setSaved(list.some(({ id }) => id === item.id));
  }, [item.id]);

  function toggle() {
    const list = JSON.parse(localStorage.getItem(KEY) ?? '[]') as SavedItem[];
    const next = list.some(({ id }) => id === item.id) ? list.filter(({ id }) => id !== item.id) : [...list, item];
    localStorage.setItem(KEY, JSON.stringify(next));
    setSaved(next.some(({ id }) => id === item.id));
    window.dispatchEvent(new Event('lopaworld-wishlist-change'));
  }

  return <button className="wishlist-toggle" type="button" aria-pressed={saved} onClick={toggle}>{saved ? 'Saved to wishlist' : 'Save to wishlist'}</button>;
}

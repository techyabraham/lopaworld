'use client';

import { useLocalStorageValue } from '../../lib/use-local-storage-value';

const KEY = 'lopaworld-wishlist-v1';
const CHANGE_EVENT = 'lopaworld-wishlist-change';
type SavedItem = { id: string; handle: string; title: string; image?: string };

function parseList(raw: string | null | undefined): SavedItem[] {
  try {
    const list = JSON.parse(raw ?? '[]') as unknown;
    return Array.isArray(list) ? list as SavedItem[] : [];
  } catch {
    return [];
  }
}

export function WishlistButton({ item }: { item: SavedItem }) {
  const saved = parseList(useLocalStorageValue(KEY, CHANGE_EVENT)).some(({ id }) => id === item.id);

  function toggle() {
    const list = parseList(localStorage.getItem(KEY));
    const next = list.some(({ id }) => id === item.id) ? list.filter(({ id }) => id !== item.id) : [...list, item];
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return <button className="wishlist-toggle" type="button" aria-pressed={saved} onClick={toggle}>{saved ? 'Saved to wishlist' : 'Save to wishlist'}</button>;
}

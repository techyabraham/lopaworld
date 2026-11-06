'use client';

import { useSyncExternalStore } from 'react';

// One shared bag count for the header and the mobile tab bar: a single /api/cart request,
// refreshed whenever something dispatches `lw:cart-updated`.
let count = 0;
let started = false;
const listeners = new Set<() => void>();

function refresh() {
  void fetch('/api/cart', { cache: 'no-store' })
    .then((response) => response.json())
    .then((body: { cart?: { items?: Array<{ quantity: number }> } | null }) => {
      count = (body.cart?.items ?? []).reduce((sum, item) => sum + item.quantity, 0);
      listeners.forEach((listener) => listener());
    })
    .catch(() => undefined);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!started) {
    started = true;
    window.addEventListener('lw:cart-updated', refresh);
    refresh();
  }
  return () => { listeners.delete(listener); };
}

/** Sets the count directly (e.g. from the bag sheet's fresh cart) and notifies subscribers. */
export function setBagCount(value: number) {
  count = value;
  listeners.forEach((listener) => listener());
}

export function useBagCount() {
  return useSyncExternalStore(subscribe, () => count, () => 0);
}

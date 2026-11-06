'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { EmptyState, QuantityStepper } from '@lopaworld/ui';
import type { StoreCart, StoreCartItem } from '../../lib/cart-types';

const money = (amount: number | undefined, currency: string | undefined) => typeof amount === 'number'
  ? new Intl.NumberFormat('en-NG', { style: 'currency', currency: currency?.toUpperCase() ?? 'NGN', maximumFractionDigits: 0 }).format(amount)
  : null;

export function CartContents({ active = true, onCountChange, showReviewLink = true, showCheckoutLink = false }: { active?: boolean; onCountChange?: (count: number) => void; showReviewLink?: boolean; showCheckoutLink?: boolean }) {
  const [cart, setCart] = useState<StoreCart | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/cart', { cache: 'no-store' });
      const body = await response.json() as { cart?: StoreCart | null; error?: string };
      if (!response.ok) throw new Error(body.error ?? 'Your bag is temporarily unavailable.');
      const next = body.cart ?? null;
      setCart(next);
      onCountChange?.((next?.items ?? []).reduce((sum, item) => sum + item.quantity, 0));
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Your bag is temporarily unavailable.');
    }
  }, [onCountChange]);

  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [active, refresh]);

  async function mutate(url: string, init: RequestInit, key: string) {
    setBusy(key);
    try {
      const response = await fetch(url, init);
      const body = await response.json() as { cart?: StoreCart | null; error?: string };
      if (!response.ok) throw new Error(body.error ?? 'Your bag could not be updated.');
      setCart(body.cart ?? null);
      onCountChange?.((body.cart?.items ?? []).reduce((sum, item) => sum + item.quantity, 0));
      setError(null);
      window.dispatchEvent(new Event('lw:cart-updated'));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Your bag could not be updated.');
    } finally {
      setBusy(null);
    }
  }

  if (error && !cart) return <p className="cart-message" role="alert">{error}</p>;
  if (!cart?.items?.length) return <div className="cart-empty"><EmptyState title="Your bag is empty" description="When you find a piece you love, it will be here." /><Link className="lw-button" href="/shop">Explore the collection</Link></div>;

  return <div className="cart-contents">
    {error && <p className="cart-message" role="alert">{error}</p>}
    <ul className="cart-list">{cart.items.map((item) => <CartLine key={item.id} item={item} currency={cart.currency_code} busy={busy === item.id} onChange={(quantity) => void mutate('/api/cart/items', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ itemId: item.id, quantity }) }, item.id)} onRemove={() => void mutate(`/api/cart/items?itemId=${encodeURIComponent(item.id)}`, { method: 'DELETE' }, item.id)} />)}</ul>
    {money(cart.subtotal ?? cart.total, cart.currency_code) && <div className="cart-totals"><span>Subtotal</span><strong>{money(cart.subtotal ?? cart.total, cart.currency_code)}</strong></div>}
    <p className="cart-note">Delivery and any applicable taxes are calculated at checkout. Items are not reserved in your bag.</p>
    <div className="cart-actions">
      {showCheckoutLink && <Link className="lw-button lw-button-buy" href="/checkout">Continue to checkout</Link>}
      {showReviewLink && <Link className="lw-button" data-variant="secondary" href="/bag">View full bag</Link>}
    </div>
  </div>;
}

function CartLine({ item, currency, busy, onChange, onRemove }: { item: StoreCartItem; currency?: string; busy: boolean; onChange: (quantity: number) => void; onRemove: () => void }) {
  const title = item.product?.title ?? item.title ?? 'Product';
  const options = (item.variant?.options ?? []).map(({ option, value }) => option?.title ? `${option.title}: ${value}` : value).filter(Boolean);
  const madeToOrderNote = item.metadata?.made_to_order_notes;
  return <li className="cart-line">
    {item.thumbnail ? <img src={item.thumbnail} alt="" width="96" height="120" loading="lazy" /> : <span className="cart-line-blank" aria-hidden="true" />}
    <div className="cart-line-details">
      {item.product?.handle ? <Link className="cart-line-title" href={`/p/${item.product.handle}`}>{title}</Link> : <span className="cart-line-title">{title}</span>}
      {options.length > 0 && <p>{options.join(' · ')}</p>}
      {typeof madeToOrderNote === 'string' && madeToOrderNote && <p>Made-to-order note: {madeToOrderNote}</p>}
      {money(item.unit_price, currency) && <p>{money(item.unit_price, currency)} each</p>}
      <QuantityStepper value={item.quantity} max={20} onChange={onChange} />
      <button className="text-button" type="button" disabled={busy} onClick={onRemove}>Remove</button>
    </div>
    <strong className="cart-line-total">{money(item.total, currency)}</strong>
  </li>;
}

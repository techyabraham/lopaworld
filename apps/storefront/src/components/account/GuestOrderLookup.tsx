'use client';

import { FormEvent, useState } from 'react';

type OrderStatus = {
  orderNumber: number;
  createdAt: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
};

const title = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export function GuestOrderLookup() {
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOrder(null);
    setError('');
    setBusy(true);
    const values = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/track-order', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ orderNumber: values.get('orderNumber'), email: values.get('email') }),
      });
      const result = await response.json() as { order?: OrderStatus; error?: string };
      if (!response.ok || !result.order) throw new Error(result.error ?? 'We could not find an order with those details.');
      setOrder(result.order);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Order tracking is temporarily unavailable.');
    } finally {
      setBusy(false);
    }
  }

  return <div className="customer-tool">
    <form className="customer-form" onSubmit={submit}>
      <label>Order number<input name="orderNumber" inputMode="numeric" autoComplete="off" required pattern="[0-9]{1,12}" /></label>
      <label>Checkout email<input name="email" type="email" autoComplete="email" required /></label>
      <button className="button button-primary" disabled={busy}>{busy ? 'Looking up…' : 'View order status'}</button>
      {error && <p role="alert" className="form-error">{error}</p>}
    </form>
    {order && <section className="order-status" aria-live="polite" aria-label="Order status">
      <h2>Order #{order.orderNumber}</h2>
      <p>Placed {new Date(order.createdAt).toLocaleDateString()}</p>
      <dl><div><dt>Order</dt><dd>{title(order.status)}</dd></div><div><dt>Payment</dt><dd>{title(order.paymentStatus)}</dd></div><div><dt>Fulfilment</dt><dd>{title(order.fulfillmentStatus)}</dd></div></dl>
      <p>Courier tracking details are not available here yet.</p>
    </section>}
  </div>;
}

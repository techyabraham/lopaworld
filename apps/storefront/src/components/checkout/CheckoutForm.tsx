'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { StoreCart } from '../../lib/cart-types';
import { trackStoreEvent } from '../../lib/analytics';

type ShippingOption = {
  id: string;
  name: string;
  calculated_price?: { calculated_amount?: number; currency_code?: string } | null;
  amount?: number;
};

type CheckoutAddress = { first_name?: string; last_name?: string; phone?: string; address_1?: string; address_2?: string; city?: string; province?: string; postal_code?: string; country_code?: string };
type CheckoutCart = StoreCart & { email?: string; shipping_address?: CheckoutAddress };
type CheckoutState = { cart?: CheckoutCart; shippingOptions?: ShippingOption[]; paymentEnabled?: boolean; error?: string };
const money = (amount: number | undefined, currency = 'NGN') => typeof amount === 'number'
  ? new Intl.NumberFormat('en-NG', { style: 'currency', currency: currency.toUpperCase(), maximumFractionDigits: 0 }).format(amount)
  : 'Calculated by Medusa';

export function CheckoutForm() {
  const [cart, setCart] = useState<StoreCart | null>(null);
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [paymentEnabled, setPaymentEnabled] = useState(false);
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [values, setValues] = useState({ email: '', first_name: '', last_name: '', phone: '', address_1: '', address_2: '', city: '', province: '', postal_code: '', country_code: 'NG' });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/checkout', { cache: 'no-store' });
      const result = await response.json() as CheckoutState;
      if (!response.ok) throw new Error(result.error ?? 'Checkout is temporarily unavailable.');
      setCart(result.cart ?? null);
      setOptions(result.shippingOptions ?? []);
      setPaymentEnabled(result.paymentEnabled === true);
      const address = result.cart?.shipping_address;
      if (address?.country_code?.toLowerCase() === 'ng') {
        setValues({
          email: result.cart?.email ?? '',
          first_name: address.first_name ?? '',
          last_name: address.last_name ?? '',
          phone: address.phone ?? '',
          address_1: address.address_1 ?? '',
          address_2: address.address_2 ?? '',
          city: address.city ?? '',
          province: address.province ?? '',
          postal_code: address.postal_code ?? '',
          country_code: 'NG',
        });
        setSaved(true);
        setSelected(result.cart?.shipping_methods?.[0]?.shipping_option_id ?? '');
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Checkout is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  function setField(key: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function saveAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(values) });
      const result = await response.json() as CheckoutState;
      if (!response.ok) throw new Error(result.error ?? 'Delivery details could not be saved.');
      setCart(result.cart ?? null);
      setOptions(result.shippingOptions ?? []);
      setPaymentEnabled(result.paymentEnabled === true);
      setSelected('');
      setSaved(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Delivery details could not be saved.');
    } finally {
      setBusy(false);
    }
  }

  async function pay() {
    if (!selected) return;
    trackStoreEvent({ name: 'begin_checkout', params: { currency: cart?.currency_code ?? 'NGN', value: cart?.total ?? 0, item_count: cart?.items?.length ?? 0 } });
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/checkout/payment', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ shippingOptionId: selected }) });
      const result = await response.json() as { authorizationUrl?: string; error?: string };
      if (!response.ok || !result.authorizationUrl) throw new Error(result.error ?? 'Secure payment could not be started.');
      window.location.assign(result.authorizationUrl);
    } catch (reason) {
      trackStoreEvent({ name: 'payment_failed', params: { stage: 'initialization' } });
      setError(reason instanceof Error ? reason.message : 'Secure payment could not be started.');
      setBusy(false);
    }
  }

  async function chooseShipping(optionId: string) {
    setBusy(true);
    setSelected('');
    setError('');
    try {
      const response = await fetch('/api/checkout/shipping', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ shippingOptionId: optionId }) });
      const result = await response.json() as { cart?: StoreCart; error?: string };
      if (!response.ok || !result.cart) throw new Error(result.error ?? 'That delivery price could not be confirmed.');
      setCart(result.cart);
      setSelected(optionId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'That delivery price could not be confirmed.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="checkout-note" role="status">Loading checkout…</p>;
  if (!cart?.items?.length) return <div className="cart-empty"><h2>Your bag is empty</h2><Link className="lw-button" href="/shop">Explore the collection</Link></div>;

  return <div className="checkout-layout">
    <div className="checkout-main">
      <section className="checkout-section">
        <p className="eyebrow">1 · Delivery details</p>
        <h2>Where should we send your order?</h2>
        <form className="checkout-form" onSubmit={saveAddress}>
          <label>Email address<input autoComplete="email" type="email" required value={values.email} onChange={(e) => setField('email', e.target.value)} /></label>
          <div className="checkout-fields-two">
            <label>First name<input autoComplete="given-name" required value={values.first_name} onChange={(e) => setField('first_name', e.target.value)} /></label>
            <label>Last name<input autoComplete="family-name" required value={values.last_name} onChange={(e) => setField('last_name', e.target.value)} /></label>
          </div>
          <label>Phone<input autoComplete="tel" type="tel" required value={values.phone} onChange={(e) => setField('phone', e.target.value)} /></label>
          <label>Street address<input autoComplete="address-line1" required value={values.address_1} onChange={(e) => setField('address_1', e.target.value)} /></label>
          <label>Apartment, suite or landmark <span>(optional)</span><input autoComplete="address-line2" value={values.address_2} onChange={(e) => setField('address_2', e.target.value)} /></label>
          <div className="checkout-fields-two">
            <label>City<input autoComplete="address-level2" required value={values.city} onChange={(e) => setField('city', e.target.value)} /></label>
            <label>State<input autoComplete="address-level1" required value={values.province} onChange={(e) => setField('province', e.target.value)} /></label>
          </div>
          <div className="checkout-fields-two">
            <label>Postal code <span>(optional)</span><input autoComplete="postal-code" value={values.postal_code} onChange={(e) => setField('postal_code', e.target.value)} /></label>
            <label>Country<input value="Nigeria" readOnly /></label>
          </div>
          <button className="lw-button" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save delivery details'}</button>
        </form>
      </section>

      <section className="checkout-section">
        <p className="eyebrow">2 · Delivery method</p>
        <h2>Choose delivery</h2>
        {!saved && <p className="checkout-note">Save your address to see delivery options available for it.</p>}
        {saved && options.length === 0 && <p className="checkout-note">No delivery option is configured for this address yet. Delivery zones and fees are being confirmed.</p>}
        {saved && options.length > 0 && <fieldset className="checkout-options" disabled={busy}><legend className="sr-only">Delivery options</legend>{options.map((option) => <label className="checkout-option" key={option.id}><input type="radio" name="shipping" value={option.id} checked={selected === option.id} onChange={() => void chooseShipping(option.id)} /><span><strong>{option.name}</strong><small>{money(option.calculated_price?.calculated_amount ?? option.amount, option.calculated_price?.currency_code ?? cart.currency_code)}</small></span></label>)}</fieldset>}
      </section>

      <section className="checkout-section">
        <p className="eyebrow">3 · Payment</p>
        <h2>Pay securely</h2>
        {!paymentEnabled && <p className="checkout-note">Secure payment is not available yet. The Lopaworld payment account and approved channels still need to be configured.</p>}
        {paymentEnabled && <p className="checkout-note">You will pay securely in NGN on Paystack.</p>}
        <button className="lw-button" type="button" disabled={!selected || !paymentEnabled || busy} onClick={() => void pay()}>{busy ? 'Connecting securely…' : 'Continue to secure payment'}</button>
      </section>
      {error && <p className="cart-message" role="alert">{error}</p>}
    </div>
    <aside className="checkout-summary"><p className="eyebrow">Your order</p><ul>{cart.items.map((item) => <li key={item.id}><span>{item.title ?? item.product?.title ?? 'Product'} × {item.quantity}</span><strong>{money(item.total, cart.currency_code)}</strong></li>)}</ul><div className="checkout-total-row"><span>Items</span><strong>{money(cart.subtotal, cart.currency_code)}</strong></div>{selected && <><div className="checkout-total-row"><span>Delivery</span><strong>{money(cart.shipping_total, cart.currency_code)}</strong></div>{typeof cart.tax_total === 'number' && cart.tax_total > 0 && <div className="checkout-total-row"><span>Tax</span><strong>{money(cart.tax_total, cart.currency_code)}</strong></div>}<div className="cart-totals"><span>Total</span><strong>{money(cart.total, cart.currency_code)}</strong></div></>}<p className="checkout-note">{selected ? 'Final total calculated by Medusa.' : 'Choose a delivery option to see your final total.'}</p><Link href="/bag">Return to bag</Link></aside>
  </div>;
}

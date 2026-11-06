'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ColourSwatch, QuantityStepper, Sheet, SizeSelector } from '@lopaworld/ui';
import type { StoreProduct } from '../../lib/store';
import type { CMSRecord } from '../../lib/cms';
import { RichContent, text } from './content';
import { trackStoreEvent } from '../../lib/analytics';
import { WishlistButton } from '../account/WishlistButton';
import { productColours } from '../../lib/product-colours';
import {
  addToBagLabel, displayPrice, formatPrice, initialSelection, lowStockValues, optionKey, optionKind,
  optionValues, selectedVariant as findVariant, unavailableValues, variantIsAvailable, type Selection,
} from '../../lib/product-options';

type SavedItem = { id: string; handle: string; title: string; image?: string };

export function ProductPurchasePanel({ product, sizeGuide, saveItem }: { product: StoreProduct; sizeGuide?: CMSRecord; saveItem: SavedItem }) {
  const options = useMemo(() => product.options ?? [], [product.options]);
  const variants = useMemo(() => product.variants ?? [], [product.variants]);
  const madeToOrder = product.metadata?.made_to_order === true;
  const colours = useMemo(() => productColours(product), [product]);
  const [selection, setSelection] = useState<Selection>(() => initialSelection(options, variants, madeToOrder));
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [stickyOpen, setStickyOpen] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const addButton = useRef<HTMLButtonElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  const variant = useMemo(() => findVariant(options, variants, selection), [options, variants, selection]);
  const available = Boolean(variant && variantIsAvailable(variant, madeToOrder));
  const price = displayPrice(options, variants, selection, variant);
  const priceText = price?.calculated_amount !== undefined ? formatPrice(price.calculated_amount, price.currency_code ?? 'NGN') : null;
  const variantPriced = variant?.calculated_price?.calculated_amount !== undefined;
  const cta = addToBagLabel({ busy, options, selection, variant, available, priced: variantPriced });
  const canAdd = Boolean(variant && available && variantPriced && !busy);

  useEffect(() => {
    if (!addButton.current) return;
    const observer = new IntersectionObserver(([entry]) => setStickyOpen(!entry.isIntersecting), { threshold: 0.2 });
    observer.observe(addButton.current);
    return () => observer.disconnect();
  }, []);

  const missingChoice = !busy && options.some((option) => !selection[optionKey(option)]);

  /** Sticky bar with an option still open: bring that option into view and focus its first choice. */
  function chooseFirst() {
    const groups = optionsRef.current?.querySelectorAll<HTMLFieldSetElement>('fieldset[data-option-key]') ?? [];
    const target = [...groups].find((group) => !selection[group.dataset.optionKey ?? '']);
    target?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    target?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus({ preventScroll: true });
  }

  function setOption(option: { id?: string; title: string }, value: string) {
    setSelection((current) => ({ ...current, [option.id ?? option.title]: value }));
    setAdded(null);
    setError(null);
    trackStoreEvent({ name: 'variant_select', params: { item_id: product.id, option: option.title, value } });
  }

  async function addToBag() {
    if (!variant || !canAdd) return;
    setBusy(true); setError(null); setAdded(null);
    try {
      const response = await fetch('/api/cart/items', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ handle: product.handle, variantId: variant.id, quantity, notes: madeToOrder ? notes : undefined }),
      });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? 'This piece could not be added to your bag.');
      const chosen = options.flatMap((option) => {
        const value = selection[optionKey(option)];
        return value ? [optionKind(option) === 'size' ? `size ${value}` : value] : [];
      });
      setAdded([product.title, ...chosen].join(', '));
      trackStoreEvent({ name: 'add_to_bag', params: { item_id: product.id, item_name: product.title, quantity, value: price?.calculated_amount ?? 0, currency: price?.currency_code ?? 'NGN' } });
      window.dispatchEvent(new Event('lw:cart-updated'));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'This piece could not be added to your bag.');
    } finally { setBusy(false); }
  }

  return <section className="purchase-panel" aria-label="Choose product options">
    {priceText && <p className="purchase-price" aria-live="polite">{variant || options.length === 0 ? priceText : `From ${priceText}`}</p>}
    <div ref={optionsRef} className="purchase-options">{options.map((option) => {
      const key = optionKey(option);
      const kind = optionKind(option);
      const value = selection[key];
      const unavailable = unavailableValues(option, options, variants, selection, madeToOrder);
      const lowStock = kind === 'size' ? lowStockValues(option, options, variants, selection, madeToOrder) : {};
      const left = value ? lowStock[value] : undefined;
      const legend = <legend className="product-option-legend"><span>{option.title}</span>{value ? ` — ${value}` : ''}{left ? ` · ${left === 1 ? 'last one' : `${left} left`}` : ''}</legend>;
      if (kind === 'colour') {
        return <fieldset className="product-option-group" key={key} data-option-key={key}>{legend}<ColourSwatch colours={colours.length ? colours : optionValues(option, variants).map((name) => ({ name, hex: null }))} value={value} label={option.title} onChange={(next) => setOption(option, next)} /></fieldset>;
      }
      if (kind === 'size') {
        return <fieldset className="product-option-group product-option-size" key={key} data-option-key={key}>
          {legend}{sizeGuide && <button className="text-link size-guide-link" type="button" onClick={() => { trackStoreEvent({ name: 'size_guide_open', params: { item_id: product.id } }); setGuideOpen(true); }}>Size guide (cm / in)</button>}
          <SizeSelector sizes={optionValues(option, variants)} value={value} unavailable={unavailable} lowStock={lowStock} label={option.title} onChange={(next) => setOption(option, next)} />
        </fieldset>;
      }
      return <fieldset className="product-option-group" key={key} data-option-key={key}>{legend}<div className="product-option-values">{optionValues(option, variants).map((item) => {
        const disabled = unavailable.includes(item);
        return <button key={item} type="button" className="lw-chip" aria-pressed={value === item} aria-label={`${option.title} ${item}${disabled ? ', sold out' : ''}`} disabled={disabled} onClick={() => setOption(option, item)}>{item}</button>;
      })}</div></fieldset>;
    })}</div>
    {madeToOrder && <p className="made-to-order-note">Made to order{typeof product.metadata?.lead_time_days === 'number' ? ` — ready in ${product.metadata.lead_time_days} days` : ''}.</p>}
    {madeToOrder && <label className="lw-field">Measurements or notes (optional)<textarea className="lw-input product-notes" maxLength={500} value={notes} onFocus={() => setInputFocused(true)} onBlur={() => setInputFocused(false)} onChange={(event) => setNotes(event.target.value)} placeholder="Add details for the atelier" /></label>}
    <div className="quantity-field"><span>Quantity</span><QuantityStepper value={quantity} max={madeToOrder ? 20 : Math.max(1, Math.min(20, variant?.inventory_quantity ?? 20))} onChange={setQuantity} /></div>
    <div className="purchase-actions">
      <button ref={addButton} type="button" className="lw-button lw-button-buy add-to-bag" disabled={!canAdd} onClick={() => void addToBag()}>{cta}</button>
      {error && <p className="product-error" role="alert">{error}</p>}
      <div className="product-success" role="status">{added && <>Added to bag — {added}. <a href="/bag">View bag</a></>}</div>
      <div className="purchase-secondary">
        <WishlistButton item={saveItem} />
        {/* Second cell (WhatsApp tailor) is blocked by D5. */}
      </div>
    </div>
    {stickyOpen && !inputFocused && <div className="sticky-add-bar">{priceText && <span className="sticky-add-price">{priceText}</span>}{missingChoice
      ? <button type="button" className="lw-button sticky-add-button" onClick={chooseFirst}>{cta}</button>
      : <button type="button" className="lw-button sticky-add-button" disabled={!canAdd} onClick={() => void addToBag()}>{cta}</button>}</div>}
    {guideOpen && sizeGuide && <SizeGuideSheet guide={sizeGuide} onClose={() => setGuideOpen(false)} />}
  </section>;
}

function SizeGuideSheet({ guide, onClose }: { guide: CMSRecord; onClose: () => void }) {
  const measurements = Array.isArray(guide.measurements) ? guide.measurements.map((row) => row && typeof row === 'object' ? row as Record<string, unknown> : null).filter((row): row is Record<string, unknown> => Boolean(row)) : [];
  const basis = guide.measurementBasis === 'body' ? 'Body measurements' : 'Finished garment measurements';
  return <Sheet title={text(guide.title) ?? 'Size guide'} onClose={onClose}>
    <p className="size-guide-basis">{[text(guide.category), basis].filter(Boolean).join(' · ')}</p>
    <RichContent value={guide.howToMeasure} />
    <div className="size-table-scroll" tabIndex={0} role="region" aria-label="Measurements table"><table className="size-table"><thead><tr><th scope="col">Size</th><th scope="col">Measurement</th><th scope="col">cm</th><th scope="col">in</th></tr></thead><tbody>{measurements.map((row, index) => <tr key={`${String(row.size)}-${index}`}><th scope="row">{text(row.size) ?? '—'}</th><td>{text(row.measurement) ?? '—'}</td><td>{typeof row.centimetres === 'number' ? row.centimetres : '—'}</td><td>{typeof row.inches === 'number' ? row.inches : '—'}</td></tr>)}</tbody></table></div>
  </Sheet>;
}

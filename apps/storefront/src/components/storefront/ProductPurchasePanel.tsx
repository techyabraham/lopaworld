'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, QuantityStepper, Sheet } from '@lopaworld/ui';
import type { StoreProduct } from '../../lib/store';
import type { CMSRecord } from '../../lib/cms';
import { RichContent, text } from './content';

type Selection = Record<string, string>;
type ProductVariant = NonNullable<StoreProduct['variants']>[number];

function variantIsAvailable(variant: ProductVariant, madeToOrder = false) {
  if (madeToOrder || variant.allow_backorder || variant.manage_inventory === false) return true;
  return (variant.inventory_quantity ?? 0) > 0;
}

export function ProductPurchasePanel({ product, sizeGuide }: { product: StoreProduct; sizeGuide?: CMSRecord }) {
  const options = useMemo(() => product.options ?? [], [product.options]);
  const variants = useMemo(() => product.variants ?? [], [product.variants]);
  const madeToOrder = product.metadata?.made_to_order === true;
  const firstVariant = variants.find((variant) => variantIsAvailable(variant, madeToOrder)) ?? variants[0];
  const [selection, setSelection] = useState<Selection>(() => Object.fromEntries((firstVariant?.options ?? []).map((option) => [option.option_id ?? option.option?.title ?? '', option.value])));
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [stickyOpen, setStickyOpen] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const addButton = useRef<HTMLButtonElement>(null);

  const selectedVariant = useMemo(() => variants.find((variant) => options.every((option) => {
    const value = selection[option.id ?? option.title];
    return value && variant.options?.some((variantOption) => (variantOption.option_id === option.id || variantOption.option?.title === option.title) && variantOption.value === value);
  })) ?? (options.length === 0 ? variants[0] : undefined), [options, selection, variants]);
  const available = Boolean(selectedVariant && variantIsAvailable(selectedVariant, madeToOrder));
  const price = selectedVariant?.calculated_price;
  const priceText = price?.calculated_amount !== undefined
    ? new Intl.NumberFormat('en-NG', { style: 'currency', currency: (price.currency_code ?? 'NGN').toUpperCase(), maximumFractionDigits: 0 }).format(price.calculated_amount)
    : 'Price unavailable';

  useEffect(() => {
    if (!addButton.current) return;
    const observer = new IntersectionObserver(([entry]) => setStickyOpen(!entry.isIntersecting), { threshold: 0.2 });
    observer.observe(addButton.current);
    return () => observer.disconnect();
  }, []);

  function setOption(option: { id?: string; title: string }, value: string) {
    setSelection((current) => ({ ...current, [option.id ?? option.title]: value }));
  }

  async function addToBag() {
    if (!selectedVariant || !available) return;
    setBusy(true); setError(null); setAdded(false);
    try {
      const response = await fetch('/api/cart/items', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ handle: product.handle, variantId: selectedVariant.id, quantity, notes: madeToOrder ? notes : undefined }),
      });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? 'This piece could not be added to your bag.');
      setAdded(true);
      window.dispatchEvent(new Event('lw:cart-updated'));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'This piece could not be added to your bag.');
    } finally { setBusy(false); }
  }

  return <section className="purchase-panel" aria-label="Choose product options">
    <p className="purchase-price" aria-live="polite">{priceText}</p>
    {options.map((option) => {
      const values = [...new Set(variants.flatMap((variant) => variant.options?.filter((item) => item.option_id === option.id || item.option?.title === option.title).map((item) => item.value) ?? []))];
      const selectionKey = option.id ?? option.title;
      const lowerTitle = option.title.toLowerCase();
      return <fieldset className="product-option-group" key={selectionKey}><legend>{option.title}{selection[selectionKey] ? ` · ${selection[selectionKey]}` : ''}</legend><div className="product-option-values">{values.map((value) => {
        const hasAvailableVariant = variants.some((variant) => variant.options?.some((item) => (item.option_id === option.id || item.option?.title === option.title) && item.value === value) && options.every((other) => {
          if (other.id === option.id || other.title === option.title) return true;
          const selected = selection[other.id ?? other.title];
          return !selected || variant.options?.some((item) => (item.option_id === other.id || item.option?.title === other.title) && item.value === selected);
        }) && variantIsAvailable(variant, madeToOrder));
        const disabled = !hasAvailableVariant;
        return <button key={value} type="button" className="option-value" data-selected={selection[selectionKey] === value} aria-pressed={selection[selectionKey] === value} aria-label={`${option.title} ${value}${disabled ? ', sold out' : ''}`} disabled={disabled} onClick={() => setOption(option, value)}>{value}</button>;
      })}</div>{lowerTitle.includes('size') && sizeGuide && <button className="text-link" type="button" onClick={() => setGuideOpen(true)}>View size guide</button>}</fieldset>;
    })}
    {options.length === 0 && <p>One size</p>}
    {madeToOrder && <p className="made-to-order-note">Made to order{typeof product.metadata?.lead_time_days === 'number' ? ` — ready in ${product.metadata.lead_time_days} days` : ''}.</p>}
    <label className="lw-field quantity-field">Quantity<QuantityStepper value={quantity} max={madeToOrder ? 20 : Math.max(1, Math.min(20, selectedVariant?.inventory_quantity ?? 20))} onChange={setQuantity} /></label>
    {madeToOrder && <label className="lw-field">Measurements or notes (optional)<textarea className="lw-input product-notes" maxLength={500} value={notes} onFocus={() => setInputFocused(true)} onBlur={() => setInputFocused(false)} onChange={(event) => setNotes(event.target.value)} placeholder="Add details for the atelier" /></label>}
    {error && <p className="product-error" role="alert">{error}</p>}
    {added && <p className="product-success" role="status">Added to your bag. <a href="/bag">Review your bag</a></p>}
    <button ref={addButton} type="button" className="lw-button add-to-bag" disabled={!available || busy || !price} onClick={() => void addToBag()}>{busy ? 'Adding…' : !selectedVariant ? 'Choose an option' : !available ? 'Sold out' : 'Add to bag'}</button>
    {!available && selectedVariant && <p className="availability-note">This option is sold out.</p>}
    {!price && <p className="availability-note">Pricing is not available for this variant yet.</p>}
    {madeToOrder && <p className="service-message">Made-to-order pieces remain available regardless of stock count.</p>}
    {stickyOpen && !inputFocused && <div className="sticky-add-bar"><span>{priceText}</span><Button disabled={!available || busy || !price} onClick={() => void addToBag()}>{busy ? 'Adding…' : 'Add to bag'}</Button></div>}
    {guideOpen && sizeGuide && <SizeGuideSheet guide={sizeGuide} onClose={() => setGuideOpen(false)} />}
  </section>;
}

function SizeGuideSheet({ guide, onClose }: { guide: CMSRecord; onClose: () => void }) {
  const measurements = Array.isArray(guide.measurements) ? guide.measurements.map((row) => row && typeof row === 'object' ? row as Record<string, unknown> : null).filter((row): row is Record<string, unknown> => Boolean(row)) : [];
  return <Sheet title={text(guide.title) ?? 'Size guide'} onClose={onClose}>
    <p>{text(guide.category)} · {guide.measurementBasis === 'body' ? 'Body measurements' : 'Finished garment measurements'}</p>
    <RichContent value={guide.howToMeasure} />
    <div className="size-table-scroll"><table className="size-table"><thead><tr><th>Size</th><th>Measurement</th><th>cm</th><th>in</th></tr></thead><tbody>{measurements.map((row, index) => <tr key={`${String(row.size)}-${index}`}><th scope="row">{text(row.size) ?? '—'}</th><td>{text(row.measurement) ?? '—'}</td><td>{typeof row.centimetres === 'number' ? row.centimetres : '—'}</td><td>{typeof row.inches === 'number' ? row.inches : '—'}</td></tr>)}</tbody></table></div>
  </Sheet>;
}

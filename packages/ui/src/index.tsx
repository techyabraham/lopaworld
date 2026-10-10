'use client';

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactElement, ReactNode, SelectHTMLAttributes } from 'react';
import { cloneElement, isValidElement, useEffect, useId, useRef, useState } from 'react';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'quiet' };
export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return <button className={['lw-button', className].filter(Boolean).join(' ')} data-variant={variant} {...props} />;
}

export function IconButton(props: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  const { label, className, ...rest } = props;
  return <button aria-label={label} className={['lw-icon-button', className].filter(Boolean).join(' ')} {...rest} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) { return <input className={['lw-input', className].filter(Boolean).join(' ')} {...props} />; }
export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) { return <select className={['lw-select', className].filter(Boolean).join(' ')} {...props} />; }
export function Checkbox({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) { return <input type="checkbox" className={['lw-checkbox', className].filter(Boolean).join(' ')} {...props} />; }
export function Radio({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) { return <input type="radio" className={['lw-radio', className].filter(Boolean).join(' ')} {...props} />; }

export function FormField({ label, id, hint, error, children }: { label: string; id: string; hint?: string; error?: string; children: ReactNode }) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<{ id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }>, { id, 'aria-describedby': describedBy, 'aria-invalid': Boolean(error) })
    : children;
  return <div className="lw-form-field"><label className="lw-field" htmlFor={id}>{label}</label>{control}{hint && <span id={hintId} className="lw-hint">{hint}</span>}{error && <span id={errorId} className="lw-error" role="alert">{error}</span>}</div>;
}

export function Stepper({ value, onChange, min = 0, max = 99, label = 'Quantity' }: { value: number; onChange: (value: number) => void; min?: number; max?: number; label?: string }) {
  return <div className="lw-stepper" role="group" aria-label={label}><button type="button" aria-label={`Decrease ${label.toLowerCase()}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}>−</button><output aria-live="polite" aria-label={label}>{value}</output><button type="button" aria-label={`Increase ${label.toLowerCase()}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>+</button></div>;
}

export function Toast({ children, role = 'status' }: { children: ReactNode; role?: 'status' | 'alert' }) { return <div className="lw-toast" role={role} aria-live={role === 'alert' ? 'assertive' : 'polite'}>{children}</div>; }
export function Badge({ children }: { children: ReactNode }) { return <span className="lw-badge">{children}</span>; }
export const Tag = Badge;
export function Chip({ children, selected, onClick }: { children: ReactNode; selected?: boolean; onClick?: () => void }) { return <button type="button" className="lw-chip" aria-pressed={selected} onClick={onClick}>{children}</button>; }
export function Skeleton({ label = 'Loading' }: { label?: string }) { return <span className="lw-skeleton" role="status" aria-label={label} />; }
export function Accordion({ title, children }: { title: string; children: ReactNode }) { return <details className="lw-accordion"><summary>{title}</summary><div>{children}</div></details>; }

export function Tabs({ tabs }: { tabs: Array<{ id: string; label: string; content: ReactNode }> }) {
  const [active, setActive] = useState(tabs[0]?.id ?? '');
  return <><div className="lw-tabs" role="tablist" onKeyDown={(event) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const current = tabs.findIndex((tab) => tab.id === active);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    const selected = tabs[next];
    if (selected) { setActive(selected.id); document.getElementById(`tab-${selected.id}`)?.focus(); }
  }}>{tabs.map((tab) => <button key={tab.id} type="button" className="lw-tab" id={`tab-${tab.id}`} role="tab" tabIndex={active === tab.id ? 0 : -1} aria-selected={active === tab.id} aria-controls={`panel-${tab.id}`} onClick={() => setActive(tab.id)}>{tab.label}</button>)}</div>{tabs.map((tab) => active === tab.id && <div key={tab.id} role="tabpanel" id={`panel-${tab.id}`} aria-labelledby={`tab-${tab.id}`} tabIndex={0}>{tab.content}</div>)}</>;
}

function useDialogKeyboard(onClose: () => void) {
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const focusable = () => dialog?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])') ?? [];
    focusable()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return; }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) { event.preventDefault(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); previous?.focus(); };
  }, [onClose]);
  return dialogRef;
}

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const id = useId();
  const ref = useDialogKeyboard(onClose);
  return <div className="lw-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section ref={ref} className="lw-modal" role="dialog" aria-modal="true" aria-labelledby={id}><header><h2 id={id}>{title}</h2><IconButton label="Close dialog" onClick={onClose}>×</IconButton></header>{children}</section></div>;
}
export function Sheet({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const id = useId();
  const ref = useDialogKeyboard(onClose);
  return <div className="lw-drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section ref={ref} className="lw-drawer" role="dialog" aria-modal="true" aria-labelledby={id}><header><h2 id={id}>{title}</h2><IconButton label="Close panel" onClick={onClose}>×</IconButton></header>{children}</section></div>;
}
export const Drawer = Sheet;

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return <span className="lw-tooltip"><button type="button" className="lw-tooltip-trigger" aria-expanded={open} aria-describedby={open ? id : undefined} onClick={() => setOpen(!open)} onBlur={() => setOpen(false)}>{children}</button>{open && <span id={id} role="tooltip">{label}</span>}</span>;
}

export function Breadcrumb({ items }: { items: Array<{ label: string; href?: string }> }) {
  return <nav className="lw-breadcrumbs" aria-label="Breadcrumb"><ol>{items.map((item, index) => <li key={`${item.label}-${index}`}>{index > 0 && <span aria-hidden="true"> / </span>}{item.href ? <a href={item.href}>{item.label}</a> : <span aria-current="page">{item.label}</span>}</li>)}</ol></nav>;
}

export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (page: number) => void }) {
  return <nav className="lw-pagination" aria-label="Pagination"><button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button><span aria-live="polite">Page {page} of {pages}</span><button type="button" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</button></nav>;
}

export function Price({ amount, compareAt, currency = 'NGN' }: { amount: number; compareAt?: number; currency?: string }) {
  const format = (value: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
  return <span className="lw-price"><span>{format(amount)}</span>{compareAt && compareAt > amount ? <del>{format(compareAt)}</del> : null}</span>;
}

export function ProductCard({ title, href, image, alt, amount, compareAt }: { title: string; href: string; image: string; alt: string; amount: number; compareAt?: number }) {
  return <a className="lw-product-card" href={href}><img src={image} alt={alt} loading="lazy" /><span>{title}</span><Price amount={amount} compareAt={compareAt} /></a>;
}
export function LabelCard({ title, href, image, alt }: { title: string; href: string; image: string; alt: string }) { return <a className="lw-label-card" href={href}><img src={image} alt={alt} loading="lazy" /><span>{title}</span></a>; }

export function SizeSelector({ sizes, value, unavailable = [], onChange }: { sizes: string[]; value?: string; unavailable?: string[]; onChange: (value: string) => void }) {
  return <div className="lw-size-selector" role="group" aria-label="Choose a size">{sizes.map((size) => <button key={size} type="button" disabled={unavailable.includes(size)} aria-pressed={value === size} onClick={() => onChange(size)}>{size}</button>)}</div>;
}
export function ColourSwatch({ colours, value, onChange }: { colours: Array<{ name: string; hex: string }>; value?: string; onChange: (name: string) => void }) {
  return <div className="lw-swatches" role="group" aria-label="Choose a colour">{colours.map((colour) => <button key={colour.name} type="button" className="lw-swatch" aria-label={colour.name} aria-pressed={value === colour.name} style={{ backgroundColor: colour.hex }} onClick={() => onChange(colour.name)} />)}</div>;
}
export function QuantityStepper({ value, onChange, max = 99 }: { value: number; onChange: (value: number) => void; max?: number }) {
  return <div className="lw-quantity" role="group" aria-label="Quantity"><button type="button" aria-label="Decrease quantity" disabled={value <= 1} onClick={() => onChange(Math.max(1, value - 1))}>−</button><output aria-live="polite" aria-label="Quantity">{value}</output><button type="button" aria-label="Increase quantity" disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>+</button></div>;
}
export function Gallery({ images }: { images: Array<{ src: string; alt: string }> }) {
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const current = images[index];
  if (!current) return <EmptyState title="No images yet" description="Product images will appear here." />;
  const swipe = (end: number) => {
    if (touchStart === null || Math.abs(end - touchStart) < 40) return;
    const direction = end < touchStart ? 1 : -1;
    setIndex((currentIndex) => (currentIndex + direction + images.length) % images.length);
    setTouchStart(null);
  };
  return <div className="lw-gallery"><button type="button" className="lw-gallery-zoom" aria-label="Zoom product image" onClick={() => setZoomed(true)} onTouchStart={(event) => setTouchStart(event.changedTouches[0]?.clientX ?? null)} onTouchEnd={(event) => swipe(event.changedTouches[0]?.clientX ?? 0)}><img className="lw-gallery-main" src={current.src} alt={current.alt} /></button><div className="lw-gallery-thumbs" aria-label="Product images">{images.map((image, i) => <button key={image.src} type="button" aria-label={`View image ${i + 1}`} aria-current={index === i} onClick={() => setIndex(i)}><img src={image.src} alt="" /></button>)}</div>{zoomed && <Modal title="Product image" onClose={() => setZoomed(false)}><img className="lw-gallery-main" src={current.src} alt={current.alt} /></Modal>}</div>;
}
export function FilterChip({ children, onRemove }: { children: ReactNode; onRemove: () => void }) { return <span className="lw-filter-chip">{children}<button type="button" aria-label={`Remove ${String(children)} filter`} onClick={onRemove}>×</button></span>; }
export function EmptyState({ title, description }: { title: string; description: string }) { return <section className="lw-state" aria-labelledby="lw-empty-title"><h2 id="lw-empty-title">{title}</h2><p>{description}</p></section>; }
export function ErrorState({ title, description, action }: { title: string; description: string; action?: ReactNode }) { return <section className="lw-state" data-kind="error" role="alert"><h2>{title}</h2><p>{description}</p>{action}</section>; }

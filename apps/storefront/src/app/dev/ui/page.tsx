'use client';

import { useState } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Accordion, Badge, Breadcrumb, Button, Checkbox, Chip, ColourSwatch, EmptyState, ErrorState,
  FilterChip, FormField, Gallery, IconButton, Input, LabelCard, Modal, Pagination, Price,
  ProductCard, QuantityStepper, Radio, Select, Sheet, SizeSelector, Skeleton, Stepper, Tabs,
  Toast, Tooltip,
} from '@lopaworld/ui';

const labels = [
  ['next', 'Lopa Next'], ['trybe', 'Lopa Trybe'], ['prime', 'Lopa Prime'], ['men', 'Lopa Men'],
  ['fashion', 'Lopa Fashion'], ['bridal', 'Lopa Bridal'], ['lopaworld', 'Lopaworld'],
] as const;

export default function UiGalleryPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  const [count, setCount] = useState(1);
  const [size, setSize] = useState('M');
  const [colour, setColour] = useState('Forest');
  const [modal, setModal] = useState<'modal' | 'sheet' | null>(null);
  const [page, setPage] = useState(1);
  return <main className="dev-gallery" data-label="lopaworld">
    <Link className="gallery-back" href="/">← Back to storefront</Link>
    <p className="dev-banner">Development only · Component gallery</p>
    <h1>Shared design system</h1>
    <p>Native controls and patterns are shared across every label. Check at 360 px and with a keyboard.</p>
    <p>Static gallery examples only; these do not come from the live catalogue or checkout.</p>
    <section className="gallery-section"><h2>Label themes</h2>{labels.map(([key, label]) => <span key={key} className="token-swatch" data-label={key}>{label}</span>)}</section>
    <section className="gallery-section"><h2>Actions and feedback</h2><div className="gallery-row"><Button>Add to bag</Button><Button variant="secondary">View details</Button><Button variant="quiet">Cancel</Button><IconButton label="Open menu">☰</IconButton><Badge>New in</Badge><Chip selected>Selected filter</Chip><Tooltip label="Choose a size before adding this piece to your bag.">Size help</Tooltip></div><div><Toast>Added to your bag.</Toast></div></section>
    <section className="gallery-section"><h2>Forms</h2><div className="gallery-row"><div className="gallery-field"><FormField id="demo-email" label="Email address" hint="We’ll use this for order updates."><Input id="demo-email" type="email" autoComplete="email" placeholder="you@example.com" aria-describedby="demo-email-hint" /></FormField></div><div className="gallery-field"><FormField id="demo-country" label="Country or region"><Select id="demo-country" defaultValue="NG"><option value="NG">Nigeria</option><option value="other">Other</option></Select></FormField></div><label className="lw-check-row"><Checkbox /> Remember my details</label><label className="lw-check-row"><Radio name="delivery" defaultChecked /> Standard delivery</label></div><div className="gallery-row"><Stepper value={count} onChange={setCount} label="Items" /><QuantityStepper value={count} onChange={setCount} /></div><ErrorState title="Check your email address" description="Enter an address in the format name@example.com." /></section>
    <section className="gallery-section"><h2>Selection and navigation</h2><SizeSelector sizes={['XS', 'S', 'M', 'L', 'XL']} value={size} unavailable={['XS']} onChange={setSize} /><ColourSwatch colours={[{ name: 'Forest', hex: '#205c52' }, { name: 'Clay', hex: '#a46a49' }, { name: 'Ink', hex: '#242322' }]} value={colour} onChange={setColour} /><div style={{ maxWidth: 360 }}><Accordion title="Delivery information">Delivery details appear here after confirmation.</Accordion></div><Tabs tabs={[{ id: 'details', label: 'Details', content: <p>Product details.</p> }, { id: 'care', label: 'Care', content: <p>Care information.</p> }]} /><Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Lopa Trybe', href: '/dev/ui' }, { label: 'Collection' }]} /><Pagination page={page} pages={5} onChange={setPage} /><FilterChip onRemove={() => undefined}>Size: M</FilterChip></section>
    <section className="gallery-section"><h2>Commerce patterns</h2><div className="gallery-grid"><article className="specimen"><h3>Product card</h3><ProductCard title="Demo piece · gallery only" href="#product-demo" image="/dev/demo-piece.svg" alt="Abstract gallery illustration in forest green" amount={150000} compareAt={175000} /><Price amount={150000} /></article><article className="specimen"><h3>Label card</h3><LabelCard title="Lopa Trybe" href="#label-demo" image="/dev/demo-label.svg" alt="Abstract gallery illustration in warm terracotta" /></article></div><div className="specimen-grid"><Gallery images={[{ src: '/dev/demo-piece.svg', alt: 'Abstract forest green gallery illustration' }, { src: '/dev/demo-label.svg', alt: 'Abstract terracotta gallery illustration' }]} /><div><Skeleton label="Loading product title" /><EmptyState title="Nothing saved yet" description="Pieces you save will appear here." /></div></div></section>
    <section className="gallery-section"><h2>Overlays and sheets</h2><div className="gallery-row"><Button onClick={() => setModal('modal')}>Open modal</Button><Button variant="secondary" onClick={() => setModal('sheet')}>Open sheet</Button></div>{modal === 'modal' && <Modal title="Size guide" onClose={() => setModal(null)}><p>Measure around the fullest part of the chest.</p><Button onClick={() => setModal(null)}>Done</Button></Modal>}{modal === 'sheet' && <Sheet title="Filters" onClose={() => setModal(null)}><p>Choose the options that matter to you.</p><Button onClick={() => setModal(null)}>Show pieces</Button></Sheet>}</section>
  </main>;
}

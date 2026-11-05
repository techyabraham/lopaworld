import { notFound } from 'next/navigation';
import Link from 'next/link';

const specimens = [
  { label: '400 Regular', weight: 400 },
  { label: '500 Medium', weight: 500 },
  { label: '600 Semibold', weight: 600 },
  { label: '700 Bold', weight: 700 },
];

export default function TypeSpecimenPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  const specimen = 'LOPA TRYBE · Modern nativewear · ₦150,000 · Size 36 · Lagos delivery · Ẹ̀wù ọ̀ṣọ́ ṣẹ́ẹ̀ ń';
  return <main className="dev-gallery" data-label="trybe">
    <Link className="gallery-back" href="/">← Back to storefront</Link>
    <p className="dev-banner">Development only · Typography specimen</p>
    <h1>Type specimen</h1>
    <p>At 360 px first, then wider breakpoints. Noto Serif supplies only the Yoruba/Igbo glyphs and Naira sign missing from the primary font files.</p>
    <section className="specimen" aria-labelledby="interface-specimen">
      <h2 id="interface-specimen">DM Sans · Interface</h2>
      {specimens.map(({ label, weight }) => <p key={weight} className="specimen-copy" style={{ fontWeight: weight }}><small>{label}</small><br />{specimen}</p>)}
    </section>
    <section className="specimen" aria-labelledby="editorial-specimen">
      <h2 id="editorial-specimen">Bodoni Moda · Editorial</h2>
      {specimens.map(({ label, weight }) => <p key={weight} className="specimen-copy editorial" style={{ fontWeight: weight }}><small>{label}</small><br />{specimen}</p>)}
    </section>
  </main>;
}

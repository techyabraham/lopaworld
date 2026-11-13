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
    <p>At 360 px first, then wider breakpoints. Archivo covers the Naira sign and Yoruba letters. Instrument Serif lacks ₦ and the dot-below letters (ẹ ọ ṣ), which fall back to Noto Serif.</p>
    <section className="specimen" aria-labelledby="display-specimen">
      <h2 id="display-specimen">Archivo · Display (62% width, 900)</h2>
      <p className="lw-display specimen-display">Lopa Trybe ₦150,000</p>
      <p className="lw-voice specimen-voice">Ẹ̀wù ọ̀ṣọ́ ṣẹ́ẹ̀ ń — ₦150,000</p>
    </section>
    <section className="specimen" aria-labelledby="interface-specimen">
      <h2 id="interface-specimen">Archivo · Interface</h2>
      {specimens.map(({ label, weight }) => <p key={weight} className="specimen-copy" style={{ fontWeight: weight }}><small>{label}</small><br />{specimen}</p>)}
    </section>
    <section className="specimen" aria-labelledby="voice-specimen">
      <h2 id="voice-specimen">Instrument Serif · Voice (italic)</h2>
      <p className="specimen-copy lw-voice">{specimen}</p>
    </section>
    <section className="specimen" aria-labelledby="editorial-specimen">
      <h2 id="editorial-specimen">Instrument Serif · Editorial (regular)</h2>
      <p className="specimen-copy editorial">{specimen}</p>
    </section>
  </main>;
}

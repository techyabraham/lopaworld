'use client';

import { useRef, useState, useSyncExternalStore } from 'react';
import { heroKeyReducer, prefersReducedData, splitHeadline } from '../../lib/hero-state';

type NetworkConnection = EventTarget & { saveData?: boolean; effectiveType?: string };
const connection = () => (navigator as Navigator & { connection?: NetworkConnection }).connection;
const subscribeConnection = (onChange: () => void) => {
  const current = connection();
  current?.addEventListener('change', onChange);
  return () => current?.removeEventListener('change', onChange);
};

export type HeroImage = { src: string; alt: string; width?: number; height?: number };
export type HeroLabel = { slug: string; name: string; introSummary: string | null; image: HeroImage | null };

type Props = {
  headline: string;
  supportingCopy: string | null;
  image: HeroImage | null;
  secondaryCta: { href: string; label: string } | null;
  labels: HeroLabel[];
  /** Server-detected `Save-Data: on`; the client also checks navigator.connection. */
  saveData?: boolean;
};

/**
 * The Entrance hero (§5.2). Server-rendered in its first state; selecting a label re-casts the tone,
 * name, one-liner and media without navigation. Copy comes only from Payload (gate D2).
 */
export function EntranceHero({ headline, supportingCopy, image, secondaryCta, labels, saveData = false }: Props) {
  const [index, setIndex] = useState(0);
  const reducedData = useSyncExternalStore(subscribeConnection, () => saveData || prefersReducedData(connection()), () => saveData);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);

  const current = labels[index];
  const [line1, line2] = splitHeadline(headline);
  // Media swaps to the selected label's hero only when data is not constrained; colour and text always change.
  const media = (!reducedData && current?.image) || image;
  const select = (next: number) => { setIndex(next); tabs.current[next]?.focus(); };

  return <section className="entrance-hero" data-label={current?.slug ?? 'lopaworld'} data-ground="ink" aria-label="Campaign">
    <div className="entrance-hero-inner">
      <div className="entrance-hero-copy">
        <div>
          <h1 className="lw-display entrance-hero-headline">{line1}</h1>
          {line2 && <p className="lw-voice entrance-hero-voice">{line2}</p>}
          {supportingCopy && <p className="entrance-hero-support">{supportingCopy}</p>}
        </div>
        {(current || secondaryCta) && <div className="entrance-hero-foot">
          {current && <div className="entrance-hero-label" aria-live="polite">
            <p className="entrance-hero-name">{current.name}</p>
            {current.introSummary && <p className="lw-voice entrance-hero-line">{current.introSummary}</p>}
          </div>}
          <div className="entrance-hero-ctas">
            {current && <a className="entrance-cta" href={`/l/${current.slug}`}>Enter {current.name}</a>}
            {secondaryCta && <a className="entrance-cta" data-variant="secondary" href={secondaryCta.href}>{secondaryCta.label}</a>}
          </div>
        </div>}
      </div>
      {media && <figure className="entrance-hero-media">
        <img key={media.src} src={media.src} alt={media.alt} width={media.width ?? 1200} height={media.height ?? 1500} fetchPriority={media === image ? 'high' : 'auto'} decoding="async" />
      </figure>}
    </div>
    {labels.length > 1 && <div className="entrance-index" role="tablist" aria-label="Labels" onKeyDown={(event) => {
      if (!['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      select(heroKeyReducer(index, event.key, labels.length));
    }}>
      {labels.map((label, i) => <button key={label.slug} ref={(node) => { tabs.current[i] = node; }} type="button" role="tab" id={`hero-tab-${label.slug}`}
        aria-selected={i === index} tabIndex={i === index ? 0 : -1} data-label={label.slug} onClick={() => setIndex(i)}>
        <span className="entrance-index-ring" aria-hidden="true">{label.image && !reducedData ? <img src={label.image.src} alt="" width="56" height="56" loading="lazy" decoding="async" /> : null}</span>
        <span className="entrance-index-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
        <span className="entrance-index-name">{label.name}</span>
      </button>)}
    </div>}
  </section>;
}

import Link from 'next/link';
import type { Metadata } from 'next';
import { LABELS } from '@lopaworld/types';
import { findPublishedRecordsSafely } from '../../../lib/cms';
import { CMSImage, record, text } from '../../../components/storefront/content';
import { canonical } from '../../../lib/seo';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Labels', description: 'Explore Lopaworld’s seven labels, each with its own point of view.', alternates: { canonical: canonical('/labels') } };

export default async function LabelsPage() {
  const result = await findPublishedRecordsSafely('labels');
  const bySlug = new Map(result.records.map((label) => [label.slug, label]));
  return <main className="store-page labels-page">
    <header className="catalog-heading"><p className="eyebrow">One house, seven labels</p><h1>Find your expression</h1><p>Each label has its own point of view, with one shared catalogue and one way to shop.</p></header>
    {result.error && <p className="service-message" role="status">{result.error}</p>}
    <ul className="label-grid directory-grid">{LABELS.map(({ slug, name }) => {
      const label = bySlug.get(slug);
      const media = record(label?.heroMedia);
      return <li key={slug}><Link href={`/l/${slug}`} className="label-entrance" data-label={slug}>
        {media ? <CMSImage value={media} alt={media.alt} className="label-entrance-image" /> : <span className="label-entrance-placeholder" aria-hidden="true">{name.slice(0, 1)}</span>}
        <span><strong>{slug === 'lopaworld' ? 'Lopaworld — The House' : text(label?.name) ?? name}</strong>{text(label?.introSummary) && <small>{text(label?.introSummary)}</small>}{!label && <small>Editorial story and imagery are being prepared.</small>}</span>
      </Link></li>;
    })}</ul>
  </main>;
}

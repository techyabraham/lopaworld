import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findPublishedRecordsSafely } from '../../../../lib/cms';
import { record, RichContent, text } from '../../../../components/storefront/content';
import { canonical } from '../../../../lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { records } = await findPublishedRecordsSafely('pages', { slug: { equals: slug } }, 1);
  const page = records[0];
  if (!page) return { title: 'Page not found', robots: { index: false, follow: false } };
  const seo = record(page.seo) ?? {};
  const title = text(seo.title) ?? text(page.title) ?? 'Lopaworld';
  const description = text(seo.description) ?? `Information from Lopaworld: ${text(page.title) ?? 'customer information'}.`;
  const image = text(record(seo.shareImage)?.url);
  const path = `/pages/${encodeURIComponent(slug)}`;
  return { title, description, alternates: { canonical: canonical(path) }, openGraph: { type: 'website', title, description, url: canonical(path), images: image ? [image] : [] }, twitter: { card: 'summary_large_image', title, description, images: image ? [image] : [] } };
}

export default async function EditorialPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { records, error } = await findPublishedRecordsSafely('pages', { slug: { equals: slug } }, 1);
  const page = records[0];
  if (!page && !error) notFound();
  if (!page) return <main className="store-page"><h1>Page details are temporarily unavailable</h1><p>Please try again shortly.</p></main>;
  return <main className="store-page editorial-page"><header className="catalog-heading"><p className="eyebrow">Lopaworld</p><h1>{text(page.title) ?? 'Information'}</h1></header><RichContent value={page.body} /></main>;
}

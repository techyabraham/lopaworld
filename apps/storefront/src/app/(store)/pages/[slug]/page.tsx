import { notFound } from 'next/navigation';
import { findPublishedRecordsSafely } from '../../../../lib/cms';
import { RichContent, text } from '../../../../components/storefront/content';

export const dynamic = 'force-dynamic';

export default async function EditorialPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { records, error } = await findPublishedRecordsSafely('pages', { slug: { equals: slug } }, 1);
  const page = records[0];
  if (!page && !error) notFound();
  if (!page) return <main className="store-page"><h1>Page details are temporarily unavailable</h1><p>Please try again shortly.</p></main>;
  return <main className="store-page editorial-page"><header className="catalog-heading"><p className="eyebrow">Lopaworld</p><h1>{text(page.title) ?? 'Information'}</h1></header><RichContent value={page.body} /></main>;
}

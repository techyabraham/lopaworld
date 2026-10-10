import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LABELS } from '@lopaworld/types';
import { findPublishedRecordsSafely } from '../../lib/cms';
import { listStoreProductsSafely, productLabel, productsForCollectionHandle, type StoreProduct } from '../../lib/store';
import { ProductGrid } from './ProductGrid';
import { CMSImage, RichContent, record, text } from './content';

const nameBySlug = new Map<string, string>(LABELS.map(({ slug, name }) => [slug, name]));

export async function LabelLandingPage({ slug }: { slug: string }) {
  const canonical = nameBySlug.get(slug);
  if (!canonical) notFound();
  const [contentResult, productResult] = await Promise.all([
    findPublishedRecordsSafely('labels', { slug: { equals: slug } }, 1),
    listStoreProductsSafely({ limit: 100, order: '-created_at' }),
  ]);
  const label = contentResult.records[0];
  const allProducts = productResult.products.filter((product) => productLabel(product) === slug);
  const featuredHandle = text(label?.featuredCollectionHandle);
  let featured: StoreProduct[] = [];
  if (featuredHandle) {
    try {
      const featuredResult = await productsForCollectionHandle(featuredHandle, 12);
      featured = featuredResult.products.filter((product) => productLabel(product) === slug);
    } catch { /* The page still renders the label and any available label products. */ }
  }
  const featuredIds = new Set(featured.map(({ id }) => id));
  const remaining = allProducts.filter(({ id }) => !featuredIds.has(id));
  return <main className="store-page label-page" data-label={slug}>
    <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/labels">Labels</Link><span aria-hidden="true">/</span><span aria-current="page">{slug === 'lopaworld' ? 'Lopaworld — The House' : text(label?.name) ?? canonical}</span></nav>
    <header className="label-intro">
      {Boolean(label?.heroMedia) && <CMSImage value={label?.heroMedia} alt={record(label?.heroMedia)?.alt} className="label-page-hero" />}
      <p className="eyebrow">Lopaworld label</p><h1>{slug === 'lopaworld' ? 'Lopaworld — The House' : text(label?.name) ?? canonical}</h1>
      {text(label?.introSummary) && <p className="label-summary">{text(label.introSummary)}</p>}
      {Boolean(label?.intro) && <RichContent value={label?.intro} />}
    </header>
    {contentResult.error && <p className="service-message" role="status">Editorial content is temporarily unavailable.</p>}
    {productResult.error && <p className="service-message" role="status">The product catalogue is temporarily unavailable.</p>}
    {featured.length > 0 && <section className="store-section"><header className="section-heading"><p className="eyebrow">Selected pieces</p><h2>{text(label?.name) ?? canonical} collection</h2></header><ProductGrid products={featured} /></section>}
    <section className="store-section"><header className="section-heading"><p className="eyebrow">Explore</p><h2>All {text(label?.name) ?? canonical}</h2></header><ProductGrid products={remaining} /><Link className="text-link" href={`/shop?label=${slug}`}>Shop all labels with filters</Link></section>
  </main>;
}

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LABELS } from '@lopaworld/types';
import { findPublishedRecordsSafely, type CMSRecord } from '../../lib/cms';
import { listStoreCategories, listStoreProductsSafely, productLabel, productsForCollectionHandle, type StoreCategory, type StoreProduct } from '../../lib/store';
import { CatalogListing } from './CatalogListing';
import { parseCatalogFilters, type SearchValues } from './CatalogPage';
import { RichContent, record, safeHref, text } from './content';

type Media = { src: string; alt: string };
const media = (value: unknown, alt?: unknown): Media | null => {
  const item = record(value);
  const src = text(item?.url);
  return src ? { src, alt: text(alt) ?? text(item?.alt) ?? '' } : null;
};

export async function LabelLandingPage({ slug, categoryHandle, searchParams }: { slug: string; categoryHandle?: string; searchParams: Promise<SearchValues> }) {
  const position = LABELS.findIndex((entry) => entry.slug === slug);
  const canonical = LABELS[position];
  if (!canonical) notFound();
  const filters = parseCatalogFilters(await searchParams);
  const [contentResult, productResult, campaignResult, categories] = await Promise.all([
    findPublishedRecordsSafely('labels', { slug: { equals: slug } }, 1),
    listStoreProductsSafely({ limit: 100, order: filters.sort === 'title' ? 'title' : '-created_at' }),
    // Filtered in code: campaigns.status shares an enum with Payload's drafts _status (ADR-014), so an
    // SQL filter on 'active' errors until that schema fix lands.
    findPublishedRecordsSafely('campaigns', {}, 20),
    listStoreCategories().catch(() => [] as StoreCategory[]),
  ]);
  const label = contentResult.records[0];
  const name = text(label?.name) ?? canonical.name;
  const labelProducts = productResult.products.filter((product) => productLabel(product) === slug);

  const featuredHandle = text(label?.featuredCollectionHandle);
  let featured: StoreProduct[] = [];
  if (featuredHandle) {
    try { featured = (await productsForCollectionHandle(featuredHandle, 6)).products.filter((product) => productLabel(product) === slug); } catch { /* The mosaic omits product tiles. */ }
  }
  const mosaic = [media(label?.heroMedia), ...featured.map((product) => media(product.images?.[0]?.url ? { url: product.images[0].url } : null, product.title))]
    .filter((item): item is Media => Boolean(item)).slice(0, 3);

  // Lookbook: only active, published campaigns related to this label that have hero media.
  const looks = campaignResult.records.filter((campaign) => campaign.status === 'active' && Boolean(media(campaign.heroMedia))
    && Array.isArray(campaign.labels) && campaign.labels.some((entry) => record(entry)?.slug === slug || (label && record(entry)?.id === label.id)));
  const lookbook = looks.length > 0 && filters.view === 'lookbook';

  // Category rail: Medusa categories present in this label's products, with counts.
  const counts = new Map<string, number>();
  for (const product of labelProducts) for (const category of product.categories ?? []) counts.set(category.handle, (counts.get(category.handle) ?? 0) + 1);
  const rail = categories.filter(({ handle }) => counts.has(handle));
  const pathname = categoryHandle ? `/l/${slug}/${categoryHandle}` : `/l/${slug}`;
  const nameParts = name.split(/\s+/);

  return <main className="label-page" data-label={slug}>
    <section className="label-hero" data-ground="ink">
      <div className="label-hero-inner">
        <div className="label-hero-copy">
          <p className="lw-eyebrow label-hero-eyebrow">{slug === 'lopaworld' ? 'The house' : `${String(position + 1).padStart(2, '0')} · A Lopaworld label`}</p>
          <div>
            <h1 className="lw-display label-hero-name">{nameParts.length > 1 ? <>{nameParts[0]}<br />{nameParts.slice(1).join(' ')}</> : name}</h1>
            {text(label?.introSummary) && <p className="lw-voice label-hero-voice">{text(label?.introSummary)}</p>}
          </div>
          {Boolean(label?.intro) && <div className="label-hero-intro"><RichContent value={label?.intro} /></div>}
        </div>
        {mosaic.length > 0 && <div className="label-mosaic" data-count={mosaic.length}>{mosaic.map((item, i) => <img key={item.src} src={item.src} alt={item.alt} width="600" height={i === 0 ? 1000 : 600} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" />)}</div>}
      </div>
    </section>
    <CatalogListing title={name} eyebrow={name} pathname={pathname} filters={filters} products={labelProducts} count={labelProducts.length} categories={categories}
      error={productResult.error} lockedLabel={slug} lockedCategory={categoryHandle} hideHeading
      toolbarExtra={looks.length > 0 ? <ViewToggle pathname={pathname} lookbook={lookbook} /> : null}
      lookbook={lookbook ? <Lookbook looks={looks} /> : undefined}>
      {rail.length > 0 && <nav className="category-rail" aria-label={`${name} categories`}>
        <Link href={`/l/${slug}`} aria-current={!categoryHandle ? 'page' : undefined}>All <span>{labelProducts.length}</span></Link>
        {rail.map(({ handle, name: categoryName }) => <Link key={handle} href={`/l/${slug}/${handle}`} aria-current={categoryHandle === handle ? 'page' : undefined}>{categoryName} <span>{counts.get(handle)}</span></Link>)}
      </nav>}
    </CatalogListing>
    <footer className="label-footer" data-ground="ink">
      <span>{name} is a Lopaworld label.</span>
      {safeHref(label?.instagramUrl) && <a href={safeHref(label?.instagramUrl) ?? undefined} rel="noopener noreferrer">Instagram</a>}
    </footer>
  </main>;
}

function ViewToggle({ pathname, lookbook }: { pathname: string; lookbook: boolean }) {
  return <div className="view-toggle" role="group" aria-label="View">
    <Link href={pathname} aria-current={!lookbook ? 'true' : undefined}>Grid</Link>
    <Link href={`${pathname}?view=lookbook`} aria-current={lookbook ? 'true' : undefined}>Lookbook</Link>
  </div>;
}

function Lookbook({ looks }: { looks: CMSRecord[] }) {
  return <div className="lookbook">{looks.map((look, i) => {
    const image = media(look.heroMedia, look.heroAlt);
    const cta = safeHref(look.ctaUrl);
    return <article key={look.id} className="look">
      {image && <img className="look-image" src={image.src} alt={image.alt} width="1600" height="1000" loading={i === 0 ? 'eager' : 'lazy'} decoding="async" />}
      <div className="look-copy">
        <p className="lw-eyebrow">Look {String(i + 1).padStart(2, '0')}</p>
        <h2 className="look-title">{text(look.title)}</h2>
        {text(look.campaignLine) && <p className="lw-voice look-line">{text(look.campaignLine)}</p>}
        {Boolean(look.body) && <RichContent value={look.body} />}
        {cta && text(look.ctaLabel) && <Link className="lw-button" href={cta}>{text(look.ctaLabel)}</Link>}
      </div>
    </article>;
  })}</div>;
}

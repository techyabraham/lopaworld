import Link from 'next/link';
import { LABELS } from '@lopaworld/types';
import { findHomepageLayoutSafely, findPublishedRecordsSafely } from '../../lib/cms';
import { listStoreProductsSafely, productsForCollectionHandle } from '../../lib/store';
import { ProductGrid } from './ProductGrid';
import { CMSImage, record, safeHref, text } from './content';

const labelNames = new Map<string, string>(LABELS.map(({ slug, name }) => [slug, name]));

export async function HomePage() {
  const [layoutResult, labelResult] = await Promise.all([
    findHomepageLayoutSafely(),
    findPublishedRecordsSafely('labels'),
  ]);
  const blocks = layoutResult.layout?.layout ?? [];
  const labels = labelResult.records;
  return <main className="store-page home-page" data-page="home">
    {layoutResult.error && <p className="service-message" role="status">{layoutResult.error}</p>}
    {blocks.length ? blocks.map((block, index) => <HomeBlock key={text(block.id) ?? `${text(block.blockType) ?? 'block'}-${index}`} block={block} labels={labels} />) : <section className="home-intro">
      <p className="eyebrow">A Nigerian fashion house</p><h1>One house.<br />Seven labels.</h1>
      <p>Explore the Lopaworld labels and find the pieces published in our catalogue.</p>
      <Link className="lw-button" href="/shop">Explore the collection</Link>
    </section>}
  </main>;
}

async function HomeBlock({ block, labels }: { block: Record<string, unknown>; labels: Array<Record<string, unknown> & { id: string; name?: string; slug?: string }> }) {
  const type = text(block.blockType);
  if (type === 'campaignHero') {
    const cta = safeHref(block.ctaUrl);
    return <section className="campaign-hero">
      <div className="campaign-hero-copy"><p className="eyebrow">Lopaworld</p><h1>{text(block.headline) ?? 'Stories and style from Lopaworld'}</h1>{text(block.supportingCopy) && <p>{text(block.supportingCopy)}</p>}{cta && text(block.ctaLabel) && <Link className="lw-button" href={cta}>{text(block.ctaLabel)}</Link>}</div>
      {Boolean(block.image) && <CMSImage value={block.image} alt={block.imageAlt} className="campaign-hero-image" />}
    </section>;
  }
  if (type === 'labelEntrances') return <section className="store-section label-entrances">
    <SectionHeading eyebrow="Find your expression" title={text(block.heading) ?? 'Seven labels'} />
    {labels.length ? <ul className="label-grid">{labels.map((label) => <LabelEntrance key={label.id} label={label} />)}</ul> : <p className="empty-inline">Label pages are being prepared in the editorial system.</p>}
  </section>;
  if (type === 'featuredCollection') {
    const handle = text(block.medusaCollectionHandle);
    let result: { products: Awaited<ReturnType<typeof productsForCollectionHandle>>['products']; count: number } = { products: [], count: 0 };
    if (handle) {
      try { result = await productsForCollectionHandle(handle, 8); } catch { /* The section keeps its editorial heading when commerce is unavailable. */ }
    }
    return <section className="store-section"><SectionHeading eyebrow="Selected pieces" title={text(block.heading) ?? 'Featured collection'} />{result.products.length ? <ProductGrid products={result.products} /> : <p className="empty-inline">No published pieces are available in this collection yet.</p>}{handle && <Link className="text-link" href={`/shop?collection=${encodeURIComponent(handle)}`}>View collection</Link>}</section>;
  }
  if (type === 'newArrivals') {
    const result = await listStoreProductsSafely({ limit: 8, order: '-created_at' });
    return <section className="store-section"><SectionHeading eyebrow="Recently added" title={text(block.heading) ?? 'New arrivals'} />{text(block.description) && <p>{text(block.description)}</p>}{result.products.length ? <ProductGrid products={result.products} /> : <p className="empty-inline">New arrivals will appear here when pieces are published.</p>}</section>;
  }
  if (type === 'storyFeature') {
    const story = record(block.story);
    const href = story?.slug ? `/stories/${String(story.slug)}` : '/stories';
    return <section className="story-feature"><p className="eyebrow">From the journal</p><h2>{text(block.heading) ?? text(story?.title) ?? 'Stories'}</h2>{text(story?.excerpt) && <p>{text(story?.excerpt)}</p>}<Link className="text-link" href={href}>Read the story</Link></section>;
  }
  if (type === 'occasionLinks') {
    const links = Array.isArray(block.links) ? block.links.map(record).filter((value): value is Record<string, unknown> => Boolean(value)) : [];
    return <section className="store-section"><SectionHeading eyebrow="Discover" title={text(block.heading) ?? 'Shop by occasion'} />{links.length ? <ul className="occasion-grid">{links.map((item, index) => {
      const href = safeHref(item.url);
      return href ? <li key={`${text(item.label) ?? 'occasion'}-${index}`}><Link href={href}>{text(item.label) ?? 'Explore'}</Link></li> : null;
    })}</ul> : <p className="empty-inline">Occasion links will appear when they are confirmed.</p>}</section>;
  }
  if (type === 'newsletter') return <section className="newsletter-panel"><div><p className="eyebrow">Stay in touch</p><h2>{text(block.heading) ?? 'News from Lopaworld'}</h2>{text(block.description) && <p>{text(block.description)}</p>}</div><p className="service-message">Newsletter sign-up will be enabled after the email provider and consent wording are confirmed.</p></section>;
  return null;
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <header className="section-heading"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></header>;
}

function LabelEntrance({ label }: { label: Record<string, unknown> & { id: string; name?: string; slug?: string } }) {
  const slug = text(label.slug);
  if (!slug) return null;
  const hero = label.heroMedia;
  const name = text(label.name) ?? labelNames.get(slug) ?? slug;
  return <li><Link href={`/l/${slug}`} className="label-entrance" data-label={slug}>
    {Boolean(hero) ? <CMSImage value={hero} alt={record(hero)?.alt} className="label-entrance-image" /> : <span className="label-entrance-placeholder" aria-hidden="true">{name.slice(0, 1)}</span>}
    <span><strong>{slug === 'lopaworld' ? 'Lopaworld — The House' : name}</strong>{text(label.introSummary) && <small>{text(label.introSummary)}</small>}</span>
  </Link></li>;
}

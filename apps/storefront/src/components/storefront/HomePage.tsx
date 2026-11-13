import Link from 'next/link';
import { headers } from 'next/headers';
import { LABELS } from '@lopaworld/types';
import { findHomepageLayoutSafely, findPublishedRecordsSafely, type CMSRecord } from '../../lib/cms';
import { listStoreProductsSafely, productLabel, productsForCollectionHandle, type StoreProduct } from '../../lib/store';
import { ProductTile } from './ProductGrid';
import { EntranceHero, type HeroImage, type HeroLabel } from './EntranceHero';
import { record, safeHref, text } from './content';

// The house slug stays out of the label index and drop chips pending gate D11.
const LABEL_ORDER = LABELS.filter(({ slug }) => slug !== 'lopaworld');
const TONE_CYCLE = LABEL_ORDER.map(({ slug }) => slug);

function mediaImage(value: unknown, alt?: unknown): HeroImage | null {
  const media = record(value);
  const src = text(media?.url);
  if (!src) return null;
  return { src, alt: text(alt) ?? text(media?.alt) ?? '', width: typeof media?.width === 'number' ? media.width : undefined, height: typeof media?.height === 'number' ? media.height : undefined };
}

/** Label data for the hero index: name, slug, introSummary and image URL only (kept small for the client island). */
function heroLabels(source: CMSRecord[]): HeroLabel[] {
  return LABEL_ORDER.map(({ slug, name }) => {
    const label = source.find((entry) => entry.slug === slug);
    return { slug, name: text(label?.name) ?? name, introSummary: text(label?.introSummary), image: mediaImage(label?.heroMedia) };
  });
}

export async function HomePage() {
  const [layoutResult, labelResult, requestHeaders] = await Promise.all([
    findHomepageLayoutSafely(),
    findPublishedRecordsSafely('labels'),
    headers(),
  ]);
  const blocks = layoutResult.layout?.layout ?? [];
  const saveData = requestHeaders.get('save-data') === 'on';
  const published = labelResult.records;
  const entranceBlock = blocks.find((block) => block.blockType === 'labelEntrances');
  const blockLabels = Array.isArray(entranceBlock?.labels) ? entranceBlock.labels.map(record).filter((value): value is CMSRecord => Boolean(value?.slug)) : [];
  const labels = heroLabels(blockLabels.length ? blockLabels : published);
  const hasHero = blocks.some((block) => block.blockType === 'campaignHero');

  if (!blocks.length) {
    const drop = await listStoreProductsSafely({ limit: 12, order: '-created_at' });
    return <main className="home-page" data-page="home">
      <EntranceHero headline="Lopaworld" supportingCopy={null} image={null} secondaryCta={drop.products.length ? { href: '#drop', label: 'Shop the drop' } : null} labels={labels} saveData={saveData} />
      <DropSection id="drop" heading="New in" products={drop.products} viewAll="/new-in" />
    </main>;
  }

  return <main className="home-page" data-page="home">
    {blocks.map((block, index) => <HomeBlock key={text(block.id) ?? `${text(block.blockType) ?? 'block'}-${index}`} block={block} index={index} labels={labels} hasHero={hasHero} saveData={saveData} />)}
  </main>;
}

async function HomeBlock({ block, index, labels, hasHero, saveData }: { block: Record<string, unknown>; index: number; labels: HeroLabel[]; hasHero: boolean; saveData: boolean }) {
  const type = text(block.blockType);
  if (type === 'campaignHero') {
    const campaign = record(block.campaign);
    const image = mediaImage(block.image, block.imageAlt) ?? mediaImage(campaign?.heroMedia, campaign?.heroAlt);
    const href = safeHref(block.ctaUrl);
    const label = text(block.ctaLabel);
    return <EntranceHero headline={text(block.headline) ?? 'Lopaworld'} supportingCopy={text(block.supportingCopy)} image={image} secondaryCta={href && label ? { href, label } : null} labels={labels} saveData={saveData} />;
  }
  // With a hero on the page, the label index is docked inside it; otherwise it stands alone as tiles.
  if (type === 'labelEntrances') return hasHero ? null : <LabelTiles heading={text(block.heading)} labels={labels} />;
  if (type === 'featuredCollection') {
    const handle = text(block.medusaCollectionHandle);
    let products: StoreProduct[] = [];
    if (handle) {
      try { products = (await productsForCollectionHandle(handle, 12)).products; } catch { /* The section hides when commerce is unavailable. */ }
    }
    return <DropSection id={index === 0 ? 'drop' : `drop-${index}`} heading={text(block.heading)} products={products} viewAll={handle ? `/shop?collection=${encodeURIComponent(handle)}` : null} />;
  }
  if (type === 'newArrivals') {
    const result = await listStoreProductsSafely({ limit: 12, order: '-created_at' });
    return <DropSection id="drop" heading={text(block.heading)} products={result.products} viewAll="/new-in" />;
  }
  if (type === 'occasionLinks') return <OccasionTiles heading={text(block.heading)} links={Array.isArray(block.links) ? block.links : []} />;
  if (type === 'storyFeature') return <JournalCard heading={text(block.heading)} story={record(block.story)} />;
  // Newsletter sign-up waits for gate D8: no placeholder copy for customers.
  return null;
}

function SplitHeading({ heading, className = '' }: { heading: string; className?: string }) {
  // "Where are you walking in?" -> the last two words become the voice line.
  const words = heading.trim().split(/\s+/);
  if (heading.trim().endsWith('?') && words.length >= 3) {
    return <h2 className={`lw-display section-display ${className}`}>{words.slice(0, -2).join(' ')} <span className="lw-voice section-voice">{words.slice(-2).join(' ')}</span></h2>;
  }
  return <h2 className={`lw-display section-display ${className}`}>{heading}</h2>;
}

export function DropSection({ id, heading, products, viewAll }: { id: string; heading: string | null; products: StoreProduct[]; viewAll: string | null }) {
  if (!products.length) return null;
  const present = LABEL_ORDER.filter(({ slug }) => products.some((product) => productLabel(product) === slug));
  return <section id={id} className="drop-section" aria-labelledby={`${id}-heading`}>
    <div className="drop-header">
      <h2 id={`${id}-heading`} className="lw-display section-display">{heading ?? 'New in'}</h2>
      {present.length > 1 && <fieldset className="drop-chips">
        <legend className="visually-hidden">Filter by label</legend>
        <label className="lw-chip"><input className="visually-hidden" type="radio" name={`${id}-label`} value="all" defaultChecked />All</label>
        {present.map(({ slug, name }) => <label key={slug} className="lw-chip"><input className="visually-hidden" type="radio" name={`${id}-label`} value={slug} />{name.replace(/^Lopa\s+/, '')}</label>)}
      </fieldset>}
    </div>
    <ul className="product-grid drop-grid">{products.map((product) => <ProductTile key={product.id} product={product} />)}</ul>
    {viewAll && <p className="drop-view-all"><Link className="lw-button" data-variant="secondary" href={viewAll}>View all</Link></p>}
  </section>;
}

export function OccasionTiles({ heading, links }: { heading: string | null; links: unknown[] }) {
  const items = links.map(record).map((item) => ({ label: text(item?.label), href: safeHref(item?.url) })).filter((item): item is { label: string; href: string } => Boolean(item.label && item.href));
  if (!items.length) return null;
  return <section id="occasions" className="occasions-section" aria-label={heading ?? 'Occasions'}>
    {heading && <SplitHeading heading={heading} />}
    <ul className="occasion-tiles">{items.map((item, i) => <li key={`${item.label}-${i}`}><Link className="occasion-tile" href={item.href} data-label={TONE_CYCLE[i % TONE_CYCLE.length]}><span className="occasion-tile-name">{item.label}</span></Link></li>)}</ul>
  </section>;
}

function JournalCard({ heading, story }: { heading: string | null; story: Record<string, unknown> | null }) {
  const title = text(story?.title);
  const slug = text(story?.slug);
  if (!title || !slug) return null;
  const labels = Array.isArray(story?.labels) ? story.labels.map(record) : [];
  const eyebrow = text(labels[0]?.name);
  const image = mediaImage(story?.heroMedia, story?.heroAlt);
  return <section className="journal-section" aria-labelledby="journal-heading">
    <h2 id="journal-heading" className="lw-display section-display">{heading ?? 'Journal'}</h2>
    <Link className="journal-card" href={`/stories/${slug}`}>
      {image && <img className="journal-card-image" src={image.src} alt={image.alt} width={image.width ?? 1200} height={image.height ?? 900} loading="lazy" decoding="async" />}
      {eyebrow && <span className="lw-eyebrow journal-card-eyebrow">{eyebrow}</span>}
      <span className="journal-card-title">{title}</span>
    </Link>
  </section>;
}

function LabelTiles({ heading, labels }: { heading: string | null; labels: HeroLabel[] }) {
  return <section className="label-tiles-section" aria-label={heading ?? 'Labels'}>
    {heading && <h2 className="lw-display section-display">{heading}</h2>}
    <ul className="label-tiles">{labels.map((label) => <li key={label.slug}><Link className="label-tile" href={`/l/${label.slug}`} data-label={label.slug}>
      {label.image && <img src={label.image.src} alt="" width="480" height="640" loading="lazy" decoding="async" />}
      <span className="label-tile-text"><span className="label-tile-name">{label.name}</span>{label.introSummary && <span className="lw-voice label-tile-line">{label.introSummary}</span>}</span>
    </Link></li>)}</ul>
  </section>;
}


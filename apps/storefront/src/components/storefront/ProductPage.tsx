import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Accordion, Breadcrumb, ErrorState, Gallery } from '@lopaworld/ui';
import { LABELS } from '@lopaworld/types';
import { findPublishedRecordsSafely } from '../../lib/cms';
import { listStoreProductsSafely, productLabel, retrieveStoreProduct, type StoreProduct } from '../../lib/store';
import { formatPrice, variantIsAvailable } from '../../lib/product-options';
import type { AddAllItem } from '../../lib/add-all';
import { canonical, jsonLd } from '../../lib/seo';
import { ProductPurchasePanel } from './ProductPurchasePanel';
import { ProductGrid } from './ProductGrid';
import { AddAllButton } from './CompleteTheEntrance';
import { text } from './content';
import { TrackEvent } from '../site/TrackEvent';

const labelNames = new Map<string, string>(LABELS.map(({ slug, name }) => [slug, name]));
const labelName = (slug: string) => slug === 'lopaworld' ? 'Lopaworld — The House' : labelNames.get(slug) ?? slug;
const COMPLETE_THE_LOOK_MAX = 4;

function imageList(product: StoreProduct) {
  return (product.images ?? []).map((image, index) => ({
    src: image.url,
    alt: typeof image.metadata?.alt === 'string' ? image.metadata.alt : Array.isArray(product.metadata?.image_alt_texts) && typeof product.metadata.image_alt_texts[index] === 'string' ? product.metadata.image_alt_texts[index] as string : '',
  }));
}

/** Handles from product metadata, validated: strings only, no duplicates, not the product itself. */
function completeTheLookHandles(product: StoreProduct): string[] {
  const raw = product.metadata?.complete_the_look;
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((handle): handle is string => typeof handle === 'string' && handle.trim().length > 0).map((handle) => handle.trim()))]
    .filter((handle) => handle !== product.handle).slice(0, COMPLETE_THE_LOOK_MAX);
}

async function completeTheLook(product: StoreProduct) {
  const handles = completeTheLookHandles(product);
  if (!handles.length) return null;
  const pieces = (await Promise.all(handles.map((handle) => retrieveStoreProduct(handle).catch(() => null)))).filter((piece): piece is StoreProduct => Boolean(piece));
  if (!pieces.length) return null;
  // "Add all" only when every listed handle resolved and each piece has exactly one purchasable,
  // priced variant: otherwise the customer must choose a size on the piece's own page.
  const items: AddAllItem[] = [];
  let total = 0;
  let currency: string | undefined;
  for (const piece of pieces) {
    const madeToOrder = piece.metadata?.made_to_order === true;
    const purchasable = (piece.variants ?? []).filter((variant) => variantIsAvailable(variant, madeToOrder) && typeof variant.calculated_price?.calculated_amount === 'number');
    if (purchasable.length !== 1 || (piece.variants ?? []).length !== 1) break;
    const [variant] = purchasable;
    items.push({ handle: piece.handle, variantId: variant!.id, title: piece.title });
    total += variant!.calculated_price!.calculated_amount!;
    currency ??= variant!.calculated_price!.currency_code;
  }
  const addAll = pieces.length === handles.length && items.length === pieces.length ? { items, totalText: formatPrice(total, currency ?? 'NGN') } : null;
  return { pieces, addAll };
}

export async function ProductPage({ handle }: { handle: string }) {
  let product: StoreProduct | null = null;
  try { product = await retrieveStoreProduct(handle); } catch {
    return <main className="store-page"><ErrorState title="This piece is temporarily unavailable" description="Please try again shortly." /></main>;
  }
  if (!product) notFound();
  const label = productLabel(product);
  const category = product.categories?.[0];
  const sizeGuideId = text(product.metadata?.size_guide_id);
  const [guideResult, relatedResult, returnsResult, look] = await Promise.all([
    sizeGuideId ? findPublishedRecordsSafely('size-guides', { id: { equals: sizeGuideId } }, 1) : Promise.resolve({ records: [], error: null }),
    listStoreProductsSafely({ limit: 12, order: '-created_at' }),
    findPublishedRecordsSafely('pages', { slug: { equals: 'returns' } }, 1),
    completeTheLook(product),
  ]);
  const sizeGuide = guideResult.records[0];
  const returnsPage = returnsResult.records[0];
  const images = imageList(product);
  const related = relatedResult.products.filter((item) => item.id !== product?.id && (!label || productLabel(item) === label)).slice(0, 4);
  const primaryPrice = product.variants?.find((variant) => variant.calculated_price)?.calculated_price;
  const description = product.description ?? '';
  const subtitle = text(product.subtitle);
  // Video hook: a product.metadata.video_url will render here once it exists; nothing renders today.

  const crumbs: Array<{ label: string; href: string }> = [{ label: 'Home', href: '/' }];
  if (label) crumbs.push({ label: labelNames.get(label) ?? label, href: `/l/${label}` });
  crumbs.push(category && label ? { label: category.name, href: `/l/${label}/${category.handle}` } : { label: 'Shop', href: '/shop' });

  const productUrl = canonical(`/p/${encodeURIComponent(product.handle)}`);
  const schema = primaryPrice?.calculated_amount === undefined ? null : {
    '@context': 'https://schema.org', '@type': 'Product', name: product.title, description,
    image: images.map(({ src }) => src), sku: product.variants?.[0]?.sku,
    brand: label ? { '@type': 'Brand', name: labelNames.get(label) ?? label } : undefined,
    offers: { '@type': 'Offer', priceCurrency: (primaryPrice.currency_code ?? 'NGN').toUpperCase(), price: primaryPrice.calculated_amount, availability: (product.variants ?? []).some((variant) => variant.manage_inventory === false || variant.allow_backorder || (variant.inventory_quantity ?? 0) > 0) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', ...(productUrl ? { url: productUrl } : {}) },
  };
  const breadcrumbSchema = productUrl ? { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    ...crumbs.map((crumb, index) => ({ '@type': 'ListItem', position: index + 1, name: crumb.label, item: canonical(crumb.href) })),
    { '@type': 'ListItem', position: crumbs.length + 1, name: product.title, item: productUrl },
  ] } : null;

  return <main className="store-page product-page" data-label={label ?? 'lopaworld'}>
    <TrackEvent name="product_view" params={{ item_id: product.id, item_name: product.title, item_label: label ?? 'unknown' }} />
    <Breadcrumb items={[...crumbs, { label: product.title }]} />
    <div className="product-layout">
      <div className="product-gallery">{images.length ? <Gallery images={images} /> : <div className="product-image-blank" aria-hidden="true" />}</div>
      <div className="product-info">
        <div className="product-heading">
          {label && <Link className="lw-eyebrow product-label-link" href={`/l/${label}`}>{labelName(label)}</Link>}
          <h1 className="lw-display product-title-display">{product.title}</h1>
          {subtitle && <p className="lw-voice product-subtitle">{subtitle}</p>}
        </div>
        <ProductPurchasePanel product={product} sizeGuide={sizeGuide} saveItem={{ id: product.id, handle: product.handle, title: product.title, image: images[0]?.src }} />
        <div className="product-accordions">
          {description && <Accordion title="Details"><p>{description}</p></Accordion>}
          {text(product.metadata?.fit) && <Accordion title="Fit"><p>{text(product.metadata?.fit)}</p></Accordion>}
          {text(product.metadata?.fabric) && <Accordion title="Fabric"><p>{text(product.metadata?.fabric)}</p></Accordion>}
          {text(product.metadata?.care) && <Accordion title="Care"><p>{text(product.metadata?.care)}</p></Accordion>}
          {text(product.metadata?.delivery_note) && <Accordion title="Delivery"><p>{text(product.metadata?.delivery_note)}</p></Accordion>}
          {returnsPage && <Accordion title="Returns"><p><Link href="/pages/returns">{text(returnsPage.title) ?? 'Read the returns policy'}</Link></p></Accordion>}
        </div>
        {guideResult.error && <p className="service-message" role="status">The size guide is temporarily unavailable.</p>}
      </div>
    </div>
    {look && <section className="complete-look" data-label={label ?? 'lopaworld'} aria-labelledby="complete-look-heading">
      <div className="complete-look-inner">
        <header className="complete-look-header">
          <h2 id="complete-look-heading" className="lw-display complete-look-title">Complete<br /><span className="lw-voice">the entrance</span></h2>
          {look.addAll && <AddAllButton items={look.addAll.items} totalText={look.addAll.totalText} />}
        </header>
        <ul className="complete-look-grid">{look.pieces.map((piece) => {
          const pieceLabel = productLabel(piece);
          const [image] = imageList(piece);
          return <li key={piece.id}><Link href={`/p/${piece.handle}`} className="complete-look-piece">
            <span className="complete-look-media">{/* Raw <img> until Phase 1.3 moves media to next/image. */}{image && <img src={image.src} alt={image.alt} loading="lazy" decoding="async" />}</span>
            {pieceLabel && <span className="lw-eyebrow complete-look-label">{labelNames.get(pieceLabel) ?? pieceLabel}</span>}
            <span className="complete-look-name">{piece.title}</span>
          </Link></li>;
        })}</ul>
      </div>
    </section>}
    {related.length > 0 && <section className="store-section related-pieces"><header className="section-heading"><p className="lw-eyebrow">Continue exploring</p><h2 className="lw-display">Related pieces</h2></header><ProductGrid products={related} /></section>}
    {schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />}
    {breadcrumbSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }} />}
  </main>;
}

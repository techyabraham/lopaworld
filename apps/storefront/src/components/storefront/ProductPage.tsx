import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Gallery, Accordion } from '@lopaworld/ui';
import { findPublishedRecordsSafely } from '../../lib/cms';
import { productLabel, retrieveStoreProduct, type StoreProduct } from '../../lib/store';
import { ProductPurchasePanel } from './ProductPurchasePanel';
import { ProductGrid } from './ProductGrid';
import { text } from './content';
import { listStoreProductsSafely } from '../../lib/store';
import { LABELS } from '@lopaworld/types';

const labelNames = new Map<string, string>(LABELS.map(({ slug, name }) => [slug, name]));

export async function ProductPage({ handle }: { handle: string }) {
  let product: StoreProduct | null = null;
  try { product = await retrieveStoreProduct(handle); } catch { return <main className="store-page"><h1>Product details are temporarily unavailable</h1><p>Please try again shortly.</p></main>; }
  if (!product) notFound();
  const label = productLabel(product);
  const sizeGuideId = text(product.metadata?.size_guide_id);
  const [guideResult, relatedResult] = await Promise.all([
    sizeGuideId ? findPublishedRecordsSafely('size-guides', { id: { equals: sizeGuideId } }, 1) : Promise.resolve({ records: [], error: null }),
    listStoreProductsSafely({ limit: 12, order: '-created_at' }),
  ]);
  const sizeGuide = guideResult.records[0];
  const images = (product.images ?? []).map((image, index) => ({
    src: image.url,
    alt: typeof image.metadata?.alt === 'string' ? image.metadata.alt : Array.isArray(product.metadata?.image_alt_texts) && typeof product.metadata.image_alt_texts[index] === 'string' ? product.metadata.image_alt_texts[index] as string : '',
  }));
  const related = relatedResult.products.filter((item) => item.id !== product?.id && (!label || productLabel(item) === label)).slice(0, 4);
  const primaryPrice = product.variants?.find((variant) => variant.calculated_price)?.calculated_price;
  const description = product.description ?? '';
  const schema = primaryPrice?.calculated_amount === undefined ? null : {
    '@context': 'https://schema.org', '@type': 'Product', name: product.title, description,
    image: images.map(({ src }) => src), sku: product.variants?.[0]?.sku,
    brand: label ? { '@type': 'Brand', name: labelNames.get(label) ?? label } : undefined,
    offers: { '@type': 'Offer', priceCurrency: (primaryPrice.currency_code ?? 'NGN').toUpperCase(), price: primaryPrice.calculated_amount, availability: (product.variants ?? []).some((variant) => variant.manage_inventory === false || variant.allow_backorder || (variant.inventory_quantity ?? 0) > 0) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', url: `/p/${product.handle}` },
  };
  return <main className="store-page product-page" data-label={label ?? 'lopaworld'}>
    <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/shop">Shop</Link><span aria-hidden="true">/</span><span aria-current="page">{product.title}</span></nav>
    <div className="product-layout">
      <div className="product-gallery">{images.length ? <Gallery images={images} /> : <div className="media-placeholder product-image-placeholder">Product imagery is being prepared.</div>}</div>
      <div className="product-info">
        {label && <Link className="eyebrow product-label-link" href={`/l/${label}`}>{label === 'lopaworld' ? 'Lopaworld — The House' : labelNames.get(label) ?? label}</Link>}
        <h1>{product.title}</h1>
        <ProductPurchasePanel product={product} sizeGuide={sizeGuide} />
        <div className="product-accordions">
          {description && <Accordion title="Details"><p>{description}</p></Accordion>}
          {text(product.metadata?.fit) && <Accordion title="Fit"><p>{text(product.metadata?.fit)}</p></Accordion>}
          {text(product.metadata?.fabric) && <Accordion title="Fabric"><p>{text(product.metadata?.fabric)}</p></Accordion>}
          {text(product.metadata?.care) && <Accordion title="Care"><p>{text(product.metadata?.care)}</p></Accordion>}
          {text(product.metadata?.delivery_note) && <Accordion title="Delivery"><p>{text(product.metadata?.delivery_note)}</p></Accordion>}
          <Accordion title="Returns"><p>Return information will be shown here once Lopaworld’s direct-store policy is confirmed.</p></Accordion>
        </div>
        <p className="support-note">WhatsApp support details will be available here after confirmation.</p>
        {guideResult.error && <p className="service-message" role="status">The size guide is temporarily unavailable.</p>}
      </div>
    </div>
    {related.length > 0 && <section className="store-section"><header className="section-heading"><p className="eyebrow">Continue exploring</p><h2>Related pieces</h2></header><ProductGrid products={related} /></section>}
    {schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />}
  </main>;
}

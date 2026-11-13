import Link from 'next/link';
import { LABELS } from '@lopaworld/types';
import { productLabel, productPrice, type StoreProduct } from '../../lib/store';
import { productBadge } from '../../lib/product-badges';
import { productColours, tileColourSummary } from '../../lib/product-colours';

const labelNames = new Map<string, string>(LABELS.map(({ slug, name }) => [slug, name]));

export function ProductGrid({ products }: { products: StoreProduct[] }) {
  if (!products.length) return <p className="empty-inline">No published pieces match these choices yet.</p>;
  return <ul className="product-grid">{products.map((product) => <ProductTile key={product.id} product={product} />)}</ul>;
}

function imageAlt(product: StoreProduct, index: number) {
  const image = product.images?.[index];
  const altTexts = product.metadata?.image_alt_texts;
  if (typeof image?.metadata?.alt === 'string') return image.metadata.alt;
  return Array.isArray(altTexts) && typeof altTexts[index] === 'string' ? altTexts[index] : '';
}

export function ProductTile({ product, as: Tag = 'li' }: { product: StoreProduct; as?: 'li' | 'div' }) {
  const label = productLabel(product);
  const [first, second] = product.images ?? [];
  const amount = productPrice(product);
  const currency = product.variants?.find(({ calculated_price }) => calculated_price?.currency_code)?.calculated_price?.currency_code ?? 'NGN';
  const badge = productBadge(product);
  const colours = tileColourSummary(productColours(product));
  return <Tag className="product-tile" data-label={label ?? undefined}>
    <Link href={`/p/${product.handle}`} className="product-tile-link">
      {/* Raw <img> until Phase 1.3 adds images.remotePatterns for the media host and switches to next/image. */}
      <span className="product-tile-media">
        {first?.url ? <img src={first.url} alt={imageAlt(product, 0)} width="600" height="800" loading="lazy" decoding="async" /> : <span className="product-tile-blank" aria-hidden="true" />}
        {second?.url && <img className="product-tile-alt" src={second.url} alt="" width="600" height="800" loading="lazy" decoding="async" />}
        {badge && <span className="lw-badge product-tile-badge" data-variant={badge.variant}>{badge.label}</span>}
      </span>
      <span className="product-tile-meta">
        <span className="product-tile-text">
          {label && <span className="product-label lw-eyebrow">{labelNames.get(label) ?? label}</span>}
          <span className="product-title">{product.title}</span>
        </span>
        {amount !== null && <span className="product-price">{new Intl.NumberFormat('en-NG', { style: 'currency', currency: currency.toUpperCase(), maximumFractionDigits: 0 }).format(amount)}</span>}
      </span>
      {colours && ('text' in colours
        ? <span className="product-tile-colours">{colours.text}</span>
        : <span className="product-tile-colours" aria-label={`${colours.swatches.length + colours.more} colours`}>{colours.swatches.map(({ name, hex }) => <span key={name} className="product-tile-swatch" style={{ backgroundColor: hex ?? undefined }} />)}{colours.more > 0 && <span>+{colours.more}</span>}</span>)}
    </Link>
  </Tag>;
}

import Link from 'next/link';
import { LABELS } from '@lopaworld/types';
import { productLabel, productPrice, type StoreProduct } from '../../lib/store';

const labelNames = new Map<string, string>(LABELS.map(({ slug, name }) => [slug, name]));

export function ProductGrid({ products }: { products: StoreProduct[] }) {
  if (!products.length) return <p className="empty-inline">No published pieces match these choices yet.</p>;
  return <ul className="product-grid">{products.map((product) => <ProductTile key={product.id} product={product} />)}</ul>;
}

export function ProductTile({ product }: { product: StoreProduct }) {
  const label = productLabel(product);
  const images = product.images ?? [];
  const image = images[0];
  const altTexts = product.metadata?.image_alt_texts;
  const alt = typeof image?.metadata?.alt === 'string'
    ? image.metadata.alt
    : Array.isArray(altTexts) && typeof altTexts[0] === 'string' ? altTexts[0] : '';
  const amount = productPrice(product);
  const currency = product.variants?.find(({ calculated_price }) => calculated_price?.currency_code)?.calculated_price?.currency_code ?? 'NGN';
  const madeToOrder = product.metadata?.made_to_order === true;
  const soldOut = (product.variants ?? []).length > 0 && product.variants?.every((variant) => !variant.allow_backorder && variant.manage_inventory !== false && (variant.inventory_quantity ?? 0) <= 0) && !madeToOrder;
  return <li className="product-tile">
    <Link href={`/p/${product.handle}`} className="product-tile-link">
      <span className="product-tile-media">{image?.url ? <img src={image.url} alt={alt} width="600" height="750" loading="lazy" /> : <span className="media-placeholder">Image pending</span>}
        <span className="product-badges">{soldOut && <span className="product-badge">Sold out</span>}{madeToOrder && <span className="product-badge">Made to order</span>}</span>
      </span>
      <span className="product-title">{product.title}</span>
      <span className="product-label">{label ? labelNames.get(label) ?? label : 'Label details pending'}</span>
      {amount === null ? <span className="product-price">Price unavailable</span> : <span className="product-price">{new Intl.NumberFormat('en-NG', { style: 'currency', currency: currency.toUpperCase(), maximumFractionDigits: 0 }).format(amount)}</span>}
    </Link>
  </li>;
}

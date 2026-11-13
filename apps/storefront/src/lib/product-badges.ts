import type { StoreProduct, StoreVariant } from './store';

export type ProductBadge = { kind: 'sold-out' | 'low-stock' | 'made-to-order' | 'new'; label: string; variant: 'default' | 'signal' };

const NEW_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const tracked = (variant: StoreVariant) => variant.manage_inventory !== false && !variant.allow_backorder;

/**
 * At most one badge, computed from Medusa data only, in this priority: Sold out, Only N left (1-3,
 * stock-tracked, not made to order), Made to order, New (created within 14 days). Delivery badges
 * such as "Lagos same-day" are never derived here (gate D4).
 */
export function productBadge(product: StoreProduct, now: number = Date.now()): ProductBadge | null {
  const variants = product.variants ?? [];
  const madeToOrder = product.metadata?.made_to_order === true;

  if (!madeToOrder && variants.length > 0 && variants.every((variant) => tracked(variant) && (variant.inventory_quantity ?? 0) <= 0)) {
    return { kind: 'sold-out', label: 'Sold out', variant: 'default' };
  }
  // Low stock only when every variant is stock-tracked, so the total is a real ceiling.
  if (!madeToOrder && variants.length > 0 && variants.every(tracked)) {
    const available = variants.reduce((sum, variant) => sum + Math.max(0, variant.inventory_quantity ?? 0), 0);
    if (available >= 1 && available <= 3) return { kind: 'low-stock', label: `Only ${available} left`, variant: 'signal' };
  }
  if (madeToOrder) return { kind: 'made-to-order', label: 'Made to order', variant: 'default' };
  const created = product.created_at ? Date.parse(product.created_at) : Number.NaN;
  if (Number.isFinite(created) && created <= now && now - created <= NEW_WINDOW_MS) return { kind: 'new', label: 'New', variant: 'default' };
  return null;
}

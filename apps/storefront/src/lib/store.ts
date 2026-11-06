import 'server-only';

export type StoreImage = { id?: string; url: string; metadata?: Record<string, unknown> | null };
export type StoreOption = { id?: string; title: string; values?: Array<string | { id?: string; value?: string }> };
export type StoreVariantOption = { id?: string; option_id?: string; value: string; option?: { title?: string } };
export type StoreVariant = {
  id: string;
  title: string;
  sku?: string | null;
  manage_inventory?: boolean;
  allow_backorder?: boolean;
  inventory_quantity?: number;
  options?: StoreVariantOption[];
  calculated_price?: { calculated_amount?: number; original_amount?: number; currency_code?: string } | null;
  metadata?: Record<string, unknown> | null;
};
export type StoreProduct = {
  id: string;
  title: string;
  subtitle?: string | null;
  handle: string;
  description?: string | null;
  created_at?: string | null;
  thumbnail?: string | null;
  images?: StoreImage[];
  options?: StoreOption[];
  variants?: StoreVariant[];
  metadata?: Record<string, unknown> | null;
  categories?: Array<{ id: string; name: string; handle: string }>;
  type?: { value?: string } | null;
};
export type StoreCategory = { id: string; name: string; handle: string; parent_category?: { handle?: string } | null };
export type StoreRegion = { id: string; currency_code: string; name: string; countries?: Array<{ iso_2: string }> };

export const medusaBackendUrl = () => (process.env.MEDUSA_BACKEND_URL ?? 'http://localhost:9000').replace(/\/$/, '');
const backend = medusaBackendUrl;
const publishableKey = () => {
  const value = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
  return value && !value.startsWith('replace-') ? value : undefined;
};

export class MedusaStoreError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(`Medusa Store API returned ${status}.`);
    this.status = status;
  }
}

export async function medusaFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const key = publishableKey();
  if (!key) throw new Error('Medusa publishable API key is not configured.');
  const response = await fetch(`${backend()}${path.startsWith('/') ? path : `/${path}`}`, {
    ...init,
    cache: 'no-store',
    headers: {
      'content-type': 'application/json',
      'x-publishable-api-key': key,
      ...init.headers,
    },
  });
  if (!response.ok) throw new MedusaStoreError(response.status);
  return response.json() as Promise<T>;
}

const regionTtlMs = 5 * 60 * 1000;
let cachedRegion: { region: StoreRegion; expiresAt: number } | undefined;
let regionRequest: Promise<StoreRegion | null> | undefined;

async function findStoreRegion() {
  const { regions = [] } = await medusaFetch<{ regions: StoreRegion[] }>('/store/regions');
  if (process.env.MEDUSA_REGION_ID) return regions.find(({ id }) => id === process.env.MEDUSA_REGION_ID) ?? null;
  return regions.find(({ currency_code }) => currency_code.toLowerCase() === 'ngn') ?? null;
}

/**
 * Only a found region is cached, for `regionTtlMs`. A missing region or a failed request is
 * retried on the next call; a failed refresh keeps serving the last region Medusa returned.
 */
export function getStoreRegion(): Promise<StoreRegion | null> {
  if (cachedRegion && cachedRegion.expiresAt > Date.now()) return Promise.resolve(cachedRegion.region);
  if (!regionRequest) {
    regionRequest = findStoreRegion()
      .then((region) => {
        cachedRegion = region ? { region, expiresAt: Date.now() + regionTtlMs } : undefined;
        return region;
      })
      .catch(() => cachedRegion?.region ?? null)
      .finally(() => { regionRequest = undefined; });
  }
  return regionRequest;
}

const productFields = '*variants.calculated_price,*variants.options,+variants.inventory_quantity,+variants.metadata,*images,*categories,*type,metadata,+created_at,+subtitle';

export async function listStoreProducts(input: {
  query?: string;
  categoryId?: string;
  collectionId?: string;
  order?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const region = await getStoreRegion();
  const params = new URLSearchParams({ fields: productFields, limit: String(input.limit ?? 100), offset: String(input.offset ?? 0) });
  if (region) params.set('region_id', region.id);
  if (input.query?.trim()) params.set('q', input.query.trim());
  if (input.categoryId) params.set('category_id', input.categoryId);
  if (input.collectionId) params.set('collection_id', input.collectionId);
  if (input.order) params.set('order', input.order);
  return medusaFetch<{ products: StoreProduct[]; count: number }>(`/store/products?${params}`);
}

export async function productsForCollectionHandle(handle: string, limit = 100) {
  const params = new URLSearchParams({ handle, limit: '1' });
  const { product_collections = [] } = await medusaFetch<{ product_collections: Array<{ id: string }> }>(`/store/product-collections?${params}`);
  const collection = product_collections[0];
  return collection ? listStoreProducts({ collectionId: collection.id, limit }) : { products: [] as StoreProduct[], count: 0 };
}

export async function retrieveStoreProduct(handle: string) {
  const region = await getStoreRegion();
  const params = new URLSearchParams({ handle, limit: '1', fields: productFields });
  if (region) params.set('region_id', region.id);
  const { products = [] } = await medusaFetch<{ products: StoreProduct[] }>(`/store/products?${params}`);
  return products[0] ?? null;
}

export async function listStoreCategories() {
  const { product_categories = [] } = await medusaFetch<{ product_categories: StoreCategory[] }>('/store/product-categories?limit=100&fields=*parent_category');
  return product_categories;
}

export function productLabel(product: StoreProduct): string | null {
  const label = product.metadata?.label;
  return typeof label === 'string' ? label : null;
}

export function variantIsAvailable(variant: StoreVariant, madeToOrder = false): boolean {
  if (madeToOrder || variant.allow_backorder || variant.manage_inventory === false) return true;
  return (variant.inventory_quantity ?? 0) > 0;
}

export function productPrice(product: StoreProduct): number | null {
  const amounts = (product.variants ?? []).map(({ calculated_price }) => calculated_price?.calculated_amount).filter((amount): amount is number => typeof amount === 'number' && Number.isFinite(amount));
  return amounts.length ? Math.min(...amounts) : null;
}

export async function listStoreProductsSafely(input: Parameters<typeof listStoreProducts>[0] = {}) {
  try {
    const result = await listStoreProducts(input);
    return { ...result, error: null as string | null };
  } catch {
    return { products: [] as StoreProduct[], count: 0, error: 'The product catalogue is temporarily unavailable.' };
  }
}

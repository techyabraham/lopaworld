import { CatalogListing } from './CatalogListing';
import type { CatalogFilters } from './FilterSheet';
import { listStoreCategories, listStoreProductsSafely, productsForCollectionHandle, type StoreCategory } from '../../lib/store';

export type SearchValues = Record<string, string | string[] | undefined>;
const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export async function CatalogPage({
  title, pathname, searchParams, lockedLabel, categoryHandle, occasion, newArrivals = false, eyebrow,
}: {
  title: string;
  pathname: string;
  searchParams: Promise<SearchValues>;
  lockedLabel?: string;
  categoryHandle?: string;
  occasion?: string;
  newArrivals?: boolean;
  eyebrow?: string;
}) {
  const params = await searchParams;
  const filters: CatalogFilters = {
    q: one(params.q), label: one(params.label), category: one(params.category), size: one(params.size),
    colour: one(params.colour), minPrice: one(params.minPrice), maxPrice: one(params.maxPrice),
    available: one(params.available), sort: one(params.sort), page: one(params.page), collection: one(params.collection),
  };
  let categories: StoreCategory[] = [];
  let categoriesError: string | null = null;
  try { categories = await listStoreCategories(); } catch { categoriesError = 'Category filters are temporarily unavailable.'; }
  const category = categoryHandle ? categories.find(({ handle }) => handle === categoryHandle) : undefined;
  let result: { products: Awaited<ReturnType<typeof listStoreProductsSafely>>['products']; count: number; error: string | null };
  if (filters.collection) {
    try {
      const collectionResult = await productsForCollectionHandle(filters.collection, 100);
      result = { ...collectionResult, error: null };
    } catch {
      result = { products: [], count: 0, error: 'This collection is temporarily unavailable.' };
    }
  } else {
    result = await listStoreProductsSafely({
      query: filters.q,
      categoryId: category?.id,
      limit: 100,
      order: newArrivals || filters.sort === 'newest' ? '-created_at' : filters.sort === 'title' ? 'title' : undefined,
    });
  }
  let products = result.products;
  if (occasion) products = products.filter((product) => Array.isArray(product.metadata?.occasion) && product.metadata.occasion.includes(occasion));
  const message = result.error ?? categoriesError;
  return <CatalogListing title={title} eyebrow={eyebrow} pathname={pathname} filters={filters} products={products} count={result.count} categories={categories} error={message} lockedLabel={lockedLabel} lockedCategory={categoryHandle} />;
}

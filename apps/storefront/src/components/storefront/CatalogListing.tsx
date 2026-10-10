import Link from 'next/link';
import { LABELS } from '@lopaworld/types';
import { FilterChip } from '@lopaworld/ui';
import { FilterSheet, type CatalogFilters } from './FilterSheet';
import { ProductGrid } from './ProductGrid';
import type { StoreCategory, StoreProduct } from '../../lib/store';
import { productLabel } from '../../lib/store';

const labelOptions = LABELS.map(({ slug, name }) => ({ slug, name }));
const pageSize = 24;

export function CatalogListing({
  title, eyebrow = 'Shop', pathname, filters, products, count, categories, error, lockedLabel, lockedCategory,
}: {
  title: string;
  eyebrow?: string;
  pathname: string;
  filters: CatalogFilters;
  products: StoreProduct[];
  count: number;
  categories: StoreCategory[];
  error?: string | null;
  lockedLabel?: string;
  lockedCategory?: string;
}) {
  const page = Math.max(1, Number(filters.page ?? 1) || 1);
  const filtered = filterProducts(products, { ...filters, label: lockedLabel ?? filters.label, category: lockedCategory ?? filters.category }, categories);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const availableSizes = uniqueOptions(products, 'size');
  const availableColours = uniqueOptions(products, 'colour');
  const activeFilters = [
    filters.label && ['label', labelOptions.find(({ slug }) => slug === filters.label)?.name ?? filters.label],
    filters.category && ['category', categories.find(({ handle }) => handle === filters.category)?.name ?? filters.category],
    filters.size && ['size', filters.size],
    filters.colour && ['colour', filters.colour],
    filters.minPrice && ['minPrice', `From ₦${filters.minPrice}`],
    filters.maxPrice && ['maxPrice', `Up to ₦${filters.maxPrice}`],
    filters.available === '1' && ['available', 'Available'],
    filters.q && ['q', `Search: ${filters.q}`],
  ].filter((item): item is [string, string] => Array.isArray(item));
  return <main className="store-page catalog-page" data-page="catalog">
    <header className="catalog-heading"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{count ? `${filtered.length} pieces shown from the current catalogue results.` : 'Discover pieces published by Lopaworld.'}</p></header>
    {pathname === '/search' && <form action="/search" method="get" className="catalog-search"><label htmlFor="catalog-search">Search products</label><input id="catalog-search" name="q" type="search" defaultValue={filters.q ?? ''} placeholder="Search the catalogue" /><button className="lw-button" type="submit">Search</button></form>}
    <div className="catalog-controls"><p className="catalog-count" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'piece' : 'pieces'}</p><FilterSheet pathname={pathname} filters={filters} labels={labelOptions} categories={categories} sizes={availableSizes} colours={availableColours} resultCount={filtered.length} showLabel={!lockedLabel} showCategory={!lockedCategory} /></div>
    {activeFilters.length > 0 && <div className="active-filters" aria-label="Active filters">{activeFilters.map(([key, label]) => <FilterChip key={key} onRemove={() => undefined}><Link href={removeFilter(pathname, filters, key)}>{label} <span aria-hidden="true">×</span></Link></FilterChip>)}<Link href={pathname} className="text-link">Clear all</Link></div>}
    {error && <p className="service-message" role="status">{error}</p>}
    <ProductGrid products={visible} />
    {filtered.length > pageSize && <nav className="catalog-pagination" aria-label="Product pages">
      {currentPage > 1 && <Link href={pageHref(pathname, filters, currentPage - 1)}>Previous</Link>}
      <span>Page {currentPage} of {pages}</span>
      {currentPage < pages && <Link href={pageHref(pathname, filters, currentPage + 1)}>Load more pieces</Link>}
    </nav>}
  </main>;
}

function filterProducts(products: StoreProduct[], filters: CatalogFilters, categories: StoreCategory[]) {
  const minimum = filters.minPrice ? Number(filters.minPrice) : null;
  const maximum = filters.maxPrice ? Number(filters.maxPrice) : null;
  return products.filter((product) => {
    if (filters.label && productLabel(product) !== filters.label) return false;
    if (filters.category) {
      const category = categories.find(({ handle }) => handle === filters.category);
      if (!category || !product.categories?.some(({ id, handle }) => id === category.id || handle === category.handle)) return false;
    }
    if (filters.size && !hasOption(product, 'size', filters.size)) return false;
    if (filters.colour && !hasOption(product, 'colour', filters.colour)) return false;
    if (filters.available === '1') {
      const madeToOrder = product.metadata?.made_to_order === true;
      if (!madeToOrder && !(product.variants ?? []).some((variant) => variant.allow_backorder || variant.manage_inventory === false || (variant.inventory_quantity ?? 0) > 0)) return false;
    }
    const price = product.variants?.map(({ calculated_price }) => calculated_price?.calculated_amount).filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
    if (minimum !== null && (!price?.length || Math.min(...price) < minimum)) return false;
    if (maximum !== null && (!price?.length || Math.min(...price) > maximum)) return false;
    return true;
  }).sort((a, b) => {
    if (filters.sort === 'price-asc') return (minPrice(a) ?? Number.POSITIVE_INFINITY) - (minPrice(b) ?? Number.POSITIVE_INFINITY);
    if (filters.sort === 'price-desc') return (minPrice(b) ?? 0) - (minPrice(a) ?? 0);
    if (filters.sort === 'title') return a.title.localeCompare(b.title);
    return 0;
  });
}

function hasOption(product: StoreProduct, kind: 'size' | 'colour', value: string) {
  const matches = (name: string | undefined) => kind === 'size' ? /size/i.test(name ?? '') : /colou?r/i.test(name ?? '');
  return product.variants?.some((variant) => variant.options?.some((option) => matches(option.option?.title) && option.value.toLowerCase() === value.toLowerCase())) ?? false;
}

function uniqueOptions(products: StoreProduct[], kind: 'size' | 'colour') {
  const values = new Set<string>();
  for (const product of products) for (const variant of product.variants ?? []) for (const option of variant.options ?? []) {
    const title = option.option?.title ?? '';
    if ((kind === 'size' ? /size/i.test(title) : /colou?r/i.test(title)) && option.value.trim()) values.add(option.value);
  }
  return [...values].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function minPrice(product: StoreProduct) {
  const values = product.variants?.map(({ calculated_price }) => calculated_price?.calculated_amount).filter((value): value is number => typeof value === 'number');
  return values?.length ? Math.min(...values) : null;
}

function removeFilter(pathname: string, filters: CatalogFilters, key: string) {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(filters)) if (name !== key && typeof value === 'string' && value) params.set(name, value);
  params.delete('page');
  return `${pathname}${params.size ? `?${params}` : ''}`;
}

function pageHref(pathname: string, filters: CatalogFilters, page: number) {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(filters)) if (typeof value === 'string' && value) params.set(name, value);
  params.set('page', String(page));
  return `${pathname}?${params}`;
}

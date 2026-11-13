import Link from 'next/link';
import type { ReactNode } from 'react';
import { LABELS } from '@lopaworld/types';
import { FilterSheet, type CatalogFilters } from './FilterSheet';
import { SortSelect } from './SortSelect';
import { ProductGrid } from './ProductGrid';
import type { StoreCategory, StoreProduct } from '../../lib/store';
import { productLabel } from '../../lib/store';
import { TrackEvent } from '../site/TrackEvent';

const labelOptions = LABELS.map(({ slug, name }) => ({ slug, name }));
const pageSize = 24;

export function CatalogListing({
  title, eyebrow = 'Shop', pathname, filters, products, categories, error, lockedLabel, lockedCategory,
  hideHeading = false, toolbarExtra, lookbook, children,
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
  /** The label page renders its own hero (h1) above the listing. */
  hideHeading?: boolean;
  toolbarExtra?: ReactNode;
  /** Replaces the grid when the Lookbook view is active. */
  lookbook?: ReactNode;
  /** Rendered before the toolbar (e.g. the label category rail). */
  children?: ReactNode;
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
  const sortHidden = Object.fromEntries(Object.entries(filters).filter(([name, value]) => name !== 'sort' && name !== 'page' && typeof value === 'string' && value)) as Record<string, string>;
  const Wrapper = hideHeading ? 'div' : 'main';
  return <Wrapper className="catalog-page" data-page="catalog">
    {pathname !== '/search' && <TrackEvent name="collection_view" params={{ route: pathname }} />}
    {pathname === '/search' && filters.q && <TrackEvent name={filtered.length ? 'search' : 'search_zero_results'} params={{ search_term: filters.q.slice(0, 80), result_count: filtered.length }} />}
    {activeFilters.length > 0 && <TrackEvent name="filter_apply" params={{ filter_count: activeFilters.length, route: pathname }} />}
    {!hideHeading && <header className="catalog-heading"><p className="lw-eyebrow">{eyebrow}</p><h1 className="lw-display">{title}</h1></header>}
    {pathname === '/search' && <form action="/search" method="get" className="catalog-search"><label htmlFor="catalog-search">Search products</label><div className="catalog-search-row"><input id="catalog-search" className="lw-input" name="q" type="search" defaultValue={filters.q ?? ''} /><button className="lw-button" type="submit">Search</button></div></form>}
    {children}
    <div className="catalog-toolbar">
      <div className="catalog-toolbar-filters">
        <FilterSheet pathname={pathname} filters={filters} labels={labelOptions} categories={categories} sizes={availableSizes} colours={availableColours} resultCount={filtered.length} activeCount={activeFilters.length} showLabel={!lockedLabel} showCategory={!lockedCategory} />
        {activeFilters.map(([key, label]) => <span key={key} className="lw-filter-chip">{label}<Link href={removeFilter(pathname, filters, key)} aria-label={`Remove ${label}`}>×</Link></span>)}
        {activeFilters.length > 0 && <Link href={filters.view ? `${pathname}?view=${encodeURIComponent(filters.view)}` : pathname} className="lw-button" data-variant="quiet">Clear all</Link>}
      </div>
      <div className="catalog-toolbar-view">
        <p className="catalog-count" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'piece' : 'pieces'}</p>
        {toolbarExtra}
        {!lookbook && <SortSelect pathname={pathname} hidden={sortHidden} value={filters.sort ?? 'newest'} />}
      </div>
    </div>
    {error && <p className="service-message" role="status">{error}</p>}
    {lookbook ?? <ProductGrid products={visible} />}
    {!lookbook && filtered.length > pageSize && <nav className="catalog-pagination" aria-label="Product pages">
      {currentPage > 1 && <Link className="lw-button" data-variant="secondary" href={pageHref(pathname, filters, currentPage - 1)}>Previous</Link>}
      <span>Page {currentPage} of {pages}</span>
      {currentPage < pages && <Link className="lw-button" data-variant="secondary" href={pageHref(pathname, filters, currentPage + 1)}>Next</Link>}
    </nav>}
  </Wrapper>;
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

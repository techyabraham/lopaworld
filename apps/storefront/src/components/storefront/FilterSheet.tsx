'use client';

import { useState } from 'react';
import { Input, Sheet } from '@lopaworld/ui';
import { FilterIcon } from '../site/icons';

export type CatalogFilters = {
  q?: string;
  label?: string;
  category?: string;
  size?: string;
  colour?: string;
  minPrice?: string;
  maxPrice?: string;
  available?: string;
  sort?: string;
  page?: string;
  collection?: string;
  /** Label page Grid / Lookbook toggle; kept in the URL so paging and filters preserve it. */
  view?: string;
};

/** Radio inputs styled as chips: a single choice per group that still submits with a plain GET form. */
function ChipGroup({ legend, name, value, options, anyLabel }: { legend: string; name: string; value?: string; options: Array<{ value: string; label: string }>; anyLabel: string }) {
  return <fieldset className="filter-chip-group">
    <legend>{legend}</legend>
    <div className="filter-chip-options">
      <label className="lw-chip"><input className="visually-hidden" type="radio" name={name} value="" defaultChecked={!value} />{anyLabel}</label>
      {options.map((option) => <label key={option.value} className="lw-chip"><input className="visually-hidden" type="radio" name={name} value={option.value} defaultChecked={value === option.value} />{option.label}</label>)}
    </div>
  </fieldset>;
}

export function FilterSheet({
  pathname, filters, labels, categories, sizes, colours, resultCount, activeCount = 0, showLabel = true, showCategory = true,
}: {
  pathname: string;
  filters: CatalogFilters;
  labels: Array<{ slug: string; name: string }>;
  categories: Array<{ handle: string; name: string }>;
  sizes: string[];
  colours: string[];
  resultCount: number;
  activeCount?: number;
  showLabel?: boolean;
  showCategory?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className="filter-trigger" aria-expanded={open} onClick={() => setOpen(true)}><FilterIcon />{activeCount ? `Filter · ${activeCount}` : 'Filter'}</button>
    {open && <Sheet title="Filter and sort" onClose={() => setOpen(false)}>
      <form action={pathname} method="get" className="filter-form" onSubmit={() => setOpen(false)}>
        {filters.q && <input type="hidden" name="q" value={filters.q} />}
        {filters.collection && <input type="hidden" name="collection" value={filters.collection} />}
        {filters.view && <input type="hidden" name="view" value={filters.view} />}
        {showLabel && <ChipGroup legend="Label" name="label" value={filters.label} anyLabel="All labels" options={labels.map(({ slug, name }) => ({ value: slug, label: name }))} />}
        {showCategory && categories.length > 0 && <label className="lw-field">Category<select className="lw-select" name="category" defaultValue={filters.category ?? ''}><option value="">All categories</option>{categories.map(({ handle, name }) => <option key={handle} value={handle}>{name}</option>)}</select></label>}
        {sizes.length > 0 && <ChipGroup legend="Size" name="size" value={filters.size} anyLabel="Any size" options={sizes.map((size) => ({ value: size, label: size }))} />}
        {colours.length > 0 && <ChipGroup legend="Colour" name="colour" value={filters.colour} anyLabel="Any colour" options={colours.map((colour) => ({ value: colour, label: colour }))} />}
        <fieldset className="price-range"><legend>Price range · NGN</legend><label className="lw-field">Minimum<Input name="minPrice" type="number" inputMode="numeric" min="0" defaultValue={filters.minPrice} /></label><label className="lw-field">Maximum<Input name="maxPrice" type="number" inputMode="numeric" min="0" defaultValue={filters.maxPrice} /></label></fieldset>
        <label className="lw-check-row"><input className="lw-checkbox" type="checkbox" name="available" value="1" defaultChecked={filters.available === '1'} /> In stock or made to order</label>
        <label className="lw-field">Sort by<select className="lw-select" name="sort" defaultValue={filters.sort ?? 'newest'}><option value="newest">Newest</option><option value="price-asc">Price, low to high</option><option value="price-desc">Price, high to low</option><option value="title">Name</option></select></label>
        <div className="filter-actions"><button className="lw-button" type="submit">Show {resultCount} {resultCount === 1 ? 'piece' : 'pieces'}</button><a className="lw-button" data-variant="quiet" href={filters.view ? `${pathname}?view=${encodeURIComponent(filters.view)}` : pathname}>Clear all</a></div>
      </form>
    </Sheet>}
  </>;
}

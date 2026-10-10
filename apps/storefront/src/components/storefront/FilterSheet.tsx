'use client';

import { useState } from 'react';
import { Button, Input, Sheet } from '@lopaworld/ui';

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
};

export function FilterSheet({
  pathname, filters, labels, categories, sizes, colours, resultCount, showLabel = true, showCategory = true,
}: {
  pathname: string;
  filters: CatalogFilters;
  labels: Array<{ slug: string; name: string }>;
  categories: Array<{ handle: string; name: string }>;
  sizes: string[];
  colours: string[];
  resultCount: number;
  showLabel?: boolean;
  showCategory?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return <>
    <Button variant="secondary" className="filter-trigger" aria-expanded={open} onClick={() => setOpen(true)}>Filter &amp; Sort</Button>
    {open && <Sheet title="Filter and sort pieces" onClose={() => setOpen(false)}>
      <form action={pathname} method="get" className="filter-form" onSubmit={() => setOpen(false)}>
        {filters.q && <input type="hidden" name="q" value={filters.q} />}
        {filters.collection && <input type="hidden" name="collection" value={filters.collection} />}
        {showLabel && <label className="lw-field">Label<select className="lw-select" name="label" defaultValue={filters.label ?? ''}><option value="">All labels</option>{labels.map(({ slug, name }) => <option key={slug} value={slug}>{name}</option>)}</select></label>}
        {showCategory && <label className="lw-field">Category<select className="lw-select" name="category" defaultValue={filters.category ?? ''}><option value="">All categories</option>{categories.map(({ handle, name }) => <option key={handle} value={handle}>{name}</option>)}</select></label>}
        {sizes.length > 0 && <label className="lw-field">Size<select className="lw-select" name="size" defaultValue={filters.size ?? ''}><option value="">Any size</option>{sizes.map((size) => <option key={size} value={size}>{size}</option>)}</select></label>}
        {colours.length > 0 && <label className="lw-field">Colour<select className="lw-select" name="colour" defaultValue={filters.colour ?? ''}><option value="">Any colour</option>{colours.map((colour) => <option key={colour} value={colour}>{colour}</option>)}</select></label>}
        <fieldset className="price-range"><legend>Price range · NGN</legend><label className="lw-field">Minimum<Input name="minPrice" type="number" inputMode="numeric" min="0" placeholder="No minimum" defaultValue={filters.minPrice} /></label><label className="lw-field">Maximum<Input name="maxPrice" type="number" inputMode="numeric" min="0" placeholder="No maximum" defaultValue={filters.maxPrice} /></label></fieldset>
        <label className="lw-check-row"><input type="checkbox" name="available" value="1" defaultChecked={filters.available === '1'} /> In stock or made to order</label>
        <label className="lw-field">Sort by<select className="lw-select" name="sort" defaultValue={filters.sort ?? 'newest'}><option value="newest">Newest</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="title">Name</option></select></label>
        <div className="filter-actions"><Button type="submit">Show {resultCount} pieces</Button><a className="text-link" href={pathname}>Clear all</a></div>
      </form>
    </Sheet>}
  </>;
}

'use client';

/**
 * Toolbar sort control. A GET form, so it works without JavaScript (the submit button shows only
 * then); with JavaScript a change submits immediately.
 */
export function SortSelect({ pathname, hidden, value }: { pathname: string; hidden: Record<string, string>; value: string }) {
  return <form className="sort-form" action={pathname} method="get">
    {Object.entries(hidden).map(([name, entry]) => <input key={name} type="hidden" name={name} value={entry} />)}
    <label className="sort-label" htmlFor="catalog-sort">Sort</label>
    <select id="catalog-sort" className="lw-select sort-select" name="sort" defaultValue={value} onChange={(event) => event.currentTarget.form?.requestSubmit()}>
      <option value="newest">Newest</option>
      <option value="price-asc">Price, low to high</option>
      <option value="price-desc">Price, high to low</option>
      <option value="title">Name</option>
    </select>
    <noscript><button className="lw-button" data-variant="secondary" type="submit">Sort</button></noscript>
  </form>;
}

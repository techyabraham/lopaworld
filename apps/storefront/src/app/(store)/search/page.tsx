import { CatalogPage, type SearchValues } from '../../../components/storefront/CatalogPage';

export const dynamic = 'force-dynamic';
export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchValues> }) {
  const params = await searchParams;
  const query = Array.isArray(params.q) ? params.q[0] : params.q;
  return <CatalogPage title={query ? `Search: ${query}` : 'Search'} eyebrow="Find your piece" pathname="/search" searchParams={Promise.resolve(params)} />;
}

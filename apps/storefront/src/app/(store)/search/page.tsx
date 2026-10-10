import type { Metadata } from 'next';
import { CatalogPage, type SearchValues } from '../../../components/storefront/CatalogPage';
import { canonical } from '../../../lib/seo';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Search', robots: { index: false, follow: true }, alternates: { canonical: canonical('/search') } };
export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchValues> }) {
  const params = await searchParams;
  const query = Array.isArray(params.q) ? params.q[0] : params.q;
  return <CatalogPage title={query ? `Search: ${query}` : 'Search'} eyebrow="Find your piece" pathname="/search" searchParams={Promise.resolve(params)} />;
}

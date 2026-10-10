import type { Metadata } from 'next';
import { CatalogPage, type SearchValues } from '../../../components/storefront/CatalogPage';
import { canonical } from '../../../lib/seo';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Shop', description: 'Browse the Lopaworld collection across seven labels.', alternates: { canonical: canonical('/shop') } };
export default function ShopPage({ searchParams }: { searchParams: Promise<SearchValues> }) {
  return <CatalogPage title="Shop all" pathname="/shop" searchParams={searchParams} />;
}

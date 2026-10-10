import { CatalogPage, type SearchValues } from '../../../components/storefront/CatalogPage';

export const dynamic = 'force-dynamic';
export default function ShopPage({ searchParams }: { searchParams: Promise<SearchValues> }) {
  return <CatalogPage title="Shop all" pathname="/shop" searchParams={searchParams} />;
}

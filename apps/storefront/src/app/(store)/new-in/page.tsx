import { CatalogPage, type SearchValues } from '../../../components/storefront/CatalogPage';

export const dynamic = 'force-dynamic';
export default function NewArrivalsPage({ searchParams }: { searchParams: Promise<SearchValues> }) {
  return <CatalogPage title="New In" eyebrow="Recently added" pathname="/new-in" searchParams={searchParams} newArrivals />;
}

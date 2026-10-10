import type { Metadata } from 'next';
import { CatalogPage, type SearchValues } from '../../../components/storefront/CatalogPage';
import { canonical } from '../../../lib/seo';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'New In', description: 'Explore recently added pieces at Lopaworld.', alternates: { canonical: canonical('/new-in') } };
export default function NewArrivalsPage({ searchParams }: { searchParams: Promise<SearchValues> }) {
  return <CatalogPage title="New In" eyebrow="Recently added" pathname="/new-in" searchParams={searchParams} newArrivals />;
}

import { notFound } from 'next/navigation';
import { CatalogPage, type SearchValues } from '../../../../components/storefront/CatalogPage';
import { listStoreCategories } from '../../../../lib/store';

export const dynamic = 'force-dynamic';
export default async function CategoryPage({ params, searchParams }: { params: Promise<{ category: string }>; searchParams: Promise<SearchValues> }) {
  const { category } = await params;
  let categories;
  try {
    categories = await listStoreCategories();
  } catch {
    return <main className="store-page"><h1>Categories are temporarily unavailable</h1><p>Please try again shortly.</p></main>;
  }
  const match = categories.find(({ handle }) => handle === category);
  if (!match) notFound();
  return <CatalogPage title={match.name} pathname={`/c/${category}`} searchParams={searchParams} categoryHandle={category} />;
}

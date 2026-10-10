import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CatalogPage, type SearchValues } from '../../../../components/storefront/CatalogPage';
import { listStoreCategories } from '../../../../lib/store';
import { canonical } from '../../../../lib/seo';

export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  try {
    const match = (await listStoreCategories()).find(({ handle }) => handle === category);
    if (!match) return { title: 'Category not found', robots: { index: false, follow: false } };
    const path = `/c/${encodeURIComponent(category)}`;
    return { title: match.name, description: `Shop ${match.name} at Lopaworld.`, alternates: { canonical: canonical(path) } };
  } catch { return { title: 'Shop categories', robots: { index: false, follow: false } }; }
}

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

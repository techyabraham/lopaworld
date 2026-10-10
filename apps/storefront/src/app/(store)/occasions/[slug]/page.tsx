import type { Metadata } from 'next';
import { CatalogPage, type SearchValues } from '../../../../components/storefront/CatalogPage';

export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const title = slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
  return { title, description: `Browse pieces for ${title} at Lopaworld.`, robots: { index: false, follow: true } };
}

export default async function OccasionPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<SearchValues> }) {
  const { slug } = await params;
  const title = slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
  return <CatalogPage title={title} eyebrow="Shop by occasion" pathname={`/occasions/${slug}`} searchParams={searchParams} occasion={slug} />;
}

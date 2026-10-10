import { CatalogPage, type SearchValues } from '../../../../components/storefront/CatalogPage';

export const dynamic = 'force-dynamic';
export default async function OccasionPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<SearchValues> }) {
  const { slug } = await params;
  const title = slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
  return <CatalogPage title={title} eyebrow="Shop by occasion" pathname={`/occasions/${slug}`} searchParams={searchParams} occasion={slug} />;
}

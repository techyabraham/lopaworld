import { CatalogPage, type SearchValues } from '../../../../../components/storefront/CatalogPage';
import { LABELS } from '@lopaworld/types';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export default async function LabelCategoryPage({ params, searchParams }: { params: Promise<{ label: string; category: string }>; searchParams: Promise<SearchValues> }) {
  const { label, category } = await params;
  const canonical = LABELS.find((entry) => entry.slug === label);
  if (!canonical) notFound();
  return <CatalogPage title={category.replace(/[-_]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())} eyebrow={canonical.name} pathname={`/l/${label}/${category}`} searchParams={searchParams} lockedLabel={label} categoryHandle={category} />;
}

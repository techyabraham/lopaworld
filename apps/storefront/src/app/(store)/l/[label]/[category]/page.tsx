import type { Metadata } from 'next';
import { CatalogPage, type SearchValues } from '../../../../../components/storefront/CatalogPage';
import { LABELS } from '@lopaworld/types';
import { notFound } from 'next/navigation';
import { canonical } from '../../../../../lib/seo';

export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ label: string; category: string }> }): Promise<Metadata> {
  const { label, category } = await params;
  const entry = LABELS.find((item) => item.slug === label);
  if (!entry) return { title: 'Label not found', robots: { index: false, follow: false } };
  const categoryName = category.replace(/[-_]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
  const path = `/l/${encodeURIComponent(label)}/${encodeURIComponent(category)}`;
  return { title: `${categoryName} · ${entry.name}`, description: `Explore ${categoryName} from ${entry.name} at Lopaworld.`, alternates: { canonical: canonical(path) } };
}

export default async function LabelCategoryPage({ params, searchParams }: { params: Promise<{ label: string; category: string }>; searchParams: Promise<SearchValues> }) {
  const { label, category } = await params;
  const canonical = LABELS.find((entry) => entry.slug === label);
  if (!canonical) notFound();
  return <CatalogPage title={category.replace(/[-_]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())} eyebrow={canonical.name} pathname={`/l/${label}/${category}`} searchParams={searchParams} lockedLabel={label} categoryHandle={category} />;
}

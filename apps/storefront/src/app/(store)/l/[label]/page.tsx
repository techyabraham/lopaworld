import type { Metadata } from 'next';
import { LabelLandingPage } from '../../../../components/storefront/LabelLandingPage';
import { text } from '../../../../components/storefront/content';
import { findPublishedRecordsSafely } from '../../../../lib/cms';
import { canonical } from '../../../../lib/seo';
import { LABELS } from '@lopaworld/types';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ label: string }> }): Promise<Metadata> {
  const { label } = await params;
  const entry = LABELS.find(({ slug }) => slug === label);
  if (!entry) return { title: 'Label not found', robots: { index: false, follow: false } };
  const { records } = await findPublishedRecordsSafely('labels', { slug: { equals: label } }, 1);
  const data = records[0];
  const seo = data?.seo && typeof data.seo === 'object' ? data.seo as Record<string, unknown> : {};
  const title = text(seo.title) ?? text(data?.name) ?? entry.name;
  const description = text(seo.description) ?? text(data?.introSummary) ?? `Explore the ${entry.name} label at Lopaworld.`;
  const path = `/l/${label}`;
  const share = seo.shareImage && typeof seo.shareImage === 'object' ? seo.shareImage as Record<string, unknown> : {};
  const image = text(share.url);
  return { title, description, alternates: { canonical: canonical(path) }, openGraph: { type: 'website', title, description, url: canonical(path), images: image ? [{ url: image }] : [] }, twitter: { card: 'summary_large_image', title, description, images: image ? [image] : [] } };
}

export default async function LabelPage({ params }: { params: Promise<{ label: string }> }) {
  const { label } = await params;
  return <LabelLandingPage slug={label} />;
}

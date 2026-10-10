import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findPublishedRecordsSafely } from '../../../../lib/cms';
import { CMSImage, record, RichContent, text } from '../../../../components/storefront/content';
import { canonical } from '../../../../lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { records } = await findPublishedRecordsSafely('stories', { slug: { equals: slug } }, 1);
  const story = records[0];
  if (!story) return { title: 'Story not found', robots: { index: false, follow: false } };
  const seo = story.seo && typeof story.seo === 'object' ? story.seo as Record<string, unknown> : {};
  const title = text(seo.title) ?? text(story.title) ?? 'Lopaworld story';
  const description = text(seo.description) ?? text(story.excerpt) ?? 'Stories from Lopaworld.';
  const path = `/stories/${encodeURIComponent(slug)}`;
  const image = text(record(seo.shareImage)?.url) ?? text(record(story.heroMedia)?.url);
  return { title, description, alternates: { canonical: canonical(path) }, openGraph: { type: 'article', title, description, url: canonical(path), images: image ? [image] : [] }, twitter: { card: 'summary_large_image', title, description, images: image ? [image] : [] } };
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { records, error } = await findPublishedRecordsSafely('stories', { slug: { equals: slug } }, 1);
  const story = records[0];
  if (!story && !error) notFound();
  if (!story) return <main className="store-page"><h1>Story details are temporarily unavailable</h1><p>Please try again shortly.</p></main>;
  return <main className="store-page story-page">
    <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/stories">Stories</Link><span aria-hidden="true">/</span><span aria-current="page">{text(story.title) ?? 'Story'}</span></nav>
    <article><header className="story-header"><p className="eyebrow">The Lopaworld journal</p><h1>{text(story.title) ?? 'Story'}</h1>{text(story.excerpt) && <p className="story-excerpt">{text(story.excerpt)}</p>}{text(story.publishedAt) && <time dateTime={String(story.publishedAt)}>{new Intl.DateTimeFormat('en-GB', { dateStyle: 'long' }).format(new Date(String(story.publishedAt)))}</time>}</header>
      {Boolean(story.heroMedia) && <CMSImage value={story.heroMedia} alt={story.heroAlt ?? record(story.heroMedia)?.alt} className="story-hero-image" />}
      <RichContent value={story.content} />
    </article>
    <Link className="text-link" href="/stories">Back to stories</Link>
  </main>;
}

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { findPublishedRecordsSafely } from '../../../../lib/cms';
import { CMSImage, record, RichContent, text } from '../../../../components/storefront/content';

export const dynamic = 'force-dynamic';

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

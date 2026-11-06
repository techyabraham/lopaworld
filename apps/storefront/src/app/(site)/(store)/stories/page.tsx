import Link from 'next/link';
import type { Metadata } from 'next';
import { findPublishedRecordsSafely } from '../../../../lib/cms';
import { EmptyState, ErrorState } from '@lopaworld/ui';
import { CMSImage, record, text } from '../../../../components/storefront/content';
import { canonical } from '../../../../lib/seo';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Stories', description: 'Perspectives and notes from the Lopaworld house.', alternates: { canonical: canonical('/stories') } };

export default async function StoriesPage() {
  const { records, error } = await findPublishedRecordsSafely('stories', {}, 100);
  const stories = [...records].sort((a, b) => String(b.publishedAt ?? '').localeCompare(String(a.publishedAt ?? '')));
  return <main className="store-page stories-page"><header className="catalog-heading"><p className="lw-eyebrow">The journal</p><h1 className="lw-display">Stories</h1></header>
    {error && <ErrorState title="Stories are temporarily unavailable" description="Please try again shortly." />}
    {stories.length ? <div className="stories-grid">{stories.map((story) => <article className="story-card" key={story.id}>
      <Link href={`/stories/${story.slug}`} className="story-card-link">
        {Boolean(story.heroMedia) && <CMSImage value={story.heroMedia} alt={story.heroAlt ?? record(story.heroMedia)?.alt} className="story-card-image" />}
        {text(story.publishedAt) && <p className="lw-eyebrow story-card-date">{new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(String(story.publishedAt)))}</p>}
        <h2 className="story-card-title">{text(story.title) ?? 'Story'}</h2>{text(story.excerpt) && <p>{text(story.excerpt)}</p>}<span className="text-link">Read story</span>
      </Link>
    </article>)}</div> : !error && <EmptyState title="No stories to show" description="Explore the collection while the journal is quiet." />}
  </main>;
}

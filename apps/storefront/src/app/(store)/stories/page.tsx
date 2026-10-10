import Link from 'next/link';
import type { Metadata } from 'next';
import { findPublishedRecordsSafely } from '../../../lib/cms';
import { CMSImage, record, text } from '../../../components/storefront/content';
import { canonical } from '../../../lib/seo';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Stories', description: 'Perspectives and notes from the Lopaworld house.', alternates: { canonical: canonical('/stories') } };

export default async function StoriesPage() {
  const { records, error } = await findPublishedRecordsSafely('stories', {}, 100);
  const stories = [...records].sort((a, b) => String(b.publishedAt ?? '').localeCompare(String(a.publishedAt ?? '')));
  return <main className="store-page stories-page"><header className="catalog-heading"><p className="eyebrow">The journal</p><h1>Stories</h1><p>Perspectives and notes from the Lopaworld house.</p></header>
    {error && <p className="service-message" role="status">Stories are temporarily unavailable.</p>}
    {stories.length ? <div className="stories-grid">{stories.map((story) => <article className="story-card" key={story.id}>
      <Link href={`/stories/${story.slug}`} className="story-card-link">
        {Boolean(story.heroMedia) && <CMSImage value={story.heroMedia} alt={story.heroAlt ?? record(story.heroMedia)?.alt} className="story-card-image" />}
        <p className="eyebrow">{text(story.publishedAt) ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(String(story.publishedAt))) : 'From Lopaworld'}</p>
        <h2>{text(story.title) ?? 'Story'}</h2><p>{text(story.excerpt)}</p><span className="text-link">Read story</span>
      </Link>
    </article>)}</div> : <p className="empty-inline">Stories will appear here when they are published.</p>}
  </main>;
}

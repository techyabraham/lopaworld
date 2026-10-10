import type { ReactNode } from 'react';
import { SiteHeader } from '../../components/site/SiteHeader';
import { SiteFooter } from '../../components/site/SiteFooter';
import { findAnnouncementSafely, findPublishedRecordsSafely } from '../../lib/cms';

export const dynamic = 'force-dynamic';

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const [announcement, pagesResult] = await Promise.all([
    findAnnouncementSafely(),
    findPublishedRecordsSafely('pages'),
  ]);
  const now = currentTimestamp();
  const starts = announcement?.startsAt ? new Date(announcement.startsAt).getTime() : Number.NEGATIVE_INFINITY;
  const ends = announcement?.endsAt ? new Date(announcement.endsAt).getTime() : Number.POSITIVE_INFINITY;
  const showAnnouncement = announcement?.enabled && announcement.message && starts <= now && now <= ends;
  return <>
    {showAnnouncement && <div className="announcement-bar">{announcement.url ? <a href={announcement.url}>{announcement.message}</a> : announcement.message}</div>}
    <SiteHeader />
    <div className="store-content">{children}</div>
    <SiteFooter pages={pagesResult.records.map(({ title, slug }) => ({ title, slug }))} />
  </>;
}

function currentTimestamp() {
  return Date.now();
}

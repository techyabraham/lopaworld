import type { ReactNode } from 'react';
import { SiteHeader } from '../../../components/site/SiteHeader';
import { SiteFooter } from '../../../components/site/SiteFooter';
import { MobileTabBar } from '../../../components/site/MobileTabBar';
import { findAnnouncementSafely, findHomepageLayoutSafely, findPublishedRecordsSafely, findSEODefaultsSafely } from '../../../lib/cms';

export const dynamic = 'force-dynamic';

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const [announcement, pagesResult, homepage, seo] = await Promise.all([
    findAnnouncementSafely(),
    findPublishedRecordsSafely('pages'),
    findHomepageLayoutSafely(),
    findSEODefaultsSafely(),
  ]);
  const now = currentTimestamp();
  const starts = announcement?.startsAt ? new Date(announcement.startsAt).getTime() : Number.NEGATIVE_INFINITY;
  const ends = announcement?.endsAt ? new Date(announcement.endsAt).getTime() : Number.POSITIVE_INFINITY;
  const showAnnouncement = announcement?.enabled && announcement.message && starts <= now && now <= ends;
  // "Occasions" appears in the header only when the homepage actually has occasion links.
  const showOccasions = (homepage.layout?.layout ?? []).some((block) => block.blockType === 'occasionLinks' && Array.isArray(block.links) && block.links.length > 0);
  return <>
    {showAnnouncement && <div className="announcement-bar">{announcement.url ? <a href={announcement.url}>{announcement.message}</a> : announcement.message}</div>}
    <SiteHeader showOccasions={showOccasions} />
    <div className="store-content">{children}</div>
    <SiteFooter pages={pagesResult.records.map(({ title, slug }) => ({ title, slug }))} organizationName={seo?.organizationName} />
    <MobileTabBar />
  </>;
}

function currentTimestamp() {
  return Date.now();
}

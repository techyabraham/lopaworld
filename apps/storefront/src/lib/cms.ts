import 'server-only';
import config from '@payload-config';
import { getPayload } from 'payload';
import { logServerError } from './server-log';

export type CMSRecord = Record<string, unknown> & { id: string; name?: string; title?: string; slug?: string };

export async function findPublishedRecords(collection: 'labels' | 'pages' | 'size-guides' | 'stories' | 'campaigns', where: Record<string, unknown> = {}, limit = 100) {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection,
    where: { _status: { equals: 'published' }, ...where },
    limit,
    depth: 2,
    draft: false,
    overrideAccess: false,
  });
  return result.docs as unknown as CMSRecord[];
}

export async function findPublishedRecordsSafely(collection: 'labels' | 'pages' | 'size-guides' | 'stories' | 'campaigns', where: Record<string, unknown> = {}, limit = 100) {
  try {
    return { records: await findPublishedRecords(collection, where, limit), error: null as string | null };
  } catch (error) {
    logServerError('cms published records', error);
    return { records: [] as CMSRecord[], error: 'Editorial content is temporarily unavailable.' };
  }
}

export async function findHomepageLayoutSafely() {
  try {
    const payload = await getPayload({ config });
    const global = await payload.findGlobal({ slug: 'homepage-layout', draft: false, overrideAccess: false });
    return { layout: global as unknown as { layout?: Array<Record<string, unknown>> }, error: null as string | null };
  } catch (error) {
    logServerError('cms homepage layout', error);
    return { layout: null, error: 'Homepage content is temporarily unavailable.' };
  }
}

export async function findAnnouncementSafely() {
  try {
    const payload = await getPayload({ config });
    const value = await payload.findGlobal({ slug: 'announcement-bar', draft: false, overrideAccess: false });
    return value as unknown as { enabled?: boolean; message?: string; url?: string; startsAt?: string; endsAt?: string };
  } catch (error) {
    logServerError('cms announcement bar', error);
    return null;
  }
}

export async function findSEODefaultsSafely() {
  try {
    const payload = await getPayload({ config });
    const value = await payload.findGlobal({ slug: 'seo-defaults', draft: false, overrideAccess: false });
    return value as unknown as { siteTitle?: string; defaultDescription?: string; defaultShareImage?: unknown; organizationName?: string };
  } catch (error) {
    logServerError('cms seo defaults', error);
    return null;
  }
}

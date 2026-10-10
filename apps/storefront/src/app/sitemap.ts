import type { MetadataRoute } from 'next';
import { LABELS } from '@lopaworld/types';
import { findPublishedRecordsSafely } from '../lib/cms';
import { publicSiteUrl } from '../lib/seo';
import { listStoreCategories, listStoreProducts } from '../lib/store';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = publicSiteUrl();
  if (!origin) return [];
  const basePaths = ['/', '/labels', '/shop', '/new-in', '/stories'];
  const urls: MetadataRoute.Sitemap = basePaths.map((path) => ({ url: new URL(path, origin).toString() }));
  for (const { slug } of LABELS) urls.push({ url: new URL(`/l/${slug}`, origin).toString() });

  const [stories, pages, categories] = await Promise.all([
    findPublishedRecordsSafely('stories', {}, 500),
    findPublishedRecordsSafely('pages', {}, 500),
    listStoreCategories().catch(() => []),
  ]);
  for (const story of stories.records) if (story.slug) urls.push({ url: new URL(`/stories/${story.slug}`, origin).toString(), lastModified: validDate(story.updatedAt) });
  for (const page of pages.records) if (page.slug) urls.push({ url: new URL(`/pages/${page.slug}`, origin).toString(), lastModified: validDate(page.updatedAt) });
  for (const category of categories) urls.push({ url: new URL(`/c/${category.handle}`, origin).toString() });

  try {
    const { products, count } = await listStoreProducts({ limit: 100, offset: 0 });
    urls.push(...products.map((product) => ({ url: new URL(`/p/${product.handle}`, origin).toString() })));
    for (let offset = products.length; offset < Math.min(count, 1000); offset += 100) {
      const result = await listStoreProducts({ limit: 100, offset });
      urls.push(...result.products.map((product) => ({ url: new URL(`/p/${product.handle}`, origin).toString() })));
      if (!result.products.length) break;
    }
  } catch {
    // A sitemap can still describe editorial and label routes during a commerce outage.
  }
  return urls;
}

function validDate(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

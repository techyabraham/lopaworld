import type { MetadataRoute } from 'next';
import { publicSiteUrl } from '../lib/seo';

export default function robots(): MetadataRoute.Robots {
  const origin = publicSiteUrl();
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/admin/', '/dev/', '/preview/', '/bag', '/checkout', '/track-order', '/wishlist'] },
    ...(origin ? { sitemap: new URL('/sitemap.xml', origin).toString() } : {}),
  };
}

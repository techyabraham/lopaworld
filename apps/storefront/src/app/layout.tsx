import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { AnalyticsConsent } from '../components/site/AnalyticsConsent';
import { findSEODefaultsSafely } from '../lib/cms';
import { canonical, jsonLd, publicSiteUrl } from '../lib/seo';

const editorialFont = localFont({
  src: '../../public/fonts/bodoni-moda.woff2',
  variable: '--font-editorial',
  display: 'swap',
  weight: '400 700',
  adjustFontFallback: 'Times New Roman',
  preload: true,
});

const interfaceFont = localFont({
  src: '../../public/fonts/dm-sans.woff2',
  variable: '--font-interface',
  display: 'swap',
  weight: '400 700',
  adjustFontFallback: 'Arial',
  preload: true,
});

const glyphFallbackFont = localFont({
  src: '../../public/fonts/noto-serif.woff2',
  variable: '--font-glyph-fallback',
  display: 'swap',
  weight: '100 900',
  adjustFontFallback: 'Times New Roman',
  preload: false,
});

export async function generateMetadata(): Promise<Metadata> {
  const seo = await findSEODefaultsSafely();
  const siteTitle = seo?.siteTitle?.trim() || 'Lopaworld';
  const description = seo?.defaultDescription?.trim() || 'Lopaworld — one house, seven labels.';
  const media = seo?.defaultShareImage && typeof seo.defaultShareImage === 'object' ? seo.defaultShareImage as Record<string, unknown> : {};
  const image = typeof media.url === 'string' ? media.url : undefined;
  return {
    metadataBase: publicSiteUrl() ?? undefined,
    title: { default: siteTitle, template: `%s | ${siteTitle}` },
    description,
    alternates: { canonical: canonical('/') },
    openGraph: { type: 'website', siteName: siteTitle, title: siteTitle, description, images: image ? [image] : [] },
    twitter: { card: 'summary_large_image', title: siteTitle, description, images: image ? [image] : [] },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const seo = await findSEODefaultsSafely();
  const organizationName = seo?.organizationName?.trim() || 'Lopaworld';
  const origin = publicSiteUrl();
  const structuredData = origin ? [
    { '@context': 'https://schema.org', '@type': 'Organization', name: organizationName, url: origin.toString() },
    { '@context': 'https://schema.org', '@type': 'WebSite', name: organizationName, url: origin.toString(), potentialAction: { '@type': 'SearchAction', target: `${origin}search?q={search_term_string}`, 'query-input': 'required name=search_term_string' } },
  ] : [];
  return <html lang="en"><body className={`${editorialFont.variable} ${interfaceFont.variable} ${glyphFallbackFont.variable}`}><div data-label="lopaworld" className="site-shell">{children}</div><AnalyticsConsent />{structuredData.map((entry) => <script key={entry['@type']} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(entry) }} />)}</body></html>;
}

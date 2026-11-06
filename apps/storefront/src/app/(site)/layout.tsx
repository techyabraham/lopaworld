import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { AnalyticsConsent } from '../../components/site/AnalyticsConsent';
import { CONSENT_KEY } from '../../lib/consent-key';
import { findSEODefaultsSafely } from '../../lib/cms';
import { canonical, jsonLd, publicSiteUrl } from '../../lib/seo';

// Entrance type (ADR "Entrance design system"). Only Archivo and the Instrument Serif italic are
// preloaded (§7: two files, 141 KB). Instrument Serif lacks the Naira sign and the Yoruba dot-below
// letters; those glyphs fall back to Noto Serif through --font-glyph-fallback.
// Runs before first paint: marks <html> when an analytics choice is stored, so the server-rendered
// consent prompt stays hidden for visitors who already answered (see AnalyticsConsent).
const consentPrePaint = `try{var v=localStorage.getItem(${JSON.stringify(CONSENT_KEY)});if(v==='accepted'||v==='rejected')document.documentElement.setAttribute('data-consent-answered','')}catch(e){}`;

const interfaceFont = localFont({
  src: '../../../public/fonts/archivo.woff2',
  variable: '--font-interface',
  display: 'swap',
  weight: '100 900',
  declarations: [{ prop: 'font-stretch', value: '62% 100%' }],
  adjustFontFallback: 'Arial',
  preload: true,
});

const voiceFont = localFont({
  src: '../../../public/fonts/instrument-serif-italic.woff2',
  variable: '--font-voice',
  display: 'swap',
  weight: '400',
  style: 'italic',
  adjustFontFallback: 'Times New Roman',
  preload: true,
});

const editorialFont = localFont({
  src: '../../../public/fonts/instrument-serif-regular.woff2',
  variable: '--font-editorial',
  display: 'swap',
  weight: '400',
  adjustFontFallback: 'Times New Roman',
  preload: false,
});

const glyphFallbackFont = localFont({
  src: '../../../public/fonts/noto-serif.woff2',
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
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: consentPrePaint }} /></head><body className={`${interfaceFont.variable} ${voiceFont.variable} ${editorialFont.variable} ${glyphFallbackFont.variable}`}><div data-label="lopaworld" className="site-shell">{children}</div><AnalyticsConsent />{structuredData.map((entry) => <script key={entry['@type']} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(entry) }} />)}</body></html>;
}

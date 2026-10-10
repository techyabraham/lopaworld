import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

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

export const metadata: Metadata = {
  title: 'Lopaworld',
  description: 'Lopaworld — one house, seven labels.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${editorialFont.variable} ${interfaceFont.variable} ${glyphFallbackFont.variable}`}><div data-label="lopaworld" className="site-shell">{children}</div></body></html>;
}

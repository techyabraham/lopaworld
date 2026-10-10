import Link from 'next/link';
import { LABELS } from '@lopaworld/types';

export function SiteFooter({ pages = [] }: { pages?: Array<{ title?: string; slug?: string }> }) {
  return <footer className="site-footer">
    <div className="footer-grid">
      <div><Link className="site-wordmark footer-wordmark" href="/">LOPA<span>WORLD</span></Link><p>One house. Seven labels.</p><p>Customer support details will be published here once confirmed.</p></div>
      <nav aria-label="Shop labels"><h2>Labels</h2><ul>{LABELS.map(({ slug, name }) => <li key={slug}><Link href={`/l/${slug}`}>{slug === 'lopaworld' ? 'Lopaworld — The House' : name}</Link></li>)}</ul></nav>
      <nav aria-label="Information"><h2>Information</h2><ul><li><Link href="/shop">Shop all</Link></li><li><Link href="/stories">Stories</Link></li>{pages.map((page) => page.slug && <li key={page.slug}><Link href={`/pages/${page.slug}`}>{page.title ?? page.slug}</Link></li>)}</ul></nav>
    </div>
    <p className="footer-copyright">© {new Date().getFullYear()} Lopaworld</p>
  </footer>;
}

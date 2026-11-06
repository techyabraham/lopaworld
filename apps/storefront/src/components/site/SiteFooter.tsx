import Link from 'next/link';
import { PrivacyChoicesButton } from './PrivacyChoicesButton';
import { LABELS } from '@lopaworld/types';

type FooterPage = { title?: string; slug?: string };

// The house slug is not listed as a label pending gate D11. "Talk to us" renders only once
// confirmed contacts exist in Payload (none today); the drop-alert sign-up waits for gate D8.
export function SiteFooter({ pages = [], organizationName }: { pages?: FooterPage[]; organizationName?: string | null }) {
  const published = pages.filter((page): page is Required<FooterPage> => Boolean(page.slug));
  const legal = published.filter(({ slug }) => slug === 'privacy' || slug === 'terms');
  const service = published.filter(({ slug }) => slug !== 'privacy' && slug !== 'terms');
  return <footer className="site-footer" data-ground="ink">
    <div className="footer-inner">
      <div className="footer-brand">
        <Link className="footer-wordmark" href="/" aria-label="Lopaworld home"><span className="footer-lopa" aria-hidden="true">LOPA</span><span className="footer-world" aria-hidden="true">WORLD</span></Link>
      </div>
      <div className="footer-columns">
        <nav aria-label="Labels"><h2 className="lw-eyebrow">Labels</h2><ul>{LABELS.filter(({ slug }) => slug !== 'lopaworld').map(({ slug, name }) => <li key={slug}><Link href={`/l/${slug}`}>{name}</Link></li>)}</ul></nav>
        <nav aria-label="Service"><h2 className="lw-eyebrow">Service</h2><ul><li><Link href="/track-order">Track an order</Link></li><li><PrivacyChoicesButton /></li>{service.map((page) => <li key={page.slug}><Link href={`/pages/${page.slug}`}>{page.title ?? page.slug}</Link></li>)}</ul></nav>
      </div>
    </div>
    <div className="footer-bottom">
      <span>© {new Date().getFullYear()} {organizationName?.trim() || 'Lopaworld'}</span>
      {legal.length > 0 && <span className="footer-legal">{legal.map((page) => <Link key={page.slug} href={`/pages/${page.slug}`}>{page.title ?? page.slug}</Link>)}</span>}
    </div>
  </footer>;
}

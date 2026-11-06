'use client';

import Link from 'next/link';
import { useState } from 'react';
import { LABELS } from '@lopaworld/types';
import { IconButton, Sheet } from '@lopaworld/ui';
import { CartLauncher } from '../cart/CartLauncher';
import { features } from '../../lib/env';
import { MenuIcon, SearchIcon } from './icons';

// The house slug is not listed as a label pending gate D11.
const labels = LABELS.filter(({ slug }) => slug !== 'lopaworld');

export function Wordmark({ className }: { className?: string }) {
  return <Link className={['site-wordmark', className].filter(Boolean).join(' ')} href="/" aria-label="Lopaworld home"><span className="wordmark-lopa" aria-hidden="true">LOPA</span><span className="wordmark-world" aria-hidden="true">WORLD</span></Link>;
}

export function SiteHeader({ showOccasions = false }: { showOccasions?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);
  const links = [
    { href: '/new-in', label: 'New in' },
    { href: '/labels', label: 'Labels' },
    ...(showOccasions ? [{ href: '/#occasions', label: 'Occasions' }] : []),
    ...(features.madeToMeasure ? [{ href: '/made-to-measure', label: 'Made to measure' }] : []),
    ...(features.groupOrders ? [{ href: '/group-orders', label: 'Aso-ebi orders' }] : []),
    { href: '/stories', label: 'Journal' },
    { href: '/shop', label: 'Shop' },
  ];
  return <header className="site-header">
    <div className="site-header-inner">
      <IconButton label="Menu" className="menu-trigger" aria-expanded={menuOpen} aria-controls="site-menu" onClick={() => setMenuOpen(true)}><MenuIcon /></IconButton>
      <Wordmark />
      <nav className="desktop-nav" aria-label="Main navigation">{links.map(({ href, label }) => <Link key={href} href={href}>{label}</Link>)}</nav>
      <div className="header-actions">
        <Link className="lw-icon-button search-link" href="/search" aria-label="Search"><SearchIcon /></Link>
        <CartLauncher />
      </div>
    </div>
    {menuOpen && <Sheet title="Menu" onClose={close}>
      <nav id="site-menu" className="mobile-menu" aria-label="Main navigation">
        {links.map(({ href, label }) => <Link key={href} className="mobile-menu-link" href={href} onClick={close}>{label}</Link>)}
        <p className="lw-eyebrow mobile-menu-heading">Labels</p>
        {labels.map(({ slug, name }) => <Link key={slug} className="mobile-menu-label" href={`/l/${slug}`} onClick={close}>{name}</Link>)}
      </nav>
    </Sheet>}
  </header>;
}

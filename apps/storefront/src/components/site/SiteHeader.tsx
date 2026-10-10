'use client';

import Link from 'next/link';
import { useState } from 'react';
import { LABELS } from '@lopaworld/types';
import { CartLauncher } from '../cart/CartLauncher';
import { Sheet } from '@lopaworld/ui';

const labelNames = new Map<string, string>(LABELS.map(({ slug, name }) => [slug, name]));

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  return <header className="site-header">
    <div className="site-header-inner">
      <button className="menu-trigger" type="button" aria-expanded={menuOpen} aria-controls="label-menu" onClick={() => setMenuOpen(true)}>Menu</button>
      <Link className="site-wordmark" href="/" aria-label="Lopaworld home">LOPA<span>WORLD</span></Link>
      <nav className="desktop-nav" aria-label="Main navigation">
        <Link href="/shop">Shop</Link><Link href="/labels">Labels</Link><Link href="/new-in">New In</Link><Link href="/stories">Stories</Link>
      </nav>
      <div className="header-actions"><Link className="search-link" href="/search" aria-label="Search">Search</Link><CartLauncher /></div>
    </div>
    {menuOpen && <Sheet title="Explore Lopaworld" onClose={() => setMenuOpen(false)}>
      <nav id="label-menu" className="mobile-menu" aria-label="Shop and labels">
        <Link href="/shop" onClick={() => setMenuOpen(false)}>Shop all</Link>
        <Link href="/new-in" onClick={() => setMenuOpen(false)}>New In</Link>
        <Link href="/stories" onClick={() => setMenuOpen(false)}>Stories</Link>
        <h3>Seven labels</h3>
        {['lopaworld', ...LABELS.filter(({ slug }) => slug !== 'lopaworld').map(({ slug }) => slug)].map((slug) => <Link key={slug} href={`/l/${slug}`} onClick={() => setMenuOpen(false)}>{slug === 'lopaworld' ? 'Lopaworld — The House' : labelNames.get(slug)}</Link>)}
        <Link href="/search" onClick={() => setMenuOpen(false)}>Search the catalogue</Link>
      </nav>
    </Sheet>}
  </header>;
}

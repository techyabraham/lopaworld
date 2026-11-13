'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useBagCount } from '../cart/use-bag-count';
import { BagIcon, HomeIcon, LabelsIcon, SavedIcon, SearchIcon } from './icons';

const isTextEntry = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.matches('input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]), textarea, select') || target.isContentEditable);

/** Thumb-zone navigation below 1024px. Hidden while a text field has focus (on-screen keyboard). */
export function MobileTabBar() {
  const pathname = usePathname();
  const count = useBagCount();
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const onFocusIn = (event: FocusEvent) => setTyping(isTextEntry(event.target));
    const onFocusOut = (event: FocusEvent) => { if (!isTextEntry(event.relatedTarget)) setTyping(false); };
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => { document.removeEventListener('focusin', onFocusIn); document.removeEventListener('focusout', onFocusOut); };
  }, []);

  const items = [
    { href: '/', label: 'Home', icon: <HomeIcon />, active: pathname === '/' },
    { href: '/labels', label: 'Labels', icon: <LabelsIcon />, active: pathname === '/labels' || pathname.startsWith('/l/') },
    { href: '/wishlist', label: 'Saved', icon: <SavedIcon />, active: pathname === '/wishlist' },
    { href: '/search', label: 'Search', icon: <SearchIcon />, active: pathname === '/search' },
    { href: '/bag', label: count ? `Bag · ${count}` : 'Bag', icon: <BagIcon />, active: pathname === '/bag' },
  ];
  return <nav className="mobile-tab-bar" aria-label="App" data-hidden={typing || undefined}>
    {items.map(({ href, label, icon, active }) => <Link key={href} href={href} aria-current={active ? 'page' : undefined}>{icon}<span>{label}</span></Link>)}
  </nav>;
}

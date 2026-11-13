'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Sheet } from '@lopaworld/ui';
import { CartContents } from './CartContents';
import { setBagCount, useBagCount } from './use-bag-count';

export function CartLauncher() {
  const [open, setOpen] = useState(false);
  const count = useBagCount();

  return <>
    <button type="button" className="header-bag" aria-label={`Open bag${count ? `, ${count} ${count === 1 ? 'item' : 'items'}` : ''}`} onClick={() => setOpen(true)}>
      <span aria-hidden="true">Bag</span>
      {count > 0 && <span className="bag-count" aria-hidden="true">{count}</span>}
    </button>
    {/* Announce bag changes to assistive technology (§6). */}
    <span className="visually-hidden" aria-live="polite">{count ? `${count} ${count === 1 ? 'item' : 'items'} in your bag` : ''}</span>
    {open && <Sheet title="Your bag" onClose={() => setOpen(false)}><CartContents active onCountChange={setBagCount} /><p><Link className="lw-button" data-variant="secondary" href="/bag" onClick={() => setOpen(false)}>View full bag</Link></p></Sheet>}
  </>;
}

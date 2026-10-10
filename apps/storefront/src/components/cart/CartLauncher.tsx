'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { IconButton } from '@lopaworld/ui';
import { CartContents } from './CartContents';
import { Sheet } from '@lopaworld/ui';

export function CartLauncher() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const onCountChange = useCallback((value: number) => setCount(value), []);
  useEffect(() => {
    const refresh = () => {
      void fetch('/api/cart', { cache: 'no-store' }).then((response) => response.json()).then((body: { cart?: { items?: Array<{ quantity: number }> } }) => {
        setCount((body.cart?.items ?? []).reduce((sum, item) => sum + item.quantity, 0));
      }).catch(() => undefined);
    };
    refresh();
    window.addEventListener('lw:cart-updated', refresh);
    return () => window.removeEventListener('lw:cart-updated', refresh);
  }, []);

  return <>
    <IconButton label={`Open bag${count ? `, ${count} items` : ''}`} className="header-bag" onClick={() => setOpen(true)}>
      <span aria-hidden="true">Bag</span><span className="bag-count" aria-hidden="true">{count}</span>
    </IconButton>
    {open && <Sheet title="Your bag" onClose={() => setOpen(false)}><CartContents active onCountChange={onCountChange} /><p><Link href="/bag" onClick={() => setOpen(false)}>View full bag</Link></p></Sheet>}
  </>;
}

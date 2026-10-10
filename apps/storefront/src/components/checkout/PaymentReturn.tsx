'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export function PaymentReturn() {
  const [message, setMessage] = useState('Checking payment with Lopaworld…');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let stopped = false;
    let timer: number | undefined;
    let attempts = 0;
    const check = async () => {
      try {
        const response = await fetch('/api/checkout/complete', { method: 'POST', cache: 'no-store' });
        const result = await response.json() as { complete?: boolean; orderId?: string; pending?: boolean; failed?: boolean; error?: string };
        if (stopped) return;
        if (result.complete && result.orderId) {
          window.location.replace(`/checkout/confirmation/${encodeURIComponent(result.orderId)}`);
          return;
        }
        attempts += 1;
        if (attempts < 20 && (response.status === 202 || result.pending)) {
          setMessage('Your payment is still being confirmed. This page will check again shortly.');
          timer = window.setTimeout(() => void check(), 3000);
          return;
        }
        setFailed(true);
        setMessage(result.error ?? 'We could not confirm this payment yet. Contact Lopaworld with your checkout email before trying again.');
      } catch {
        if (!stopped) {
          attempts += 1;
          if (attempts < 20) timer = window.setTimeout(() => void check(), 3000);
          else { setFailed(true); setMessage('We could not confirm this payment yet. Contact Lopaworld with your checkout email before trying again.'); }
        }
      }
    };
    void check();
    return () => { stopped = true; if (timer) window.clearTimeout(timer); };
  }, []);

  return <section className="checkout-return" aria-live="polite"><p className="eyebrow">Payment return</p><h1>{failed ? 'Payment not confirmed' : 'Confirming your order'}</h1><p>{message}</p>{failed && <Link className="lw-button" href="/bag">Return to your bag</Link>}</section>;
}

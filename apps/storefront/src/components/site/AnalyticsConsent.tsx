'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { CONSENT_KEY } from '../../lib/analytics';
import { useLocalStorageValue } from '../../lib/use-local-storage-value';

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const CHANGE_EVENT = 'lopaworld-consent-change';
type Choice = 'accepted' | 'rejected' | null;

function activateMeasurement() {
  if (!measurementId) return;
  if (!window.gtag) {
    window.dataLayer = window.dataLayer ?? [];
    window.gtag = (...args: unknown[]) => { window.dataLayer?.push(args); };
    window.gtag('js', new Date());
    window.gtag('consent', 'default', { analytics_storage: 'granted' });
    window.gtag('config', measurementId, { anonymize_ip: true });
  }
}

export function AnalyticsConsent() {
  const stored = useLocalStorageValue(CONSENT_KEY, CHANGE_EVENT);
  // undefined until hydrated: render nothing rather than a prompt the visitor may already have answered.
  const ready = stored !== undefined;
  const choice: Choice = stored === 'accepted' || stored === 'rejected' ? stored : null;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (choice === 'accepted') activateMeasurement();
  }, [choice]);

  function decide(next: Exclude<Choice, null>) {
    window.localStorage.setItem(CONSENT_KEY, next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
    setOpen(false);
    if (measurementId && window.gtag) {
      window.gtag('consent', 'update', { analytics_storage: next === 'accepted' ? 'granted' : 'denied' });
    }
    if (next === 'accepted') activateMeasurement();
  }

  const showPrompt = ready && (choice === null || open);
  return <>
    {measurementId && choice === 'accepted' && <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`} strategy="lazyOnload" />}
    {showPrompt ? <aside className="consent-panel" aria-label="Analytics preferences">
      <div><strong>Privacy choices</strong><p>Optional analytics help us understand how the shop is used. They stay off unless you allow them. You can change this choice at any time.</p></div>
      <div className="consent-actions">
        <button type="button" onClick={() => decide('rejected')}>Reject optional</button>
        <button type="button" onClick={() => decide('accepted')}>Allow analytics</button>
      </div>
    </aside> : ready && <button className="consent-settings" type="button" onClick={() => setOpen(true)}>Privacy choices</button>}
  </>;
}

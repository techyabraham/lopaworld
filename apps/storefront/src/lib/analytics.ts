'use client';

import type { StoreAnalyticsEvent } from '@lopaworld/types';

const CONSENT_KEY = 'lopaworld-analytics-consent';

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackStoreEvent(event: StoreAnalyticsEvent) {
  if (typeof window === 'undefined' || window.localStorage.getItem(CONSENT_KEY) !== 'accepted') return;
  window.gtag?.('event', event.name, event.params ?? {});
}

export { CONSENT_KEY };

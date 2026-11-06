'use client';

import { OPEN_EVENT } from './AnalyticsConsent';

/** Reopens the analytics prompt. Lives in the footer so no floating button covers the tab bar. */
export function PrivacyChoicesButton() {
  return <button type="button" className="footer-link-button" onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}>Privacy choices</button>;
}

# Phase 7 launch QA checklist

Run this checklist against a configured staging deployment with realistic catalogue data before launch. Record the date, build, tester and evidence for each result.

## Accessibility

- [ ] Run axe WCAG 2.2 AA checks on home, each label landing page, listing, product, cart, checkout and order confirmation.
- [ ] Complete browse-to-order using keyboard only; verify visible focus, logical order, Escape/close behavior, focus return and no keyboard traps in menus, dialogs and sheets.
- [ ] Complete the same flow with a screen reader on desktop and mobile; confirm headings, product options, prices, form labels, validation messages and status updates are announced.
- [ ] Check text, controls and focus indicators for contrast; verify zoom/reflow and touch target sizing.
- [ ] Enable reduced motion and verify animations respect the system preference.

## Security and privacy

- [ ] Confirm production HTTPS and response security headers; review the CSP report and remove any unused allowed origins.
- [ ] Verify cross-origin POSTs to cart and checkout mutation routes return 403, while same-origin browser requests work.
- [ ] Confirm cart and order cookies are `HttpOnly`, `Secure` in production and `SameSite=Lax`.
- [ ] Verify no card data enters Lopaworld systems or logs; exercise payment success, failure, cancel, duplicate, delayed, replayed and tampered webhook cases.
- [ ] Exercise order lookup abuse controls and verify personal data is excluded from analytics and application logs.
- [ ] Complete the approved NDPA consent, export, correction and deletion workflow review with the business/legal owner.
- [ ] Run dependency and secret scans in CI; resolve or document all findings.

## Performance and resilience

- [ ] Run mobile Lighthouse on home, label, listing and product pages; target performance score at least 90 and LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 with representative production data.
- [ ] Verify CDN/cache behavior, ISR or revalidation after content and product changes, and deferred third-party scripts.
- [ ] Run the agreed load profile against staging and record response percentiles, error rate and resource saturation.
- [ ] Take a production-like database backup, restore it into an isolated environment, verify records and record measured RPO/RTO.
- [ ] Verify media versioning/restore, uptime alerts, error reporting and incident escalation.

## Browser and device coverage

- [ ] Run the existing Playwright suite on desktop and mobile viewports.
- [ ] Add/run E2E coverage for label navigation, search/filter, product variant selection, cart changes, invalid checkout, shipping selection, payment return and order lookup.
- [ ] Verify supported browsers and real iOS/Android devices, including narrow viewport, slow network and offline/retry states.

## Release sign-off

- [ ] Confirm owner-approved catalogue, logo, copy, delivery, returns, privacy and contact information are present.
- [ ] Confirm production host, payment, analytics consent, monitoring, backup, restore and rollback procedures are configured.
- [ ] Capture evidence, assign owners to failures, and obtain product, operations and legal sign-off.

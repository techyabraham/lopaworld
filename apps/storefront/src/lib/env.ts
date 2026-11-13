// Public feature flags (inlined at build time). Both default off: made-to-measure arrives in
// Phase 3 and group orders in Phase 4; until then their UI renders only in /dev/ui.
export const features = {
  madeToMeasure: process.env.NEXT_PUBLIC_FEATURE_MTM === 'true',
  groupOrders: process.env.NEXT_PUBLIC_FEATURE_GROUP_ORDERS === 'true',
} as const;

/**
 * The storefront's public origin, from `NEXT_PUBLIC_SITE_URL` (e.g. `https://www.example.com`).
 * Next inlines `NEXT_PUBLIC_*` at build time, so the image must be built with the real value
 * (the Coolify compose passes it as a build arg). Returns null when unset or not an http(s) URL.
 */
export function configuredSiteOrigin(): string | null {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.origin : null;
  } catch {
    return null;
  }
}

/**
 * Whether the storefront sits behind a reverse proxy that sets `X-Forwarded-Host` /
 * `X-Forwarded-Proto` and strips client-supplied copies (Coolify's Traefik does). Read at runtime;
 * off unless `TRUST_PROXY_HEADERS=true`, because otherwise any client can forge those headers.
 */
export function trustProxyHeaders(): boolean {
  return process.env.TRUST_PROXY_HEADERS?.trim().toLowerCase() === 'true';
}

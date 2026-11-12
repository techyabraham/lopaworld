import { configuredSiteOrigin, trustProxyHeaders } from './env';

function firstHeaderValue(request: Request, name: string): string | null {
  const value = request.headers.get(name)?.split(',')[0]?.trim();
  return value ? value : null;
}

/** The origin the client used, as reported by a trusted reverse proxy. */
function forwardedOrigin(request: Request): string | null {
  const host = firstHeaderValue(request, 'x-forwarded-host') ?? firstHeaderValue(request, 'host');
  const proto = firstHeaderValue(request, 'x-forwarded-proto')?.toLowerCase();
  // A bare hostname with an optional port; anything else (userinfo, paths) is refused.
  if (!host || !/^[a-z0-9.-]+(:\d{1,5})?$/i.test(host) || (proto !== 'https' && proto !== 'http')) return null;
  return originOf(`${proto}://${host}`);
}

/**
 * Origins a same-origin browser request may come from.
 *
 * `request.url` cannot be used on its own: the Next standalone server reports it as
 * `http://localhost:<port>` whatever the `Host` / `X-Forwarded-*` headers say (audit N11). So:
 * 1. the configured public origin (`NEXT_PUBLIC_SITE_URL`);
 * 2. the proxy-reported origin, only when `TRUST_PROXY_HEADERS=true`;
 * 3. only if neither is available (local dev, CI without a site URL), `request.url`'s origin.
 */
export function allowedRequestOrigins(request: Request): Set<string> {
  const allowed = new Set<string>();
  const configured = configuredSiteOrigin();
  if (configured) allowed.add(configured);
  if (trustProxyHeaders()) {
    const forwarded = forwardedOrigin(request);
    if (forwarded) allowed.add(forwarded);
  }
  if (allowed.size === 0) allowed.add(new URL(request.url).origin);
  return allowed;
}

function originOf(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/** Reject cross-site browser requests before they can mutate a guest cart or checkout. */
export function isSameOriginRequest(request: Request): boolean {
  const allowed = allowedRequestOrigins(request);

  const origin = request.headers.get('origin');
  if (origin) {
    const value = originOf(origin);
    return value !== null && allowed.has(value);
  }

  const referer = request.headers.get('referer');
  if (referer) {
    const value = originOf(referer);
    return value !== null && allowed.has(value);
  }

  return request.headers.get('sec-fetch-site') === 'same-origin';
}

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isSameOriginRequest } from './request-security';

// What the Next standalone server reports as request.url behind any proxy (audit N11).
const LOCAL_URL = 'http://localhost:3000/api/cart/items';

function post(headers: Record<string, string>, url = LOCAL_URL): Request {
  return new Request(url, { method: 'POST', headers });
}

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.com');
  vi.stubEnv('TRUST_PROXY_HEADERS', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('isSameOriginRequest with a configured site origin', () => {
  it('accepts an Origin that matches the configured origin', () => {
    expect(isSameOriginRequest(post({ origin: 'https://example.com' }))).toBe(true);
  });

  it('accepts the configured origin when request.url is localhost (standalone server)', () => {
    const request = post({ origin: 'https://example.com', host: 'example.com', 'x-forwarded-proto': 'https' });
    expect(new URL(request.url).origin).toBe('http://localhost:3000');
    expect(isSameOriginRequest(request)).toBe(true);
  });

  it('accepts a configured origin given with a trailing path', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.com/');
    expect(isSameOriginRequest(post({ origin: 'https://example.com' }))).toBe(true);
  });

  it('rejects a mismatched Origin', () => {
    expect(isSameOriginRequest(post({ origin: 'https://evil.example' }))).toBe(false);
    expect(isSameOriginRequest(post({ origin: 'http://example.com' }))).toBe(false);
    expect(isSameOriginRequest(post({ origin: 'https://shop.example.com' }))).toBe(false);
  });

  it('rejects request.url’s own localhost origin once a site origin is configured', () => {
    expect(isSameOriginRequest(post({ origin: 'http://localhost:3000' }))).toBe(false);
  });

  it('rejects a malformed or opaque Origin', () => {
    expect(isSameOriginRequest(post({ origin: 'null' }))).toBe(false);
    expect(isSameOriginRequest(post({ origin: 'not a url' }))).toBe(false);
  });

  it('falls back to Referer when Origin is missing', () => {
    expect(isSameOriginRequest(post({ referer: 'https://example.com/bag?x=1' }))).toBe(true);
    expect(isSameOriginRequest(post({ referer: 'https://evil.example/bag' }))).toBe(false);
    expect(isSameOriginRequest(post({ referer: '::bad' }))).toBe(false);
  });

  it('Origin wins over Referer', () => {
    expect(isSameOriginRequest(post({ origin: 'https://evil.example', referer: 'https://example.com/' }))).toBe(false);
  });

  it('falls back to Sec-Fetch-Site when neither Origin nor Referer is sent', () => {
    expect(isSameOriginRequest(post({ 'sec-fetch-site': 'same-origin' }))).toBe(true);
    expect(isSameOriginRequest(post({ 'sec-fetch-site': 'same-site' }))).toBe(false);
    expect(isSameOriginRequest(post({ 'sec-fetch-site': 'cross-site' }))).toBe(false);
    expect(isSameOriginRequest(post({}))).toBe(false);
  });
});

describe('forwarded headers', () => {
  const forged = { origin: 'https://evil.example', 'x-forwarded-host': 'evil.example', 'x-forwarded-proto': 'https' };

  it('are ignored unless TRUST_PROXY_HEADERS=true', () => {
    expect(isSameOriginRequest(post(forged))).toBe(false);
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    expect(isSameOriginRequest(post(forged))).toBe(false);
  });

  it('are accepted from a trusted proxy, alongside the configured origin', () => {
    vi.stubEnv('TRUST_PROXY_HEADERS', 'true');
    const viaProxy = { origin: 'https://staging.example.com', 'x-forwarded-host': 'staging.example.com', 'x-forwarded-proto': 'https' };
    expect(isSameOriginRequest(post(viaProxy))).toBe(true);
    expect(isSameOriginRequest(post({ ...viaProxy, origin: 'https://example.com' }))).toBe(true);
    expect(isSameOriginRequest(post({ ...viaProxy, origin: 'https://evil.example' }))).toBe(false);
  });

  it('use the first value of a comma-separated chain and fall back to Host', () => {
    vi.stubEnv('TRUST_PROXY_HEADERS', 'true');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    expect(isSameOriginRequest(post({ origin: 'https://a.example', 'x-forwarded-host': 'a.example, b.internal', 'x-forwarded-proto': 'https, http' }))).toBe(true);
    expect(isSameOriginRequest(post({ origin: 'https://a.example', host: 'a.example', 'x-forwarded-proto': 'https' }))).toBe(true);
  });

  it('refuse a forwarded host that is not a plain host[:port]', () => {
    vi.stubEnv('TRUST_PROXY_HEADERS', 'true');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    const request = post({ origin: 'https://evil.example', 'x-forwarded-host': 'user@evil.example/x', 'x-forwarded-proto': 'https' });
    expect(isSameOriginRequest(request)).toBe(false);
  });

  it('need a forwarded proto', () => {
    vi.stubEnv('TRUST_PROXY_HEADERS', 'true');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    // No proto: no forwarded origin, so only request.url's origin is allowed.
    expect(isSameOriginRequest(post({ origin: 'https://a.example', 'x-forwarded-host': 'a.example' }))).toBe(false);
  });
});

describe('without a configured origin (local dev, CI)', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
  });

  it('falls back to request.url’s origin', () => {
    expect(isSameOriginRequest(post({ origin: 'http://localhost:3000' }))).toBe(true);
    expect(isSameOriginRequest(post({ origin: 'http://127.0.0.1:3000' }))).toBe(false);
  });

  it('treats an unparseable site URL as unset', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'example.com');
    expect(isSameOriginRequest(post({ origin: 'http://localhost:3000' }))).toBe(true);
    expect(isSameOriginRequest(post({ origin: 'https://example.com' }))).toBe(false);
  });
});

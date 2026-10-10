import 'server-only';

export function publicSiteUrl(): URL | null {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && url.hostname === 'localhost')) return null;
    return new URL(url.origin);
  } catch {
    return null;
  }
}

export function canonical(path: string): string | undefined {
  const origin = publicSiteUrl();
  return origin ? new URL(path, origin).toString() : undefined;
}

export function jsonLd(value: Record<string, unknown>): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

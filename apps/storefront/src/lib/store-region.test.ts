import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ngn = { id: 'reg_ngn', currency_code: 'ngn', name: 'Nigeria' };
const usd = { id: 'reg_usd', currency_code: 'usd', name: 'Elsewhere' };

const regionsResponse = (regions: unknown[]) => new Response(JSON.stringify({ regions }), { status: 200, headers: { 'content-type': 'application/json' } });

let fetchMock: ReturnType<typeof vi.fn>;

async function loadStore() {
  vi.resetModules();
  return import('./store');
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-05T12:00:00Z'));
  vi.stubEnv('NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY', 'pk_test_unit');
  vi.stubEnv('MEDUSA_REGION_ID', '');
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('getStoreRegion (B2)', () => {
  it('retries on the next call after Medusa was unreachable', async () => {
    const { getStoreRegion } = await loadStore();
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED')).mockResolvedValueOnce(regionsResponse([ngn]));

    expect(await getStoreRegion()).toBeNull();
    expect(await getStoreRegion()).toEqual(ngn);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries on the next call after Medusa had no NGN region', async () => {
    const { getStoreRegion } = await loadStore();
    fetchMock.mockResolvedValueOnce(regionsResponse([usd])).mockResolvedValueOnce(regionsResponse([usd, ngn]));

    expect(await getStoreRegion()).toBeNull();
    expect(await getStoreRegion()).toEqual(ngn);
  });

  it('serves a found region from cache within the TTL', async () => {
    const { getStoreRegion } = await loadStore();
    fetchMock.mockResolvedValue(regionsResponse([ngn]));

    await getStoreRegion();
    vi.setSystemTime(new Date('2026-11-05T12:04:59Z'));
    expect(await getStoreRegion()).toEqual(ngn);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('refreshes the region once the TTL has passed', async () => {
    const { getStoreRegion } = await loadStore();
    const renamed = { ...ngn, name: 'Nigeria (renamed)' };
    fetchMock.mockResolvedValueOnce(regionsResponse([ngn])).mockResolvedValueOnce(regionsResponse([renamed]));

    await getStoreRegion();
    vi.setSystemTime(new Date('2026-11-05T12:05:01Z'));
    expect(await getStoreRegion()).toEqual(renamed);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('keeps the last known region if a refresh after the TTL fails', async () => {
    const { getStoreRegion } = await loadStore();
    fetchMock.mockResolvedValueOnce(regionsResponse([ngn])).mockRejectedValueOnce(new Error('ECONNREFUSED'));

    await getStoreRegion();
    vi.setSystemTime(new Date('2026-11-05T12:06:00Z'));
    expect(await getStoreRegion()).toEqual(ngn);
  });

  it('shares one Medusa request between concurrent callers', async () => {
    const { getStoreRegion } = await loadStore();
    fetchMock.mockResolvedValue(regionsResponse([ngn]));

    const [first, second] = await Promise.all([getStoreRegion(), getStoreRegion()]);
    expect(first).toEqual(ngn);
    expect(second).toEqual(ngn);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

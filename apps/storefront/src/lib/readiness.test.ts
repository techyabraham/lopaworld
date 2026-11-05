import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getPayload } = vi.hoisted(() => ({ getPayload: vi.fn() }));
vi.mock('payload', () => ({ getPayload }));

import { GET as health } from '../app/api/health/route';
import { GET as ready } from '../app/api/ready/route';
import { checkDatabase, checkMedusa } from './readiness';

let fetchMock: ReturnType<typeof vi.fn>;
const poolWith = (query: () => Promise<unknown>) => ({ db: { pool: { query } } });
const never = () => new Promise<never>(() => undefined);

beforeEach(() => {
  vi.stubEnv('MEDUSA_BACKEND_URL', 'http://medusa.test:9000/');
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  getPayload.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('GET /api/health', () => {
  it('answers 200 without touching any dependency', async () => {
    const response = health();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(getPayload).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('readiness checks', () => {
  it('reports the database ok when the pool answers', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] });
    getPayload.mockResolvedValue(poolWith(query));

    expect(await checkDatabase()).toBe('ok');
    expect(query).toHaveBeenCalledWith('select 1');
  });

  it('reports the database unavailable when the query fails', async () => {
    getPayload.mockResolvedValue(poolWith(() => Promise.reject(new Error('ECONNREFUSED'))));

    expect(await checkDatabase()).toBe('unavailable');
  });

  it('reports the database unavailable when Payload does not initialise in time', async () => {
    getPayload.mockImplementation(never);

    expect(await checkDatabase(50)).toBe('unavailable');
  });

  it('calls Medusa /health on the configured backend', async () => {
    fetchMock.mockResolvedValue(new Response('OK', { status: 200 }));

    expect(await checkMedusa()).toBe('ok');
    expect(fetchMock).toHaveBeenCalledWith('http://medusa.test:9000/health', expect.objectContaining({ cache: 'no-store' }));
  });

  it('reports Medusa unavailable on a non-2xx answer or a network failure', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 503 })).mockRejectedValueOnce(new TypeError('fetch failed'));

    expect(await checkMedusa()).toBe('unavailable');
    expect(await checkMedusa()).toBe('unavailable');
  });
});

describe('GET /api/ready', () => {
  it('answers 200 when both dependencies are up', async () => {
    getPayload.mockResolvedValue(poolWith(() => Promise.resolve({})));
    fetchMock.mockResolvedValue(new Response('OK', { status: 200 }));

    const response = await ready();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ready', checks: { database: 'ok', medusa: 'ok' } });
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('answers 503 naming the failed check without exposing error details', async () => {
    getPayload.mockResolvedValue(poolWith(() => Promise.resolve({})));
    fetchMock.mockRejectedValue(new TypeError('getaddrinfo ENOTFOUND medusa.internal'));

    const response = await ready();
    const text = await response.text();

    expect(response.status).toBe(503);
    expect(JSON.parse(text)).toEqual({ status: 'unavailable', checks: { database: 'ok', medusa: 'unavailable' } });
    expect(text).not.toMatch(/ENOTFOUND|medusa\.internal/);
  });
});

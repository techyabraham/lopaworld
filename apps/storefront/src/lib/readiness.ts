import 'server-only';
import config from '@payload-config';
import { getPayload } from 'payload';
import { medusaBackendUrl } from './store';
import { logServerError } from './server-log';

export type CheckStatus = 'ok' | 'unavailable';
export type Readiness = { ready: boolean; checks: { database: CheckStatus; medusa: CheckStatus } };

const defaultTimeoutMs = 2000;

function withTimeout<T>(work: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}

type PoolLike = { query: (text: string) => Promise<unknown> };

/** Pings Payload's PostgreSQL pool. The first call also initialises Payload (and its prodMigrations). */
export async function checkDatabase(timeoutMs = defaultTimeoutMs): Promise<CheckStatus> {
  try {
    await withTimeout((async () => {
      const payload = await getPayload({ config });
      const pool = (payload.db as unknown as { pool?: PoolLike }).pool;
      if (!pool) throw new Error('Payload database adapter has no connection pool.');
      await pool.query('select 1');
    })(), timeoutMs, 'Payload database check');
    return 'ok';
  } catch (error) {
    logServerError('readiness database', error);
    return 'unavailable';
  }
}

export async function checkMedusa(timeoutMs = defaultTimeoutMs): Promise<CheckStatus> {
  try {
    const response = await fetch(`${medusaBackendUrl()}/health`, { cache: 'no-store', signal: AbortSignal.timeout(timeoutMs) });
    if (!response.ok) throw new Error(`Medusa /health returned ${response.status}.`);
    return 'ok';
  } catch (error) {
    logServerError('readiness medusa', error);
    return 'unavailable';
  }
}

export async function checkReadiness(timeoutMs = defaultTimeoutMs): Promise<Readiness> {
  const [database, medusa] = await Promise.all([checkDatabase(timeoutMs), checkMedusa(timeoutMs)]);
  return { ready: database === 'ok' && medusa === 'ok', checks: { database, medusa } };
}

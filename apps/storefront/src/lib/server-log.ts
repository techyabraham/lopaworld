import 'server-only';

/**
 * Records an internal failure server-side so the browser only ever receives a generic message.
 * Pass the error, never request bodies, cookies or customer details.
 */
export function logServerError(scope: string, error: unknown) {
  console.error(JSON.stringify({
    level: 'error',
    scope,
    message: error instanceof Error ? error.message : String(error),
    name: error instanceof Error ? error.name : undefined,
  }));
}

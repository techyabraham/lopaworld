// In-memory stand-in for the `cookies()` store from `next/headers`, for route-handler tests.
export function createCookieJar() {
  const values = new Map<string, string>();
  return {
    values,
    store: {
      get: (name: string) => (values.has(name) ? { name, value: values.get(name) as string } : undefined),
      set: (name: string, value: string) => { values.set(name, value); },
      delete: (name: string) => { values.delete(name); },
    },
  };
}

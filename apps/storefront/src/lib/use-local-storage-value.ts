'use client';

import { useCallback, useSyncExternalStore } from 'react';

function read(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    // Storage can be blocked (private mode, site-data settings); treat it as empty.
    return null;
  }
}

/**
 * The raw localStorage value for `key`, kept in sync across tabs (`storage`) and within this tab
 * (`changeEvent`, dispatched by whoever writes the key). `undefined` on the server and during
 * hydration, so callers can render their not-yet-known state without a mismatch.
 */
export function useLocalStorageValue(key: string, changeEvent: string): string | null | undefined {
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener('storage', onChange);
    window.addEventListener(changeEvent, onChange);
    return () => {
      window.removeEventListener('storage', onChange);
      window.removeEventListener(changeEvent, onChange);
    };
  }, [changeEvent]);
  return useSyncExternalStore(subscribe, () => read(key), () => undefined);
}

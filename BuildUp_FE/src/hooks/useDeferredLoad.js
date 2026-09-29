import { useEffect } from 'react';

// Cancel an obsolete effect before starting its network requests. In StrictMode,
// the setup/cleanup probe must not send the same initial request twice.
export function useDeferredLoad(load) {
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void load();
    });
    return () => { active = false; };
  }, [load]);
}

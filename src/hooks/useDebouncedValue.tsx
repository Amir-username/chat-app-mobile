import { useEffect, useState } from "react";

/**
 * Returns a copy of `value` that only updates after it has stopped changing
 * for `delayMs`. Perfect for search inputs — the effect below the hook fires
 * once typing pauses instead of on every keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

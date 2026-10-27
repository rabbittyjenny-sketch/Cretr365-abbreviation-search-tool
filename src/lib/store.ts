import { useCallback, useEffect, useState } from "react";

const PREFIX = "c365-glossary:";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Private mode / blocked storage: the app still works, it just won't remember.
  }
}

/** A small localStorage-backed state hook that never throws. */
export function useStored<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => read(key, fallback));
  useEffect(() => write(key, value), [key, value]);
  return [value, setValue] as const;
}

export function useSaved() {
  const [ids, setIds] = useStored<string[]>("saved", []);
  const toggle = useCallback((id: string) => setIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [id, ...current])), [setIds]);
  return { savedIds: ids, isSaved: (id: string) => ids.includes(id), toggleSaved: toggle, clearSaved: () => setIds([]) };
}

export function useRecent() {
  const [items, setItems] = useStored<string[]>("recent", []);
  const remember = useCallback(
    (query: string) => {
      const clean = query.trim();
      if (clean.length < 2) return;
      setItems((current) => [clean, ...current.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 8));
    },
    [setItems],
  );
  return { recent: items, remember, clearRecent: () => setItems([]) };
}

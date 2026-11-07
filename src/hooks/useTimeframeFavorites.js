import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useAuth } from '@/auth/useAuth';

export const TIMEFRAME_OPTIONS = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN'];
const listeners = new Set();
const memory = new Map();
const notify = () => listeners.forEach(listener => listener());
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
if (typeof window !== 'undefined') {
  window.addEventListener('storage', event => {
    if (event.key === null || event.key.startsWith('nexora_timeframe_favorites:')) {
      if (event.key === null) memory.clear();
      else memory.delete(event.key);
      notify();
    }
  });
}
function read(key) {
  // Memory also keeps the choice usable if browser storage is unavailable.
  if (memory.has(key)) return memory.get(key);
  try { return localStorage.getItem(key); } catch { return null; }
}
function decode(raw) {
  try {
    const values = JSON.parse(raw);
    return Array.isArray(values) ? TIMEFRAME_OPTIONS.filter(value => values.includes(value)) : [];
  } catch { return []; }
}
export function useTimeframeFavorites() {
  const auth = useAuth();
  const key = `nexora_timeframe_favorites:${auth?.user?.id ?? auth?.user?.email ?? 'browser'}`;
  const snapshot = useSyncExternalStore(subscribe, () => read(key), () => null);
  const favorites = useMemo(() => decode(snapshot), [snapshot]);
  const toggleFavorite = useCallback(value => {
    if (!TIMEFRAME_OPTIONS.includes(value)) return;
    const previous = decode(read(key));
    const next = previous.includes(value) ? previous.filter(item => item !== value) : [...previous, value];
    const raw = JSON.stringify(next);
    memory.set(key, raw);
    try { localStorage.setItem(key, raw); } catch { /* In-memory preference remains available. */ }
    notify();
  }, [key]);
  return { favorites, toggleFavorite };
}

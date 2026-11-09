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
function decode(raw, options) {
  try {
    const values = JSON.parse(raw);
    return Array.isArray(values) ? options.filter(value => values.includes(value)) : [];
  } catch { return []; }
}
export function useTimeframeFavorites(field, options = TIMEFRAME_OPTIONS) {
  const auth = useAuth();
  const legacyKey = `nexora_timeframe_favorites:${auth?.user?.id ?? auth?.user?.email ?? 'browser'}`;
  const key = `${legacyKey}:${field}`;
  // Keep existing choices as a starting point; each field writes its own preference.
  const readPreference = () => read(key) ?? read(legacyKey);
  const snapshot = useSyncExternalStore(subscribe, readPreference, () => null);
  const favorites = useMemo(() => decode(snapshot, options), [snapshot, options]);
  const toggleFavorite = useCallback(value => {
    if (!options.includes(value)) return;
    const previous = decode(read(key) ?? read(legacyKey), options);
    const next = previous.includes(value) ? previous.filter(item => item !== value) : [...previous, value];
    const raw = JSON.stringify(next);
    memory.set(key, raw);
    try { localStorage.setItem(key, raw); } catch { /* In-memory preference remains available. */ }
    notify();
  }, [key, legacyKey, options]);
  return { favorites, toggleFavorite };
}

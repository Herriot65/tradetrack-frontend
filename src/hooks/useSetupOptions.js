import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { useAuth } from '@/auth/useAuth';
export const SETUP_OPTIONS = {
  timeframes: { label: 'Timeframes', maxLength: 10, defaults: ['M1','M5','M15','M30','H1','H4','D1','W1','MN'].map(value => ({value,label:value})) },
  trends: { label: 'Trend', maxLength: 20, defaults: [{value:'BULLISH',label:'Bullish'},{value:'BEARISH',label:'Bearish'},{value:'RANGE',label:'Range'}] },
  sessions: { label: 'Session', maxLength: 50, defaults: ['Asian','London','New York','London/NY Overlap','Pre-Market'].map(value => ({value,label:value})) },
};
const memory = new Map(), listeners = new Set();
const notify = () => listeners.forEach(fn => fn());
function read(key) { if (memory.has(key)) return memory.get(key); try { return localStorage.getItem(key); } catch { return null; } }
function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
if (typeof window !== 'undefined') window.addEventListener('storage', event => {
  if (event.key === null || event.key.startsWith('nexora_setup_options:')) {
    if (event.key === null) memory.clear(); else memory.delete(event.key);
    notify();
  }
});
function decode(raw, kind) {
  const config = SETUP_OPTIONS[kind];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return config.defaults;
    const seen = new Set();
    return parsed.slice(0,100).filter(item => {
      if (typeof item?.value !== 'string' || typeof item.label !== 'string' || !item.value.trim() || !item.label.trim() || item.value.length > config.maxLength || item.label.length > config.maxLength || item.value === '__not_set__' || seen.has(item.value.toLowerCase())) return false;
      seen.add(item.value.toLowerCase()); return true;
    });
  } catch { return config.defaults; }
}
export function useSetupOptions(kind) {
  const auth = useAuth();
  const key = `nexora_setup_options:${auth?.user?.id ?? auth?.user?.email ?? 'browser'}:${kind}`;
  const raw = useSyncExternalStore(subscribe, () => read(key), () => null);
  const options = useMemo(() => decode(raw, kind), [raw,kind]);
  const change = useCallback(transform => {
    const next = JSON.stringify(transform(decode(read(key), kind)));
    memory.set(key,next); try { localStorage.setItem(key,next); } catch { /* Keep usable without storage. */ }
    notify();
  },[key,kind]);
  return { options, add: value => change(current => [...current,value]), remove: value => change(current => current.filter(item => item.value !== value)), reset: () => change(() => SETUP_OPTIONS[kind].defaults) };
}

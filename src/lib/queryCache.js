// Session-local, bounded cache. Pending reads are shared across analytics tabs.
const entries = new Map();
const TTL = 30_000;
export function clearQueryCache() {
  entries.clear();
}
export function cachedQuery(key, fetcher, now = Date.now()) {
  const existing = entries.get(key);
  if (existing && (existing.pending || now < existing.expires)) return existing.promise;
  const entry = { pending: true, expires: 0 };
  entry.promise = Promise.resolve().then(fetcher).then(result => {
    entry.pending = false;
    entry.expires = Date.now() + TTL;
    return result;
  }, error => {
    if (entries.get(key) === entry) entries.delete(key);
    throw error;
  });
  entries.set(key, entry);
  if (entries.size > 30) entries.delete(entries.keys().next().value);
  return entry.promise;
}

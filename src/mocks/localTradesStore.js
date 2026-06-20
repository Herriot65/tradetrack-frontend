const storeKey = (wid) => `local_trades_${wid}`;

function load(wid) {
  try {
    const raw = localStorage.getItem(storeKey(wid));
    return raw ? JSON.parse(raw) : { created: [], updated: {}, deleted: [] };
  } catch {
    return { created: [], updated: {}, deleted: [] };
  }
}

function save(wid, store) {
  try { localStorage.setItem(storeKey(wid), JSON.stringify(store)); } catch {}
}

// Merge local CRUD changes on top of base mock trade array.
export function applyLocalStore(baseTrades, wid) {
  const store = load(wid);
  const deletedSet = new Set(store.deleted.map(Number));
  const merged = baseTrades
    .filter((t) => !deletedSet.has(t.id))
    .map((t) => {
      const patch = store.updated[t.id];
      return patch ? { ...t, ...patch } : t;
    });
  // Locally-created trades come first (most recent)
  return [...store.created, ...merged];
}

export function createLocalTrade(wid, data) {
  const store = load(wid);
  const now = new Date().toISOString();
  const id = Date.now();
  const trade = { ...data, id, created_at: now, updated_at: now };
  store.created = [trade, ...store.created];
  save(wid, store);
  return trade;
}

export function updateLocalTrade(wid, id, patch) {
  const store = load(wid);
  const now = new Date().toISOString();
  const ci = store.created.findIndex((t) => t.id === id);
  if (ci >= 0) {
    store.created[ci] = { ...store.created[ci], ...patch, updated_at: now };
  } else {
    store.updated[id] = { ...(store.updated[id] ?? {}), ...patch, updated_at: now };
  }
  save(wid, store);
}

export function deleteLocalTrade(wid, id) {
  const store = load(wid);
  if (store.created.some((t) => t.id === id)) {
    store.created = store.created.filter((t) => t.id !== id);
  } else {
    store.deleted = [...store.deleted, id];
    delete store.updated[id];
  }
  save(wid, store);
}

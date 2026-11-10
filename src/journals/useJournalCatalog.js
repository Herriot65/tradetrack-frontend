import { useState, useCallback, useMemo, useEffect } from "react";

import { USE_MOCK } from "@/mocks/mockData";
import {
  fetchCatalog,
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
} from "@/api/journals.api";

// ── Default labels / symbols ──────────────────────────────────────────────────

const DEFAULT_ASSETS = [
  "EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "USDCHF", "NZDUSD",
  "XAUUSD", "XAGUSD", "NAS100", "US30", "US500", "GER40", "UK100",
];
const DEFAULT_EMOTION_TAGS = [
  "Calm", "Confident", "Anxious", "Fearful", "FOMO", "Disciplined",
  "Impatient", "Excited", "Frustrated", "Neutral",
];
const DEFAULT_MISTAKE_TAGS = [
  "Chased entry", "Moved SL", "FOMO trade", "Overtraded",
  "Ignored plan", "Poor risk sizing", "Exited too early",
];
const DEFAULT_SETUPS = [
  "Break of Structure", "Order Block", "Fair Value Gap",
  "Liquidity Grab", "Supply & Demand Zone", "Trendline Bounce",
  "Support / Resistance", "Breaker Block",
];

// Default objects with stable IDs (index + 1).
// IMPORTANT: must stay in sync with MOCK_*_CATALOG arrays in mockData.js.
export const DEFAULT_ASSET_OBJECTS   = DEFAULT_ASSETS.map((symbol, i) => ({ id: i + 1, symbol }));
export const DEFAULT_EMOTION_OBJECTS = DEFAULT_EMOTION_TAGS.map((label, i) => ({ id: i + 1, label }));
export const DEFAULT_MISTAKE_OBJECTS = DEFAULT_MISTAKE_TAGS.map((label, i) => ({ id: i + 1, label }));
export const DEFAULT_SETUP_OBJECTS   = DEFAULT_SETUPS.map((label, i) => ({ id: i + 1, label }));

// ── localStorage helpers (mock mode only) ─────────────────────────────────────

const assetsKey  = (id) => `journal_assets_${id}`;
const emotionKey = (id) => `journal_emotion_tags_${id}`;
const mistakeKey = (id) => `journal_mistake_tags_${id}`;
const setupKey   = (id) => `journal_setups_${id}`;

// Reads {id, label} objects, migrating old plain-string arrays on first read.
function readObjectList(key, defaults) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaults;
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return defaults;
    return data.map((item, i) =>
      typeof item === "string" ? { id: i + 1, label: item } : item
    );
  } catch { return defaults; }
}

// Same but assets use `symbol` instead of `label`.
function readAssetList(key, defaults) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaults;
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return defaults;
    return data.map((item, i) =>
      typeof item === "string" ? { id: i + 1, symbol: item } : item
    );
  } catch { return defaults; }
}

function writeList(key, list) {
  try { localStorage.setItem(key, JSON.stringify(list)); } catch { /* ignore quota errors */ }
}

// Normalize paginated or plain array responses from the API.
function toArray(data) {
  return Array.isArray(data) ? data : (data?.results ?? []);
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useJournalCatalog(journalId) {
  const [assetObjects,   setAssetObjects]   = useState(() =>
    USE_MOCK ? readAssetList(assetsKey(journalId),   DEFAULT_ASSET_OBJECTS)   : []
  );
  const [emotionObjects, setEmotionObjects] = useState(() =>
    USE_MOCK ? readObjectList(emotionKey(journalId), DEFAULT_EMOTION_OBJECTS) : []
  );
  const [mistakeObjects, setMistakeObjects] = useState(() =>
    USE_MOCK ? readObjectList(mistakeKey(journalId), DEFAULT_MISTAKE_OBJECTS) : []
  );
  const [setupObjects,   setSetupObjects]   = useState(() =>
    USE_MOCK ? readObjectList(setupKey(journalId),   DEFAULT_SETUP_OBJECTS)   : []
  );

  // loading is only meaningful in real-API mode; starts true if journalId is already known
  const [loading, setLoading] = useState(!USE_MOCK && !!journalId);

  // ── Real API: fetch all catalogs when journalId changes ───────────────────────
  useEffect(() => {
    if (USE_MOCK || !journalId) return;
    let cancelled = false;
    setLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
    Promise.all([
      fetchCatalog(journalId, "assets"),
      fetchCatalog(journalId, "emotion-tags"),
      fetchCatalog(journalId, "mistake-tags"),
      fetchCatalog(journalId, "setup-tags"),
    ])
      .then(([assets, emotions, mistakes, setups]) => {
        if (cancelled) return;
        setAssetObjects(toArray(assets));
        setEmotionObjects(toArray(emotions));
        setMistakeObjects(toArray(mistakes));
        setSetupObjects(toArray(setups));
      })
      .catch(() => { /* catalogs remain empty on error */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [journalId]);

  // ── String arrays for pickers (unchanged external interface) ─────────────────
  const assets      = useMemo(() => assetObjects.map((a) => a.symbol),  [assetObjects]);
  const emotionTags = useMemo(() => emotionObjects.map((e) => e.label), [emotionObjects]);
  const mistakeTags = useMemo(() => mistakeObjects.map((m) => m.label), [mistakeObjects]);
  const setups      = useMemo(() => setupObjects.map((s) => s.label),   [setupObjects]);

  // ── ID maps (display-string → backend id) for submit transformation ──────────
  const assetMap   = useMemo(() => new Map(assetObjects.map((a) => [a.symbol, a.id])),  [assetObjects]);
  const emotionMap = useMemo(() => new Map(emotionObjects.map((e) => [e.label, e.id])), [emotionObjects]);
  const mistakeMap = useMemo(() => new Map(mistakeObjects.map((m) => [m.label, m.id])), [mistakeObjects]);
  const setupMap   = useMemo(() => new Map(setupObjects.map((s) => [s.label, s.id])),   [setupObjects]);

  // Trade form can be submitted once at least 1 asset and 1 emotion tag exist.
  const catalogReady = !loading && assetObjects.length > 0 && emotionObjects.length > 0;

  // ── Asset CRUD ────────────────────────────────────────────────────────────────

  const addAsset = useCallback(async (symbol) => {
    const n = symbol.trim().toUpperCase();
    if (!n) return;
    if (USE_MOCK) {
      setAssetObjects((prev) => {
        if (prev.some((a) => a.symbol === n)) return prev;
        const next = [...prev, { id: Date.now(), symbol: n }].sort((a, b) => a.symbol.localeCompare(b.symbol));
        writeList(assetsKey(journalId), next);
        return next;
      });
    } else {
      const item = await createCatalogItem(journalId, "assets", { symbol: n });
      setAssetObjects((prev) => {
        if (prev.some((a) => a.id === item.id)) return prev;
        return [...prev, item].sort((a, b) => a.symbol.localeCompare(b.symbol));
      });
    }
  }, [journalId]);

  const removeAsset = useCallback(async (value) => {
    const item = assetObjects.find(item => item.symbol === value);
    if (!item) return;
    if (!USE_MOCK) await deleteCatalogItem(journalId, "assets", item.id);
    setAssetObjects(prev => {
      const next = prev.filter(entry => entry.id !== item.id);
      if (USE_MOCK) writeList(assetsKey(journalId), next);
      return next;
    });
  }, [journalId, assetObjects]);

  const updateAsset = useCallback(async (oldValue, newValue) => {
    const n = newValue.trim().toUpperCase();
    const item = assetObjects.find(item => item.symbol === oldValue);
    if (!n || !item || n === oldValue) return;
    if (assetObjects.some(entry => entry.id !== item.id && entry.symbol.toLowerCase() === n.toLowerCase())) throw new Error("This option already exists.");
    const updated = USE_MOCK ? {...item, symbol: n} : await updateCatalogItem(journalId, "assets", item.id, {symbol:n});
    setAssetObjects(prev => {
      const next = prev.map(entry => entry.id === item.id ? updated : entry).sort((a,b) => a.symbol.localeCompare(b.symbol));
      if (USE_MOCK) writeList(assetsKey(journalId), next);
      return next;
    });
  }, [journalId, assetObjects]);

  // ── Emotion tag CRUD ──────────────────────────────────────────────────────────

  const addEmotionTag = useCallback(async (label) => {
    const n = label.trim();
    if (!n) return;
    if (USE_MOCK) {
      setEmotionObjects((prev) => {
        if (prev.some((t) => t.label === n)) return prev;
        const next = [...prev, { id: Date.now(), label: n }].sort((a, b) => a.label.localeCompare(b.label));
        writeList(emotionKey(journalId), next);
        return next;
      });
    } else {
      const item = await createCatalogItem(journalId, "emotion-tags", { label: n });
      setEmotionObjects((prev) => {
        if (prev.some((t) => t.id === item.id)) return prev;
        return [...prev, item].sort((a, b) => a.label.localeCompare(b.label));
      });
    }
  }, [journalId]);

  const removeEmotionTag = useCallback(async (value) => {
    const item = emotionObjects.find(item => item.label === value);
    if (!item) return;
    if (!USE_MOCK) await deleteCatalogItem(journalId, "emotion-tags", item.id);
    setEmotionObjects(prev => {
      const next = prev.filter(entry => entry.id !== item.id);
      if (USE_MOCK) writeList(emotionKey(journalId), next);
      return next;
    });
  }, [journalId, emotionObjects]);

  const updateEmotionTag = useCallback(async (oldValue, newValue) => {
    const n = newValue.trim();
    const item = emotionObjects.find(item => item.label === oldValue);
    if (!n || !item || n === oldValue) return;
    if (emotionObjects.some(entry => entry.id !== item.id && entry.label.toLowerCase() === n.toLowerCase())) throw new Error("This option already exists.");
    const updated = USE_MOCK ? {...item, label: n} : await updateCatalogItem(journalId, "emotion-tags", item.id, {label:n});
    setEmotionObjects(prev => {
      const next = prev.map(entry => entry.id === item.id ? updated : entry).sort((a,b) => a.label.localeCompare(b.label));
      if (USE_MOCK) writeList(emotionKey(journalId), next);
      return next;
    });
  }, [journalId, emotionObjects]);

  // ── Mistake tag CRUD ──────────────────────────────────────────────────────────

  const addMistakeTag = useCallback(async (label) => {
    const n = label.trim();
    if (!n) return;
    if (USE_MOCK) {
      setMistakeObjects((prev) => {
        if (prev.some((t) => t.label === n)) return prev;
        const next = [...prev, { id: Date.now(), label: n }].sort((a, b) => a.label.localeCompare(b.label));
        writeList(mistakeKey(journalId), next);
        return next;
      });
    } else {
      const item = await createCatalogItem(journalId, "mistake-tags", { label: n });
      setMistakeObjects((prev) => {
        if (prev.some((t) => t.id === item.id)) return prev;
        return [...prev, item].sort((a, b) => a.label.localeCompare(b.label));
      });
    }
  }, [journalId]);

  const removeMistakeTag = useCallback(async (value) => {
    const item = mistakeObjects.find(item => item.label === value);
    if (!item) return;
    if (!USE_MOCK) await deleteCatalogItem(journalId, "mistake-tags", item.id);
    setMistakeObjects(prev => {
      const next = prev.filter(entry => entry.id !== item.id);
      if (USE_MOCK) writeList(mistakeKey(journalId), next);
      return next;
    });
  }, [journalId, mistakeObjects]);

  const updateMistakeTag = useCallback(async (oldValue, newValue) => {
    const n = newValue.trim();
    const item = mistakeObjects.find(item => item.label === oldValue);
    if (!n || !item || n === oldValue) return;
    if (mistakeObjects.some(entry => entry.id !== item.id && entry.label.toLowerCase() === n.toLowerCase())) throw new Error("This option already exists.");
    const updated = USE_MOCK ? {...item, label: n} : await updateCatalogItem(journalId, "mistake-tags", item.id, {label:n});
    setMistakeObjects(prev => {
      const next = prev.map(entry => entry.id === item.id ? updated : entry).sort((a,b) => a.label.localeCompare(b.label));
      if (USE_MOCK) writeList(mistakeKey(journalId), next);
      return next;
    });
  }, [journalId, mistakeObjects]);

  // ── Setup tag CRUD ────────────────────────────────────────────────────────────

  const addSetup = useCallback(async (label) => {
    const n = label.trim();
    if (!n) return;
    if (USE_MOCK) {
      setSetupObjects((prev) => {
        if (prev.some((t) => t.label === n)) return prev;
        const next = [...prev, { id: Date.now(), label: n }].sort((a, b) => a.label.localeCompare(b.label));
        writeList(setupKey(journalId), next);
        return next;
      });
    } else {
      const item = await createCatalogItem(journalId, "setup-tags", { label: n });
      setSetupObjects((prev) => {
        if (prev.some((t) => t.id === item.id)) return prev;
        return [...prev, item].sort((a, b) => a.label.localeCompare(b.label));
      });
    }
  }, [journalId]);

  const removeSetup = useCallback(async (value) => {
    const item = setupObjects.find(item => item.label === value);
    if (!item) return;
    if (!USE_MOCK) await deleteCatalogItem(journalId, "setup-tags", item.id);
    setSetupObjects(prev => {
      const next = prev.filter(entry => entry.id !== item.id);
      if (USE_MOCK) writeList(setupKey(journalId), next);
      return next;
    });
  }, [journalId, setupObjects]);

  const updateSetup = useCallback(async (oldValue, newValue) => {
    const n = newValue.trim();
    const item = setupObjects.find(item => item.label === oldValue);
    if (!n || !item || n === oldValue) return;
    if (setupObjects.some(entry => entry.id !== item.id && entry.label.toLowerCase() === n.toLowerCase())) throw new Error("This option already exists.");
    const updated = USE_MOCK ? {...item, label: n} : await updateCatalogItem(journalId, "setup-tags", item.id, {label:n});
    setSetupObjects(prev => {
      const next = prev.map(entry => entry.id === item.id ? updated : entry).sort((a,b) => a.label.localeCompare(b.label));
      if (USE_MOCK) writeList(setupKey(journalId), next);
      return next;
    });
  }, [journalId, setupObjects]);

  // ── Public API ────────────────────────────────────────────────────────────────

  return {
    // String arrays for pickers — unchanged external interface
    assets, emotionTags, mistakeTags, setups,
    // Object arrays (for tradeToDefaults label resolution and catalog management UI)
    assetObjects,
    emotionTagObjects: emotionObjects,
    mistakeTagObjects: mistakeObjects,
    setupObjects,
    // ID maps (string → number) for converting form values to API payload
    assetMap, emotionMap, mistakeMap, setupMap,
    // Loading state (always false in mock mode; true while API fetch is in-flight)
    loading,
    // Both required catalogs have at least one item — use to gate the trade form
    catalogReady,
    // CRUD — accept/return strings (same external interface as before)
    addAsset, removeAsset, updateAsset,
    addEmotionTag, removeEmotionTag, updateEmotionTag,
    addMistakeTag, removeMistakeTag, updateMistakeTag,
    addSetup, removeSetup, updateSetup,
  };
}

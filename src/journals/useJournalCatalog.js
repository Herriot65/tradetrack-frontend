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

  const removeAsset = useCallback((symbol) => {
    if (USE_MOCK) {
      setAssetObjects((prev) => {
        const next = prev.filter((a) => a.symbol !== symbol);
        writeList(assetsKey(journalId), next);
        return next;
      });
    } else {
      setAssetObjects((prev) => {
        const item = prev.find((a) => a.symbol === symbol);
        if (!item) return prev;
        deleteCatalogItem(journalId, "assets", item.id).catch(console.error);
        return prev.filter((a) => a.id !== item.id);
      });
    }
  }, [journalId]);

  const updateAsset = useCallback((oldSymbol, newSymbol) => {
    const n = newSymbol.trim().toUpperCase();
    if (!n || n === oldSymbol) return;
    if (USE_MOCK) {
      setAssetObjects((prev) => {
        if (prev.some((a) => a.symbol === n)) return prev;
        const next = prev
          .map((a) => (a.symbol === oldSymbol ? { ...a, symbol: n } : a))
          .sort((a, b) => a.symbol.localeCompare(b.symbol));
        writeList(assetsKey(journalId), next);
        return next;
      });
    } else {
      setAssetObjects((prev) => {
        const item = prev.find((a) => a.symbol === oldSymbol);
        if (!item || prev.some((a) => a.symbol === n && a.id !== item.id)) return prev;
        updateCatalogItem(journalId, "assets", item.id, { symbol: n }).catch(console.error);
        return prev
          .map((a) => (a.id === item.id ? { ...a, symbol: n } : a))
          .sort((a, b) => a.symbol.localeCompare(b.symbol));
      });
    }
  }, [journalId]);

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

  const removeEmotionTag = useCallback((label) => {
    if (USE_MOCK) {
      setEmotionObjects((prev) => {
        const next = prev.filter((t) => t.label !== label);
        writeList(emotionKey(journalId), next);
        return next;
      });
    } else {
      setEmotionObjects((prev) => {
        const item = prev.find((t) => t.label === label);
        if (!item) return prev;
        deleteCatalogItem(journalId, "emotion-tags", item.id).catch(console.error);
        return prev.filter((t) => t.id !== item.id);
      });
    }
  }, [journalId]);

  const updateEmotionTag = useCallback((oldLabel, newLabel) => {
    const n = newLabel.trim();
    if (!n || n === oldLabel) return;
    if (USE_MOCK) {
      setEmotionObjects((prev) => {
        if (prev.some((t) => t.label === n)) return prev;
        const next = prev
          .map((t) => (t.label === oldLabel ? { ...t, label: n } : t))
          .sort((a, b) => a.label.localeCompare(b.label));
        writeList(emotionKey(journalId), next);
        return next;
      });
    } else {
      setEmotionObjects((prev) => {
        const item = prev.find((t) => t.label === oldLabel);
        if (!item || prev.some((t) => t.label === n && t.id !== item.id)) return prev;
        updateCatalogItem(journalId, "emotion-tags", item.id, { label: n }).catch(console.error);
        return prev
          .map((t) => (t.id === item.id ? { ...t, label: n } : t))
          .sort((a, b) => a.label.localeCompare(b.label));
      });
    }
  }, [journalId]);

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

  const removeMistakeTag = useCallback((label) => {
    if (USE_MOCK) {
      setMistakeObjects((prev) => {
        const next = prev.filter((t) => t.label !== label);
        writeList(mistakeKey(journalId), next);
        return next;
      });
    } else {
      setMistakeObjects((prev) => {
        const item = prev.find((t) => t.label === label);
        if (!item) return prev;
        deleteCatalogItem(journalId, "mistake-tags", item.id).catch(console.error);
        return prev.filter((t) => t.id !== item.id);
      });
    }
  }, [journalId]);

  const updateMistakeTag = useCallback((oldLabel, newLabel) => {
    const n = newLabel.trim();
    if (!n || n === oldLabel) return;
    if (USE_MOCK) {
      setMistakeObjects((prev) => {
        if (prev.some((t) => t.label === n)) return prev;
        const next = prev
          .map((t) => (t.label === oldLabel ? { ...t, label: n } : t))
          .sort((a, b) => a.label.localeCompare(b.label));
        writeList(mistakeKey(journalId), next);
        return next;
      });
    } else {
      setMistakeObjects((prev) => {
        const item = prev.find((t) => t.label === oldLabel);
        if (!item || prev.some((t) => t.label === n && t.id !== item.id)) return prev;
        updateCatalogItem(journalId, "mistake-tags", item.id, { label: n }).catch(console.error);
        return prev
          .map((t) => (t.id === item.id ? { ...t, label: n } : t))
          .sort((a, b) => a.label.localeCompare(b.label));
      });
    }
  }, [journalId]);

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

  const removeSetup = useCallback((label) => {
    if (USE_MOCK) {
      setSetupObjects((prev) => {
        const next = prev.filter((t) => t.label !== label);
        writeList(setupKey(journalId), next);
        return next;
      });
    } else {
      setSetupObjects((prev) => {
        const item = prev.find((t) => t.label === label);
        if (!item) return prev;
        deleteCatalogItem(journalId, "setup-tags", item.id).catch(console.error);
        return prev.filter((t) => t.id !== item.id);
      });
    }
  }, [journalId]);

  const updateSetup = useCallback((oldLabel, newLabel) => {
    const n = newLabel.trim();
    if (!n || n === oldLabel) return;
    if (USE_MOCK) {
      setSetupObjects((prev) => {
        if (prev.some((t) => t.label === n)) return prev;
        const next = prev
          .map((t) => (t.label === oldLabel ? { ...t, label: n } : t))
          .sort((a, b) => a.label.localeCompare(b.label));
        writeList(setupKey(journalId), next);
        return next;
      });
    } else {
      setSetupObjects((prev) => {
        const item = prev.find((t) => t.label === oldLabel);
        if (!item || prev.some((t) => t.label === n && t.id !== item.id)) return prev;
        updateCatalogItem(journalId, "setup-tags", item.id, { label: n }).catch(console.error);
        return prev
          .map((t) => (t.id === item.id ? { ...t, label: n } : t))
          .sort((a, b) => a.label.localeCompare(b.label));
      });
    }
  }, [journalId]);

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

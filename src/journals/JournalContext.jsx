import { createContext, useCallback, useEffect, useState } from "react";

import {
  createWorkspace as apiCreate,
  deleteWorkspace as apiDelete,
  fetchWorkspaces,
  updateWorkspace as apiUpdate,
} from "@/api/journals.api";
import { useAuth } from "@/auth/useAuth";

const STORAGE_LAST_KEY = "last_journal_id";
const metaKey = (id) => `journal_meta_${id}`;

function loadMeta(id) {
  try {
    const raw = localStorage.getItem(metaKey(id));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveMeta(id, meta) {
  try {
    localStorage.setItem(metaKey(id), JSON.stringify(meta));
  } catch {}
}

function enrichJournal(workspace) {
  return { ...workspace, ...loadMeta(workspace.id) };
}

export const JournalContext = createContext(null);

export function JournalProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [journals, setJournals] = useState([]);
  const [activeJournal, setActiveJournal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsVersion, setAnalyticsVersion] = useState(0);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setJournals([]);
      setActiveJournal(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await fetchWorkspaces();
      const enriched = list.map(enrichJournal);

      // One-time migration: push any localStorage startingCapital to the backend
      // for journals where the backend still has starting_capital = 0.
      await Promise.all(
        enriched.map(async (j) => {
          const backendCapital = parseFloat(j.starting_capital ?? 0);
          const localCapital   = parseFloat(j.startingCapital  ?? 0);
          if (backendCapital === 0 && localCapital > 0) {
            await apiUpdate(j.id, { starting_capital: localCapital }).catch(() => {});
          }
        })
      );

      setJournals(enriched);

      const lastId = localStorage.getItem(STORAGE_LAST_KEY);
      const last = enriched.find((j) => String(j.id) === lastId);
      const toSelect = last ?? enriched[0] ?? null;
      setActiveJournal(toSelect);
      if (toSelect) localStorage.setItem(STORAGE_LAST_KEY, String(toSelect.id));
    } catch (err) {
      setError(err?.response?.data?.detail ?? err.message ?? "Failed to load journals");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    load();
  }, [load]);

  const selectJournal = useCallback((journal) => {
    setActiveJournal(journal);
    localStorage.setItem(STORAGE_LAST_KEY, String(journal.id));
  }, []);

  const createJournal = useCallback(
    async (payload) => {
      const { name, journalType, startingCapital, currency, breakEvenMethod, breakEvenValue } = payload;
      const created = await apiCreate({ name, starting_capital: startingCapital ?? 0 });
      const meta = { journalType, startingCapital, currency, breakEvenMethod, breakEvenValue };
      saveMeta(created.id, meta);
      const enriched = { ...created, ...meta };
      setJournals((prev) => [...prev, enriched]);
      selectJournal(enriched);
      return enriched;
    },
    [selectJournal]
  );

  const renameJournal = useCallback(
    async (id, name) => {
      const updated = await apiUpdate(id, { name });
      const meta = loadMeta(id);
      const enriched = { ...updated, ...meta };
      setJournals((prev) => prev.map((j) => (j.id === id ? enriched : j)));
      if (activeJournal?.id === id) setActiveJournal(enriched);
      return enriched;
    },
    [activeJournal?.id]
  );

  const updateJournal = useCallback(
    async (id, payload) => {
      const { name, startingCapital, journalType, currency, breakEvenMethod, breakEvenValue } = payload;
      const backendPayload = {};
      if (name             != null) backendPayload.name             = name;
      if (startingCapital  != null) backendPayload.starting_capital = startingCapital;
      const updated = Object.keys(backendPayload).length > 0
        ? await apiUpdate(id, backendPayload)
        : (journals.find((j) => j.id === id) ?? {});
      const prevMeta = loadMeta(id);
      const newMeta = {
        ...prevMeta,
        ...(journalType     != null && { journalType     }),
        ...(currency        != null && { currency        }),
        ...(breakEvenMethod != null && { breakEvenMethod }),
        ...(breakEvenValue  != null && { breakEvenValue  }),
        ...(startingCapital != null && { startingCapital }),
      };
      saveMeta(id, newMeta);
      const enriched = { ...updated, ...newMeta };
      setJournals((prev) => prev.map((j) => (j.id === id ? enriched : j)));
      if (activeJournal?.id === id) setActiveJournal(enriched);
      setAnalyticsVersion((v) => v + 1);
      return enriched;
    },
    [activeJournal?.id, journals]
  );

  const deleteJournal = useCallback(
    async (id) => {
      await apiDelete(id);
      try { localStorage.removeItem(metaKey(id)); } catch {}
      const remaining = journals.filter((j) => j.id !== id);
      setJournals(remaining);
      if (activeJournal?.id === id) {
        const next = remaining[0] ?? null;
        setActiveJournal(next);
        if (next) localStorage.setItem(STORAGE_LAST_KEY, String(next.id));
        else localStorage.removeItem(STORAGE_LAST_KEY);
      }
    },
    [activeJournal?.id, journals]
  );

  const value = {
    // Primary journal API
    journals,
    activeJournal,
    selectJournal,
    createJournal,
    renameJournal,
    updateJournal,
    deleteJournal,
    refetchJournals: load,
    loading,
    error,
    analyticsVersion,
    // Backward-compat aliases so existing hooks (useTrades, useHubAnalytics, etc.)
    // continue to work without modification
    workspaces: journals,
    activeWorkspace: activeJournal,
    selectWorkspace: selectJournal,
    createWorkspace: createJournal,
    renameWorkspace: renameJournal,
    deleteWorkspace: deleteJournal,
    refetchWorkspaces: load,
  };

  return (
    <JournalContext.Provider value={value}>
      {children}
    </JournalContext.Provider>
  );
}

import { createContext, useCallback, useEffect, useState } from "react";

import {
  createWorkspace as apiCreate,
  deleteWorkspace as apiDelete,
  fetchWorkspaces,
  updateWorkspace as apiUpdate,
} from "@/api/workspaces.api";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      const { name, journalType, startingCapital, currency, breakEvenMethod } = payload;
      const created = await apiCreate({ name });
      const meta = { journalType, startingCapital, currency, breakEvenMethod };
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
    deleteJournal,
    refetchJournals: load,
    loading,
    error,
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

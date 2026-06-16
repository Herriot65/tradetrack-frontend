import { createContext, useCallback, useEffect, useState } from "react";

import {
  createWorkspace as apiCreate,
  deleteWorkspace as apiDelete,
  fetchWorkspaces,
  updateWorkspace as apiUpdate,
} from "@/api/workspaces.api";
import { useAuth } from "@/auth/useAuth";

const STORAGE_KEY = "last_workspace_id";

export const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setWorkspaces([]);
      setActiveWorkspace(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const list = await fetchWorkspaces();
      setWorkspaces(list);

      const lastId = localStorage.getItem(STORAGE_KEY);
      const last = list.find((w) => String(w.id) === lastId);
      const toSelect = last ?? list[0] ?? null;

      setActiveWorkspace(toSelect);
      if (toSelect) localStorage.setItem(STORAGE_KEY, String(toSelect.id));
    } catch (err) {
      setError(
        err?.response?.data?.detail ?? err.message ?? "Failed to load workspaces"
      );
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    load();
  }, [load]);

  const selectWorkspace = useCallback((workspace) => {
    setActiveWorkspace(workspace);
    localStorage.setItem(STORAGE_KEY, String(workspace.id));
  }, []);

  const createWorkspace = useCallback(
    async (payload) => {
      const created = await apiCreate(payload);
      setWorkspaces((prev) => [...prev, created]);
      selectWorkspace(created);
      return created;
    },
    [selectWorkspace]
  );

  const renameWorkspace = useCallback(
    async (id, name) => {
      const updated = await apiUpdate(id, { name });
      setWorkspaces((prev) => prev.map((w) => (w.id === id ? updated : w)));
      if (activeWorkspace?.id === id) setActiveWorkspace(updated);
      return updated;
    },
    [activeWorkspace?.id]
  );

  const deleteWorkspace = useCallback(
    async (id) => {
      await apiDelete(id);
      const remaining = workspaces.filter((w) => w.id !== id);
      setWorkspaces(remaining);

      if (activeWorkspace?.id === id) {
        const next = remaining[0] ?? null;
        setActiveWorkspace(next);
        if (next) localStorage.setItem(STORAGE_KEY, String(next.id));
        else localStorage.removeItem(STORAGE_KEY);
      }
    },
    [activeWorkspace?.id, workspaces]
  );

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        loading,
        error,
        selectWorkspace,
        createWorkspace,
        renameWorkspace,
        deleteWorkspace,
        refetchWorkspaces: load,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

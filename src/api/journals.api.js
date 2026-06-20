import api from "./axios";

// ── Journal CRUD ──────────────────────────────────────────────────────────────

export const fetchJournals = async () => {
  const { data } = await api.get("/journals/");
  return Array.isArray(data) ? data : (data.results ?? []);
};

export const createJournal = async (payload) => {
  const { data } = await api.post("/journals/", payload);
  return data;
};

export const updateJournal = async (id, payload) => {
  const { data } = await api.patch(`/journals/${id}/`, payload);
  return data;
};

export const deleteJournal = async (id) => {
  await api.delete(`/journals/${id}/`);
};

// Backward-compat aliases so JournalContext (and any legacy imports) continue to work
export const fetchWorkspaces = fetchJournals;
export const createWorkspace = createJournal;
export const updateWorkspace = updateJournal;
export const deleteWorkspace = deleteJournal;

// ── Catalog CRUD ──────────────────────────────────────────────────────────────
// Called by useJournalCatalog when USE_MOCK is false.
// catalogType: "assets" | "emotion-tags" | "mistake-tags" | "setup-tags"

export const fetchCatalog = async (journalId, catalogType) => {
  const { data } = await api.get(`/journals/${journalId}/${catalogType}/`);
  return data;
};

export const createCatalogItem = async (journalId, catalogType, payload) => {
  const { data } = await api.post(`/journals/${journalId}/${catalogType}/`, payload);
  return data;
};

export const updateCatalogItem = async (journalId, catalogType, itemId, payload) => {
  const { data } = await api.patch(`/journals/${journalId}/${catalogType}/${itemId}/`, payload);
  return data;
};

export const deleteCatalogItem = async (journalId, catalogType, itemId) => {
  await api.delete(`/journals/${journalId}/${catalogType}/${itemId}/`);
};

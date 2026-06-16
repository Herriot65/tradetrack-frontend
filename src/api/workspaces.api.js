import api from "./axios";

export const fetchWorkspaces = async () => {
  const { data } = await api.get("/workspaces/");
  // DRF returns paginated { count, results } or a plain array
  return Array.isArray(data) ? data : (data.results ?? []);
};

export const createWorkspace = async (payload) => {
  const { data } = await api.post("/workspaces/", payload);
  return data;
};

export const updateWorkspace = async (id, payload) => {
  const { data } = await api.patch(`/workspaces/${id}/`, payload);
  return data;
};

export const deleteWorkspace = async (id) => {
  await api.delete(`/workspaces/${id}/`);
};

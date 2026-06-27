import api from "./axios";
import {
  USE_MOCK,
  mockFetchTrades,
  mockFetchTrade,
  mockCreateTrade,
  mockUpdateTrade,
  mockDeleteTrade,
} from "@/mocks/mockData";

export const fetchTrades = async (workspaceId, params = {}) => {
  if (USE_MOCK) return mockFetchTrades(workspaceId, params);
  const { data } = await api.get(`/journals/${workspaceId}/trades/`, { params });
  return data;
};

export const fetchTrade = async (workspaceId, id) => {
  if (USE_MOCK) return mockFetchTrade(workspaceId, id);
  const { data } = await api.get(`/journals/${workspaceId}/trades/${id}/`);
  return data;
};

export const createTrade = async (workspaceId, payload) => {
  if (USE_MOCK) return mockCreateTrade(workspaceId, payload);
  const { data } = await api.post(`/journals/${workspaceId}/trades/`, payload);
  return data;
};

export const updateTrade = async (workspaceId, id, payload) => {
  if (USE_MOCK) return mockUpdateTrade(workspaceId, id, payload);
  const { data } = await api.patch(`/journals/${workspaceId}/trades/${id}/`, payload);
  return data;
};

export const deleteTrade = async (workspaceId, id) => {
  if (USE_MOCK) return mockDeleteTrade(workspaceId, id);
  await api.delete(`/journals/${workspaceId}/trades/${id}/`);
};

export const uploadScreenshot = async (journalId, tradeId, file, section = null) => {
  const formData = new FormData();
  formData.append("file", file);
  if (section) formData.append("section", section);
  const { data } = await api.post(
    `/journals/${journalId}/trades/${tradeId}/screenshots/`,
    formData,
  );
  return data;
};

export const deleteScreenshot = async (journalId, tradeId, screenshotId) => {
  await api.delete(`/journals/${journalId}/trades/${tradeId}/screenshots/${screenshotId}/`);
};

import { clearQueryCache } from "../lib/queryCache.js";
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
  if (USE_MOCK) { const result = await mockCreateTrade(workspaceId, payload); clearQueryCache(); return result; }
  const { data } = await api.post(`/journals/${workspaceId}/trades/`, payload);
  return data;
};

export const updateTrade = async (workspaceId, id, payload) => {
  if (USE_MOCK) { const result = await mockUpdateTrade(workspaceId, id, payload); clearQueryCache(); return result; }
  const { data } = await api.patch(`/journals/${workspaceId}/trades/${id}/`, payload);
  return data;
};

export const deleteTrade = async (workspaceId, id) => {
  if (USE_MOCK) { const result = await mockDeleteTrade(workspaceId, id); clearQueryCache(); return result; }
  await api.delete(`/journals/${workspaceId}/trades/${id}/`);
};

export const uploadScreenshot = async (journalId, tradeId, file, section = null, displayWidth = 100) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("display_width", String(displayWidth));
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

export const updateScreenshotWidth = async (journalId, tradeId, screenshotId, width, section) => {
  const {data} = await api.patch(`/journals/${journalId}/trades/${tradeId}/screenshots/${screenshotId}/`, {display_width: width, ...(section != null ? {section} : {})});
  return data;
};

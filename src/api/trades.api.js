import api from "./axios";
import { USE_MOCK, mockFetchTrades, mockFetchTrade } from "@/mocks/mockData";

export const fetchTrades = async (workspaceId, params = {}) => {
  if (USE_MOCK) return mockFetchTrades(workspaceId, params);
  const { data } = await api.get(`/workspaces/${workspaceId}/trades/`, { params });
  return data;
};

export const fetchTrade = async (workspaceId, id) => {
  if (USE_MOCK) return mockFetchTrade(workspaceId, id);
  const { data } = await api.get(`/workspaces/${workspaceId}/trades/${id}/`);
  return data;
};

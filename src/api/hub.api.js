import api from "./axios";
import { USE_MOCK, mockFetchHubTrades, mockFetchCareerData } from "@/mocks/mockData";

// years: number[] — empty array means all available years
export const fetchHubTrades = async (workspaceId, { years = [] } = {}) => {
  if (USE_MOCK) return mockFetchHubTrades(workspaceId, { years });
  const params = { ordering: "entry_datetime", page_size: 500 };
  if (years.length > 0) params.year__in = years.join(",");
  const { data } = await api.get(`/workspaces/${workspaceId}/trades/`, { params });
  return data.results;
};

export const fetchCareerData = async (workspaceId) => {
  if (USE_MOCK) return mockFetchCareerData(workspaceId);
  const { data } = await api.get(`/workspaces/${workspaceId}/analytics/career/`);
  return data;
};

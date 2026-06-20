import api from "./axios";
import { USE_MOCK, mockFetchDashboardSummary } from "@/mocks/mockData";

export const fetchDashboardSummary = async (workspaceId) => {
  if (USE_MOCK) return mockFetchDashboardSummary(workspaceId);
  const { data } = await api.get(`/journals/${workspaceId}/dashboard/summary/`);
  return data;
};

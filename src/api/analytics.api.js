import api from "./axios";
import {
  USE_MOCK,
  mockFetchEquityCurve,
  mockFetchWinLossDistribution,
  mockFetchPnlBySetup,
} from "@/mocks/mockData";

export const fetchEquityCurve = async (workspaceId, period = "weekly") => {
  if (USE_MOCK) return mockFetchEquityCurve(workspaceId, period);
  const { data } = await api.get(
    `/journals/${workspaceId}/analytics/equity-curve/`,
    { params: { period } }
  );
  return data;
};

export const fetchWinLossDistribution = async (workspaceId) => {
  if (USE_MOCK) return mockFetchWinLossDistribution(workspaceId);
  const { data } = await api.get(
    `/journals/${workspaceId}/analytics/win-loss-distribution/`
  );
  return data;
};

export const fetchPnlBySetup = async (workspaceId) => {
  if (USE_MOCK) return mockFetchPnlBySetup(workspaceId);
  const { data } = await api.get(`/journals/${workspaceId}/analytics/pnl-by-setup/`);
  return data;
};

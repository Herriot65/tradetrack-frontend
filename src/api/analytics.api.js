import api from "./axios";

export const fetchEquityCurve = async (period = "weekly") => {
  const response = await api.get("/analytics/equity-curve/", {
    params: { period },
  });
  return response.data;
};

export const fetchWinLossDistribution = async () => {
  const response = await api.get("/analytics/win-loss-distribution/");
  return response.data;
};

export const fetchPnlBySetup = async () => {
  const response = await api.get("/analytics/pnl-by-setup/");
  return response.data;
};

import api from "./axios";

export const fetchDashboardSummary = async () => {
  const response = await api.get("/dashboard/summary/");
  return response.data;
};

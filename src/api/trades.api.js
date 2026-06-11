import api from "./axios";

export const fetchTrades = async (params = {}) => {
  const response = await api.get("/trades/", { params });
  return response.data;
};

export const fetchTrade = async (id) => {
  const response = await api.get(`/trades/${id}/`);
  return response.data;
};

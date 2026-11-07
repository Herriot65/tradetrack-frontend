import { clearQueryCache } from "../lib/queryCache.js";
export const getAccessToken = () =>
  localStorage.getItem("access");

export const getRefreshToken = () =>
  localStorage.getItem("refresh");

export const setTokens = (access, refresh) => {
  clearQueryCache();
  localStorage.setItem("access", access);
  localStorage.setItem("refresh", refresh);
};

export const clearTokens = () => {
  clearQueryCache();
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
};
import { clearQueryCache } from "../lib/queryCache.js";
const USER_KEY = "nexora_session_user";
export const getSavedUser = () => {
  if (!getAccessToken() && !getRefreshToken()) return null;
  try {
    const user = JSON.parse(localStorage.getItem(USER_KEY));
    return user && typeof user === "object" && user.id && typeof user.email === "string" ? user : null;
  } catch { return null; }
};
export const saveUser = user => {
  try { localStorage.setItem(USER_KEY, JSON.stringify(user)); } catch { /* Storage may be full. */ }
};
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
  localStorage.removeItem(USER_KEY);
};

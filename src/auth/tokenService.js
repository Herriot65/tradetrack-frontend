import { clearQueryCache } from "../lib/queryCache.js";

// Access tokens live only in memory. Refresh tokens are HttpOnly cookies.
let accessToken = null;
let sessionVersion = 0;
const USER_KEY = "nexora_session_user";

// Retire the old persistent-token format. Existing sessions must sign in again.
for (const key of ["access", "refresh", USER_KEY]) {
  try { localStorage.removeItem(key); } catch { /* Storage is optional. */ }
}

export const getAccessToken = () => accessToken;
export const getSessionVersion = () => sessionVersion;
export const setTokens = access => {
  clearQueryCache();
  accessToken = access;
};
export const clearTokens = () => {
  sessionVersion++;
  accessToken = null;
  clearQueryCache();
};
export const broadcastLogout = () => {
  try { localStorage.setItem("nexora_logout", `${Date.now()}-${Math.random()}`); } catch { /* Local sign-out still works. */ }
};

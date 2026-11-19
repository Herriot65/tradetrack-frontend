import { clearQueryCache } from "../lib/queryCache.js";
// Central Axios instance for API requests.
// Adds Authorization headers automatically and handles token refresh
// on 401 responses using refresh tokens.

import axios from "axios";

import {
  getAccessToken,
  getSessionVersion,
  setTokens,
  clearTokens,
} from "../auth/tokenService";

import { BASE_URL, cookieRequest, csrfHeaders, hasPendingLogout } from "./session";

const api = axios.create({ baseURL: BASE_URL, withCredentials: true });

/* =========================
   REQUEST INTERCEPTOR
========================= */
api.interceptors.request.use(
  async (config) => {
    config._sessionVersion ??= getSessionVersion();
    const token = getAccessToken();

    const isPublicAuth = ["/auth/login/", "/auth/google/", "/auth/register/"].includes(config.url);
    if (token && !isPublicAuth) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.url?.startsWith("/auth/") && !["get", "head", "options"].includes(config.method)) {
      Object.assign(config.headers, await csrfHeaders());
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* =========================
   REFRESH TOKEN LOGIC
========================= */
let refreshPromise = null;
const expireSession = () => {
  clearTokens();
  window.dispatchEvent(new Event("auth:expired"));
};

const refreshAccessToken = () => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const version = getSessionVersion();
    if (hasPendingLogout()) throw Object.assign(new Error("Signed out"), { code: "SESSION_EXPIRED" });
    const previousAccess = getAccessToken();
    const response = await cookieRequest("/auth/refresh/");
    const { access } = response.data;
    if (getSessionVersion() !== version) {
      throw new axios.CanceledError("Session changed while refreshing");
    }
    if (!access) throw new Error("Invalid session response");
    // Never replay an old account's mutation under a newly signed-in account.
    const identity = token => {
      try { return JSON.parse(atob(token.split(".")[1].replaceAll("-", "+").replaceAll("_", "/"))).user_id; }
      catch { return null; }
    };
    if (previousAccess && identity(previousAccess) !== identity(access)) {
      expireSession();
      throw new axios.CanceledError("Account changed while refreshing");
    }
    setTokens(access);
    return access;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
};

/* =========================
   RESPONSE INTERCEPTOR
========================= */
api.interceptors.response.use(
  (response) => {
    if (!["get", "head", "options"].includes(response.config.method) && !response.config.url?.includes("/drafts/")) clearQueryCache();
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (originalRequest && originalRequest._sessionVersion !== getSessionVersion()) {
      return Promise.reject(new axios.CanceledError("Session changed during request"));
    }
    const isLoginRequest = ["/auth/login/", "/auth/google/", "/auth/register/", "/auth/logout/"].some(path => originalRequest?.url?.includes(path));

    if (
      error.response?.status === 401 &&
      !isLoginRequest &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      const versionBeforeRetry = getSessionVersion();

      try {
        const newAccessToken = await refreshAccessToken();

        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        // A login in another request may have replaced the credentials meanwhile.
        if (
          getSessionVersion() === versionBeforeRetry &&
          (refreshError.code === "SESSION_EXPIRED" || [400, 401].includes(refreshError.response?.status))
        ) {
          expireSession();
        }
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 401 && !isLoginRequest && originalRequest?._retry &&
        originalRequest.headers?.Authorization === `Bearer ${getAccessToken()}`) {
      expireSession();
    }
    return Promise.reject(error);
  }
);

export default api;

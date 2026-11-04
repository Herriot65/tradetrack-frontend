// Central Axios instance for API requests.
// Adds Authorization headers automatically and handles token refresh
// on 401 responses using refresh tokens.

import axios from "axios";

import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from "../auth/tokenService";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

const api = axios.create({
  baseURL: BASE_URL,
});

/* =========================
   REQUEST INTERCEPTOR
========================= */
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    const refresh = getRefreshToken();
    if (!refresh) {
      const error = new Error("Session expired");
      error.code = "SESSION_EXPIRED";
      throw error;
    }

    const response = await axios.post(`${BASE_URL}/auth/refresh/`, { refresh }, { timeout: 15000 });
    const { access, refresh: rotatedRefresh } = response.data;

    // SimpleJWT rotates refresh tokens, so retain the replacement when supplied.
    if (getRefreshToken() !== refresh) {
      throw new axios.CanceledError("Session changed while refreshing");
    }
    if (!access) throw new Error("Invalid session response");
    setTokens(access, rotatedRefresh ?? refresh);
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
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isLoginRequest = ["/auth/login/", "/auth/register/", "/auth/logout/"].some(path => originalRequest?.url?.includes(path));

    if (
      error.response?.status === 401 &&
      !isLoginRequest &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      const refreshBeforeRetry = getRefreshToken();

      try {
        const newAccessToken = await refreshAccessToken();

        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        // A login in another request may have replaced the credentials meanwhile.
        if (
          getRefreshToken() === refreshBeforeRetry &&
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

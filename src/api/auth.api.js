//handles authentication logics

import api from "./axios";
import axios from "axios";
import {
  getRefreshToken,
  setTokens,
  clearTokens,
} from "../auth/tokenService";

// Brief connection interruptions and a waking server should recover silently.
// Never retry rejected credentials or an intentionally cancelled request.
const withConnectionRetry = async (request, signal) => {
  for (let attempt = 0; ; attempt++) {
    try {
      return await request();
    } catch (error) {
      const temporary = !error.response || [502, 503, 504].includes(error.response.status);
      if (attempt >= 2 || !temporary || error.code === "SESSION_EXPIRED" || axios.isCancel(error) || signal?.aborted) throw error;
      await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
      if (signal?.aborted) throw new axios.CanceledError();
    }
  }
};

/* =========================
   LOGIN
========================= */
export const loginUser = async (credentials) => {
  const response = await withConnectionRetry(() =>
    api.post("/auth/login/", credentials, { timeout: 15000 })
  );

  const { access, refresh, user } = response.data;

  // Save tokens locally
  clearTokens();
  setTokens(access, refresh);

  return { access, refresh, user };
};

/* =========================
   LOGOUT
========================= */
export const logoutUser = async () => {
  const refresh = getRefreshToken();

  clearTokens();
  if (!refresh) return;
  await api.post("/auth/logout/", { refresh }, { timeout: 15000 });
};

/* =========================
   GET CURRENT USER
========================= */
export const getCurrentUser = async (config = {}) => {
  const response = await withConnectionRetry(
    () => api.get("/auth/me/", { timeout: 15000, ...config }), config.signal
  );
  return response.data;
};

/* =========================
   REGISTER
========================= */
export const registerUser = async (userData) => {
  const response = await api.post(
    "/auth/register/",
    userData
  );

  return response.data;
};

export const googleLoginUser = async (credential) => {
  const { data } = await api.post("/auth/google/", { credential });
  clearTokens();
  setTokens(data.access, data.refresh);
  return data;
};

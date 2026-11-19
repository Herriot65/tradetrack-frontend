//handles authentication logics

import api from "./axios";
import axios from "axios";
import { cookieRequest, hasPendingLogout, setPendingLogout } from "./session";
import {
  broadcastLogout,
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
    cookieRequest("/auth/login/", credentials)
  );

  const { access, user } = response.data;

  setPendingLogout(false);
  clearTokens();
  setTokens(access);

  return { access, user };
};

/* =========================
   LOGOUT
========================= */
export const logoutUser = async () => {
  setPendingLogout(true);
  clearTokens();
  broadcastLogout();
  await cookieRequest("/auth/logout/");
  setPendingLogout(false);
};

/* =========================
   GET CURRENT USER
========================= */
export const getCurrentUser = async (config = {}) => {
  if (hasPendingLogout()) {
    await cookieRequest("/auth/logout/");
    setPendingLogout(false);
    window.dispatchEvent(new Event("auth:expired"));
    const error = new Error("Signed out");
    error.code = "SESSION_EXPIRED";
    throw error;
  }
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

export const googleLoginUser = async (credential, remember_me = false) => {
  const { data } = await cookieRequest("/auth/google/", { credential, remember_me });
  clearTokens();
  setPendingLogout(false);
  setTokens(data.access);
  return data;
};

export const reauthenticate = async credentials => api.post("/auth/reauthenticate/", credentials);
export const logoutAllDevices = async () => {
  await api.post("/auth/logout-all/");
  clearTokens();
  broadcastLogout();
  window.dispatchEvent(new Event("auth:expired"));
};

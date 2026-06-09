//handles authentication logics

import api from "./axios";
import {
  getRefreshToken,
  setTokens,
  clearTokens,
} from "../auth/tokenService";

/* =========================
   LOGIN
========================= */
export const loginUser = async (email, password) => {
  const response = await api.post("/auth/login/", {
    email,
    password,
  });

  const { access, refresh, user } = response.data;

  // Save tokens locally
  setTokens(access, refresh);

  return { access, refresh, user };
};

/* =========================
   LOGOUT
========================= */
export const logoutUser = async () => {
  const refresh = getRefreshToken();

  if (!refresh) return;

  await api.post("/auth/logout/", { refresh });

  clearTokens();
};

/* =========================
   GET CURRENT USER
========================= */
export const getCurrentUser = async () => {
  const response = await api.get("/auth/me/");
  return response.data;
};
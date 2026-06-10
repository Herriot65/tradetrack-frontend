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
export const loginUser = async (credentials) => {
  const response = await api.post("/auth/login/", 
    credentials
  );

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
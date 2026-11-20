import axios from "axios";
import { requireJsonResponse } from "./responseValidation";

export const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export const csrfHeaders = async () => {
  const { data } = requireJsonResponse(await axios.get(`${BASE_URL}/auth/csrf/`, { withCredentials: true, timeout: 15000 }));
  return { "X-CSRFToken": data.csrfToken };
};

// Serialize cookie rotation across tabs as well as within this page.
export const cookieRequest = (path, data = {}) => {
  const request = async () => requireJsonResponse(await axios.post(`${BASE_URL}${path}`, data, {
    withCredentials: true, timeout: 15000, headers: await csrfHeaders(),
  }));
  return navigator.locks ? navigator.locks.request("nexora-auth-cookie", request) : request();
};

let pendingLogout = false;
export const hasPendingLogout = () => {
  try { return localStorage.getItem("nexora_logout_pending") === "true"; }
  catch { return pendingLogout; }
};
export const setPendingLogout = pending => {
  pendingLogout = pending;
  try {
    if (pending) localStorage.setItem("nexora_logout_pending", "true");
    else localStorage.removeItem("nexora_logout_pending");
  } catch { /* The in-memory flag still prevents session restoration. */ }
};

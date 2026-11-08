import { createContext, useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { getAccessToken, getRefreshToken, clearTokens, getSavedUser, saveUser } from "./tokenService";
import { setUserTimezone } from "../lib/timezone";
import { loginUser, googleLoginUser, logoutUser, getCurrentUser } from "../api/auth.api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getSavedUser);
  const [loading, setLoading] = useState(() => !getSavedUser());
  const [sessionExpired, setSessionExpired] = useState(false);
  const generation = useRef(0);

  const acceptUser = user => {
    saveUser(user);
    setUserTimezone(user.timezone);
    setUser(user);
    setLoading(false);
    setSessionExpired(false);
  };
  const resetSession = () => {
    generation.current++;
    clearTokens();
    setUser(null);
    setLoading(false);
    setSessionExpired(false);
  };
  const login = async credentials => {
    const { user } = await loginUser(credentials);
    generation.current++;
    acceptUser(user);
  };
  const logout = async () => {
    generation.current++;
    setUser(null);
    setLoading(false);
    setSessionExpired(false);
    try { await logoutUser(); } catch { /* Local sign-out is already complete. */ }
  };

  useEffect(() => {
    const expire = () => {
      generation.current++;
      setUser(null);
      setSessionExpired(true);
      setLoading(false);
    };
    window.addEventListener("auth:expired", expire);
    return () => window.removeEventListener("auth:expired", expire);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let timer;
    let pending = false;
    let failures = 0;
    const loadUser = async () => {
      if (pending || controller.signal.aborted) return;
      clearTimeout(timer);
      if (!getAccessToken() && !getRefreshToken()) {
        setLoading(false);
        return;
      }
      pending = true;
      const startedGeneration = generation.current;
      try {
        const currentUser = await getCurrentUser({ signal: controller.signal });
        if (controller.signal.aborted || generation.current !== startedGeneration) return;
        saveUser(currentUser);
        setUserTimezone(currentUser.timezone);
        setUser(currentUser);
        setSessionExpired(false);
        setLoading(false);
        failures = 0;
      } catch {
        // Keep the current page mounted while connectivity recovers. Only an
        // explicit authentication rejection can end the session.
        if (!controller.signal.aborted && generation.current === startedGeneration &&
            (getAccessToken() || getRefreshToken())) {
          timer = setTimeout(loadUser, Math.min(30000, 2000 * 2 ** Math.min(failures++, 4)));
        }
      } finally {
        pending = false;
      }
    };
    const resume = () => { if (document.visibilityState === "visible") loadUser(); };
    loadUser();
    window.addEventListener("online", loadUser);
    document.addEventListener("visibilitychange", resume);
    return () => {
      controller.abort();
      clearTimeout(timer);
      window.removeEventListener("online", loadUser);
      document.removeEventListener("visibilitychange", resume);
    };
  }, []);

  return <AuthContext.Provider value={{
    user, loading, sessionExpired, isAuthenticated: !!user,
    login, logout, resetSession,
    loginWithGoogle: async credential => {
      const { user } = await googleLoginUser(credential);
      generation.current++;
      acceptUser(user);
    },
    updatePreferences: async preferences => {
      const { data } = await api.patch("/auth/me/", preferences);
      acceptUser(data);
      return data;
    },
  }}>{children}</AuthContext.Provider>;
};

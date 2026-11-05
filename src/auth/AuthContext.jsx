// Manages authentication state across the entire app.
// Other components can access the shared information using useContext(AuthContext)
// to retrieve user data and perform actions like login and logout...

import { createContext, useEffect, useState } from "react";
import api from "../api/axios";
import { getAccessToken, getRefreshToken, clearTokens } from "./tokenService";
import { setUserTimezone } from "../lib/timezone";
import { setTheme } from "../lib/theme";
import {
  loginUser,
  googleLoginUser,
  logoutUser,
  getCurrentUser,
} from "../api/auth.api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const login = async (credentials) => {
    const { user } = await loginUser(credentials);
    setUserTimezone(user.timezone);
    setTheme(user.theme || "system");
    setSessionError(null);
    setSessionExpired(false);
    setUser(user);
  };

  const logout = async () => {
    setUser(null);
    setSessionError(null);
    try {
      await logoutUser();
    } catch (err) {
      console.error(err);
    }
    setUser(null);
  };

  useEffect(() => {
    const expire = () => {
      setUser(null);
      setSessionError(null);
      setSessionExpired(true);
      setLoading(false);
    };
    window.addEventListener("auth:expired", expire);
    return () => window.removeEventListener("auth:expired", expire);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const loadUser = async () => {
      if (!getAccessToken() && !getRefreshToken()) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setSessionError(null);
      try {
        const user = await getCurrentUser({ signal: controller.signal });
        if (controller.signal.aborted) return;
        setUserTimezone(user.timezone);
        setTheme(user.theme || "system");
        setUser(user);
        setSessionExpired(false);
      } catch (err) {
        if (controller.signal.aborted) return;
        // Authentication rejection is handled centrally; keep credentials for
        // temporary network/server failures so Retry can restore the session.
        if (getAccessToken() || getRefreshToken()) {
          setSessionError(err.response?.status >= 500
            ? "The server is temporarily unavailable. Please try again."
            : "We couldn’t reconnect to your account. Check your connection and try again.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    loadUser();
    return () => controller.abort();
  }, [retryKey]);

  return (
    <AuthContext.Provider
      value={{
        user,
        updatePreferences: async preferences => {
          const {data} = await api.patch("/auth/me/", preferences);
          setUserTimezone(data.timezone);
          setTheme(data.theme || "system");
          setUser(data);
          return data;
        },
        login,
        loginWithGoogle: async credential => {
          const { user } = await googleLoginUser(credential);
          setUserTimezone(user.timezone);
          setTheme(user.theme || "system");
          setSessionError(null);
          setSessionExpired(false);
          setUser(user);
        },
        logout,
        loading,
        sessionError,
        sessionExpired,
        retrySession: () => setRetryKey(key => key + 1),
        resetSession: () => {
          clearTokens();
          setSessionError(null);
          setSessionExpired(false);
          setUser(null);
        },
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

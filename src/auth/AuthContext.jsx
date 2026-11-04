// Manages authentication state across the entire app.
// Other components can access the shared information using useContext(AuthContext)
// to retrieve user data and perform actions like login and logout...

import { createContext, useEffect, useState } from "react";
import api from "../api/axios";
import { setUserTimezone } from "../lib/timezone";
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

  const login = async (credentials) => {
    const { user } = await loginUser(credentials);
    setUserTimezone(user.timezone);
    setUser(user);
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error(err);
    }
    setUser(null);
  };

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("access");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const user = await getCurrentUser();
        setUserTimezone(user.timezone);
        setUser(user);
      } catch (err) {
        console.error(err);
        // Optionally clear tokens if invalid
      }

      setLoading(false);
    };

    loadUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        updatePreferences: async preferences => {
          const {data} = await api.patch("/auth/me/", preferences);
          setUserTimezone(data.timezone);
          setUser(data);
          return data;
        },
        login,
        loginWithGoogle: async credential => {
          const { user } = await googleLoginUser(credential);
          setUserTimezone(user.timezone);
          setUser(user);
        },
        logout,
        loading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

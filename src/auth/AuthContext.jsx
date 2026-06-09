// Manages authentication state across the entire app.
// Other components can access the shared information using useContext(AuthContext)
// to retrieve user data and perform actions like login and logout...

import { createContext, useEffect, useState } from "react";
import {
  loginUser,
  logoutUser,
  getCurrentUser,
} from "../api/auth.api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    const { user } = await loginUser(email, password);
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
        login,
        logout,
        loading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
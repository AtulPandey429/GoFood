import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import ApiClient from "../factories/api/ApiClient";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const stored = localStorage.getItem("authToken");
    if (!stored) {
      setLoading(false);
      return;
    }
    try {
      const data = await ApiClient.get("/api/auth/me");
      setUser(data.user);
      setToken(stored);
      if (data.user?.email) localStorage.setItem("userEmail", data.user.email);
    } catch {
      localStorage.removeItem("authToken");
      localStorage.removeItem("userEmail");
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = (authToken, userData) => {
    localStorage.setItem("authToken", authToken);
    if (userData?.email) localStorage.setItem("userEmail", userData.email);
    setToken(authToken);
    setUser(userData);
  };

  const updateUser = (userData) => {
    if (userData) setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userEmail");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, fetchMe, updateUser, isAdmin: user?.isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

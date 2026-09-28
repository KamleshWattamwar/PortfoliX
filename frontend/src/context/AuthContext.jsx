import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, registerUser, getCurrentUser, TOKEN_KEY } from '../api/client';

export const USER_KEY = 'portfolix_user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  // Initialize and verify session on initial load
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      if (!savedToken) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const userData = await getCurrentUser();
        if (mounted) {
          setUser(userData);
          localStorage.setItem(USER_KEY, JSON.stringify(userData));
          setToken(savedToken);
        }
      } catch (err) {
        // If token is expired or unauthorized, logout
        if (err.response?.status === 401 || err.response?.status === 403) {
          logout();
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    // Listen to window logout event dispatched by axios 401 interceptor
    const handleAuthLogoutEvent = () => {
      logout();
    };

    window.addEventListener('auth:logout', handleAuthLogoutEvent);

    return () => {
      mounted = false;
      window.removeEventListener('auth:logout', handleAuthLogoutEvent);
    };
  }, [logout]);

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    const accessToken = data.access_token;
    
    localStorage.setItem(TOKEN_KEY, accessToken);
    setToken(accessToken);

    try {
      const userData = await getCurrentUser();
      setUser(userData);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      return userData;
    } catch {
      const fallbackUser = { email };
      setUser(fallbackUser);
      localStorage.setItem(USER_KEY, JSON.stringify(fallbackUser));
      return fallbackUser;
    }
  };

  const register = async (email, password) => {
    await registerUser(email, password);
    // Automatically log user in after successful registration
    return await login(email, password);
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

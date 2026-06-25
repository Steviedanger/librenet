import { createContext, useContext, useEffect, useRef, useState } from 'react';
import authService from '../services/authService.js';
import {
  setAccessToken,
  getAccessToken,
  setAuthFailureHandler,
} from '../services/api.js';

const AuthContext = createContext(null);

// Access tokens live 15 min; refresh a little early to avoid 401 round-trips.
const REFRESH_INTERVAL_MS = 13 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // initial silent refresh
  const refreshTimer = useRef(null);

  const applySession = (data) => {
    setAccessToken(data.accessToken);
    setUser(data.user);
  };

  const clearSession = () => {
    setAccessToken(null);
    setUser(null);
    if (refreshTimer.current) clearInterval(refreshTimer.current);
  };

  // Attempt a silent refresh using the httpOnly cookie.
  const silentRefresh = async () => {
    try {
      const data = await authService.refresh();
      applySession(data);
      return true;
    } catch {
      clearSession();
      return false;
    }
  };

  // On mount: try to restore the session, then schedule periodic refreshes.
  useEffect(() => {
    let active = true;

    // If the API layer gives up on refreshing, force a logout in state.
    setAuthFailureHandler(() => {
      if (active) clearSession();
    });

    (async () => {
      await silentRefresh();
      if (active) setLoading(false);
    })();

    refreshTimer.current = setInterval(silentRefresh, REFRESH_INTERVAL_MS);

    return () => {
      active = false;
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    applySession(data);
    return data.user;
  };

  const register = async (payload) => authService.register(payload);

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      /* ignore network errors on logout */
    }
    clearSession();
  };

  // Let pages (e.g. Profile) push an updated user object into context.
  const updateUser = (next) => setUser(next);

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user) && Boolean(getAccessToken()),
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    updateUser,
    refresh: silentRefresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
};

export default AuthContext;

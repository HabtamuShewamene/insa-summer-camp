'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { api, User, ApiError } from './api';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => void;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveTokens = (access: string, refresh: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    setAccessToken(access);
  };

  const clearTokens = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setAccessToken(null);
    setUser(null);
  };

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return null;

    try {
      const result = await api.refresh(refreshToken);
      saveTokens(result.accessToken, result.refreshToken);
      return result.accessToken;
    } catch {
      clearTokens();
      return null;
    }
  }, []);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (accessToken) return accessToken;
    return refreshAccessToken();
  }, [accessToken, refreshAccessToken]);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }

    setAccessToken(token);

    try {
      const userData = await api.getMe(token);
      setUser(userData);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          try {
            const userData = await api.getMe(newToken);
            setUser(userData);
            return;
          } catch {
            clearTokens();
          }
        }
      } else {
        clearTokens();
      }
    } finally {
      setIsLoading(false);
    }
  }, [refreshAccessToken]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    const result = await api.login(email, password);
    saveTokens(result.accessToken, result.refreshToken);
    setUser(result.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const result = await api.register(name, email, password);
    saveTokens(result.accessToken, result.refreshToken);
    setUser(result.user);
  };

  const logout = async () => {
    const token = accessToken || localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (token && refreshToken) {
      try {
        await api.logout(refreshToken, token);
      } catch {
        // Continue logout even if API fails
      }
    }
    clearTokens();
  };

  const logoutAll = async () => {
    const token = await getAccessToken();
    if (token) {
      await api.logoutAll(token);
    }
    clearTokens();
  };

  const setTokens = (access: string, refresh: string) => {
    saveTokens(access, refresh);
    loadUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        login,
        register,
        logout,
        logoutAll,
        setTokens,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

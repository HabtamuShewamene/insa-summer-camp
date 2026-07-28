'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { api, User, setTokens as setApiTokens } from './api';
import { useRouter, usePathname } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const queryClient = new QueryClient();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const handleForceLogout = useCallback(() => {
    setUser(null);
    setApiTokens(null, null);
    if (!pathname.startsWith('/login') && !pathname.startsWith('/register')) {
      router.push('/login');
    }
  }, [pathname, router]);

  useEffect(() => {
    window.addEventListener('force-logout', handleForceLogout);
    return () => window.removeEventListener('force-logout', handleForceLogout);
  }, [handleForceLogout]);

  const loadUser = useCallback(async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    try {
      const userData = await api.getMe();
      setUser(userData);
    } catch (error) {
      // Interceptor will handle refresh if needed. If it fails, it triggers force-logout
      console.error('Failed to load user', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (data: any) => {
    const result = await api.login(data);
    setApiTokens(result.accessToken, result.refreshToken);
    setUser(result.user);
    router.push('/dashboard');
  };

  const register = async (data: any) => {
    const result = await api.register(data);
    setApiTokens(result.accessToken, result.refreshToken);
    setUser(result.user);
    router.push('/dashboard');
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await api.logout(refreshToken);
      } catch {
        // Ignore API failure during logout
      }
    }
    setApiTokens(null, null);
    setUser(null);
    router.push('/login');
  };

  const logoutAll = async () => {
    try {
      await api.logoutAll();
    } catch {
      // Ignore API failure
    }
    setApiTokens(null, null);
    setUser(null);
    router.push('/login');
  };

  const setTokens = (access: string, refresh: string) => {
    setApiTokens(access, refresh);
    loadUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        logoutAll,
        setTokens,
      }}
    >
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
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

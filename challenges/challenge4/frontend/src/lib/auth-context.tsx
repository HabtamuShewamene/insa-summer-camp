'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { api, User, setTokens as setApiTokens } from './api';

interface LoginData { email: string; password: string }
interface RegisterData { name: string; email: string; password: string }

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  /** Stores tokens and fetches the user — awaitable so callers can navigate after */
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Restore session on mount ───────────────────────────────────────────────
  const loadUser = useCallback(async (): Promise<void> => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    try {
      const userData = await api.getMe();
      setUser(userData);
    } catch {
      // Axios interceptor already tried a token refresh.
      // If that also failed it fired force-logout — clear state here too.
      setApiTokens(null, null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // ── Force-logout event fired by axios interceptor on unrecoverable 401 ────
  useEffect(() => {
    const handler = () => {
      setUser(null);
      setApiTokens(null, null);
    };
    window.addEventListener('force-logout', handler);
    return () => window.removeEventListener('force-logout', handler);
  }, []);

  // ── Auth actions ──────────────────────────────────────────────────────────
  const login = async (data: LoginData): Promise<void> => {
    const result = await api.login(data);
    setApiTokens(result.accessToken, result.refreshToken);
    setUser(result.user);
  };

  const register = async (data: RegisterData): Promise<void> => {
    const result = await api.register(data);
    setApiTokens(result.accessToken, result.refreshToken);
    setUser(result.user);
  };

  const logout = async (): Promise<void> => {
    const refreshToken =
      typeof window !== 'undefined'
        ? localStorage.getItem('refreshToken')
        : null;
    if (refreshToken) {
      try {
        await api.logout(refreshToken);
      } catch {
        // Best-effort — always clear locally regardless
      }
    }
    setApiTokens(null, null);
    setUser(null);
  };

  const logoutAll = async (): Promise<void> => {
    try {
      await api.logoutAll();
    } catch {
      // Best-effort
    }
    setApiTokens(null, null);
    setUser(null);
  };

  /**
   * Store tokens then fetch the user profile.
   * Returns a Promise so the Google OAuth callback page can await full
   * hydration before navigating — prevents the user=null flash on /dashboard.
   */
  const setTokens = async (
    access: string,
    refresh: string,
  ): Promise<void> => {
    setApiTokens(access, refresh);
    setIsLoading(true);
    await loadUser();
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, register, logout, logoutAll, setTokens }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

/**
 * Convenience hook that adds router-aware redirect on logout.
 * Use this in components that need to navigate after logout
 * instead of calling useRouter separately everywhere.
 */
export function useAuthWithRedirect() {
  const auth = useAuth();
  const router = useRouter();

  const logout = async () => {
    await auth.logout();
    router.push('/login');
  };

  const logoutAll = async () => {
    await auth.logoutAll();
    router.push('/login');
  };

  return { ...auth, logout, logoutAll };
}

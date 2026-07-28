import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface User {
  id: string;
  name: string;
  email: string;
  provider: string;
  emailVerified: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Session {
  id: string;
  device: string;
  browser: string;
  os?: string;
  ipAddress: string;
  location?: string;
  createdAt: string;
  lastActive: string;
  expiresAt: string;
  isCurrent?: boolean;
}

export interface LoginHistoryEntry {
  id: string;
  ipAddress: string;
  device: string;
  browser: string;
  location?: string;
  country?: string;
  city?: string;
  status: string;
  riskScore: number;
  createdAt: string;
}

export interface SecurityEvent {
  id: string;
  eventType: string;
  description: string;
  ipAddress?: string;
  createdAt: string;
}

export interface SecurityDashboard {
  sessions: Session[];
  loginHistory: LoginHistoryEntry[];
  securityEvents: SecurityEvent[];
}

export interface PasswordStrengthResult {
  score: number;
  label: string;
  feedback: string[];
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

// Global storage for tokens to be used in interceptors
let currentAccessToken: string | null = null;
let currentRefreshToken: string | null = null;

export const setTokens = (accessToken: string | null, refreshToken: string | null) => {
  currentAccessToken = accessToken;
  currentRefreshToken = refreshToken;
  
  if (typeof window !== 'undefined') {
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    else localStorage.removeItem('accessToken');
    
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    else localStorage.removeItem('refreshToken');
  }
};

export const getTokens = () => {
  if (!currentAccessToken && typeof window !== 'undefined') {
    currentAccessToken = localStorage.getItem('accessToken');
    currentRefreshToken = localStorage.getItem('refreshToken');
  }
  return { accessToken: currentAccessToken, refreshToken: currentRefreshToken };
};

// Create Axios Instance
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { accessToken } = getTokens();
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response Interceptor: Handle Token Expiration
apiClient.interceptors.response.use((response) => response, async (error: AxiosError) => {
  const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
  
  // If 401 Unauthorized and we haven't retried yet
  if (error.response?.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true;
    
    const { refreshToken } = getTokens();
    if (!refreshToken) {
      // No refresh token, trigger logout
      window.dispatchEvent(new Event('force-logout'));
      return Promise.reject(error);
    }

    try {
      // Attempt to refresh token
      const response = await axios.post<{ accessToken: string; refreshToken: string }>(`${API_URL}/auth/refresh`, {
        refreshToken,
      });

      const { accessToken: newAccess, refreshToken: newRefresh } = response.data;
      setTokens(newAccess, newRefresh);

      // Retry original request with new token
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      }
      return apiClient(originalRequest);
    } catch (refreshError) {
      // Refresh failed, trigger logout
      setTokens(null, null);
      window.dispatchEvent(new Event('force-logout'));
      return Promise.reject(refreshError);
    }
  }

  // Format error message to be consistent
  const message = error.response?.data 
    ? (error.response.data as any).message || (error.response.data as any).error
    : error.message;
    
  return Promise.reject(new Error(Array.isArray(message) ? message.join(', ') : message));
});

export const api = {
  register: async (data: any) => {
    const res = await apiClient.post<AuthResponse>('/auth/register', data);
    return res.data;
  },

  login: async (data: any) => {
    const res = await apiClient.post<AuthResponse>('/auth/login', data);
    return res.data;
  },

  logout: async (refreshToken: string) => {
    const res = await apiClient.post<{ message: string }>('/auth/logout', { refreshToken });
    return res.data;
  },

  logoutAll: async () => {
    const res = await apiClient.post<{ message: string }>('/auth/logout-all');
    return res.data;
  },

  getMe: async () => {
    const res = await apiClient.get<User>('/auth/me');
    return res.data;
  },

  getSecurityDashboard: async () => {
    const res = await apiClient.get<SecurityDashboard>('/auth/security-dashboard');
    return res.data;
  },

  getSessions: async () => {
    const res = await apiClient.get<Session[]>('/auth/sessions');
    return res.data;
  },

  revokeSession: async (sessionId: string) => {
    const res = await apiClient.delete<{ message: string }>(`/auth/sessions/${sessionId}`);
    return res.data;
  },

  checkPasswordStrength: async (password: string) => {
    const res = await apiClient.post<PasswordStrengthResult>('/auth/check-password-strength', { password });
    return res.data;
  },

  changePassword: async (data: any) => {
    const res = await apiClient.post<{ message: string }>('/auth/change-password', data);
    return res.data;
  },

  forgotPassword: async (email: string) => {
    const res = await apiClient.post<{ message: string }>('/auth/forgot-password', { email });
    return res.data;
  },

  resetPassword: async (data: any) => {
    const res = await apiClient.post<{ message: string }>('/auth/reset-password', data);
    return res.data;
  },

  verifyEmail: async (token: string) => {
    const res = await apiClient.post<{ message: string }>('/auth/verify-email', { token });
    return res.data;
  },

  getGoogleAuthUrl: () => `${API_URL.replace('/api', '')}/api/auth/google`,
};

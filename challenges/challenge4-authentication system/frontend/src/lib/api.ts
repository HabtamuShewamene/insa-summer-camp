import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// User types
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
  os?: string;
  browser: string;
  ipAddress: string;
  location?: string;
  createdAt: string;
  lastActive: string;
  expiresAt: string;
  isCurrent?: boolean;
}

export interface SecurityEvent {
  id: string;
  eventType: string;
  description?: string;
  ipAddress?: string;
  createdAt: string;
  metadata?: any;
}

export interface LoginHistory {
  id: string;
  status: string;
  ipAddress: string;
  browser?: string;
  device?: string;
  location?: string;
  createdAt: string;
  riskScore: number;
}

export interface SecurityDashboard {
  sessions: Session[];
  loginHistory: LoginHistory[];
  securityEvents: SecurityEvent[];
}
let tokens = {
  accessToken: null as string | null,
  refreshToken: null as string | null
};

export const setTokens = (accessToken: string | null, refreshToken: string | null) => {
  tokens.accessToken = accessToken;
  tokens.refreshToken = refreshToken;
  
  // Store in localStorage for persistence
  if (typeof window !== 'undefined') {
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    else localStorage.removeItem('accessToken');
    
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    else localStorage.removeItem('refreshToken');
  }
};

export const getTokens = () => {
  // Load from localStorage on first access
  if (!tokens.accessToken && typeof window !== 'undefined') {
    tokens.accessToken = localStorage.getItem('accessToken');
    tokens.refreshToken = localStorage.getItem('refreshToken');
  }
  return tokens;
};

// Main API client
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth header to requests
apiClient.interceptors.request.use((config) => {
  const { accessToken } = getTokens();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Handle token refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const { refreshToken } = getTokens();
      if (!refreshToken) {
        // No refresh token - force logout
        window.dispatchEvent(new Event('force-logout'));
        return Promise.reject(error);
      }

      try {
        // Try to refresh
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken: newAccess, refreshToken: newRefresh } = response.data;
        setTokens(newAccess, newRefresh);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout
        setTokens(null, null);
        window.dispatchEvent(new Event('force-logout'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API methods
export const api = {
  // Generic authenticated request helpers used by feature services.
  get: (url: string, config?: Parameters<typeof apiClient.get>[1]) => apiClient.get(url, config),
  post: (url: string, data?: unknown, config?: Parameters<typeof apiClient.post>[2]) => apiClient.post(url, data, config),
  put: (url: string, data?: unknown, config?: Parameters<typeof apiClient.put>[2]) => apiClient.put(url, data, config),
  patch: (url: string, data?: unknown, config?: Parameters<typeof apiClient.patch>[2]) => apiClient.patch(url, data, config),
  delete: (url: string, config?: Parameters<typeof apiClient.delete>[1]) => apiClient.delete(url, config),

  async register(data: { name: string; email: string; password: string }) {
    const res = await apiClient.post('/auth/register', data);
    return res.data;
  },

  async login(data: { email: string; password: string }) {
    const res = await apiClient.post('/auth/login', data);
    return res.data;
  },

  async logout(refreshToken: string) {
    const res = await apiClient.post('/auth/logout', { refreshToken });
    return res.data;
  },

  async logoutAll() {
    const res = await apiClient.post('/auth/logout-all');
    return res.data;
  },

  async getMe() {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  async getSecurityDashboard() {
    const res = await apiClient.get('/auth/security-dashboard');
    return res.data;
  },

  async getSessions() {
    const res = await apiClient.get('/sessions');
    return res.data;
  },

  async revokeSession(sessionId: string) {
    const res = await apiClient.delete(`/sessions/${sessionId}`);
    return res.data;
  },

  async checkPasswordStrength(password: string) {
    const res = await apiClient.post('/auth/check-password-strength', { password });
    return res.data;
  },

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    const res = await apiClient.post('/auth/change-password', data);
    return res.data;
  },

  getGoogleAuthUrl: () => `${API_URL}/auth/google`,

  async forgotPassword(email: string) {
    const res = await apiClient.post('/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword(data: any) {
    const res = await apiClient.post('/auth/reset-password', data);
    return res.data;
  },

  async verifyEmail(token: string) {
    const res = await apiClient.post('/auth/verify-email', { token });
    return res.data;
  },

  // Documents
  async createDocument(data: { title: string; content?: string }) {
    const res = await apiClient.post('/documents', data);
    return res.data;
  },

  async getDocuments() {
    const res = await apiClient.get('/documents');
    return res.data;
  },

  async getDocument(id: string) {
    const res = await apiClient.get(`/documents/${id}`);
    return res.data;
  },

  async updateDocument(id: string, data: { title?: string; content?: string }) {
    const res = await apiClient.patch(`/documents/${id}`, data);
    return res.data;
  },

  async deleteDocument(id: string) {
    const res = await apiClient.delete(`/documents/${id}`);
    return res.data;
  },
};

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
  score: number; // 0–4
  label: string; // 'very-weak' | 'weak' | 'fair' | 'strong' | 'very-strong'
  feedback: string[];
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || 'Request failed';
    throw new ApiError(response.status, message);
  }

  return data as T;
}

export const api = {
  register: (name: string, email: string, password: string) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  refresh: (refreshToken: string) =>
    request<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  logout: (refreshToken: string, accessToken: string) =>
    request<{ message: string }>(
      '/auth/logout',
      {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      },
      accessToken,
    ),

  logoutAll: (accessToken: string) =>
    request<{ message: string }>(
      '/auth/logout-all',
      { method: 'POST' },
      accessToken,
    ),

  getMe: (accessToken: string) =>
    request<User>('/auth/me', {}, accessToken),

  getSecurityDashboard: (accessToken: string) =>
    request<SecurityDashboard>('/auth/security-dashboard', {}, accessToken),

  getSessions: (accessToken: string) =>
    request<Session[]>('/sessions', {}, accessToken),

  revokeSession: (sessionId: string, accessToken: string) =>
    request<{ message: string }>(
      `/sessions/${sessionId}`,
      { method: 'DELETE' },
      accessToken,
    ),

  checkPasswordStrength: (password: string) =>
    request<PasswordStrengthResult>('/auth/check-password-strength', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  changePassword: (
    currentPassword: string,
    newPassword: string,
    accessToken: string,
  ) =>
    request<{ message: string }>(
      '/auth/change-password',
      {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      },
      accessToken,
    ),

  getGoogleAuthUrl: () =>
    `${API_URL.replace('/api', '')}/api/auth/google`,
};

export { ApiError };

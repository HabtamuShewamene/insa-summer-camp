export interface JwtPayload {
  sub: string;
  email: string;
  sessionId: string;
}

export interface RequestUser {
  id: string;
  email: string;
  name: string;
  sessionId: string;
}

export interface DeviceInfo {
  device: string;
  browser: string;
  os: string;
  ipAddress: string;
  location?: string;
  country?: string;
  city?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: {
    id: string;
    name: string;
    email: string;
    provider: string;
    emailVerified: boolean;
  };
}

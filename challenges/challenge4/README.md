# Identity & Authentication Platform

An enterprise-level identity system with secure authentication, session management, brute-force protection, suspicious login detection, and Google OAuth.

---

## Stack

| Layer      | Technology                                  |
|------------|---------------------------------------------|
| Frontend   | Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend    | NestJS, TypeScript                          |
| Database   | PostgreSQL via Prisma ORM                   |
| Auth       | JWT (short-lived) + Refresh tokens, bcrypt/Argon2, Google OAuth 2.0 |
| Security   | Redis-backed rate limiting (ThrottlerModule), zxcvbn password scoring |

---

## Project Structure

```
challenge4/
├── backend/          # NestJS REST API
│   ├── src/
│   │   ├── auth/         # Registration, login, refresh, Google OAuth, change-password
│   │   ├── sessions/     # Session listing and revocation
│   │   ├── security/     # Brute-force protection, suspicious login detection, audit log
│   │   ├── prisma/       # PrismaService + module
│   │   └── common/       # Guards, decorators, filters, interfaces, utils
│   └── prisma/
│       └── schema.prisma # Database schema
└── frontend/         # Next.js 15 app
    └── src/
        ├── app/
        │   ├── login/        # /login
        │   ├── register/     # /register (with live password strength meter)
        │   ├── dashboard/    # /dashboard (+ change-password modal)
        │   ├── security/     # /security (alerts / login history / sessions)
        │   ├── sessions/     # /sessions (full session management)
        │   └── auth/callback # Google OAuth redirect handler
        ├── components/
        │   ├── password-strength.tsx      # Live strength bar + requirements checklist
        │   ├── change-password-modal.tsx  # Change password dialog
        │   ├── navbar.tsx
        │   └── protected-route.tsx
        └── lib/
            ├── api.ts          # Typed API client
            └── auth-context.tsx # Auth state, token refresh
```

---

## Setup

### Prerequisites

- Node.js 20+
- Docker Desktop (for PostgreSQL)
- A Google Cloud project with OAuth 2.0 credentials (for Google login)

### 1 — Start the database

```bash
docker compose up -d
```

This starts PostgreSQL on port 5432 with the credentials already configured in `backend/.env`.

### 2 — Configure environment

**Backend** (`backend/.env`) is pre-filled for local development. Only the Google OAuth values need updating:

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
```

Get credentials from [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → Create OAuth 2.0 Client. Add `http://localhost:3001/api/auth/google/callback` as an authorized redirect URI.

**Frontend** — create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 3 — Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 4 — Run database migrations

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 5 — Start the servers

**Backend** (terminal 1):

```bash
cd backend
npm run start:dev
# → http://localhost:3001/api
```

**Frontend** (terminal 2):

```bash
cd frontend
npm run dev
# → http://localhost:3000
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | Public | Register with email + password |
| POST | `/api/auth/login` | Public | Login, returns tokens |
| POST | `/api/auth/refresh` | Public | Refresh access token |
| POST | `/api/auth/logout` | JWT | Revoke current session |
| POST | `/api/auth/logout-all` | JWT | Revoke all other sessions |
| GET  | `/api/auth/me` | JWT | Get current user |
| GET  | `/api/auth/security-dashboard` | JWT | Sessions + login history + events |
| POST | `/api/auth/change-password` | JWT | Change password |
| POST | `/api/auth/check-password-strength` | Public | Real-time password scoring |
| GET  | `/api/auth/google` | Public | Initiate Google OAuth |
| GET  | `/api/auth/google/callback` | Public | Google OAuth callback |
| GET  | `/api/sessions` | JWT | List active sessions |
| DELETE | `/api/sessions/:id` | JWT | Revoke a specific session |

---

## Security Features

### Password Policy
- Minimum 8 characters
- Must contain uppercase, lowercase, number, and special character
- Scored by zxcvbn (rejects score < 2 — common/guessable passwords)
- Live strength meter + requirement checklist on register and change-password forms

### Brute-Force Protection
Progressive delay on failed login attempts:

| Attempt | Delay |
|---------|-------|
| 1st | None |
| 2nd | 1 second |
| 3rd | 5 seconds |
| 4th | 10 seconds |
| 5th+ | 30 seconds → full 15-minute lockout |

Rate limiting via `@nestjs/throttler`: 10 requests / 60 seconds on login endpoint.

### Token Strategy
- **Access token**: 15-minute JWT, stored in memory (never localStorage)
- **Refresh token**: 7-day random 64-byte token stored as SHA-256 hash in the database, sent as part of the response body (frontend stores in localStorage — upgrade to HTTP-only cookie in production)
- Every JWT validation also checks that the session exists and is not revoked

### Suspicious Login Detection
Risk score calculated on each login:

| Signal | Score |
|--------|-------|
| New device / browser | +40 |
| Country change | +50 |
| City change (same country) | +20 |

Score ≥ 40 → `NEW_DEVICE_LOGIN` security event  
Score ≥ 70 → `SUSPICIOUS_LOGIN` security event

### Session Management
- Per-session records: device, browser, OS, IP, location, last active, expiry
- Users can view all active sessions and revoke individual ones
- Logout-all revokes every session except the current one
- Automatic expiry checked on every JWT validation

### Audit Log
Every significant event is recorded in `SecurityEvent`:
`REGISTRATION`, `FAILED_LOGIN`, `ACCOUNT_LOCKED`, `NEW_DEVICE_LOGIN`, `SUSPICIOUS_LOGIN`, `PASSWORD_CHANGED`, `SESSION_REVOKED`, `LOGOUT_ALL_DEVICES`, `GOOGLE_ACCOUNT_LINKED`

---

## Frontend Pages

| Route | Description |
|-------|-------------|
| `/login` | Email/password login + Google OAuth button |
| `/register` | Registration with live password strength meter |
| `/dashboard` | Overview stats + recent events + change-password button |
| `/security` | Tabs: Security Alerts / Login History / Active Sessions with revoke |
| `/sessions` | Full session list with per-session revoke and logout-all |

---

## Production Checklist

- [ ] Rotate JWT secrets (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`)
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS and set `Secure` + `SameSite=Strict` on cookies
- [ ] Move refresh token from localStorage to HTTP-only cookie
- [ ] Add Redis for distributed rate limiting across multiple instances
- [ ] Integrate a GeoIP service (MaxMind GeoLite2 or ip-api) in `resolveLocation()`
- [ ] Configure email notifications for suspicious login events
- [ ] Set up database connection pooling (PgBouncer)
- [ ] Add monitoring / alerting (Sentry, Datadog, etc.)

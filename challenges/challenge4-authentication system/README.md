# Authentication System

A secure user authentication system with login/register functionality, session management, and Google OAuth integration.

## Tech Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS
- **Backend:** NestJS, TypeScript  
- **Database:** PostgreSQL with Prisma
- **Auth:** JWT tokens, Google OAuth
- **Security:** Password hashing, rate limiting

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

## Getting Started

### What you need:
- Node.js (latest version)
- Docker Desktop 
- Google Cloud account (for OAuth)

### Quick Setup:

1. **Start the database:**
```bash
docker compose up -d
```

2. **Install stuff:**
```bash
# Backend
cd backend && npm install

# Frontend  
cd ../frontend && npm install
```

3. **Environment files:**

Backend `.env` is mostly ready, just add your Google OAuth stuff:
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret
```

Frontend needs `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

4. **Run migrations:**
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

5. **Start everything:**
```bash
# Terminal 1 - Backend
cd backend && npm run start:dev

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

Then go to http://localhost:3000

## What's Built

### Backend API
- `/api/auth/register` - Sign up
- `/api/auth/login` - Log in  
- `/api/auth/me` - Get current user
- `/api/auth/refresh` - Refresh tokens
- `/api/auth/logout` - Log out
- `/api/auth/google` - Google OAuth
- `/api/sessions` - Session management

### Frontend Pages
- `/login` - Login page with Google button
- `/register` - Signup with password strength checker
- `/dashboard` - User dashboard  
- `/security` - View login history and active sessions

### Features
- Password strength validation
- JWT access + refresh tokens
- Google OAuth integration
- Session tracking (device, location, etc.)
- Login attempt rate limiting
- Basic audit logging

## Security Stuff

The app has some basic security features:
- Password requirements (8+ chars, mixed case, numbers, symbols)
- Rate limiting on login attempts  
- JWT tokens with 15min expiry
- Session tracking and revocation
- Password strength scoring (using zxcvbn library)

For production you'd want to add more stuff like email verification, password reset, better logging, etc.

## Notes

This was built as a learning project to practice:
- NestJS backend development
- Next.js app router
- Authentication flows
- Database design with Prisma
- TypeScript full-stack development

The code tries to follow decent practices but there's definitely room for improvement!

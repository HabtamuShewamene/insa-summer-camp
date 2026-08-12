# Comprehensive Collaborative Document & Authentication Platform

A production-ready, highly secure, real-time collaborative document editing platform built with modern web technologies. This system provides a full-featured authentication mechanism combined with Google Docs-style real-time editing, fine-grained sharing permissions, and robust version control.

---

## 🚀 Comprehensive Features

### 🔐 Advanced Authentication & Security
- **Robust User Registration & Login**: Secure credential management with strict password policies.
- **Email Verification**: Ensures users verify their email address before accessing the platform.
- **JWT-Based Sessions**: Stateless authentication utilizing secure access and refresh tokens.
- **Google OAuth Integration**: Single Sign-On (SSO) support for seamless user onboarding.
- **Password Management**: Complete "Forgot Password" and "Reset Password" workflows using secure email tokens.
- **Multi-Factor Authentication (MFA)**: Optional two-step verification using authenticator apps (TOTP).
- **Session & Device Tracking**: Monitor active sessions, track login history (device, location, time), and remotely revoke sessions.
- **Role-Based Access Control (RBAC)**: Secure routes and API endpoints using comprehensive role and permission checks.

### 📝 Real-Time Document Collaboration
- **Yjs & WebSockets (Socket.IO)**: High-performance, conflict-free replicated data types (CRDTs) ensure seamless real-time syncing.
- **Live Cursors & Presence Tracking**: See exactly where other users are typing and whether they are active, idle, or away.
- **Rich Text Editor (Tiptap)**: Full formatting capabilities including headings, bold, italic, underline, highlights, text alignment, and lists.
- **Auto-Save functionality**: Changes are automatically debounced and persisted to the database to prevent data loss.
- **Offline Resilience**: Automatic reconnection and synchronization of offline edits.

### 💬 Inline Comments & Discussions
- **Selection-Based Commenting**: Highlight text and attach context-aware comments directly to the document.
- **Threaded Replies**: Engage in detailed discussions with nested reply threads on specific comments.
- **Comment States**: Resolve, reopen, or delete comments as discussions evolve.
- **Comment Sidebar**: A dedicated, filterable sidebar to view all active and resolved comments at a glance.
- **Real-Time Comment Syncing**: Instantly see new comments and replies from collaborators without refreshing.

### 🛡️ Document Sharing & Permissions
- **Granular Roles**: Share documents assigning users as `OWNER`, `EDITOR`, `COMMENTER`, or `VIEWER`.
- **Read-Only Mode**: The editor automatically gracefully degrades into a read-only view for users lacking edit permissions, with a clear permission banner.
- **Share Dialog**: Manage active collaborators, invite new users via email, and instantly update permission tiers.

### 📜 Version History
- **Automatic Snapshots**: The system tracks document changes over time.
- **Version Sidebar**: View the history of the document and see previous states.

### 🎨 Modern, Interactive User Interface
- **Next.js App Router**: Optimized, fast, and SEO-friendly React framework.
- **Shadcn UI & Tailwind CSS**: A beautiful, accessible, and highly responsive design system featuring dark mode and glassmorphism elements.
- **Framer Motion Animations**: Smooth micro-animations for page transitions, modals, and list items to enhance user experience.
- **Dashboard Interface**: Organize documents with tabs for "My Documents", "Shared With Me", and "Recent".

---

## 🏗️ Architecture & Technology Stack

### **Frontend**
- **Framework**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui Components, Framer Motion
- **Editor**: Tiptap Editor (ProseMirror based)
- **State Management & Fetching**: React Query (TanStack Query), Axios
- **Real-Time**: Socket.IO Client, Yjs (CRDT)

### **Backend**
- **Framework**: NestJS, TypeScript
- **Database**: PostgreSQL (relational data), Prisma ORM
- **Caching & Pub/Sub**: Redis
- **Real-Time**: Socket.IO Server
- **Security & Auth**: Passport.js, JWT, bcrypt, speakeasy (for MFA)

### **Infrastructure**
- **Containerization**: Docker & Docker Compose
- **Databases**: PostgreSQL 16, Redis 7

---

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 12+
- Redis 6+
- Docker (optional, for easy infrastructure setup)

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/HabtamuShewamene/insa-summer-camp.git
cd insa-summer-camp/challenges/challenge4-authentication system
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration, especially Database URLs, JWT secrets, and Email SMTP settings.
```

3. **Install dependencies**
```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate deploy

# Frontend
cd ../frontend
npm install
```

4. **Start the Infrastructure (Optional, if using Docker)**
```bash
docker-compose up -d
```

5. **Start services locally**
```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

6. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

---

## 🔧 Environment Configuration

Key configuration variables for your `.env` file:

```bash
# Database & Redis
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
REDIS_URL=redis://localhost:6379

# JWT Secrets (generate secure random strings)
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback

# Email SMTP (for verification & password resets)
MAIL_HOST=smtp.gmail.com
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password

# Application URLs
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 🛡️ Security Measures

- **JWT-based authentication** with short-lived access tokens and secure, HTTP-only refresh tokens.
- **CSRF & XSS protection** utilizing modern React practices and helmet.
- **Rate limiting** configured per IP and user to protect against brute force and DDoS attacks.
- **SQL injection protection** automatically handled by Prisma ORM.
- **Strict Input Validation** using class-validator and Zod schemas across the stack.
- **Secure Password Hashing** using bcrypt.

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test
npm run test:e2e

# Frontend tests
cd frontend
npm run test
```

---

Made with ❤️ by the INSA Summer Camp Development Team
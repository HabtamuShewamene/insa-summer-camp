# Collaborative Document Platform

A production-ready, real-time collaborative document editing platform built with modern web technologies. Features include Google Docs-style editing, real-time collaboration, comments, version history, and enterprise-level document sharing.

## 🚀 Features

### Core Features
- ✅ **Real-time Collaboration** - Multiple users editing simultaneously with Yjs and Socket.IO
- ✅ **Rich Text Editor** - Powered by Tiptap with full formatting support
- ✅ **Live Cursors** - See where other users are editing in real-time
- ✅ **Presence Awareness** - Know who's viewing or editing documents
- ✅ **Auto-save** - Never lose your work with automatic saving
- ✅ **Google Docs-style Comments** - Comment on text selections with threaded replies
- ✅ **Version History** - Track changes and restore previous versions
- ✅ **Document Sharing** - Share with fine-grained permission control

### Advanced Features
- ✅ **Global Search** - Search across documents, comments, and content
- ✅ **Export** - Download as PDF, Markdown, Plain Text, or HTML
- ✅ **Markdown Import** - Import existing markdown files
- ✅ **Keyboard Shortcuts** - Professional workflow with keyboard commands
- ✅ **Command Palette** - Quick access to all features (Ctrl+K)
- ✅ **Notifications** - Real-time in-app notifications
- ✅ **User Profiles** - Activity tracking and statistics

### Security & Performance
- ✅ **Authentication** - JWT-based with refresh tokens
- ✅ **Google OAuth** - Single sign-on support
- ✅ **Role-based Access Control** - Owner, Editor, Commenter, Viewer roles
- ✅ **Rate Limiting** - Protection against abuse
- ✅ **Session Management** - Multi-device session tracking
- ✅ **Performance Optimized** - Lazy loading, code splitting, caching

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tiptap Editor
- Tailwind CSS
- Shadcn/ui Components
- React Query (TanStack Query)
- Socket.IO Client
- Yjs (CRDT)

**Backend:**
- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- Socket.IO
- JWT Authentication
- Passport.js

**Infrastructure:**
- Docker & Docker Compose
- Nginx (optional reverse proxy)
- PostgreSQL 16
- Redis 7

### Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/           # Authentication & OAuth
│   │   │   ├── documents/      # Document CRUD
│   │   │   ├── comments/       # Comments & replies
│   │   │   ├── versions/       # Version history
│   │   │   ├── sharing/        # Permissions & sharing
│   │   │   ├── search/         # Global search
│   │   │   ├── export/         # Document export
│   │   │   ├── socket/         # WebSocket server
│   │   │   └── sessions/       # Session management
│   │   ├── common/
│   │   │   ├── guards/         # Authentication guards
│   │   │   ├── filters/        # Exception filters
│   │   │   └── decorators/     # Custom decorators
│   │   ├── prisma/             # Database client
│   │   └── health/             # Health checks
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── migrations/         # Database migrations
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── app/                # Next.js pages
│   │   ├── components/         # React components
│   │   │   ├── editor/         # Tiptap editor
│   │   │   ├── comments/       # Comment system
│   │   │   ├── sharing/        # Sharing UI
│   │   │   ├── search/         # Search components
│   │   │   └── ui/             # Shadcn components
│   │   ├── lib/                # Services & utilities
│   │   │   ├── auth-context.tsx
│   │   │   ├── collaboration-context.tsx
│   │   │   └── *.service.ts    # API services
│   │   └── hooks/              # Custom React hooks
│   └── Dockerfile
│
├── docker-compose.yml          # Production deployment
├── .env.example                # Environment template
├── API_DOCUMENTATION.md        # API docs
└── README.md                   # This file
```

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+
- Redis 6+
- Docker (optional)

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/collaborative-platform.git
cd collaborative-platform
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
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

4. **Start services**
```bash
# Terminal 1 - PostgreSQL (if not using Docker)
postgres -D /usr/local/var/postgres

# Terminal 2 - Redis (if not using Docker)
redis-server

# Terminal 3 - Backend
cd backend
npm run start:dev

# Terminal 4 - Frontend
cd frontend
npm run dev
```

5. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Health: http://localhost:3001/health

### Docker Deployment

1. **Configure environment**
```bash
cp .env.example .env
# Update .env with production values
```

2. **Build and start containers**
```bash
docker-compose up -d
```

3. **Run migrations**
```bash
docker-compose exec backend npx prisma migrate deploy
```

4. **Check health**
```bash
curl http://localhost:3001/health
```

## 🔧 Configuration

### Environment Variables

Key configuration variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# JWT Secrets (generate secure random strings)
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback

# Email (for notifications)
MAIL_HOST=smtp.gmail.com
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password

# URLs
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Database Migrations

```bash
# Create a new migration
npx prisma migrate dev --name description

# Apply migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

## 🚀 Deployment

### Production Checklist

- [ ] Set strong JWT secrets
- [ ] Configure HTTPS/SSL certificates
- [ ] Set up database backups
- [ ] Configure Redis persistence
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting
- [ ] Set up CDN for static assets
- [ ] Enable CORS for production domains
- [ ] Configure email service
- [ ] Set up error tracking (Sentry)

### Docker Production

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Scale services
docker-compose up -d --scale backend=3

# Stop services
docker-compose down
```

### Health Checks

- **Liveness**: `GET /health/live` - Is service running?
- **Readiness**: `GET /health/ready` - Is service ready for traffic?
- **Health**: `GET /health` - Detailed health status

## 🎯 Usage

### Creating a Document

1. Log in or register
2. Click "New Document" in dashboard
3. Start typing in the editor
4. Changes save automatically

### Collaborating in Real-time

1. Share document with users
2. Set appropriate permissions (Owner/Editor/Commenter/Viewer)
3. Collaborators can edit simultaneously
4. See live cursors and presence indicators

### Commenting

1. Select text in the document
2. Click the comment button
3. Add your comment
4. Team members can reply
5. Resolve when discussion is complete

### Version History

1. Click "History" in document header
2. Browse previous versions
3. Preview changes
4. Restore if needed

### Keyboard Shortcuts

- `Ctrl + N` - New document
- `Ctrl + K` - Quick search
- `Ctrl + /` - Show shortcuts
- `Ctrl + S` - Manual save
- `Ctrl + Shift + S` - Create version snapshot
- `Ctrl + Shift + P` - Command palette

## 📖 API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test
npm run test:e2e
npm run test:cov

# Frontend tests
cd frontend
npm run test
npm run test:e2e
```

## 🐛 Troubleshooting

### Common Issues

**Database connection fails:**
```bash
# Check PostgreSQL is running
pg_isready

# Verify DATABASE_URL is correct
echo $DATABASE_URL
```

**Socket.IO connection issues:**
- Ensure CORS is configured correctly
- Check firewall/security group rules
- Verify WebSocket support on reverse proxy

**Authentication errors:**
- Clear cookies and local storage
- Verify JWT secrets match between deployments
- Check token expiration times

## 📊 Performance

- **Initial load**: < 2s (optimized builds)
- **Time to interactive**: < 3s
- **Real-time latency**: < 100ms (local network)
- **Concurrent users per document**: 50+ (tested)
- **Document size limit**: 10MB (configurable)

## 🔒 Security

- JWT-based authentication with refresh tokens
- httpOnly cookies for token storage
- CSRF protection
- Rate limiting per IP and user
- SQL injection protection via Prisma
- XSS protection
- Input validation and sanitization
- Secure session management
- Permission-based access control

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Tiptap for the excellent editor
- Yjs for CRDT collaboration
- Shadcn for beautiful UI components
- NestJS and Next.js teams

## 📞 Support

- Documentation: [docs.yourapp.com](https://docs.yourapp.com)
- Issues: [GitHub Issues](https://github.com/yourusername/collab-platform/issues)
- Email: support@yourapp.com

## 🗺️ Roadmap

- [ ] Mobile apps (iOS/Android)
- [ ] Advanced analytics
- [ ] Document templates
- [ ] AI-powered suggestions
- [ ] Advanced export options
- [ ] Integrations (Slack, Teams)
- [ ] Offline mode support

---

Made with ❤️ by Your Team
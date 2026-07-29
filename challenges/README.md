# INSA Summer Camp - Programming Challenges

Welcome to the INSA Summer Camp programming challenges! This collection contains hands-on coding exercises designed to build practical development skills across various technologies and concepts.

## 🎯 Overview

This repository contains **4 progressive challenges** covering essential development skills from environment setup to enterprise-level system design. Each challenge builds upon previous concepts while introducing new technologies and best practices.

## 🛠️ Prerequisites

Before starting, ensure you have the following installed on your system:

### Essential Tools
- **Python 3.8+** - For Python-based challenges
- **Node.js 18+** - For JavaScript/TypeScript challenges  
- **npm** - Node package manager (comes with Node.js)
- **Git** - Version control system

### Optional Tools (Challenge-Specific)
- **Docker Desktop** - For database setup (Challenge 4)
- **PostgreSQL** - Database (can be run via Docker)
- **Google Cloud Account** - For OAuth integration (Challenge 4)

### Development Environment
- **Code Editor** (VS Code recommended)
- **Terminal/Command Line** access
- **Web Browser** for testing web applications

## 📚 Challenge Structure

### Challenge 1: Environment Verification
**🔧 Focus:** Development Environment Setup  
**📁 Directory:** `challenge-1/`  
**⚡ Technologies:** Python  
**⏱️ Duration:** 15-30 minutes

Verify your development environment is properly configured. This foundational challenge ensures all necessary tools are installed and working correctly.

**Key Learning:**
- Environment validation
- Python scripting basics
- Cross-platform development considerations

---

### Challenge 2: Git Workflow Mastery
**🔧 Focus:** Advanced Git Operations  
**📁 Directory:** `Challenge22/`  
**⚡ Technologies:** Node.js, Express.js  
**⏱️ Duration:** 60-90 minutes

Master Git workflows through a realistic backend API scenario. Practice advanced Git operations including history cleanup, merge conflicts, and release preparation.

**Key Learning:**
- Feature branch workflows
- Merge conflict resolution
- History rewriting and cleanup
- Production hotfix procedures
- Release preparation strategies

**Features:**
- Task Management API
- User authentication
- RESTful endpoints
- Express middleware

---

### Challenge 3: CLI Tool Development
**🔧 Focus:** Command-Line Interface Development  
**📁 Directory:** `challenge3/`  
**⚡ Technologies:** Python  
**⏱️ Duration:** 45-60 minutes

Build a personal CLI toolbox for note management. Learn argument parsing, file I/O, and creating user-friendly command-line applications.

**Key Learning:**
- CLI design principles
- Argument parsing with `argparse`
- JSON file handling
- Error handling and validation
- Code organization and modularity

**Features:**
- Add, list, and delete notes
- Persistent JSON storage
- Robust error handling
- Clean command interface

---

### Challenge 4: Enterprise Authentication System
**🔧 Focus:** Full-Stack Security & Authentication  
**📁 Directory:** `challenge4-authentication system/`  
**⚡ Technologies:** NestJS, Next.js, PostgreSQL, Prisma, TypeScript  
**⏱️ Duration:** 2-3 hours

Build a production-ready identity and authentication platform with advanced security features, OAuth integration, and comprehensive session management.

**Key Learning:**
- Enterprise-level architecture
- JWT and refresh token strategies
- OAuth 2.0 implementation (Google)
- Security best practices
- Rate limiting and brute-force protection
- Database design with Prisma ORM
- Full-stack TypeScript development

**Features:**
- Secure user registration and login
- Google OAuth integration
- Session management and revocation
- Password strength validation
- Suspicious login detection
- Comprehensive audit logging
- Rate limiting and security controls
- Modern React UI with Next.js 15

## 🚀 Quick Start Guide

### 1. Clone the Repository
```bash
git clone <repository-url>
cd "insa summer camp/challenges"
```

### 2. Start with Challenge 1
```bash
cd challenge-1
python env_proof.py
```

### 3. Follow the Progressive Path
Complete challenges in order: **1 → 2 → 3 → 4**

Each challenge directory contains its own detailed README with specific setup instructions.

## 📋 Challenge Completion Checklist

- [ ] **Challenge 1**: Environment verified and personalized
- [ ] **Challenge 2**: Git workflows mastered, history cleaned
- [ ] **Challenge 3**: CLI tool built and tested
- [ ] **Challenge 4**: Full authentication system deployed

## 🎓 Learning Outcomes

By completing all challenges, you will have gained experience in:

### Technical Skills
- **Python Development** (Challenges 1, 3)
- **JavaScript/TypeScript** (Challenges 2, 4)
- **Backend APIs** (Express.js, NestJS)
- **Frontend Development** (Next.js, React)
- **Database Design** (PostgreSQL, Prisma)
- **Authentication & Security** (JWT, OAuth, Rate Limiting)

### Development Practices
- **Git Workflows** (branching, merging, history management)
- **CLI Design** (user experience, argument parsing)
- **Security Patterns** (password policies, session management)
- **Testing Strategies** (unit tests, integration tests)
- **Documentation** (README files, code comments)

### DevOps & Tools
- **Environment Setup** (development toolchain)
- **Database Management** (Docker, migrations)
- **Package Management** (npm, Python packages)
- **Deployment Preparation** (production checklists)

## 🔧 Troubleshooting

### Common Issues

**Python Command Not Found**
```bash
# Try alternative Python commands
python3 --version
py --version
```

**Node.js Issues**
```bash
# Verify installation
node --version
npm --version
```

**Permission Errors**
- On Windows: Run as Administrator if needed
- On macOS/Linux: Check file permissions with `chmod +x`

**Port Conflicts**
- Challenge 2: Default port 3000
- Challenge 4: Backend 3001, Frontend 3000
- Use different ports if conflicts occur

### Getting Help

1. **Check individual challenge READMEs** for specific instructions
2. **Review error messages** carefully - they often contain solutions
3. **Verify prerequisites** are installed and up-to-date
4. **Test with simple examples** before complex implementations

## 📁 Repository Structure

```
challenges/
├── README.md                          # This file
├── challenge-1/                       # Environment setup
│   ├── env_proof.py
│   └── README.md
├── Challenge22/                       # Git workflows
│   ├── src/
│   ├── docs/
│   ├── package.json
│   └── README.md
├── challenge3/                        # CLI development
│   ├── notes.py
│   ├── notes.json
│   └── README.md
└── challenge4-authentication system/  # Full-stack auth
    ├── backend/                       # NestJS API
    ├── frontend/                      # Next.js app
    └── README.md
```

## 🎉 Next Steps

After completing all challenges:

1. **Portfolio Projects**: Use these as foundation for personal projects
2. **Advanced Topics**: Explore microservices, containerization, CI/CD
3. **Open Source**: Contribute to open source projects
4. **Specialization**: Deep dive into areas of interest (frontend, backend, DevOps)

---

**Happy Coding! 🚀**

*INSA Summer Camp - Building the Next Generation of Developers*
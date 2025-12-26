# Vibeyard - Quickstart Guide

**Status**: 🔧 Project foundation complete - Ready for local setup and OAuth implementation

---

## What's Been Set Up

### ✅ Project Foundation
- **Next.js 14** with App Router and TypeScript (strict mode)
- **Tailwind CSS** for styling with custom configuration
- **Prisma ORM** with PostgreSQL schema (NextAuth models included)
- **ESLint & Prettier** for code quality
- **Complete package.json** with all dependencies

### ✅ Authentication Infrastructure
- **NextAuth.js v5** fully configured with GitHub provider
- **Prisma Adapter** for database sessions
- **Auth API routes** at `/api/auth/[...nextauth]`
- **Type-safe session** with custom user properties
- **Auth utilities** in `/lib/auth.ts`

### ✅ Database & Caching
- **Prisma client singleton** (`/lib/prisma.ts`)
- **Redis client singleton** (`/lib/redis.ts`) with connection handling
- **Complete schema** with User, Account, Session, Repository models
- **Docker Compose** for PostgreSQL, Redis, and BullBoard

### ✅ Testing Infrastructure
- **Vitest** configuration with React Testing Library
- **Playwright** for E2E testing (5 browser configurations)
- **Coverage reports** configured
- **Mock setup** for NextAuth and Next.js router

### ✅ UI Component Library
- **Reusable Button component** with variants
- **Card components** (Card, CardHeader, CardTitle, etc.)
- **Layout components** (Header, Footer)
- **Utility functions** (cn, formatRelativeTime, truncate)

### ✅ Production Readiness
- **Environment-dependent CORS** configuration
- **.dockerignore** for optimized builds
- **Development scripts** in package.json
- **TypeScript strict mode** enabled

### ✅ Documentation
- **Technical Specification** (Confluence)
- **Implementation Plan** (Confluence)
- **Task Breakdown** (TASKS.md - 64 tasks, 377 hours)
- **Deployment Guide** (DEPLOYMENT.md)
- **Setup Guide** (SETUP.md)

### 🔄 In Progress
- GitHub OAuth credentials setup (user action required)
- Database migrations (pending)
- Initial `yarn dev` verification

---

## Getting Started Locally

### 1. Prerequisites Check

Ensure you have installed:
- **Node.js** 20.0.0 or higher
- **Yarn** 1.22.0 or higher
- **Docker** and **Docker Compose**

### 2. Install Dependencies

```bash
yarn install
```

### 3. Start Docker Services

```bash
yarn docker:up
```

This starts:
- **PostgreSQL** on `localhost:5432`
- **Redis** on `localhost:6379`
- **BullBoard** on `localhost:3001`

Verify services are running:
```bash
yarn docker:logs
```

### 4. Configure Environment Variables

```bash
cp .env.example .env
```

#### 4a. Generate NextAuth Secret

**Required**: Generate a secure secret:
```bash
openssl rand -base64 32
```

Add to `.env`:
```env
NEXTAUTH_SECRET="<paste-generated-secret-here>"
```

#### 4b. Create GitHub OAuth App

**Required**: Create GitHub OAuth App at https://github.com/settings/developers

Click **"New OAuth App"** and configure:
- **Application name**: `Vibeyard Local`
- **Homepage URL**: `http://localhost:3000`
- **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`

After creating the app:
1. Copy the **Client ID**
2. Click **"Generate a new client secret"** and copy the secret

Add to `.env`:
```env
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

### 5. Set Up Database

Run Prisma migrations to create database tables:

```bash
# Generate Prisma client
yarn prisma:generate

# Run migrations (creates tables)
yarn prisma:migrate

# Optional: Open Prisma Studio to view database
yarn prisma:studio
```

### 6. Start Development Server

```bash
yarn dev
```

The application will be available at:
- **App**: http://localhost:3000
- **BullBoard** (Queue monitoring): http://localhost:3001

### 7. Verify Setup

See **CHECKLIST.md** for a complete verification checklist.

---

## Next Development Tasks

Based on the implementation plan, here are the immediate next steps:

### Sprint 1: Foundation (In Progress)

- ✅ **VIBE-2**: Initialize Next.js Project (DONE)
- 🔄 **VIBE-3**: Configure Database with Prisma (Database setup done, need migrations)
- 🔄 **VIBE-4**: Set Up Redis (Docker setup done, need client setup)
- 🔄 **VIBE-5**: Configure Environment Variables (Template done, need actual values)
- ⏳ **VIBE-45**: Set Up Tailwind CSS (Config done, need design tokens)
- ⏳ **VIBE-6**: Set Up CI/CD Pipeline (Documented, need to implement)
- ⏳ **VIBE-7**: Set Up Monitoring (Need to implement)

### Sprint 2: Authentication (Next Priority)

- ⏳ **VIBE-8**: Implement GitHub OAuth
- ⏳ **VIBE-9**: Create User Models and Services
- ⏳ **VIBE-10**: Build Authentication API Endpoints
- ⏳ **VIBE-11**: Create Authentication UI Components
- ⏳ **VIBE-12**: Implement Authorization Middleware

### Immediate Action Items

1. **Complete Environment Setup**:
   - Generate NEXTAUTH_SECRET
   - Create GitHub OAuth App
   - Update `.env` file

2. **Run Database Migrations**:
   ```bash
   yarn prisma:migrate
   yarn prisma:generate
   ```

3. **Start Development**:
   ```bash
   yarn dev
   ```

4. **Begin VIBE-8**: Implement GitHub OAuth authentication

---

## Project Structure

```
vibeyard/
├── .dockerignore             ✅ Docker build optimization
├── .env.example              ✅ Environment template
├── .eslintrc.json            ✅ ESLint config
├── .prettierrc               ✅ Prettier config
├── docker-compose.yml        ✅ Local services
├── next.config.js            ✅ Next.js config (with env-dependent CORS)
├── package.json              ✅ Dependencies
├── playwright.config.ts      ✅ E2E test config
├── postcss.config.js         ✅ PostCSS config
├── tailwind.config.ts        ✅ Tailwind config
├── tsconfig.json             ✅ TypeScript config
├── vitest.config.ts          ✅ Unit test config
├── vitest.setup.ts           ✅ Test setup and mocks
├── app/
│   ├── api/auth/[...nextauth]/
│   │   └── route.ts          ✅ NextAuth handler
│   ├── globals.css           ✅ Global styles
│   ├── layout.tsx            ✅ Root layout
│   └── page.tsx              ✅ Homepage
├── components/
│   ├── layout/
│   │   ├── footer.tsx        ✅ Footer component
│   │   ├── header.tsx        ✅ Header component
│   │   └── index.ts          ✅ Layout exports
│   └── ui/
│       ├── button.tsx        ✅ Button component
│       ├── card.tsx          ✅ Card components
│       └── index.ts          ✅ UI exports
├── e2e/
│   └── example.spec.ts       ✅ Example E2E test
├── lib/
│   ├── auth.ts               ✅ NextAuth configuration
│   ├── prisma.ts             ✅ Prisma client singleton
│   ├── redis.ts              ✅ Redis client singleton
│   └── utils.ts              ✅ Utility functions
├── prisma/
│   └── schema.prisma         ✅ Database schema (with NextAuth models)
├── public/                   ✅ Static assets directory
├── services/                 ✅ Service layer directory
├── types/
│   └── next-auth.d.ts        ✅ NextAuth type definitions
├── helm/                     ⏳ To be created
└── .github/workflows/        ⏳ To be created
```

---

## Documentation Links

### Confluence
- **Technical Specification**: https://techopsservices.atlassian.net/wiki/spaces/VIBE/pages/1769492
- **Implementation Plan**: https://techopsservices.atlassian.net/wiki/spaces/VIBE/pages/1441811

### JIRA
- **Project**: https://techopsservices.atlassian.net/jira/software/projects/VIBE
- **Epic VIBE-1**: Phase 1: Core Platform

### Local Documentation
- **SETUP.md**: Detailed local development setup
- **DEPLOYMENT.md**: K8s + Helm + GitHub Actions deployment strategy
- **TASKS.md**: Complete task breakdown (64 tasks)
- **PHASE1_SUMMARY.md**: Phase 1 overview and summary
- **README.md**: Project description and vision

---

## Commands Reference

### Development
```bash
yarn dev              # Start dev server
yarn build            # Build for production
yarn start            # Start production server
yarn lint             # Run linter
yarn type-check       # TypeScript checking
yarn format           # Format code
```

### Database
```bash
yarn prisma:migrate   # Run migrations
yarn prisma:generate  # Generate Prisma client
yarn prisma:studio    # Open database GUI
yarn prisma:seed      # Seed database
```

### Docker
```bash
yarn docker:up        # Start services
yarn docker:down      # Stop services
yarn docker:logs      # View logs
```

### Testing (when implemented)
```bash
yarn test             # Run tests
yarn test:watch       # Watch mode
yarn test:coverage    # Coverage report
yarn test:e2e         # E2E tests
```

---

## Key Technologies

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL 15+ (Prisma ORM)
- **Cache/Queue**: Redis (BullMQ)
- **Auth**: NextAuth.js v5
- **GitHub API**: Octokit
- **AI**: OpenAI API (GPT-4)
- **Deployment**: Kubernetes + Helm
- **CI/CD**: GitHub Actions

---

## Success Criteria

### Phase 1 Launch Goals
- 50+ repositories connected
- 20+ active users
- 100+ votes cast
- 50+ follows created
- 80% analysis success rate
- <2s page load time (p95)
- 99.5%+ uptime

---

## Getting Help

1. Check **SETUP.md** for detailed setup instructions
2. Review **TASKS.md** for task details
3. Read the Technical Specification in Confluence
4. Check JIRA for task status and assignments

---

## Ready to Build? 🚀

Follow the "Getting Started Locally" steps above, then begin with VIBE-8 (Implement GitHub OAuth).

The junkyard awaits your vibecode! 🏗️

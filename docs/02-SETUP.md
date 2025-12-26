# Vibeyard - Local Development Setup

This guide will help you set up Vibeyard for local development.

---

## Prerequisites

- **Node.js** 20+ and **Yarn** 1.22+
- **Docker** and **Docker Compose**
- **Git**
- **GitHub Account** (for OAuth)
- **OpenAI API Key** (optional, for AI-powered analysis)

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/vibeyard.git
cd vibeyard
```

### 2. Start Docker Services

Start PostgreSQL and Redis using Docker Compose:

```bash
yarn docker:up
```

This will start:
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`
- BullBoard (job queue UI) on `localhost:3001`

To stop services:
```bash
yarn docker:down
```

To view logs:
```bash
yarn docker:logs
```

### 3. Install Dependencies

```bash
yarn install
```

### 4. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure the following:

#### Required Configuration

**Database** (already configured for Docker Compose):
```env
DATABASE_URL="postgresql://vibeyard:vibeyard_dev_password@localhost:5432/vibeyard"
```

**Redis** (already configured for Docker Compose):
```env
REDIS_URL="redis://localhost:6379"
```

**NextAuth.js**:
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
```

**GitHub OAuth** (see setup instructions below):
```env
GITHUB_CLIENT_ID="your-github-oauth-app-client-id"
GITHUB_CLIENT_SECRET="your-github-oauth-app-client-secret"
```

#### Optional Configuration

**OpenAI API** (for AI-powered repository analysis):
```env
OPENAI_API_KEY="your-openai-api-key"
```

**Sentry** (for error tracking):
```env
SENTRY_DSN="your-sentry-dsn"
NEXT_PUBLIC_SENTRY_DSN="your-sentry-dsn"
```

### 5. Set Up GitHub OAuth Application

1. Go to [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in the form:
   - **Application name**: Vibeyard (Development)
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click **"Register application"**
5. Copy the **Client ID** and **Client Secret** to your `.env` file

### 6. Set Up the Database

Run Prisma migrations to create database tables:

```bash
yarn prisma:migrate
```

Generate Prisma client:

```bash
yarn prisma:generate
```

(Optional) Seed the database with sample data:

```bash
yarn prisma:seed
```

### 7. Start the Development Server

```bash
yarn dev
```

The application will be available at:
- **App**: http://localhost:3000
- **BullBoard (job queue UI)**: http://localhost:3001

---

## Development Commands

### Core Commands

```bash
# Development server
yarn dev

# Build for production
yarn build

# Start production server
yarn start

# Run linter
yarn lint

# Type checking
yarn type-check

# Format code
yarn format
```

### Database Commands

```bash
# Create and run migrations
yarn prisma:migrate

# Generate Prisma client
yarn prisma:generate

# Open Prisma Studio (database GUI)
yarn prisma:studio

# Seed database with sample data
yarn prisma:seed
```

### Docker Commands

```bash
# Start services (detached)
yarn docker:up

# Stop services
yarn docker:down

# View logs
yarn docker:logs
```

### Testing Commands

```bash
# Run unit tests
yarn test

# Run tests in watch mode
yarn test:watch

# Generate test coverage
yarn test:coverage

# Run end-to-end tests
yarn test:e2e
```

---

## Project Structure

```
vibeyard/
├── app/                    # Next.js App Router
│   ├── api/                # API routes
│   ├── (auth)/             # Auth-related pages
│   ├── (marketplace)/      # Public marketplace pages
│   ├── workbench/          # Private dashboard pages
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Homepage
│   └── globals.css         # Global styles
├── components/             # React components
│   ├── ui/                 # Base UI components
│   ├── repository/         # Repository components
│   ├── auth/               # Auth components
│   └── layout/             # Layout components
├── lib/                    # Utilities and helpers
│   ├── prisma.ts           # Prisma client instance
│   ├── redis.ts            # Redis client
│   ├── utils.ts            # Utility functions
│   └── constants.ts        # App constants
├── services/               # Business logic layer
│   ├── user.service.ts
│   ├── repository.service.ts
│   ├── github.service.ts
│   ├── analysis.service.ts
│   ├── vote.service.ts
│   └── follow.service.ts
├── types/                  # TypeScript type definitions
│   ├── api.ts
│   ├── repository.ts
│   └── user.ts
├── prisma/                 # Database schema and migrations
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/                 # Static assets
├── docker-compose.yml      # Local Docker services
├── Dockerfile              # Production Docker image
├── helm/                   # Kubernetes Helm charts
└── .github/                # GitHub Actions workflows
```

---

## Accessing Services

### Prisma Studio

View and edit database records with Prisma Studio:

```bash
yarn prisma:studio
```

Opens at: http://localhost:5555

### BullBoard

Monitor background job queues:

Open: http://localhost:3001

### PostgreSQL

Connect to the database directly:

```bash
psql postgresql://vibeyard:vibeyard_dev_password@localhost:5432/vibeyard
```

### Redis CLI

Connect to Redis:

```bash
redis-cli -h localhost -p 6379
```

---

## Troubleshooting

### Port Already in Use

If port 3000, 5432, or 6379 is already in use:

1. Stop the conflicting service
2. Or update the port in `docker-compose.yml` and `.env`

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps

# Restart Docker services
yarn docker:down
yarn docker:up

# Check logs
yarn docker:logs
```

### Prisma Client Out of Sync

If you see "Prisma Client is not generated" errors:

```bash
yarn prisma:generate
```

### GitHub OAuth Issues

1. Verify callback URL matches: `http://localhost:3000/api/auth/callback/github`
2. Check that Client ID and Secret are correctly set in `.env`
3. Restart the development server after changing `.env`

---

## Next Steps

1. ✅ **Set up local environment** (you're here!)
2. 📖 **Read the** [Technical Specification](https://techopsservices.atlassian.net/wiki/spaces/VIBE/pages/1769492)
3. 📋 **Check** [TASKS.md](./TASKS.md) **for implementation tasks**
4. 🚀 **Start with VIBE-2**: Initialize project (already done!)
5. 👉 **Next: VIBE-8**: Implement GitHub OAuth

---

## Helpful Links

- **Confluence Space**: https://techopsservices.atlassian.net/wiki/spaces/VIBE
- **JIRA Project**: https://techopsservices.atlassian.net/jira/software/projects/VIBE
- **Technical Spec**: https://techopsservices.atlassian.net/wiki/spaces/VIBE/pages/1769492
- **Implementation Plan**: https://techopsservices.atlassian.net/wiki/spaces/VIBE/pages/1441811

---

## Contributing

1. Create a feature branch from `develop`
2. Make your changes
3. Run tests and linting
4. Create a pull request to `develop`

For detailed contribution guidelines, see [CONTRIBUTING.md](./CONTRIBUTING.md) (coming soon).

---

## Questions?

- Check the [Technical Specification](https://techopsservices.atlassian.net/wiki/spaces/VIBE/pages/1769492)
- Review [TASKS.md](./TASKS.md) for task breakdown
- Ask in team channels

Happy coding! 🏗️

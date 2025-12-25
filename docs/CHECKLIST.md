# Vibeyard Local Setup Verification Checklist

Use this checklist to verify that your local development environment is set up correctly.

---

## Prerequisites

- [ ] **Node.js** 20.0.0 or higher installed
  ```bash
  node --version
  ```

- [ ] **Yarn** 1.22.0 or higher installed
  ```bash
  yarn --version
  ```

- [ ] **Docker** and **Docker Compose** installed
  ```bash
  docker --version
  docker-compose --version
  ```

---

## Installation & Configuration

### Dependencies

- [ ] Dependencies installed successfully
  ```bash
  yarn install
  # Should complete without errors
  ```

### Docker Services

- [ ] Docker services started
  ```bash
  yarn docker:up
  ```

- [ ] PostgreSQL is running on port 5432
  ```bash
  docker ps | grep postgres
  ```

- [ ] Redis is running on port 6379
  ```bash
  docker ps | grep redis
  ```

- [ ] Can access BullBoard at http://localhost:3001
  - Open in browser and verify queue dashboard loads

### Environment Variables

- [ ] `.env` file created from `.env.example`
  ```bash
  ls -la .env
  ```

- [ ] `NEXTAUTH_SECRET` is set (should be 32+ character base64 string)
  ```bash
  grep NEXTAUTH_SECRET .env
  ```

- [ ] `GITHUB_CLIENT_ID` is set
  ```bash
  grep GITHUB_CLIENT_ID .env
  ```

- [ ] `GITHUB_CLIENT_SECRET` is set
  ```bash
  grep GITHUB_CLIENT_SECRET .env
  ```

- [ ] All required environment variables are present:
  - `DATABASE_URL`
  - `REDIS_URL`
  - `NEXTAUTH_URL`
  - `NEXTAUTH_SECRET`
  - `GITHUB_CLIENT_ID`
  - `GITHUB_CLIENT_SECRET`

### GitHub OAuth App

- [ ] GitHub OAuth App created at https://github.com/settings/developers

- [ ] OAuth App configured with:
  - Homepage URL: `http://localhost:3000`
  - Callback URL: `http://localhost:3000/api/auth/callback/github`

- [ ] Client ID copied to `.env`

- [ ] Client Secret generated and copied to `.env`

---

## Database Setup

### Prisma

- [ ] Prisma client generated
  ```bash
  yarn prisma:generate
  # Should complete successfully
  ```

- [ ] Database migrations run successfully
  ```bash
  yarn prisma:migrate
  # Should create all tables without errors
  ```

- [ ] Can connect to database
  ```bash
  yarn prisma:studio
  # Should open Prisma Studio in browser
  ```

### Database Tables

Verify these tables exist in Prisma Studio (http://localhost:5555):
- [ ] `users`
- [ ] `accounts`
- [ ] `sessions`
- [ ] `verification_tokens`
- [ ] `repositories`
- [ ] `repository_analyses`
- [ ] `votes`
- [ ] `follows`
- [ ] `repository_views`
- [ ] `activities`

---

## Development Server

### Start Server

- [ ] Development server starts without errors
  ```bash
  yarn dev
  ```

- [ ] Server is running on http://localhost:3000

- [ ] No compilation errors in terminal

- [ ] No TypeScript errors
  ```bash
  yarn type-check
  ```

### Application

- [ ] Homepage loads at http://localhost:3000
  - Page should display without errors

- [ ] Can navigate to auth pages:
  - [ ] http://localhost:3000/api/auth/signin
  - Should show NextAuth sign-in page

- [ ] No console errors in browser DevTools

- [ ] Redis connection successful (check server logs for "✓ Redis connected")

---

## Authentication Flow

### GitHub OAuth

- [ ] Click "Sign in with GitHub" (when UI is implemented)
  - Should redirect to GitHub authorization page

- [ ] Authorize the application on GitHub
  - Should redirect back to http://localhost:3000

- [ ] Successfully authenticated
  - User session should be created in database

- [ ] Check session in Prisma Studio
  - Should see new records in `users`, `accounts`, and `sessions` tables

- [ ] Sign out works correctly

---

## File Structure Verification

### Core Files

- [ ] `/lib/prisma.ts` exists
- [ ] `/lib/auth.ts` exists
- [ ] `/lib/redis.ts` exists
- [ ] `/lib/utils.ts` exists
- [ ] `/app/api/auth/[...nextauth]/route.ts` exists
- [ ] `/types/next-auth.d.ts` exists

### Components

- [ ] `/components/ui/button.tsx` exists
- [ ] `/components/ui/card.tsx` exists
- [ ] `/components/ui/index.ts` exists
- [ ] `/components/layout/header.tsx` exists
- [ ] `/components/layout/footer.tsx` exists
- [ ] `/components/layout/index.ts` exists

### Configuration

- [ ] `/vitest.config.ts` exists
- [ ] `/vitest.setup.ts` exists
- [ ] `/playwright.config.ts` exists
- [ ] `/.dockerignore` exists
- [ ] `/e2e/example.spec.ts` exists

### Directories

- [ ] `/components/` directory exists
- [ ] `/services/` directory exists
- [ ] `/types/` directory exists
- [ ] `/public/` directory exists
- [ ] `/e2e/` directory exists

---

## Testing

### Unit Tests

- [ ] Unit tests can run (if any tests exist)
  ```bash
  yarn test
  ```

### E2E Tests

- [ ] Playwright installed
  ```bash
  npx playwright install
  ```

- [ ] E2E tests can run
  ```bash
  yarn test:e2e
  # Note: Server must be running
  ```

---

## Build Verification

### Production Build

- [ ] Production build completes successfully
  ```bash
  yarn build
  ```

- [ ] No build errors

- [ ] Production server starts
  ```bash
  yarn start
  ```

---

## Common Issues & Solutions

### Issue: Port already in use

**Solution**: Check for processes using ports 3000, 5432, 6379, or 3001
```bash
lsof -i :3000
lsof -i :5432
lsof -i :6379
lsof -i :3001
```

### Issue: Docker services won't start

**Solution**:
```bash
yarn docker:down
docker system prune -a
yarn docker:up
```

### Issue: Prisma client not found

**Solution**:
```bash
yarn prisma:generate
```

### Issue: Database connection refused

**Solution**:
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# If not, restart Docker services
yarn docker:down
yarn docker:up
```

### Issue: NextAuth configuration error

**Solution**: Verify all environment variables are set:
```bash
cat .env | grep -E "NEXTAUTH|GITHUB"
```

### Issue: Redis connection timeout

**Solution**:
```bash
# Check Redis logs
docker logs vibeyard-redis

# Restart Redis
docker restart vibeyard-redis
```

---

## Final Verification

- [ ] All checklist items above are completed
- [ ] Development server runs without errors
- [ ] Can access the application at http://localhost:3000
- [ ] Docker services are running
- [ ] Database is accessible
- [ ] Redis is connected
- [ ] Environment variables are configured
- [ ] GitHub OAuth is set up

---

## Next Steps

Once all items are checked:

1. ✅ **Foundation is complete!**
2. 🚀 **Begin implementing features** (start with authentication UI)
3. 📖 **Review TASKS.md** for detailed task breakdown
4. 🎯 **Check JIRA** for assigned tasks

---

## Getting Help

If you encounter issues:

1. Check the **Common Issues & Solutions** section above
2. Review **SETUP.md** for detailed setup instructions
3. Check Docker logs: `yarn docker:logs`
4. Verify environment variables: `cat .env`
5. Restart services: `yarn docker:down && yarn docker:up`

---

**Last Updated**: 2025-12-25

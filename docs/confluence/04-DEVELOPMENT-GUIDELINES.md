# Vibeyard - Development Guidelines

**Last Updated:** 2025-12-25
**Version:** 1.0
**For:** All developers contributing to Vibeyard

---

## Table of Contents

1. [Overview](#overview)
2. [Code Style & Standards](#code-style--standards)
3. [Project Structure](#project-structure)
4. [TypeScript Guidelines](#typescript-guidelines)
5. [React & Next.js Best Practices](#react--nextjs-best-practices)
6. [API Development](#api-development)
7. [Database Guidelines](#database-guidelines)
8. [Testing Requirements](#testing-requirements)
9. [Git Workflow](#git-workflow)
10. [Code Review Process](#code-review-process)
11. [Performance Optimization](#performance-optimization)
12. [Security Best Practices](#security-best-practices)
13. [Accessibility Standards](#accessibility-standards)

---

## Overview

These guidelines ensure consistency, maintainability, and quality across the Vibeyard codebase. All developers must follow these standards.

### Core Principles

1. **Clarity over Cleverness:** Write code that's easy to understand
2. **Type Safety First:** Leverage TypeScript's type system
3. **Test Everything:** Aim for 80%+ test coverage
4. **Performance Matters:** Write efficient, scalable code
5. **Security by Default:** Never compromise on security
6. **Accessibility Always:** Build for everyone

---

## Code Style & Standards

### Formatting

We use **Prettier** for automatic code formatting. Configuration:

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 90,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

**Run formatting:**
```bash
npm run format
```

### Linting

We use **ESLint** with TypeScript rules. Configuration: `.eslintrc.json`

**Run linting:**
```bash
npm run lint
```

**Auto-fix issues:**
```bash
npm run lint -- --fix
```

### Naming Conventions

#### Files and Folders

```
✅ Good
components/auth/sign-in-button.tsx
services/repository-service.ts
lib/utils.ts

❌ Bad
components/auth/SignInButton.tsx
services/RepositoryService.ts
lib/Utils.ts
```

**Rules:**
- Use kebab-case for files: `user-avatar.tsx`
- Use kebab-case for folders: `api-routes/`
- Component files match component name: `Button.tsx` exports `Button`
- Test files: `button.test.tsx` or `button.spec.tsx`

#### Variables and Functions

```typescript
// ✅ Good
const userRepository = await getRepository()
const isAuthenticated = checkAuth()
function calculateCompleteness(repo: Repository): number

// ❌ Bad
const UserRepository = await getRepository()
const authenticated = checkAuth()
function calc_completeness(repo: Repository): number
```

**Rules:**
- Use camelCase for variables and functions
- Use descriptive names (no single letters except loops)
- Boolean variables start with `is`, `has`, `should`, `can`
- Functions start with verbs: `get`, `set`, `create`, `update`, `delete`, `fetch`

#### Types and Interfaces

```typescript
// ✅ Good
interface User { ... }
type RepositoryStatus = 'pending' | 'processing' | 'completed'
class GitHubClient { ... }

// ❌ Bad
interface IUser { ... }
type repositoryStatus = 'pending' | 'processing' | 'completed'
class githubClient { ... }
```

**Rules:**
- Use PascalCase for types, interfaces, classes
- Don't prefix interfaces with `I`
- Use `type` for unions and aliases
- Use `interface` for object shapes

#### Constants

```typescript
// ✅ Good
const MAX_REPOSITORIES = 100
const DEFAULT_PAGE_SIZE = 20
const CACHE_TTL_SECONDS = 3600

// ❌ Bad
const maxRepositories = 100
const default_page_size = 20
```

**Rules:**
- Use SCREAMING_SNAKE_CASE for constants
- Define constants at module top level

---

## Project Structure

### Directory Organization

```
vibeyard/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route group for auth pages
│   │   ├── signin/
│   │   └── signout/
│   ├── (public)/                 # Route group for public pages
│   │   ├── page.tsx              # Landing page (Yard Lot)
│   │   └── repositories/
│   │       └── [id]/             # Repository detail page
│   ├── (protected)/              # Route group for protected pages
│   │   └── workbench/            # User dashboard
│   ├── api/                      # API routes
│   │   ├── auth/
│   │   ├── repositories/
│   │   ├── votes/
│   │   └── follows/
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles
│   └── error.tsx                 # Error boundary
│
├── components/                   # React components
│   ├── ui/                       # UI primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── index.ts
│   ├── layout/                   # Layout components
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   └── index.ts
│   ├── auth/                     # Authentication components
│   ├── repository/               # Repository-specific components
│   └── dashboard/                # Dashboard components
│
├── lib/                          # Shared utilities and configs
│   ├── auth.ts                   # NextAuth configuration
│   ├── prisma.ts                 # Prisma client singleton
│   ├── redis.ts                  # Redis client singleton
│   ├── utils.ts                  # Utility functions
│   └── queue.ts                  # BullMQ configuration
│
├── services/                     # Business logic layer
│   ├── user-service.ts           # User operations
│   ├── repository-service.ts    # Repository operations
│   ├── github-client.ts          # GitHub API client
│   ├── analysis-service.ts       # Repository analysis
│   ├── ai-detection-service.ts   # AI detection logic
│   ├── vote-service.ts           # Vote operations
│   └── follow-service.ts         # Follow operations
│
├── workers/                      # Background job workers
│   ├── analysis-worker.ts        # Repository analysis worker
│   └── cleanup-worker.ts         # Cleanup jobs
│
├── types/                        # TypeScript type definitions
│   ├── next-auth.d.ts            # NextAuth types
│   ├── api.ts                    # API types
│   └── models.ts                 # Data model types
│
├── prisma/                       # Database
│   ├── schema.prisma             # Database schema
│   ├── migrations/               # Migration files
│   └── seed.ts                   # Seed script
│
├── tests/                        # Test files
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   └── e2e/                      # E2E tests
│
├── public/                       # Static assets
│   ├── images/
│   └── icons/
│
├── docs/                         # Documentation
│   ├── confluence/               # Confluence pages (markdown)
│   ├── QUICKSTART.md
│   ├── SETUP.md
│   └── DEPLOYMENT.md
│
└── .github/                      # GitHub configuration
    └── workflows/                # CI/CD workflows
        ├── ci.yml
        └── deploy.yml
```

### File Organization Rules

1. **Group by feature, not by type** (for components)
2. **Keep files under 300 lines** (split if larger)
3. **One component per file** (except tightly coupled components)
4. **Co-locate tests** with source files when possible
5. **Use index.ts** for clean exports

---

## TypeScript Guidelines

### Strict Mode

Always use TypeScript strict mode:

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

### Type Annotations

```typescript
// ✅ Good - Explicit return types
function getUser(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } })
}

// ✅ Good - Explicit parameter types
const filterRepositories = (
  repos: Repository[],
  language: string
): Repository[] => {
  return repos.filter(r => r.language === language)
}

// ❌ Bad - Implicit types
function getUser(id) {
  return prisma.user.findUnique({ where: { id } })
}
```

### Avoid `any`

```typescript
// ✅ Good - Use unknown and narrow
function parseJSON(json: string): unknown {
  return JSON.parse(json)
}

const data = parseJSON('{"name": "John"}')
if (typeof data === 'object' && data !== null) {
  // Type narrowed, safe to use
}

// ❌ Bad - Using any
function parseJSON(json: string): any {
  return JSON.parse(json)
}
```

### Use Type Guards

```typescript
// ✅ Good - Type guard
function isRepository(obj: unknown): obj is Repository {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj
  )
}

if (isRepository(data)) {
  console.log(data.name) // TypeScript knows data is Repository
}
```

### Zod for Runtime Validation

Use Zod for API request validation:

```typescript
import { z } from 'zod'

// Define schema
const ConnectRepositorySchema = z.object({
  githubRepoId: z.number().int().positive(),
  owner: z.string().min(1),
  repo: z.string().min(1)
})

// Validate in API route
export async function POST(req: NextRequest) {
  const body = await req.json()

  const result = ConnectRepositorySchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid request', issues: result.error.issues },
      { status: 400 }
    )
  }

  const { githubRepoId, owner, repo } = result.data
  // Type-safe from here
}
```

---

## React & Next.js Best Practices

### Server vs. Client Components

**Default to Server Components:**

```typescript
// ✅ Good - Server component (default)
// app/repositories/page.tsx
import { getPublicRepositories } from '@/services/repository-service'

export default async function RepositoriesPage() {
  const repositories = await getPublicRepositories()

  return (
    <div>
      {repositories.map(repo => (
        <RepositoryCard key={repo.id} repository={repo} />
      ))}
    </div>
  )
}
```

**Use Client Components only when needed:**

```typescript
// ✅ Good - Client component for interactivity
'use client'

import { useState } from 'react'

export function VoteButton({ repositoryId }: { repositoryId: string }) {
  const [voted, setVoted] = useState(false)

  const handleVote = async () => {
    await fetch(`/api/repositories/${repositoryId}/vote`, { method: 'POST' })
    setVoted(true)
  }

  return (
    <button onClick={handleVote}>
      {voted ? 'Voted' : 'Vote'}
    </button>
  )
}
```

**When to use 'use client':**
- Event handlers (onClick, onChange, onSubmit)
- State (useState, useReducer)
- Effects (useEffect, useLayoutEffect)
- Browser APIs (window, document, localStorage)
- Custom hooks that use the above

### Component Structure

```typescript
// ✅ Good component structure
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import type { Repository } from '@/types/models'

// 1. Type definitions
interface RepositoryCardProps {
  repository: Repository
  onVote?: (id: string) => void
}

// 2. Component
export function RepositoryCard({ repository, onVote }: RepositoryCardProps) {
  // 3. State
  const [isLoading, setIsLoading] = useState(false)

  // 4. Effects
  useEffect(() => {
    // Effect logic
  }, [])

  // 5. Handlers
  const handleVote = async () => {
    setIsLoading(true)
    try {
      await onVote?.(repository.id)
    } finally {
      setIsLoading(false)
    }
  }

  // 6. Render
  return (
    <div className="repository-card">
      <h3>{repository.name}</h3>
      <p>{repository.description}</p>
      <Button onClick={handleVote} disabled={isLoading}>
        Vote
      </Button>
    </div>
  )
}
```

### Hooks Best Practices

```typescript
// ✅ Good - Custom hook
function useRepository(repositoryId: string) {
  const [repository, setRepository] = useState<Repository | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchRepository() {
      try {
        const response = await fetch(`/api/repositories/${repositoryId}`)
        const data = await response.json()

        if (!cancelled) {
          setRepository(data.data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchRepository()

    return () => {
      cancelled = true
    }
  }, [repositoryId])

  return { repository, loading, error }
}

// Usage
function RepositoryPage({ params }: { params: { id: string } }) {
  const { repository, loading, error } = useRepository(params.id)

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!repository) return <div>Not found</div>

  return <div>{repository.name}</div>
}
```

### TanStack Query (React Query)

Use TanStack Query for data fetching in client components:

```typescript
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// ✅ Good - Using React Query
function RepositoryList() {
  const queryClient = useQueryClient()

  // Fetch data
  const { data, isLoading, error } = useQuery({
    queryKey: ['repositories'],
    queryFn: async () => {
      const response = await fetch('/api/repositories/public')
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  })

  // Mutation
  const voteMutation = useMutation({
    mutationFn: async (repositoryId: string) => {
      const response = await fetch(`/api/repositories/${repositoryId}/vote`, {
        method: 'POST'
      })
      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['repositories'] })
    }
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error</div>

  return (
    <div>
      {data.data.repositories.map(repo => (
        <div key={repo.id}>
          <h3>{repo.name}</h3>
          <button onClick={() => voteMutation.mutate(repo.id)}>
            Vote
          </button>
        </div>
      ))}
    </div>
  )
}
```

---

## API Development

### API Route Structure

```typescript
// app/api/repositories/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// GET /api/repositories/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const repository = await prisma.repository.findUnique({
      where: { id: params.id },
      include: { analysis: true, user: true }
    })

    if (!repository) {
      return NextResponse.json(
        { success: false, error: { message: 'Repository not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: repository
    })
  } catch (error) {
    console.error('Error fetching repository:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

// PUT /api/repositories/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Authenticate
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: { message: 'Unauthorized' } },
      { status: 401 }
    )
  }

  // 2. Validate input
  const UpdateSchema = z.object({
    description: z.string().optional(),
    topics: z.array(z.string()).optional()
  })

  const body = await req.json()
  const result = UpdateSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid input', details: result.error } },
      { status: 400 }
    )
  }

  // 3. Check authorization
  const repository = await prisma.repository.findUnique({
    where: { id: params.id },
    select: { userId: true }
  })

  if (repository?.userId !== session.user.id) {
    return NextResponse.json(
      { success: false, error: { message: 'Forbidden' } },
      { status: 403 }
    )
  }

  // 4. Update resource
  try {
    const updated = await prisma.repository.update({
      where: { id: params.id },
      data: result.data
    })

    return NextResponse.json({
      success: true,
      data: updated
    })
  } catch (error) {
    console.error('Error updating repository:', error)
    return NextResponse.json(
      { success: false, error: { message: 'Update failed' } },
      { status: 500 }
    )
  }
}
```

### Error Handling

```typescript
// lib/api-errors.ts
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export class UnauthorizedError extends APIError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends APIError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class NotFoundError extends APIError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND')
  }
}

// Usage in API route
import { UnauthorizedError, NotFoundError } from '@/lib/api-errors'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      throw new UnauthorizedError()
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) {
      throw new NotFoundError('User')
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: error.message,
            code: error.code
          }
        },
        { status: error.statusCode }
      )
    }

    // Unknown error
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
```

---

## Database Guidelines

### Prisma Best Practices

**1. Use Transactions for Multiple Operations:**

```typescript
// ✅ Good - Use transaction
await prisma.$transaction(async (tx) => {
  await tx.repository.create({ data: repositoryData })
  await tx.activity.create({ data: activityData })
})

// ❌ Bad - Separate operations
await prisma.repository.create({ data: repositoryData })
await prisma.activity.create({ data: activityData })
```

**2. Select Only Needed Fields:**

```typescript
// ✅ Good - Select specific fields
const user = await prisma.user.findUnique({
  where: { id },
  select: { id: true, name: true, email: true }
})

// ❌ Bad - Select all fields
const user = await prisma.user.findUnique({ where: { id } })
```

**3. Use Proper Indexes:**

```prisma
// schema.prisma
model Repository {
  id        String   @id @default(cuid())
  userId    String
  createdAt DateTime @default(now())

  // ✅ Good - Indexed for common queries
  @@index([userId])
  @@index([createdAt])
  @@index([userId, createdAt])
}
```

**4. Handle Unique Constraint Violations:**

```typescript
import { Prisma } from '@prisma/client'

try {
  await prisma.vote.create({
    data: { userId, repositoryId }
  })
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      // Unique constraint violation
      throw new Error('Already voted')
    }
  }
  throw error
}
```

### Migration Guidelines

**Creating Migrations:**

```bash
# Create migration after schema changes
npx prisma migrate dev --name add_repository_views

# Generate Prisma client
npx prisma generate
```

**Migration Best Practices:**
1. **Test migrations locally** before applying to production
2. **Backup database** before running migrations in production
3. **Keep migrations small** and focused on one change
4. **Write rollback scripts** for destructive changes
5. **Document breaking changes** in migration comments

---

## Testing Requirements

### Test Coverage Requirements

| Type | Minimum Coverage | Target Coverage |
|------|------------------|-----------------|
| Unit Tests | 70% | 85% |
| Integration Tests | 60% | 75% |
| E2E Tests | Critical paths | Key user flows |

### Unit Testing

**Use Vitest for unit tests:**

```typescript
// services/repository-service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RepositoryService } from './repository-service'
import { prisma } from '@/lib/prisma'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    repository: {
      findUnique: vi.fn(),
      create: vi.fn()
    }
  }
}))

describe('RepositoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getRepository', () => {
    it('should return repository when found', async () => {
      const mockRepo = {
        id: 'repo-123',
        name: 'test-repo',
        owner: 'johndoe'
      }

      vi.mocked(prisma.repository.findUnique).mockResolvedValue(mockRepo)

      const service = new RepositoryService()
      const result = await service.getRepository('repo-123')

      expect(result).toEqual(mockRepo)
      expect(prisma.repository.findUnique).toHaveBeenCalledWith({
        where: { id: 'repo-123' }
      })
    })

    it('should throw error when not found', async () => {
      vi.mocked(prisma.repository.findUnique).mockResolvedValue(null)

      const service = new RepositoryService()

      await expect(service.getRepository('repo-123')).rejects.toThrow(
        'Repository not found'
      )
    })
  })
})
```

### Integration Testing

```typescript
// tests/integration/api/repositories.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createTestUser, createTestRepository, cleanupTestData } from '@/tests/helpers'

describe('Repository API', () => {
  let testUser: any
  let testRepo: any

  beforeAll(async () => {
    testUser = await createTestUser()
    testRepo = await createTestRepository(testUser.id)
  })

  afterAll(async () => {
    await cleanupTestData()
  })

  it('GET /api/repositories/[id] should return repository', async () => {
    const response = await fetch(`http://localhost:3000/api/repositories/${testRepo.id}`)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.id).toBe(testRepo.id)
  })
})
```

### E2E Testing with Playwright

```typescript
// e2e/repository-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Repository Connection Flow', () => {
  test('user can connect and view repository', async ({ page }) => {
    // Sign in
    await page.goto('http://localhost:3000')
    await page.click('text=Sign In with GitHub')

    // Should redirect to GitHub OAuth (mocked in test environment)
    await expect(page).toHaveURL(/.*workbench/)

    // Connect repository
    await page.click('text=Connect Repository')
    await page.fill('input[name="repo-search"]', 'test-repo')
    await page.click('text=Connect')

    // Verify repository appears
    await expect(page.locator('text=test-repo')).toBeVisible()
    await expect(page.locator('text=Analysis pending')).toBeVisible()
  })
})
```

---

## Git Workflow

### Branch Strategy

```
main
├── feature/VIBE-14-github-client
├── feature/VIBE-15-repo-service
├── bugfix/VIBE-99-fix-auth
└── hotfix/critical-security-fix
```

**Branch Types:**
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical production fixes
- `chore/*` - Maintenance tasks

### Commit Messages

**Format:**
```
<type>(<scope>): <description> [TICKET-ID]

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**
```
feat(repo): implement GitHub API client [VIBE-14]

Add GitHubClient service with methods for fetching
repository data, commits, and file contents.
Includes Redis caching and rate limit handling.

Closes VIBE-14
```

```
fix(auth): handle expired GitHub tokens [VIBE-99]

Check token expiration before making GitHub API calls.
Refresh token or prompt re-authentication if expired.

Fixes #99
```

### Pull Request Process

**1. Create PR with Template:**

```markdown
## Description
Brief description of changes

## Ticket
[VIBE-XX](https://techopsservices.atlassian.net/browse/VIBE-XX)

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes
- Implemented GitHub API client
- Added Redis caching
- Created unit tests

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Commented complex logic
- [ ] Updated documentation
- [ ] No new warnings
- [ ] Tests added
- [ ] All tests pass
```

**2. Review Requirements:**
- At least 1 approval required
- All CI checks must pass
- No merge conflicts
- Branch up to date with main

**3. Merge Strategy:**
- Use **Squash and Merge** for feature branches
- Use **Rebase and Merge** for hotfixes
- Delete branch after merge

---

## Code Review Process

### Reviewer Checklist

**Code Quality:**
- [ ] Code follows style guide
- [ ] No TypeScript errors
- [ ] Proper error handling
- [ ] No console.logs in production code
- [ ] Consistent naming conventions

**Functionality:**
- [ ] Implementation matches requirements
- [ ] Edge cases handled
- [ ] Performance considerations addressed
- [ ] Security best practices followed

**Testing:**
- [ ] Tests added for new functionality
- [ ] Tests are comprehensive
- [ ] Tests pass locally and in CI

**Documentation:**
- [ ] Code comments where needed
- [ ] API documentation updated
- [ ] README updated if needed

### Providing Feedback

**✅ Good Feedback:**
```
Consider extracting this logic into a separate function for reusability:

\`\`\`typescript
function calculateCompleteness(repo: Repository): number {
  // Logic here
}
\`\`\`

This would make testing easier and improve readability.
```

**❌ Bad Feedback:**
```
This is wrong, fix it.
```

### Addressing Feedback

- **Respond to all comments** (even if just "Done")
- **Ask questions** if feedback is unclear
- **Push changes** addressing feedback
- **Mark conversations as resolved** after addressing

---

## Performance Optimization

### Database Query Optimization

```typescript
// ❌ Bad - N+1 query problem
const repositories = await prisma.repository.findMany()
for (const repo of repositories) {
  const user = await prisma.user.findUnique({ where: { id: repo.userId } })
  // Use user...
}

// ✅ Good - Use include
const repositories = await prisma.repository.findMany({
  include: { user: true }
})
```

### Caching Strategy

```typescript
import { redis } from '@/lib/redis'

async function getPublicRepositories() {
  const cacheKey = 'repositories:public'

  // Check cache
  const cached = await redis.get(cacheKey)
  if (cached) {
    return JSON.parse(cached)
  }

  // Fetch from database
  const repositories = await prisma.repository.findMany({
    where: { isPrivate: false }
  })

  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(repositories))

  return repositories
}
```

### Image Optimization

```typescript
// ✅ Good - Use Next.js Image component
import Image from 'next/image'

<Image
  src={repository.ownerAvatarUrl}
  alt={repository.owner}
  width={48}
  height={48}
  className="rounded-full"
/>

// ❌ Bad - Regular img tag
<img src={repository.ownerAvatarUrl} alt={repository.owner} />
```

---

## Security Best Practices

### Input Validation

```typescript
// Always validate user input
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  age: z.number().int().positive().max(120)
})

const result = schema.safeParse(userInput)
if (!result.success) {
  throw new ValidationError(result.error)
}
```

### Prevent SQL Injection

```typescript
// ✅ Good - Prisma prevents SQL injection
await prisma.user.findMany({
  where: { email: userEmail }
})

// ❌ Bad - Raw SQL without parameterization
await prisma.$queryRaw`SELECT * FROM users WHERE email = ${userEmail}`

// ✅ Good - Parameterized raw query
await prisma.$queryRaw`SELECT * FROM users WHERE email = ${Prisma.sql`${userEmail}`}`
```

### Authentication Checks

```typescript
// Always check authentication
export async function DELETE(req: NextRequest, { params }) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check authorization
  const repository = await prisma.repository.findUnique({
    where: { id: params.id }
  })

  if (repository.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Proceed with deletion
}
```

### Secrets Management

```typescript
// ❌ Never commit secrets
const GITHUB_TOKEN = 'ghp_1234567890abcdef'

// ✅ Always use environment variables
const GITHUB_TOKEN = process.env.GITHUB_CLIENT_SECRET

// ✅ Validate environment variables
if (!process.env.GITHUB_CLIENT_SECRET) {
  throw new Error('GITHUB_CLIENT_SECRET is required')
}
```

---

## Accessibility Standards

### WCAG 2.1 AA Compliance

All components must meet WCAG 2.1 Level AA standards.

### Semantic HTML

```typescript
// ✅ Good - Semantic HTML
<nav>
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/workbench">Dashboard</a></li>
  </ul>
</nav>

<main>
  <article>
    <h1>Repository Title</h1>
    <p>Description...</p>
  </article>
</main>

// ❌ Bad - Div soup
<div>
  <div>
    <div><a href="/">Home</a></div>
    <div><a href="/workbench">Dashboard</a></div>
  </div>
</div>
```

### ARIA Labels

```typescript
// ✅ Good - ARIA labels
<button
  onClick={handleVote}
  aria-label={`Vote for ${repository.name}`}
  aria-pressed={voted}
>
  <ThumbsUp />
</button>

<input
  type="search"
  aria-label="Search repositories"
  placeholder="Search..."
/>
```

### Keyboard Navigation

```typescript
// ✅ Good - Keyboard accessible
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }}
>
  Click me
</div>
```

### Color Contrast

- Text must have contrast ratio of at least 4.5:1
- Large text (18pt+) must have contrast ratio of at least 3:1
- Use tools like [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

## Related Documentation

- [Architecture Overview](/docs/confluence/01-ARCHITECTURE-OVERVIEW.md)
- [Phase 1 Implementation Guide](/docs/confluence/02-PHASE1-IMPLEMENTATION-GUIDE.md)
- [API Documentation](/docs/confluence/03-API-DOCUMENTATION.md)
- [Task Breakdown](/docs/TASKS.md)

---

## Conclusion

These guidelines are living documents. If you find better practices or need clarification, propose changes via PR to this document.

**Remember:**
- **Quality > Speed** - Take time to write good code
- **Ask Questions** - No question is too small
- **Share Knowledge** - Help your teammates grow
- **Stay Curious** - Keep learning and improving

---

**Document Maintainer:** Development Team
**Last Review:** 2025-12-25
**Next Review:** End of Sprint 4

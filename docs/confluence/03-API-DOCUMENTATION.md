# Vibeyard - API Documentation

**Last Updated:** 2025-12-25
**Version:** 1.0 (Phase 1)
**Base URL:** `https://vibeyard.com` (production) | `http://localhost:3000` (development)

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [Rate Limiting](#rate-limiting)
5. [API Endpoints](#api-endpoints)
   - [Authentication](#authentication-endpoints)
   - [Users](#user-endpoints)
   - [Repositories](#repository-endpoints)
   - [Analysis](#analysis-endpoints)
   - [Votes](#vote-endpoints)
   - [Follows](#follow-endpoints)
   - [Activities](#activity-endpoints)
   - [Search](#search-endpoints)
6. [Webhook Events](#webhook-events)
7. [Data Models](#data-models)

---

## Overview

The Vibeyard API is a RESTful API built with Next.js API Routes. All requests and responses use JSON format.

### API Characteristics

- **RESTful Design:** Standard HTTP methods (GET, POST, PUT, DELETE)
- **JSON Payloads:** All requests and responses in JSON
- **Session-Based Auth:** Uses NextAuth.js with database sessions
- **Rate Limited:** Protects against abuse
- **Validated:** All inputs validated with Zod schemas
- **Cached:** Responses cached where appropriate

### Base Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": { ... }
  }
}
```

### Pagination

Endpoints that return lists use cursor-based pagination:

**Request:**
```
GET /api/repositories?limit=20&cursor=abc123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "nextCursor": "def456",
      "hasMore": true,
      "total": 150
    }
  }
}
```

---

## Authentication

### Session-Based Authentication

Vibeyard uses NextAuth.js with database sessions. Authentication is handled via cookies.

**Session Cookie:** `next-auth.session-token` (httpOnly, secure, sameSite)

**Authentication Flow:**
1. User clicks "Sign In with GitHub"
2. Redirected to GitHub OAuth
3. GitHub redirects back with authorization code
4. NextAuth exchanges code for access token
5. Session created and cookie set
6. Subsequent requests include session cookie

### Checking Authentication Status

```javascript
// Client-side (React)
import { useSession } from 'next-auth/react'

function Component() {
  const { data: session, status } = useSession()

  if (status === 'loading') return <div>Loading...</div>
  if (status === 'unauthenticated') return <div>Not signed in</div>

  return <div>Hello {session.user.name}</div>
}
```

```javascript
// Server-side (API Route)
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Use session.user.id for queries
}
```

### Protected Endpoints

Endpoints marked with 🔒 require authentication.

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 204 | No Content | Request succeeded, no content returned |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Not authorized to access resource |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Temporary service outage |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "message": "Repository not found",
    "code": "REPOSITORY_NOT_FOUND",
    "details": {
      "repositoryId": "abc123"
    },
    "timestamp": "2025-12-25T10:30:00Z"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid session |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `ALREADY_EXISTS` | 409 | Resource already exists |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `GITHUB_API_ERROR` | 502 | GitHub API failure |
| `ANALYSIS_FAILED` | 500 | Repository analysis error |

---

## Rate Limiting

### Rate Limit Policies

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| **Anonymous (by IP)** | 100 requests | 15 minutes |
| **Authenticated (by user)** | 1,000 requests | 1 hour |
| **Analysis Jobs** | 10 jobs | 1 hour |
| **Search** | 50 requests | 5 minutes |

### Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 998
X-RateLimit-Reset: 1640000000
```

### Rate Limit Response

```json
{
  "success": false,
  "error": {
    "message": "Rate limit exceeded",
    "code": "RATE_LIMIT_EXCEEDED",
    "details": {
      "retryAfter": 300,
      "limit": 1000,
      "remaining": 0,
      "reset": 1640000000
    }
  }
}
```

---

## API Endpoints

### Authentication Endpoints

#### Sign In with GitHub

```http
GET /api/auth/signin/github
```

Redirects user to GitHub OAuth consent screen.

**Query Parameters:**
- `callbackUrl` (optional): URL to redirect after sign in

**Example:**
```
GET /api/auth/signin/github?callbackUrl=/workbench
```

---

#### Sign Out

```http
POST /api/auth/signout
```

🔒 Destroys user session.

**Response:**
```json
{
  "success": true
}
```

---

#### Get Session

```http
GET /api/auth/session
```

Returns current user session.

**Response (authenticated):**
```json
{
  "user": {
    "id": "clm123abc",
    "name": "John Doe",
    "email": "john@example.com",
    "image": "https://avatars.githubusercontent.com/u/123456",
    "githubId": "123456",
    "githubUsername": "johndoe"
  },
  "expires": "2025-12-26T10:00:00Z"
}
```

**Response (unauthenticated):**
```json
null
```

---

### User Endpoints

#### Get Current User

```http
GET /api/users/me
```

🔒 Get authenticated user's profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clm123abc",
    "name": "John Doe",
    "email": "john@example.com",
    "image": "https://avatars.githubusercontent.com/u/123456",
    "githubId": "123456",
    "githubUsername": "johndoe",
    "createdAt": "2025-12-01T00:00:00Z",
    "stats": {
      "repositoriesCount": 5,
      "votesCount": 12,
      "followsCount": 8
    }
  }
}
```

---

#### Update User Profile

```http
PUT /api/users/me
```

🔒 Update current user's profile.

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "bio": "Software developer passionate about AI"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clm123abc",
    "name": "John Doe Updated",
    "bio": "Software developer passionate about AI"
  }
}
```

---

#### Get User by Username

```http
GET /api/users/{username}
```

Get public profile of any user.

**Parameters:**
- `username`: GitHub username

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clm123abc",
    "name": "John Doe",
    "githubUsername": "johndoe",
    "image": "https://avatars.githubusercontent.com/u/123456",
    "createdAt": "2025-12-01T00:00:00Z",
    "stats": {
      "repositoriesCount": 5,
      "totalVotes": 45,
      "totalFollowers": 23
    }
  }
}
```

---

### Repository Endpoints

#### List User's Repositories

```http
GET /api/repositories?userId={userId}
```

🔒 Get repositories owned by a user.

**Query Parameters:**
- `userId` (optional): User ID (defaults to current user)
- `limit` (optional): Results per page (default: 20, max: 100)
- `cursor` (optional): Pagination cursor

**Response:**
```json
{
  "success": true,
  "data": {
    "repositories": [
      {
        "id": "clr123abc",
        "githubId": 789456123,
        "name": "awesome-project",
        "fullName": "johndoe/awesome-project",
        "description": "An awesome AI-assisted project",
        "owner": "johndoe",
        "ownerAvatarUrl": "https://avatars.githubusercontent.com/u/123456",
        "htmlUrl": "https://github.com/johndoe/awesome-project",
        "language": "TypeScript",
        "topics": ["nextjs", "ai", "web"],
        "stargazersCount": 42,
        "forksCount": 7,
        "votesCount": 15,
        "followersCount": 8,
        "viewsCount": 234,
        "analysisStatus": "completed",
        "lastAnalyzedAt": "2025-12-25T10:00:00Z",
        "createdAt": "2025-12-20T00:00:00Z",
        "updatedAt": "2025-12-25T10:00:00Z",
        "analysis": {
          "aiDetected": true,
          "aiProvider": "claude",
          "aiConfidence": 0.85,
          "projectType": "web",
          "framework": "nextjs",
          "completenessScore": 78
        }
      }
    ],
    "pagination": {
      "nextCursor": "clr456def",
      "hasMore": true,
      "total": 5
    }
  }
}
```

---

#### Get Repository Details

```http
GET /api/repositories/{repositoryId}
```

Get detailed information about a repository.

**Parameters:**
- `repositoryId`: Repository ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clr123abc",
    "githubId": 789456123,
    "name": "awesome-project",
    "fullName": "johndoe/awesome-project",
    "description": "An awesome AI-assisted project",
    "owner": "johndoe",
    "ownerAvatarUrl": "https://avatars.githubusercontent.com/u/123456",
    "htmlUrl": "https://github.com/johndoe/awesome-project",
    "language": "TypeScript",
    "topics": ["nextjs", "ai", "web"],
    "stargazersCount": 42,
    "forksCount": 7,
    "openIssuesCount": 3,
    "license": "MIT",
    "isPrivate": false,
    "votesCount": 15,
    "followersCount": 8,
    "viewsCount": 234,
    "analysisStatus": "completed",
    "lastAnalyzedAt": "2025-12-25T10:00:00Z",
    "createdAt": "2025-12-20T00:00:00Z",
    "updatedAt": "2025-12-25T10:00:00Z",
    "user": {
      "id": "clm123abc",
      "name": "John Doe",
      "githubUsername": "johndoe",
      "image": "https://avatars.githubusercontent.com/u/123456"
    },
    "analysis": {
      "id": "cla123abc",
      "aiDetected": true,
      "aiProvider": "claude",
      "aiConfidence": 0.85,
      "aiEvidence": {
        "files": [".claude/"],
        "commits": ["abc123"],
        "readme": ["built with claude"]
      },
      "projectType": "web",
      "framework": "nextjs",
      "completenessScore": 78,
      "purpose": "A community platform for AI-assisted projects",
      "techStack": ["Next.js", "React", "TypeScript", "Tailwind CSS", "Prisma"],
      "features": [
        "GitHub OAuth authentication",
        "Repository analysis",
        "AI detection"
      ],
      "firstCommitAt": "2025-12-15T00:00:00Z",
      "lastCommitAt": "2025-12-24T18:00:00Z",
      "commitCount": 47,
      "contributorCount": 2
    },
    "currentUserVoted": false,
    "currentUserFollowing": true
  }
}
```

---

#### Connect Repository

```http
POST /api/repositories
```

🔒 Connect a GitHub repository to Vibeyard.

**Request Body:**
```json
{
  "githubRepoId": 789456123,
  "owner": "johndoe",
  "repo": "awesome-project"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clr123abc",
    "name": "awesome-project",
    "analysisStatus": "pending",
    "jobId": "analysis-job-123"
  }
}
```

**Errors:**
- `409 ALREADY_CONNECTED`: Repository already connected
- `404 GITHUB_REPO_NOT_FOUND`: Repository doesn't exist on GitHub
- `403 GITHUB_ACCESS_DENIED`: User doesn't have access to repository

---

#### Disconnect Repository

```http
DELETE /api/repositories/{repositoryId}
```

🔒 Disconnect a repository from Vibeyard.

**Parameters:**
- `repositoryId`: Repository ID

**Response:**
```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

**Errors:**
- `403 FORBIDDEN`: Not repository owner
- `404 NOT_FOUND`: Repository not found

---

#### Re-analyze Repository

```http
POST /api/repositories/{repositoryId}/analyze
```

🔒 Queue repository for re-analysis.

**Parameters:**
- `repositoryId`: Repository ID

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "analysis-job-456",
    "status": "queued",
    "estimatedDuration": 300
  }
}
```

**Errors:**
- `429 RATE_LIMIT_EXCEEDED`: Too many analysis requests
- `403 FORBIDDEN`: Not repository owner

---

#### List Public Repositories (Yard Lot)

```http
GET /api/repositories/public
```

Browse all public repositories in the marketplace.

**Query Parameters:**
- `limit` (optional): Results per page (default: 20, max: 100)
- `cursor` (optional): Pagination cursor
- `language` (optional): Filter by language (e.g., "TypeScript")
- `aiDetected` (optional): Filter by AI detection (true/false)
- `topics` (optional): Filter by topics (comma-separated)
- `sortBy` (optional): Sort order (`recent`, `votes`, `follows`, `views`)
- `search` (optional): Full-text search query

**Example:**
```
GET /api/repositories/public?language=TypeScript&aiDetected=true&sortBy=votes&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "repositories": [...],
    "pagination": {
      "nextCursor": "clr789ghi",
      "hasMore": true,
      "total": 150
    },
    "filters": {
      "language": "TypeScript",
      "aiDetected": true,
      "sortBy": "votes"
    }
  }
}
```

---

### Analysis Endpoints

#### Get Analysis Details

```http
GET /api/repositories/{repositoryId}/analysis
```

Get detailed analysis for a repository.

**Parameters:**
- `repositoryId`: Repository ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cla123abc",
    "repositoryId": "clr123abc",
    "status": "completed",
    "aiDetection": {
      "detected": true,
      "provider": "claude",
      "confidence": 0.85,
      "evidence": {
        "files": [".claude/", "claude.json"],
        "commits": ["abc123", "def456"],
        "readme": ["built with claude", "ai-assisted"]
      }
    },
    "projectAnalysis": {
      "type": "web",
      "framework": "nextjs",
      "completenessScore": 78,
      "purpose": "A community platform for AI-assisted projects",
      "techStack": ["Next.js", "React", "TypeScript", "Tailwind CSS"],
      "features": [
        "GitHub OAuth authentication",
        "Repository analysis engine",
        "AI detection system"
      ],
      "improvements": [
        "Add comprehensive test coverage",
        "Improve error handling in API routes",
        "Add monitoring and logging"
      ],
      "mistakes": [
        "Missing rate limiting on some endpoints",
        "Could benefit from better caching strategy"
      ]
    },
    "timeline": {
      "firstCommit": "2025-12-15T00:00:00Z",
      "lastCommit": "2025-12-24T18:00:00Z",
      "commitCount": 47,
      "contributorCount": 2,
      "averageCommitsPerDay": 3.4
    },
    "analyzedAt": "2025-12-25T10:00:00Z"
  }
}
```

---

#### Get Analysis Job Status

```http
GET /api/jobs/{jobId}
```

🔒 Check status of analysis job.

**Parameters:**
- `jobId`: Job ID from analysis request

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "analysis-job-123",
    "status": "processing",
    "progress": 45,
    "currentStage": "AI Detection",
    "stages": [
      {
        "name": "Basic Data Collection",
        "status": "completed",
        "completedAt": "2025-12-25T10:01:00Z"
      },
      {
        "name": "File Structure Analysis",
        "status": "completed",
        "completedAt": "2025-12-25T10:02:00Z"
      },
      {
        "name": "Commit History Analysis",
        "status": "completed",
        "completedAt": "2025-12-25T10:03:00Z"
      },
      {
        "name": "AI Detection",
        "status": "processing",
        "progress": 60
      },
      {
        "name": "AI-Powered Analysis",
        "status": "pending"
      },
      {
        "name": "Quality Scoring",
        "status": "pending"
      }
    ],
    "estimatedCompletion": "2025-12-25T10:08:00Z"
  }
}
```

---

### Vote Endpoints

#### Vote for Repository

```http
POST /api/repositories/{repositoryId}/vote
```

🔒 Upvote a repository (one vote per user).

**Parameters:**
- `repositoryId`: Repository ID

**Response:**
```json
{
  "success": true,
  "data": {
    "voted": true,
    "votesCount": 16
  }
}
```

**Errors:**
- `409 ALREADY_VOTED`: User already voted

---

#### Remove Vote

```http
DELETE /api/repositories/{repositoryId}/vote
```

🔒 Remove upvote from repository.

**Parameters:**
- `repositoryId`: Repository ID

**Response:**
```json
{
  "success": true,
  "data": {
    "voted": false,
    "votesCount": 15
  }
}
```

---

#### Get Voters

```http
GET /api/repositories/{repositoryId}/voters
```

Get list of users who voted for repository.

**Query Parameters:**
- `limit` (optional): Results per page (default: 20)
- `cursor` (optional): Pagination cursor

**Response:**
```json
{
  "success": true,
  "data": {
    "voters": [
      {
        "id": "clm789xyz",
        "name": "Jane Smith",
        "githubUsername": "janesmith",
        "image": "https://avatars.githubusercontent.com/u/789456",
        "votedAt": "2025-12-24T15:00:00Z"
      }
    ],
    "pagination": {
      "nextCursor": "clv123abc",
      "hasMore": true,
      "total": 15
    }
  }
}
```

---

### Follow Endpoints

#### Follow Repository

```http
POST /api/repositories/{repositoryId}/follow
```

🔒 Follow a repository to receive updates.

**Parameters:**
- `repositoryId`: Repository ID

**Response:**
```json
{
  "success": true,
  "data": {
    "following": true,
    "followersCount": 9
  }
}
```

**Errors:**
- `409 ALREADY_FOLLOWING`: User already following

---

#### Unfollow Repository

```http
DELETE /api/repositories/{repositoryId}/follow
```

🔒 Unfollow a repository.

**Parameters:**
- `repositoryId`: Repository ID

**Response:**
```json
{
  "success": true,
  "data": {
    "following": false,
    "followersCount": 8
  }
}
```

---

#### Get Followers

```http
GET /api/repositories/{repositoryId}/followers
```

Get list of users following repository.

**Query Parameters:**
- `limit` (optional): Results per page (default: 20)
- `cursor` (optional): Pagination cursor

**Response:**
```json
{
  "success": true,
  "data": {
    "followers": [
      {
        "id": "clm789xyz",
        "name": "Jane Smith",
        "githubUsername": "janesmith",
        "image": "https://avatars.githubusercontent.com/u/789456",
        "followedAt": "2025-12-23T10:00:00Z"
      }
    ],
    "pagination": {
      "nextCursor": "clf123abc",
      "hasMore": false,
      "total": 8
    }
  }
}
```

---

#### Get User's Following

```http
GET /api/users/me/following
```

🔒 Get repositories current user is following.

**Query Parameters:**
- `limit` (optional): Results per page (default: 20)
- `cursor` (optional): Pagination cursor

**Response:**
```json
{
  "success": true,
  "data": {
    "repositories": [...],
    "pagination": {
      "nextCursor": "clr456def",
      "hasMore": true,
      "total": 12
    }
  }
}
```

---

### Activity Endpoints

#### Get Activity Feed

```http
GET /api/activities
```

🔒 Get activity feed for current user.

**Query Parameters:**
- `type` (optional): Filter by activity type
- `limit` (optional): Results per page (default: 20)
- `cursor` (optional): Pagination cursor

**Activity Types:**
- `repository_connected`
- `vote_added`
- `follow_added`

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "cla123abc",
        "type": "repository_connected",
        "actor": {
          "id": "clm123abc",
          "name": "John Doe",
          "githubUsername": "johndoe",
          "image": "https://avatars.githubusercontent.com/u/123456"
        },
        "repository": {
          "id": "clr123abc",
          "name": "awesome-project",
          "owner": "johndoe"
        },
        "createdAt": "2025-12-25T10:00:00Z"
      },
      {
        "id": "cla456def",
        "type": "vote_added",
        "actor": {
          "id": "clm789xyz",
          "name": "Jane Smith",
          "githubUsername": "janesmith",
          "image": "https://avatars.githubusercontent.com/u/789456"
        },
        "repository": {
          "id": "clr123abc",
          "name": "awesome-project",
          "owner": "johndoe"
        },
        "createdAt": "2025-12-25T09:30:00Z"
      }
    ],
    "pagination": {
      "nextCursor": "cla789ghi",
      "hasMore": true
    }
  }
}
```

---

#### Get Repository Activity

```http
GET /api/repositories/{repositoryId}/activities
```

Get activity feed for a specific repository.

**Parameters:**
- `repositoryId`: Repository ID

**Query Parameters:**
- `limit` (optional): Results per page (default: 20)
- `cursor` (optional): Pagination cursor

**Response:** Same format as general activity feed

---

### Search Endpoints

#### Search Repositories

```http
GET /api/search/repositories
```

Full-text search across repositories.

**Query Parameters:**
- `q` (required): Search query
- `language` (optional): Filter by language
- `aiDetected` (optional): Filter by AI detection
- `limit` (optional): Results per page (default: 20)
- `cursor` (optional): Pagination cursor

**Example:**
```
GET /api/search/repositories?q=nextjs&language=TypeScript&aiDetected=true
```

**Response:**
```json
{
  "success": true,
  "data": {
    "repositories": [...],
    "pagination": {
      "nextCursor": "clr456def",
      "hasMore": true,
      "total": 42
    },
    "query": "nextjs",
    "filters": {
      "language": "TypeScript",
      "aiDetected": true
    }
  }
}
```

---

#### Search Users

```http
GET /api/search/users
```

Search for users by username or name.

**Query Parameters:**
- `q` (required): Search query
- `limit` (optional): Results per page (default: 20)
- `cursor` (optional): Pagination cursor

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "clm123abc",
        "name": "John Doe",
        "githubUsername": "johndoe",
        "image": "https://avatars.githubusercontent.com/u/123456",
        "repositoriesCount": 5
      }
    ],
    "pagination": {
      "nextCursor": "clm456def",
      "hasMore": false,
      "total": 3
    },
    "query": "john"
  }
}
```

---

## Webhook Events

### Future Feature: Webhooks

Vibeyard will support webhooks for real-time notifications (Phase 2).

**Planned Events:**
- `repository.connected`
- `repository.analyzed`
- `repository.vote_added`
- `repository.follow_added`

**Webhook Payload Format:**
```json
{
  "event": "repository.analyzed",
  "timestamp": "2025-12-25T10:00:00Z",
  "data": {
    "repositoryId": "clr123abc",
    "analysisStatus": "completed",
    "aiDetected": true
  }
}
```

---

## Data Models

### User

```typescript
interface User {
  id: string
  name: string | null
  email: string
  image: string | null
  githubId: string
  githubUsername: string
  createdAt: string
  updatedAt: string
}
```

### Repository

```typescript
interface Repository {
  id: string
  githubId: number
  name: string
  fullName: string
  description: string | null
  owner: string
  ownerAvatarUrl: string | null
  htmlUrl: string
  language: string | null
  topics: string[]
  stargazersCount: number
  forksCount: number
  openIssuesCount: number
  license: string | null
  isPrivate: boolean
  votesCount: number
  followersCount: number
  viewsCount: number
  analysisStatus: 'pending' | 'processing' | 'completed' | 'failed'
  lastAnalyzedAt: string | null
  createdAt: string
  updatedAt: string
}
```

### RepositoryAnalysis

```typescript
interface RepositoryAnalysis {
  id: string
  repositoryId: string
  aiDetected: boolean
  aiProvider: string | null
  aiConfidence: number | null
  aiEvidence: {
    files: string[]
    commits: string[]
    readme: string[]
  }
  projectType: string | null
  framework: string | null
  completenessScore: number | null
  purpose: string | null
  techStack: string[]
  features: string[]
  improvements: string[]
  mistakes: string[]
  firstCommitAt: string | null
  lastCommitAt: string | null
  commitCount: number | null
  contributorCount: number | null
  createdAt: string
  updatedAt: string
}
```

### Vote

```typescript
interface Vote {
  id: string
  userId: string
  repositoryId: string
  createdAt: string
}
```

### Follow

```typescript
interface Follow {
  id: string
  userId: string
  repositoryId: string
  createdAt: string
}
```

### Activity

```typescript
interface Activity {
  id: string
  actorId: string
  type: 'repository_connected' | 'vote_added' | 'follow_added'
  entityType: 'repository'
  entityId: string
  metadata: Record<string, any> | null
  createdAt: string
}
```

---

## SDK Examples

### JavaScript/TypeScript Client

```typescript
// Example API client
class VibeyardAPI {
  private baseUrl: string

  constructor(baseUrl = 'https://vibeyard.com') {
    this.baseUrl = baseUrl
  }

  async getPublicRepositories(params?: {
    language?: string
    aiDetected?: boolean
    sortBy?: string
    limit?: number
    cursor?: string
  }) {
    const query = new URLSearchParams(params as any).toString()
    const response = await fetch(`${this.baseUrl}/api/repositories/public?${query}`)
    return response.json()
  }

  async connectRepository(githubRepoId: number, owner: string, repo: string) {
    const response = await fetch(`${this.baseUrl}/api/repositories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ githubRepoId, owner, repo }),
      credentials: 'include' // Include session cookie
    })
    return response.json()
  }

  async voteRepository(repositoryId: string) {
    const response = await fetch(
      `${this.baseUrl}/api/repositories/${repositoryId}/vote`,
      {
        method: 'POST',
        credentials: 'include'
      }
    )
    return response.json()
  }
}

// Usage
const api = new VibeyardAPI()

// Browse repositories
const repos = await api.getPublicRepositories({
  language: 'TypeScript',
  aiDetected: true,
  sortBy: 'votes'
})

// Connect repository
const result = await api.connectRepository(
  789456123,
  'johndoe',
  'awesome-project'
)

// Vote
await api.voteRepository('clr123abc')
```

---

## Testing the API

### Using cURL

```bash
# Get public repositories
curl https://vibeyard.com/api/repositories/public?limit=10

# Connect repository (requires session cookie)
curl -X POST https://vibeyard.com/api/repositories \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "githubRepoId": 789456123,
    "owner": "johndoe",
    "repo": "awesome-project"
  }'

# Vote for repository
curl -X POST https://vibeyard.com/api/repositories/clr123abc/vote \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

### Using Postman

1. Import API collection (coming soon)
2. Set environment variable: `baseUrl = http://localhost:3000`
3. Sign in via browser to get session cookie
4. Copy cookie to Postman requests
5. Make requests

---

## Changelog

### Version 1.0 (2025-12-25)
- Initial API documentation
- Authentication endpoints
- Repository management endpoints
- Vote and Follow endpoints
- Search endpoints
- Activity feed endpoints

### Future Versions
- v1.1: Webhook support
- v1.2: GraphQL API
- v1.3: Bulk operations
- v2.0: Team collaboration endpoints

---

## Related Documentation

- [Architecture Overview](/docs/confluence/01-ARCHITECTURE-OVERVIEW.md)
- [Phase 1 Implementation Guide](/docs/confluence/02-PHASE1-IMPLEMENTATION-GUIDE.md)
- [Development Guidelines](/docs/confluence/04-DEVELOPMENT-GUIDELINES.md)

---

**Document Maintainer:** Development Team
**API Support:** api-support@vibeyard.com
**Report Issues:** [GitHub Issues](https://github.com/vibeyard/vibeyard/issues)

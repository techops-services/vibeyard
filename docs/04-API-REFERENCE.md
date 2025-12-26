# Collaboration API Quick Reference

Quick reference guide for the collaboration-related API endpoints.

## Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/collaboration-requests` | List collaboration requests | ✅ |
| POST | `/api/collaboration-requests` | Create collaboration request | ✅ |
| PATCH | `/api/collaboration-requests/[id]` | Update request status | ✅ |
| GET | `/api/workbench/stats` | Get workbench statistics | ✅ |
| GET | `/api/repositories/[id]/suggestions` | List suggestions | ✅ |
| POST | `/api/repositories/[id]/suggestions` | Create suggestion | ✅ |

---

## Collaboration Requests

### List Requests
```
GET /api/collaboration-requests?type=received&status=PENDING
```

**Query Parameters:**
- `type`: 'sent' | 'received' (default: 'received')
- `collaborationType`: filter by type
- `status`: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN' | 'COMPLETED'

### Create Request
```
POST /api/collaboration-requests
Content-Type: application/json

{
  "targetRepoId": "string",
  "collaborationType": "CODE_REVIEW",
  "message": "string (min 10 chars)",
  "requestorRepoId": "string (optional)"
}
```

**Collaboration Types:**
- CODE_REVIEW
- BUG_FIX_HELP
- TEAM_FORMATION
- EXPERTISE_OFFER
- MENTORSHIP
- GENERAL_COLLABORATION

### Update Request Status
```
PATCH /api/collaboration-requests/[id]
Content-Type: application/json

{
  "status": "ACCEPTED",
  "responseMessage": "string (optional)"
}
```

**Status Options:** ACCEPTED, DECLINED, WITHDRAWN, COMPLETED

**Authorization:**
- ACCEPTED/DECLINED: Only repository owner
- WITHDRAWN: Only requestor
- COMPLETED: Either party

---

## Workbench Statistics

### Get Stats
```
GET /api/workbench/stats
```

**Response:**
```json
{
  "totalRepos": 10,
  "totalVotes": 42,
  "totalFollows": 18,
  "totalViews": 356,
  "pendingCollabRequests": 3,
  "activeSuggestions": 7
}
```

---

## Improvement Suggestions

### List Suggestions
```
GET /api/repositories/[id]/suggestions?sortBy=popular&status=open
```

**Query Parameters:**
- `status`: 'open' | 'acknowledged' | 'implemented' | 'closed'
- `category`: filter by category
- `sortBy`: 'recent' | 'popular' (default: 'popular')

### Create Suggestion
```
POST /api/repositories/[id]/suggestions
Content-Type: application/json

{
  "title": "string (5-200 chars)",
  "description": "string (min 20 chars)",
  "category": "bug",
  "priority": "medium"
}
```

**Categories:**
- bug
- feature
- performance
- documentation
- security
- testing
- refactoring
- other

**Priorities:**
- low
- medium (default)
- high

---

## Common Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized (not logged in) |
| 403 | Forbidden (not allowed) |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 500 | Server Error |

---

## Error Response Format

```json
{
  "error": "Error message",
  "details": [...] // Only for validation errors
}
```

---

## TypeScript Types

### Collaboration Request
```typescript
interface CollaborationRequest {
  id: string
  requestorId: string
  targetRepoId: string
  targetOwnerId: string
  collaborationType: CollaborationType
  message: string
  status: CollaborationRequestStatus
  requestorRepoId?: string
  respondedAt?: Date
  responseMessage?: string
  createdAt: Date
  updatedAt: Date

  // Included relations
  requestor: User
  targetRepo: Repository
  targetOwner: User
  requestorRepo?: Repository
}
```

### Improvement Suggestion
```typescript
interface ImprovementSuggestion {
  id: string
  repositoryId: string
  suggestedById: string
  title: string
  description: string
  category: string
  priority: string
  status: string
  upvotesCount: number
  ownerResponse?: string
  createdAt: Date
  updatedAt: Date

  // Included relations
  suggestedBy: User
  hasUpvoted: boolean // For current user
}
```

### Workbench Stats
```typescript
interface WorkbenchStats {
  totalRepos: number
  totalVotes: number
  totalFollows: number
  totalViews: number
  pendingCollabRequests: number
  activeSuggestions: number
}
```

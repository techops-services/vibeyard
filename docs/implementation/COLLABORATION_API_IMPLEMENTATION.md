# Collaboration API Routes Implementation

This document describes the collaboration-related API routes implemented for the Vibeyard project.

## Implementation Date
December 25, 2025

## Overview
Implemented four collaboration API endpoints that enable users to:
- Create and manage collaboration requests
- View workbench statistics
- Submit and view improvement suggestions for repositories

## API Routes Implemented

### 1. Collaboration Requests API
**File**: `/app/api/collaboration-requests/route.ts`

#### GET /api/collaboration-requests
Fetch collaboration requests for the authenticated user.

**Query Parameters**:
- `type`: 'sent' | 'received' (default: 'received')
- `collaborationType`: Filter by collaboration type (CODE_REVIEW, BUG_FIX_HELP, etc.)
- `status`: Filter by status (PENDING, ACCEPTED, DECLINED, WITHDRAWN, COMPLETED)

**Response**: Array of collaboration requests with related user and repository data

**Features**:
- Authentication required
- Filters by requestor or target owner based on type
- Includes full user and repository details
- Sorted by creation date (descending)

#### POST /api/collaboration-requests
Create a new collaboration request.

**Request Body**:
```typescript
{
  targetRepoId: string;
  collaborationType: 'CODE_REVIEW' | 'BUG_FIX_HELP' | 'TEAM_FORMATION' | 'EXPERTISE_OFFER' | 'MENTORSHIP' | 'GENERAL_COLLABORATION';
  message: string; // min 10 characters
  requestorRepoId?: string; // optional
}
```

**Response**: Created collaboration request with status 201

**Validations**:
- Target repository must exist
- Target repository must be accepting collaborators
- Cannot send request to own repository
- Cannot have duplicate pending requests
- Requestor repo (if provided) must belong to the user

**Error Codes**:
- 400: Invalid data or business rule violation
- 401: Unauthorized
- 403: Forbidden (trying to use someone else's repo)
- 404: Repository not found
- 409: Duplicate pending request exists

---

### 2. Collaboration Request Update API
**File**: `/app/api/collaboration-requests/[id]/route.ts`

#### PATCH /api/collaboration-requests/[id]
Update the status of a collaboration request.

**Request Body**:
```typescript
{
  status: 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN' | 'COMPLETED';
  responseMessage?: string; // optional
}
```

**Response**: Updated collaboration request

**Authorization Rules**:
- **ACCEPTED/DECLINED**: Only target owner can perform these actions
- **WITHDRAWN**: Only requestor can withdraw
- **COMPLETED**: Either party can mark as completed

**Status Transition Rules**:
- ACCEPTED/DECLINED: Only from PENDING status
- WITHDRAWN: Only from PENDING status
- COMPLETED: Only from ACCEPTED status

**Features**:
- Sets `respondedAt` timestamp on accept/decline/withdraw
- Includes full related data in response
- Proper authorization checks
- Validates status transitions

**Error Codes**:
- 400: Invalid status transition
- 401: Unauthorized
- 403: Forbidden (wrong user for action)
- 404: Request not found

---

### 3. Workbench Statistics API
**File**: `/app/api/workbench/stats/route.ts`

#### GET /api/workbench/stats
Get aggregated statistics for the authenticated user's workbench.

**Response**:
```typescript
{
  totalRepos: number;           // Total repositories owned
  totalVotes: number;           // Sum of votes across all repos
  totalFollows: number;         // Sum of follows across all repos
  totalViews: number;          // Sum of views across all repos
  pendingCollabRequests: number; // Pending requests received
  activeSuggestions: number;    // Open suggestions across repos
}
```

**Features**:
- Authentication required
- Aggregates data across all user's repositories
- Counts only PENDING collaboration requests (received)
- Counts only 'open' status improvement suggestions

**Use Case**: Dashboard overview and workbench summary stats

---

### 4. Improvement Suggestions API
**File**: `/app/api/repositories/[id]/suggestions/route.ts`

#### GET /api/repositories/[id]/suggestions
Fetch improvement suggestions for a repository.

**Query Parameters**:
- `status`: Filter by status (open, acknowledged, implemented, closed)
- `category`: Filter by category
- `sortBy`: 'recent' | 'popular' (default: 'popular')

**Response**: Array of suggestions with user data and upvote status

**Features**:
- Authentication required
- Repository must exist
- Includes `hasUpvoted` flag for current user
- Sort by upvotes count (popular) or creation date (recent)
- Includes suggestion author details

#### POST /api/repositories/[id]/suggestions
Create a new improvement suggestion.

**Request Body**:
```typescript
{
  title: string;        // 5-200 characters
  description: string;  // min 20 characters
  category: 'bug' | 'feature' | 'performance' | 'documentation' | 'security' | 'testing' | 'refactoring' | 'other';
  priority?: 'low' | 'medium' | 'high'; // default: 'medium'
}
```

**Response**: Created suggestion with status 201

**Validations**:
- Repository must exist
- Title: 5-200 characters
- Description: minimum 20 characters
- Prevents duplicate suggestions (same title from same user for same repo in open/acknowledged status)

**Error Codes**:
- 400: Invalid request data
- 401: Unauthorized
- 404: Repository not found
- 409: Duplicate active suggestion exists

---

## Common Patterns Used

### Authentication
All routes use `auth()` from `@/lib/auth` to get the current session:
```typescript
const session = await auth()
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### Database Access
All routes use `prisma` from `@/lib/prisma` for database operations.

### Validation
All routes use Zod schemas for request validation:
```typescript
const schema = z.object({...})
const data = schema.parse(body)
```

### Error Handling
Consistent error handling pattern:
```typescript
try {
  // Route logic
} catch (error) {
  console.error('Error message:', error)

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Invalid request data', details: error.errors },
      { status: 400 }
    )
  }

  return NextResponse.json(
    { error: 'Error message' },
    { status: 500 }
  )
}
```

### Response Format
All routes return JSON responses with appropriate HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request / Validation Error
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Internal Server Error

---

## Database Models Used

### CollaborationRequest
```prisma
model CollaborationRequest {
  id               String
  requestorId      String
  targetRepoId     String
  targetOwnerId    String
  collaborationType CollaborationType
  message          String
  status           CollaborationRequestStatus
  requestorRepoId  String?
  respondedAt      DateTime?
  responseMessage  String?
  createdAt        DateTime
  updatedAt        DateTime
}
```

### ImprovementSuggestion
```prisma
model ImprovementSuggestion {
  id              String
  repositoryId    String
  suggestedById   String
  title           String
  description     String
  category        String
  priority        String
  status          String
  upvotesCount    Int
  ownerResponse   String?
  createdAt       DateTime
  updatedAt       DateTime
}
```

---

## Security Considerations

1. **Authentication**: All routes require authentication
2. **Authorization**:
   - Users can only modify their own requests
   - Repository owners control accept/decline
   - Requestors control withdrawal
3. **Validation**: All inputs validated with Zod schemas
4. **Business Rules**: Enforced at API level (e.g., no self-collaboration)
5. **Data Access**: Users can only see their sent/received requests
6. **No SQL Injection**: Using Prisma ORM with parameterized queries

---

## Testing Recommendations

### Unit Tests
- Test authentication checks
- Test authorization logic
- Test validation schemas
- Test status transitions
- Test duplicate prevention

### Integration Tests
- Test full request/response cycles
- Test database interactions
- Test error scenarios
- Test query parameter filtering

### E2E Tests
- Test collaboration request workflow (create → accept → complete)
- Test suggestion creation and filtering
- Test stats aggregation accuracy

---

## Future Enhancements

1. **Notifications**: Add real-time notifications for request updates
2. **Pagination**: Add cursor-based pagination for large result sets
3. **Rate Limiting**: Prevent spam requests
4. **Webhooks**: Notify external systems of collaboration events
5. **Search**: Add full-text search for suggestions
6. **Bulk Operations**: Allow bulk status updates
7. **Analytics**: Track collaboration success rates
8. **Comments**: Add threaded comments on suggestions

---

## Related Files

- `/prisma/schema.prisma` - Database schema
- `/lib/auth.ts` - Authentication utilities
- `/lib/prisma.ts` - Prisma client instance
- `/app/api/repositories/route.ts` - Repository API patterns
- `/app/api/repositories/[id]/vote/route.ts` - Vote toggle pattern
- `/types/collaboration.ts` - TypeScript types (if exists)

---

## Migration Notes

No database migrations required - the schema was already set up with:
- CollaborationRequest model
- ImprovementSuggestion model
- SuggestionUpvote model
- All necessary enums (CollaborationRole, CollaborationType, CollaborationRequestStatus)

---

## API Usage Examples

### Create a Collaboration Request
```typescript
const response = await fetch('/api/collaboration-requests', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    targetRepoId: 'repo-123',
    collaborationType: 'CODE_REVIEW',
    message: 'I would love to help review your code and provide feedback on best practices.',
    requestorRepoId: 'my-repo-456' // optional
  })
})
```

### Accept a Collaboration Request
```typescript
const response = await fetch('/api/collaboration-requests/request-789', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'ACCEPTED',
    responseMessage: 'Thanks! Looking forward to collaborating.'
  })
})
```

### Get Workbench Stats
```typescript
const response = await fetch('/api/workbench/stats')
const stats = await response.json()
// { totalRepos: 5, totalVotes: 42, ... }
```

### Create Improvement Suggestion
```typescript
const response = await fetch('/api/repositories/repo-123/suggestions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Add TypeScript strict mode',
    description: 'Enabling strict mode would catch potential type errors early...',
    category: 'improvement',
    priority: 'medium'
  })
})
```

---

## Implementation Status

✅ All routes implemented and ready for testing
✅ Following existing project patterns
✅ Proper authentication and authorization
✅ Comprehensive validation with Zod
✅ Error handling with appropriate status codes
✅ Security considerations addressed
✅ Documentation complete

**Next Steps**:
1. Run `npm run build` to verify TypeScript compilation
2. Write unit tests for the new routes
3. Test API endpoints manually or with Postman
4. Update frontend components to consume these APIs
5. Add integration tests

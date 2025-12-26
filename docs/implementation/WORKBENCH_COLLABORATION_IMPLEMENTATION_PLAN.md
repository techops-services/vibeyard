# Workbench & Collaboration Features - Implementation Plan

## Executive Summary

This document outlines the implementation plan for adding **Workbench** (private dashboard) and **Collaboration Features** to Vibeyard. These features enable two-sided marketplace functionality where Seekers (developers seeking help) and Providers (experienced developers offering assistance) can connect through project repositories.

**Estimated Timeline**: 2-3 weeks
**Complexity**: Medium-High
**Dependencies**: Existing auth, repository, and GitHub integration systems

---

## 1. Feature Requirements Overview

### 1.1 Workbench (Private Dashboard)
Rename "my yard" concept to "workbench" and create a private dashboard at `/workbench`:
- Display user's connected repositories with private analytics
- Show project engagement metrics (votes, follows, views)
- Manage collaboration requests (incoming and outgoing)
- Track community improvement suggestions
- Private analytics not visible in public Yard Lot

### 1.2 User Types & Collaboration
- **Seekers**: Users requesting help, reviews, fixes, or team members

**Collaboration Options** (per repository):
1. Request human code reviews
2. Seek help fixing specific issues
3. Form development teams
4. Offer expertise to projects
5. General mentorship/guidance

### 1.3 Repository Details Page Enhancement
- Display collaboration options specified by repository owner
- Show user type for the repository
- Highlight what kind of help is being sought
- Display collaboration status and active requests
- Show interested collaborators and pending requests

---

## 2. Database Schema Changes

### 2.1 New Enums

```prisma
// Collaboration role for a specific repository
enum CollaborationRole {
  SEEKER      // Looking for help
  PROVIDER    // Offering help
  BOTH        // Open to both
}

// Types of collaboration being sought/offered
enum CollaborationType {
  CODE_REVIEW           // Human code review requests
  BUG_FIX_HELP         // Help fixing specific issues
  TEAM_FORMATION       // Looking to form dev team
  EXPERTISE_OFFER      // Offering technical expertise
  MENTORSHIP           // Mentorship/guidance
  GENERAL_COLLABORATION // General collaboration
}

// Status of a collaboration request
enum CollaborationRequestStatus {
  PENDING
  ACCEPTED
  DECLINED
  WITHDRAWN
  COMPLETED
}
```

### 2.2 Repository Model Extensions

```prisma
model Repository {
  id                String   @id @default(cuid())

  // ... existing fields ...

  // NEW: Collaboration fields
  collaborationRole       CollaborationRole?
  collaborationTypes      CollaborationType[] // Array of collaboration types
  collaborationDetails    String?              // Optional detailed description
  isAcceptingCollaborators Boolean @default(false)

  // NEW: Relations
  collaborationRequestsSent     CollaborationRequest[] @relation("RequestorRepo")
  collaborationRequestsReceived CollaborationRequest[] @relation("TargetRepo")

  // ... existing relations ...
}
```

### 2.3 New Models

```prisma
// Collaboration requests between users and repositories
model CollaborationRequest {
  id          String   @id @default(cuid())

  // Requestor (the person offering to help or asking to join)
  requestorId String
  requestor   User     @relation("RequestorUser", fields: [requestorId], references: [id], onDelete: Cascade)

  // Target repository and owner
  targetRepoId String
  targetRepo   Repository @relation("TargetRepo", fields: [targetRepoId], references: [id], onDelete: Cascade)
  targetOwnerId String
  targetOwner   User @relation("TargetOwner", fields: [targetOwnerId], references: [id], onDelete: Cascade)

  // Request details
  collaborationType CollaborationType
  message          String             // Why they want to collaborate
  status           CollaborationRequestStatus @default(PENDING)

  // Optional: if requestor has a related repo
  requestorRepoId String?
  requestorRepo   Repository? @relation("RequestorRepo", fields: [requestorRepoId], references: [id], onDelete: SetNull)

  // Metadata
  respondedAt      DateTime?
  responseMessage  String?            // Owner's response

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([requestorId])
  @@index([targetRepoId])
  @@index([targetOwnerId])
  @@index([status])
  @@index([createdAt])
  @@map("collaboration_requests")
}

// Track improvement suggestions from community
model ImprovementSuggestion {
  id           String   @id @default(cuid())

  repositoryId String
  repository   Repository @relation(fields: [repositoryId], references: [id], onDelete: Cascade)

  suggestedById String
  suggestedBy   User @relation(fields: [suggestedById], references: [id], onDelete: Cascade)

  title        String
  description  String
  category     String   // "bug", "feature", "performance", "documentation", etc.
  priority     String   @default("medium") // "low", "medium", "high"

  status       String   @default("open") // "open", "acknowledged", "implemented", "closed"

  upvotesCount Int      @default(0)

  ownerResponse String?

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  upvotes      SuggestionUpvote[]

  @@index([repositoryId])
  @@index([suggestedById])
  @@index([status])
  @@index([createdAt])
  @@map("improvement_suggestions")
}

// Upvotes for suggestions
model SuggestionUpvote {
  id           String   @id @default(cuid())

  suggestionId String
  suggestion   ImprovementSuggestion @relation(fields: [suggestionId], references: [id], onDelete: Cascade)

  userId       String
  user         User @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt    DateTime @default(now())

  @@unique([userId, suggestionId])
  @@index([suggestionId])
  @@index([userId])
  @@map("suggestion_upvotes")
}
```

### 2.4 User Model Extensions

```prisma
model User {
  // ... existing fields ...

  // NEW: Relations
  collaborationRequestsSent     CollaborationRequest[] @relation("RequestorUser")
  collaborationRequestsReceived CollaborationRequest[] @relation("TargetOwner")
  suggestionsMade               ImprovementSuggestion[]
  suggestionUpvotes             SuggestionUpvote[]

  // ... existing relations ...
}
```

### 2.5 Migration Strategy

**File**: `/prisma/migrations/YYYYMMDDHHMMSS_add_collaboration_features/migration.sql`

1. Create enums first
2. Add new columns to Repository (with defaults)
3. Create new tables
4. Add foreign key constraints
5. Add indexes for performance
6. Update User relations

---

## 3. File Structure & Components

### 3.1 New Pages

```
app/
├── workbench/
│   ├── page.tsx                          # Main workbench dashboard
│   ├── layout.tsx                        # Workbench-specific layout
│   ├── loading.tsx                       # Loading state
│   └── components/
│       ├── WorkbenchStats.tsx            # Overview stats cards
│       ├── RepositoryList.tsx            # User's repos with analytics
│       ├── CollaborationRequests.tsx     # Incoming/outgoing requests
│       ├── ImprovementSuggestions.tsx    # Community suggestions
│       └── RequestCard.tsx               # Individual request display
```

### 3.2 Enhanced Repository Pages

```
app/
├── repo/
│   └── [id]/
│       ├── page.tsx                      # ENHANCED: Show collaboration info
│       ├── components/
│       │   ├── CollaborationSection.tsx  # NEW: Collaboration options display
│       │   ├── RequestCollaborationForm.tsx # NEW: Send collab request
│       │   └── SuggestionsSection.tsx    # NEW: Community suggestions
```

### 3.3 Updated Add Repository Form

```
app/
├── components/
│   ├── AddRepoForm.tsx                   # ENHANCED: Add collaboration options
│   ├── AddRepoModal.tsx                  # NEW: Multi-step form modal
│   └── CollaborationOptionsForm.tsx      # NEW: Collaboration preferences
```

### 3.4 API Routes

```
app/
├── api/
│   ├── workbench/
│   │   └── stats/
│   │       └── route.ts                  # GET workbench statistics
│   ├── repositories/
│   │   ├── [id]/
│   │   │   ├── collaboration/
│   │   │   │   └── route.ts             # PATCH update collab settings
│   │   │   └── suggestions/
│   │   │       └── route.ts             # GET/POST suggestions
│   │   └── route.ts                     # ENHANCED: Include collab options
│   └── collaboration-requests/
│       ├── route.ts                     # GET/POST requests
│       └── [id]/
│           └── route.ts                 # PATCH update request status
```

### 3.5 TypeScript Types

```
types/
├── collaboration.ts                      # Collaboration-related types
└── workbench.ts                         # Workbench-specific types
```

### 3.6 Shared Components

```
app/
├── components/
│   ├── UserBadge.tsx                    # NEW: Show Seeker/Provider badge
│   ├── CollaborationTypeChip.tsx        # NEW: Collab type display
│   └── StatusBadge.tsx                  # NEW: Request status badge
```

---

## 4. Detailed Implementation Breakdown

### 4.1 Phase 1: Database Schema & Types (3-4 days)

#### Task 1.1: Create Prisma Schema Extensions
**File**: `/prisma/schema.prisma`

**Steps**:
1. Add enums at top of schema file
2. Extend Repository model with collaboration fields
3. Add new CollaborationRequest model
4. Add ImprovementSuggestion and SuggestionUpvote models
5. Update User model relations

**Acceptance Criteria**:
- Schema compiles without errors
- All relations are properly defined with onDelete cascades
- Indexes added for performance

#### Task 1.2: Create Migration
```bash
npx prisma migrate dev --name add_collaboration_features
```

**Acceptance Criteria**:
- Migration runs successfully on dev database
- All tables and columns created
- Indexes properly set up

#### Task 1.3: Create TypeScript Types
**File**: `/types/collaboration.ts`

```typescript
import { CollaborationRole, CollaborationType, CollaborationRequestStatus } from '@prisma/client'

export interface CollaborationOptions {
  role: CollaborationRole
  types: CollaborationType[]
  details?: string
  isAccepting: boolean
}

export interface CollaborationRequestWithRelations {
  id: string
  requestor: {
    id: string
    name: string | null
    image: string | null
    githubUsername: string | null
  }
  targetRepo: {
    id: string
    name: string
    fullName: string
  }
  targetOwner: {
    id: string
    name: string | null
  }
  collaborationType: CollaborationType
  message: string
  status: CollaborationRequestStatus
  createdAt: Date
  updatedAt: Date
}

export interface WorkbenchStats {
  totalRepos: number
  totalVotes: number
  totalFollows: number
  totalViews: number
  pendingCollabRequests: number
  activeSuggestions: number
}
```

**File**: `/types/workbench.ts`

```typescript
export interface RepositoryWithAnalytics {
  id: string
  name: string
  fullName: string
  description: string | null
  votesCount: number
  followersCount: number
  viewsCount: number
  collaborationRole: CollaborationRole | null
  collaborationTypes: CollaborationType[]
  isAcceptingCollaborators: boolean
  _count: {
    collaborationRequestsReceived: number
  }
}
```

---

### 4.2 Phase 2: API Endpoints (4-5 days)

#### Task 2.1: Update Repository Creation API
**File**: `/app/api/repositories/route.ts`

**Changes to POST endpoint**:
```typescript
// Add to request schema
const addRepoSchema = z.object({
  owner: z.string(),
  name: z.string(),
  // NEW: Collaboration options
  collaborationOptions: z.object({
    role: z.enum(['SEEKER', 'PROVIDER', 'BOTH']).optional(),
    types: z.array(z.enum([
      'CODE_REVIEW',
      'BUG_FIX_HELP',
      'TEAM_FORMATION',
      'EXPERTISE_OFFER',
      'MENTORSHIP',
      'GENERAL_COLLABORATION'
    ])).optional(),
    details: z.string().optional(),
    isAccepting: z.boolean().default(false),
  }).optional(),
})

// Update create call to include collaboration fields
const repository = await prisma.repository.create({
  data: {
    // ... existing fields ...
    collaborationRole: collaborationOptions?.role,
    collaborationTypes: collaborationOptions?.types || [],
    collaborationDetails: collaborationOptions?.details,
    isAcceptingCollaborators: collaborationOptions?.isAccepting || false,
  },
})
```

**Acceptance Criteria**:
- Can create repo with collaboration options
- Can create repo without collaboration options (optional)
- Proper validation errors returned

#### Task 2.2: Create Collaboration Settings Update Endpoint
**File**: `/app/api/repositories/[id]/collaboration/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const collaborationSettingsSchema = z.object({
  role: z.enum(['SEEKER', 'PROVIDER', 'BOTH']).nullable(),
  types: z.array(z.enum([
    'CODE_REVIEW',
    'BUG_FIX_HELP',
    'TEAM_FORMATION',
    'EXPERTISE_OFFER',
    'MENTORSHIP',
    'GENERAL_COLLABORATION'
  ])),
  details: z.string().nullable(),
  isAccepting: z.boolean(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const repository = await prisma.repository.findUnique({
      where: { id: params.id },
      select: { userId: true },
    })

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    if (repository.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update settings
    const body = await request.json()
    const settings = collaborationSettingsSchema.parse(body)

    const updated = await prisma.repository.update({
      where: { id: params.id },
      data: {
        collaborationRole: settings.role,
        collaborationTypes: settings.types,
        collaborationDetails: settings.details,
        isAcceptingCollaborators: settings.isAccepting,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating collaboration settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
```

**Acceptance Criteria**:
- Only repo owner can update settings
- Validates collaboration options
- Returns updated repository

#### Task 2.3: Create Collaboration Requests API
**File**: `/app/api/collaboration-requests/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createRequestSchema = z.object({
  targetRepoId: z.string(),
  collaborationType: z.enum([
    'CODE_REVIEW',
    'BUG_FIX_HELP',
    'TEAM_FORMATION',
    'EXPERTISE_OFFER',
    'MENTORSHIP',
    'GENERAL_COLLABORATION'
  ]),
  message: z.string().min(20).max(1000),
  requestorRepoId: z.string().optional(),
})

/**
 * GET /api/collaboration-requests
 * Get collaboration requests (sent or received)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'sent' or 'received'
    const status = searchParams.get('status')

    let where: any = {}

    if (type === 'sent') {
      where.requestorId = session.user.id
    } else if (type === 'received') {
      where.targetOwnerId = session.user.id
    } else {
      // Both
      where = {
        OR: [
          { requestorId: session.user.id },
          { targetOwnerId: session.user.id },
        ],
      }
    }

    if (status) {
      where.status = status
    }

    const requests = await prisma.collaborationRequest.findMany({
      where,
      include: {
        requestor: {
          select: {
            id: true,
            name: true,
            image: true,
            githubUsername: true,
          },
        },
        targetRepo: {
          select: {
            id: true,
            name: true,
            fullName: true,
            description: true,
          },
        },
        targetOwner: {
          select: {
            id: true,
            name: true,
            githubUsername: true,
          },
        },
        requestorRepo: {
          select: {
            id: true,
            name: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(requests)
  } catch (error) {
    console.error('Error fetching collaboration requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/collaboration-requests
 * Create a new collaboration request
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { targetRepoId, collaborationType, message, requestorRepoId } =
      createRequestSchema.parse(body)

    // Get target repo and verify it accepts collaborators
    const targetRepo = await prisma.repository.findUnique({
      where: { id: targetRepoId },
      select: {
        userId: true,
        isAcceptingCollaborators: true,
        collaborationTypes: true,
      },
    })

    if (!targetRepo) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      )
    }

    if (targetRepo.userId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot request collaboration on your own repository' },
        { status: 400 }
      )
    }

    if (!targetRepo.isAcceptingCollaborators) {
      return NextResponse.json(
        { error: 'Repository is not accepting collaborators' },
        { status: 400 }
      )
    }

    // Check for duplicate pending requests
    const existing = await prisma.collaborationRequest.findFirst({
      where: {
        requestorId: session.user.id,
        targetRepoId,
        status: 'PENDING',
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'You already have a pending request for this repository' },
        { status: 409 }
      )
    }

    // Create request
    const collaborationRequest = await prisma.collaborationRequest.create({
      data: {
        requestorId: session.user.id,
        targetRepoId,
        targetOwnerId: targetRepo.userId,
        collaborationType,
        message,
        requestorRepoId,
      },
      include: {
        requestor: {
          select: {
            id: true,
            name: true,
            image: true,
            githubUsername: true,
          },
        },
        targetRepo: {
          select: {
            id: true,
            name: true,
            fullName: true,
          },
        },
      },
    })

    // Create activity
    await prisma.activity.create({
      data: {
        actorId: session.user.id,
        type: 'collaboration_request_sent',
        entityType: 'collaboration_request',
        entityId: collaborationRequest.id,
        metadata: {
          targetRepoId,
          collaborationType,
        },
      },
    })

    return NextResponse.json(collaborationRequest, { status: 201 })
  } catch (error) {
    console.error('Error creating collaboration request:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create request' },
      { status: 500 }
    )
  }
}
```

**File**: `/app/api/collaboration-requests/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateRequestSchema = z.object({
  status: z.enum(['ACCEPTED', 'DECLINED', 'WITHDRAWN']),
  responseMessage: z.string().optional(),
})

/**
 * PATCH /api/collaboration-requests/[id]
 * Update a collaboration request status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status, responseMessage } = updateRequestSchema.parse(body)

    // Get request
    const collaborationRequest = await prisma.collaborationRequest.findUnique({
      where: { id: params.id },
      include: {
        targetRepo: true,
      },
    })

    if (!collaborationRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    // Verify permissions
    if (status === 'WITHDRAWN') {
      // Only requestor can withdraw
      if (collaborationRequest.requestorId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else {
      // Only target owner can accept/decline
      if (collaborationRequest.targetOwnerId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Update request
    const updated = await prisma.collaborationRequest.update({
      where: { id: params.id },
      data: {
        status,
        respondedAt: new Date(),
        responseMessage,
      },
      include: {
        requestor: {
          select: {
            id: true,
            name: true,
            githubUsername: true,
          },
        },
        targetRepo: {
          select: {
            id: true,
            name: true,
            fullName: true,
          },
        },
      },
    })

    // Create activity
    await prisma.activity.create({
      data: {
        actorId: session.user.id,
        type: `collaboration_request_${status.toLowerCase()}`,
        entityType: 'collaboration_request',
        entityId: updated.id,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating collaboration request:', error)
    return NextResponse.json(
      { error: 'Failed to update request' },
      { status: 500 }
    )
  }
}
```

**Acceptance Criteria**:
- Users can send collaboration requests
- Users can view sent/received requests
- Repo owners can accept/decline requests
- Requestors can withdraw requests
- Proper authorization checks

#### Task 2.4: Create Workbench Stats API
**File**: `/app/api/workbench/stats/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch aggregated stats
    const [repos, requests, suggestions] = await Promise.all([
      // Repository stats
      prisma.repository.findMany({
        where: { userId: session.user.id },
        select: {
          votesCount: true,
          followersCount: true,
          viewsCount: true,
        },
      }),

      // Pending collaboration requests
      prisma.collaborationRequest.count({
        where: {
          targetOwnerId: session.user.id,
          status: 'PENDING',
        },
      }),

      // Active improvement suggestions
      prisma.improvementSuggestion.count({
        where: {
          repository: {
            userId: session.user.id,
          },
          status: 'open',
        },
      }),
    ])

    const stats = {
      totalRepos: repos.length,
      totalVotes: repos.reduce((sum, r) => sum + r.votesCount, 0),
      totalFollows: repos.reduce((sum, r) => sum + r.followersCount, 0),
      totalViews: repos.reduce((sum, r) => sum + r.viewsCount, 0),
      pendingCollabRequests: requests,
      activeSuggestions: suggestions,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching workbench stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
```

**Acceptance Criteria**:
- Returns aggregated stats for authenticated user
- Efficient queries (uses Promise.all)
- Proper error handling

#### Task 2.5: Create Suggestions API
**File**: `/app/api/repositories/[id]/suggestions/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSuggestionSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(2000),
  category: z.enum(['bug', 'feature', 'performance', 'documentation', 'other']),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
})

/**
 * GET /api/repositories/[id]/suggestions
 * Get improvement suggestions for a repository
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'open'

    const suggestions = await prisma.improvementSuggestion.findMany({
      where: {
        repositoryId: params.id,
        status,
      },
      include: {
        suggestedBy: {
          select: {
            id: true,
            name: true,
            image: true,
            githubUsername: true,
          },
        },
      },
      orderBy: [
        { upvotesCount: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json(suggestions)
  } catch (error) {
    console.error('Error fetching suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/repositories/[id]/suggestions
 * Create a new improvement suggestion
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createSuggestionSchema.parse(body)

    // Verify repository exists
    const repository = await prisma.repository.findUnique({
      where: { id: params.id },
    })

    if (!repository) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      )
    }

    // Create suggestion
    const suggestion = await prisma.improvementSuggestion.create({
      data: {
        ...data,
        repositoryId: params.id,
        suggestedById: session.user.id,
      },
      include: {
        suggestedBy: {
          select: {
            id: true,
            name: true,
            image: true,
            githubUsername: true,
          },
        },
      },
    })

    return NextResponse.json(suggestion, { status: 201 })
  } catch (error) {
    console.error('Error creating suggestion:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create suggestion' },
      { status: 500 }
    )
  }
}
```

**Acceptance Criteria**:
- Users can create suggestions for any repository
- Suggestions are associated with both repo and suggester
- Proper validation

---

### 4.3 Phase 3: Workbench Dashboard (3-4 days)

#### Task 3.1: Create Workbench Layout
**File**: `/app/workbench/layout.tsx`

```typescript
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { YardHeader } from '@/app/components/YardHeader'

export default async function WorkbenchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/api/auth/signin')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <YardHeader />
      {children}
    </div>
  )
}
```

#### Task 3.2: Create Workbench Page
**File**: `/app/workbench/page.tsx`

```typescript
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { WorkbenchStats } from './components/WorkbenchStats'
import { RepositoryList } from './components/RepositoryList'
import { CollaborationRequests } from './components/CollaborationRequests'
import { ImprovementSuggestions } from './components/ImprovementSuggestions'

export const dynamic = 'force-dynamic'

export default async function WorkbenchPage() {
  const session = await auth()

  if (!session?.user?.id) {
    return null // Layout will redirect
  }

  // Fetch user's repositories with analytics
  const repositories = await prisma.repository.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      _count: {
        select: {
          votes: true,
          follows: true,
          views: true,
          collaborationRequestsReceived: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Fetch pending collaboration requests
  const pendingRequests = await prisma.collaborationRequest.findMany({
    where: {
      targetOwnerId: session.user.id,
      status: 'PENDING',
    },
    include: {
      requestor: {
        select: {
          id: true,
          name: true,
          image: true,
          githubUsername: true,
        },
      },
      targetRepo: {
        select: {
          id: true,
          name: true,
          fullName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
  })

  // Fetch active improvement suggestions
  const activeSuggestions = await prisma.improvementSuggestion.findMany({
    where: {
      repository: {
        userId: session.user.id,
      },
      status: 'open',
    },
    include: {
      repository: {
        select: {
          id: true,
          name: true,
        },
      },
      suggestedBy: {
        select: {
          id: true,
          name: true,
          githubUsername: true,
        },
      },
    },
    orderBy: [
      { upvotesCount: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 5,
  })

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto p-4">
      {/* Breadcrumb */}
      <div className="mb-4 yard-meta text-xs">
        <Link href="/" className="hover:text-[--yard-orange] hover:underline">
          ← back to yard lot
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mono mb-2">the workbench</h1>
        <p className="yard-meta text-sm">
          Your private workspace for managing vibecode projects
        </p>
      </div>

      {/* Stats Overview */}
      <WorkbenchStats repositories={repositories} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Left Column */}
        <div className="space-y-6">
          <RepositoryList repositories={repositories} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <CollaborationRequests requests={pendingRequests} />
          <ImprovementSuggestions suggestions={activeSuggestions} />
        </div>
      </div>
    </main>
  )
}
```

#### Task 3.3: Create Workbench Components
**File**: `/app/workbench/components/WorkbenchStats.tsx`

```typescript
'use client'

import { Repository } from '@prisma/client'

interface Props {
  repositories: (Repository & {
    _count: {
      votes: number
      follows: number
      views: number
      collaborationRequestsReceived: number
    }
  })[]
}

export function WorkbenchStats({ repositories }: Props) {
  const stats = {
    totalRepos: repositories.length,
    totalVotes: repositories.reduce((sum, r) => sum + r._count.votes, 0),
    totalFollows: repositories.reduce((sum, r) => sum + r._count.follows, 0),
    totalViews: repositories.reduce((sum, r) => sum + r._count.views, 0),
    pendingRequests: repositories.reduce(
      (sum, r) => sum + r._count.collaborationRequestsReceived,
      0
    ),
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <StatCard label="repositories" value={stats.totalRepos} />
      <StatCard label="total votes" value={stats.totalVotes} />
      <StatCard label="total follows" value={stats.totalFollows} />
      <StatCard label="total views" value={stats.totalViews} />
      <StatCard
        label="pending requests"
        value={stats.pendingRequests}
        highlight={stats.pendingRequests > 0}
      />
    </div>
  )
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <div
      className={`border border-[--yard-border] p-4 ${
        highlight ? 'bg-[--yard-light-orange] border-[--yard-orange]' : ''
      }`}
    >
      <div className="text-2xl font-bold mono">{value}</div>
      <div className="yard-meta text-xs mt-1">{label}</div>
    </div>
  )
}
```

**File**: `/app/workbench/components/RepositoryList.tsx`

```typescript
'use client'

import Link from 'next/link'
import { CollaborationRole, CollaborationType, Repository } from '@prisma/client'

interface RepositoryWithAnalytics extends Repository {
  _count: {
    votes: number
    follows: number
    views: number
    collaborationRequestsReceived: number
  }
}

interface Props {
  repositories: RepositoryWithAnalytics[]
}

export function RepositoryList({ repositories }: Props) {
  if (repositories.length === 0) {
    return (
      <div className="border border-[--yard-border] p-6">
        <h2 className="text-lg font-bold mono mb-2">your repositories</h2>
        <p className="yard-meta text-sm">
          No repositories connected yet. Add one from the{' '}
          <Link href="/" className="hover:text-[--yard-orange] hover:underline">
            yard lot
          </Link>
          .
        </p>
      </div>
    )
  }

  return (
    <div className="border border-[--yard-border]">
      <div className="p-4 border-b border-[--yard-border]">
        <h2 className="text-lg font-bold mono">your repositories</h2>
      </div>

      <div className="divide-y divide-[--yard-border]">
        {repositories.map((repo) => (
          <div key={repo.id} className="p-4 hover:bg-[--yard-light-gray]">
            <div className="flex items-start justify-between mb-2">
              <Link
                href={`/repo/${repo.id}`}
                className="font-medium mono hover:text-[--yard-orange] hover:underline"
              >
                {repo.fullName}
              </Link>
              {repo.collaborationRole && (
                <span className="text-xs px-2 py-0.5 bg-[--yard-orange] text-white">
                  {repo.collaborationRole}
                </span>
              )}
            </div>

            {repo.description && (
              <p className="text-sm yard-meta mb-2">{repo.description}</p>
            )}

            <div className="flex flex-wrap gap-3 yard-meta text-xs">
              <span>{repo._count.votes} votes</span>
              <span>•</span>
              <span>{repo._count.follows} follows</span>
              <span>•</span>
              <span>{repo._count.views} views</span>
              {repo._count.collaborationRequestsReceived > 0 && (
                <>
                  <span>•</span>
                  <span className="text-[--yard-orange] font-medium">
                    {repo._count.collaborationRequestsReceived} pending requests
                  </span>
                </>
              )}
            </div>

            {repo.collaborationTypes && repo.collaborationTypes.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {repo.collaborationTypes.map((type) => (
                  <span
                    key={type}
                    className="text-xs px-2 py-0.5 bg-[--yard-light-gray] text-[--yard-gray]"
                  >
                    {formatCollaborationType(type)}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function formatCollaborationType(type: CollaborationType): string {
  const map: Record<CollaborationType, string> = {
    CODE_REVIEW: 'code review',
    BUG_FIX_HELP: 'bug fixes',
    TEAM_FORMATION: 'team building',
    EXPERTISE_OFFER: 'expertise',
    MENTORSHIP: 'mentorship',
    GENERAL_COLLABORATION: 'collaboration',
  }
  return map[type] || type
}
```

**File**: `/app/workbench/components/CollaborationRequests.tsx`

```typescript
'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { CollaborationRequest, User, Repository } from '@prisma/client'

type RequestWithRelations = CollaborationRequest & {
  requestor: Pick<User, 'id' | 'name' | 'image' | 'githubUsername'>
  targetRepo: Pick<Repository, 'id' | 'name' | 'fullName'>
}

interface Props {
  requests: RequestWithRelations[]
}

export function CollaborationRequests({ requests }: Props) {
  return (
    <div className="border border-[--yard-border]">
      <div className="p-4 border-b border-[--yard-border] flex items-center justify-between">
        <h2 className="text-lg font-bold mono">pending requests</h2>
        {requests.length > 5 && (
          <Link
            href="/workbench/requests"
            className="text-xs yard-meta hover:text-[--yard-orange] hover:underline"
          >
            view all →
          </Link>
        )}
      </div>

      {requests.length === 0 ? (
        <div className="p-4 yard-meta text-sm">
          No pending collaboration requests.
        </div>
      ) : (
        <div className="divide-y divide-[--yard-border]">
          {requests.map((request) => (
            <div key={request.id} className="p-4">
              <div className="flex items-start gap-3">
                {request.requestor.image && (
                  <img
                    src={request.requestor.image}
                    alt={request.requestor.name || 'User'}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">
                      {request.requestor.name || request.requestor.githubUsername}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-[--yard-light-gray]">
                      {request.collaborationType.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  </div>
                  <p className="text-sm yard-meta mb-2">
                    wants to collaborate on{' '}
                    <Link
                      href={`/repo/${request.targetRepo.id}`}
                      className="hover:text-[--yard-orange] hover:underline"
                    >
                      {request.targetRepo.name}
                    </Link>
                  </p>
                  <p className="text-xs line-clamp-2">{request.message}</p>
                  <div className="yard-meta text-xs mt-2">
                    {formatDistanceToNow(new Date(request.createdAt), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

**File**: `/app/workbench/components/ImprovementSuggestions.tsx`

```typescript
'use client'

import Link from 'next/link'
import { ImprovementSuggestion, User, Repository } from '@prisma/client'

type SuggestionWithRelations = ImprovementSuggestion & {
  repository: Pick<Repository, 'id' | 'name'>
  suggestedBy: Pick<User, 'id' | 'name' | 'githubUsername'>
}

interface Props {
  suggestions: SuggestionWithRelations[]
}

export function ImprovementSuggestions({ suggestions }: Props) {
  return (
    <div className="border border-[--yard-border]">
      <div className="p-4 border-b border-[--yard-border] flex items-center justify-between">
        <h2 className="text-lg font-bold mono">community suggestions</h2>
        {suggestions.length > 5 && (
          <Link
            href="/workbench/suggestions"
            className="text-xs yard-meta hover:text-[--yard-orange] hover:underline"
          >
            view all →
          </Link>
        )}
      </div>

      {suggestions.length === 0 ? (
        <div className="p-4 yard-meta text-sm">
          No active improvement suggestions.
        </div>
      ) : (
        <div className="divide-y divide-[--yard-border]">
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <Link
                  href={`/repo/${suggestion.repository.id}/suggestions`}
                  className="font-medium hover:text-[--yard-orange] hover:underline flex-1"
                >
                  {suggestion.title}
                </Link>
                <span className="text-xs px-2 py-0.5 bg-[--yard-light-gray] whitespace-nowrap">
                  {suggestion.category}
                </span>
              </div>
              <p className="text-sm yard-meta mb-2">
                for {suggestion.repository.name}
              </p>
              <p className="text-xs line-clamp-2 mb-2">{suggestion.description}</p>
              <div className="flex items-center gap-3 yard-meta text-xs">
                <span>by {suggestion.suggestedBy.name || suggestion.suggestedBy.githubUsername}</span>
                <span>•</span>
                <span>{suggestion.upvotesCount} upvotes</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Acceptance Criteria**:
- Workbench displays user's repositories
- Shows aggregated analytics
- Displays pending collaboration requests
- Shows community suggestions
- Mobile responsive design
- Follows existing "yard" aesthetic

---

### 4.4 Phase 4: Enhanced Add Repository Form (2-3 days)

#### Task 4.1: Create Multi-Step Add Repo Modal
**File**: `/app/components/AddRepoModal.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CollaborationRole, CollaborationType } from '@prisma/client'

interface Props {
  isOpen: boolean
  onClose: () => void
}

interface FormData {
  repoUrl: string
  collaborationOptions?: {
    role: CollaborationRole | null
    types: CollaborationType[]
    details: string
    isAccepting: boolean
  }
}

export function AddRepoModal({ isOpen, onClose }: Props) {
  const [step, setStep] = useState<1 | 2>(1)
  const [formData, setFormData] = useState<FormData>({
    repoUrl: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleRepoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate repo URL
    const match =
      formData.repoUrl.match(/github\.com\/([^\/]+)\/([^\/\s]+)/) ||
      formData.repoUrl.match(/^([^\/\s]+)\/([^\/\s]+)$/)

    if (!match) {
      setError('Invalid format. Use "owner/repo" or GitHub URL')
      return
    }

    // Move to collaboration options
    setStep(2)
  }

  const handleCollaborationSubmit = async (
    options: FormData['collaborationOptions']
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      const match =
        formData.repoUrl.match(/github\.com\/([^\/]+)\/([^\/\s]+)/) ||
        formData.repoUrl.match(/^([^\/\s]+)\/([^\/\s]+)$/)

      if (!match) {
        throw new Error('Invalid repository format')
      }

      const [, owner, name] = match

      const response = await fetch('/api/repositories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner: owner.trim(),
          name: name.trim().replace(/\.git$/, ''),
          collaborationOptions: options,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add repository')
      }

      // Success!
      onClose()
      setFormData({ repoUrl: '' })
      setStep(1)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add repository')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[--yard-border]">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold mono">
              {step === 1 ? 'add repository' : 'collaboration options'}
            </h2>
            <button
              onClick={onClose}
              className="yard-meta hover:text-[--yard-orange]"
            >
              × close
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6 yard-meta text-xs">
            <span className={step === 1 ? 'font-bold' : ''}>1. repository</span>
            <span>→</span>
            <span className={step === 2 ? 'font-bold' : ''}>
              2. collaboration (optional)
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Repository URL */}
          {step === 1 && (
            <form onSubmit={handleRepoSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  GitHub Repository
                </label>
                <input
                  type="text"
                  value={formData.repoUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, repoUrl: e.target.value })
                  }
                  placeholder="owner/repo or github.com/owner/repo"
                  className="yard-input w-full"
                  autoFocus
                />
                <p className="yard-meta text-xs mt-1">
                  Example: facebook/react or https://github.com/facebook/react
                </p>
              </div>

              <div className="flex gap-3">
                <button type="submit" className="yard-button" disabled={!formData.repoUrl}>
                  next →
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="yard-button bg-gray-300 border-gray-300 text-black hover:bg-gray-400 hover:border-gray-400"
                >
                  cancel
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Collaboration Options */}
          {step === 2 && (
            <CollaborationOptionsForm
              onSubmit={handleCollaborationSubmit}
              onBack={() => setStep(1)}
              onSkip={() => handleCollaborationSubmit(undefined)}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </div>
  )
}
```

**File**: `/app/components/CollaborationOptionsForm.tsx`

```typescript
'use client'

import { useState } from 'react'
import { CollaborationRole, CollaborationType } from '@prisma/client'

interface Props {
  onSubmit: (options: {
    role: CollaborationRole | null
    types: CollaborationType[]
    details: string
    isAccepting: boolean
  } | undefined) => void
  onBack: () => void
  onSkip: () => void
  isLoading: boolean
}

const collaborationTypes: { value: CollaborationType; label: string; desc: string }[] = [
  {
    value: 'CODE_REVIEW',
    label: 'Code Reviews',
    desc: 'Request human review of code quality, architecture, and best practices',
  },
  {
    value: 'BUG_FIX_HELP',
    label: 'Bug Fixes',
    desc: 'Seek help identifying and fixing bugs or issues',
  },
  {
    value: 'TEAM_FORMATION',
    label: 'Team Building',
    desc: 'Looking to form a development team around this project',
  },
  {
    value: 'EXPERTISE_OFFER',
    label: 'Expertise Sharing',
    desc: 'Offering or seeking technical expertise in specific areas',
  },
  {
    value: 'MENTORSHIP',
    label: 'Mentorship',
    desc: 'Seeking mentorship or offering guidance to others',
  },
  {
    value: 'GENERAL_COLLABORATION',
    label: 'General Collaboration',
    desc: 'Open to general collaboration and contributions',
  },
]

export function CollaborationOptionsForm({ onSubmit, onBack, onSkip, isLoading }: Props) {
  const [role, setRole] = useState<CollaborationRole | null>(null)
  const [selectedTypes, setSelectedTypes] = useState<CollaborationType[]>([])
  const [details, setDetails] = useState('')
  const [isAccepting, setIsAccepting] = useState(false)

  const toggleType = (type: CollaborationType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!role) {
      onSubmit(undefined)
      return
    }

    onSubmit({
      role,
      types: selectedTypes,
      details,
      isAccepting,
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Role Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-3">
          What's your role for this repository?
        </label>
        <div className="space-y-2">
          <label className="flex items-start gap-3 p-3 border border-[--yard-border] cursor-pointer hover:bg-[--yard-light-gray]">
            <input
              type="radio"
              name="role"
              value="SEEKER"
              checked={role === 'SEEKER'}
              onChange={() => setRole('SEEKER')}
              className="mt-1"
            />
            <div>
              <div className="font-medium">Seeker</div>
              <div className="yard-meta text-xs">
                Looking for help, reviews, or collaborators
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 border border-[--yard-border] cursor-pointer hover:bg-[--yard-light-gray]">
            <input
              type="radio"
              name="role"
              value="PROVIDER"
              checked={role === 'PROVIDER'}
              onChange={() => setRole('PROVIDER')}
              className="mt-1"
            />
            <div>
              <div className="font-medium">Provider</div>
              <div className="yard-meta text-xs">
                Offering expertise, mentorship, or collaboration
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 border border-[--yard-border] cursor-pointer hover:bg-[--yard-light-gray]">
            <input
              type="radio"
              name="role"
              value="BOTH"
              checked={role === 'BOTH'}
              onChange={() => setRole('BOTH')}
              className="mt-1"
            />
            <div>
              <div className="font-medium">Both</div>
              <div className="yard-meta text-xs">
                Open to both seeking and providing help
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Collaboration Types */}
      {role && (
        <>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3">
              What kind of collaboration are you interested in?
            </label>
            <div className="space-y-2">
              {collaborationTypes.map((type) => (
                <label
                  key={type.value}
                  className="flex items-start gap-3 p-3 border border-[--yard-border] cursor-pointer hover:bg-[--yard-light-gray]"
                >
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type.value)}
                    onChange={() => toggleType(type.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{type.label}</div>
                    <div className="yard-meta text-xs">{type.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Details */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Additional details (optional)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe what you're looking for or what you can offer..."
              className="yard-input w-full h-24 resize-none"
              maxLength={500}
            />
            <p className="yard-meta text-xs mt-1">{details.length}/500 characters</p>
          </div>

          {/* Accept Collaborators */}
          <div className="mb-6">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={isAccepting}
                onChange={(e) => setIsAccepting(e.target.checked)}
                className="mt-1"
              />
              <div>
                <div className="font-medium text-sm">
                  Accept collaboration requests
                </div>
                <div className="yard-meta text-xs">
                  Allow others to send you collaboration requests for this repository
                </div>
              </div>
            </label>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="yard-button"
          disabled={isLoading}
        >
          ← back
        </button>
        <button type="submit" className="yard-button" disabled={isLoading}>
          {isLoading ? 'adding...' : role ? 'add repository' : 'skip & add'}
        </button>
        {!role && (
          <button
            type="button"
            onClick={onSkip}
            className="yard-button bg-gray-300 border-gray-300 text-black hover:bg-gray-400 hover:border-gray-400"
            disabled={isLoading}
          >
            skip
          </button>
        )}
      </div>
    </form>
  )
}
```

#### Task 4.2: Update AddRepoForm to Use Modal
**File**: `/app/components/AddRepoForm.tsx` (Update)

```typescript
'use client'

import { useState } from 'react'
import { AddRepoModal } from './AddRepoModal'

export function AddRepoForm() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsModalOpen(true)} className="yard-button">
        + add repo
      </button>

      <AddRepoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
```

**Acceptance Criteria**:
- Two-step modal for adding repositories
- Step 1: Repository URL input
- Step 2: Optional collaboration settings
- Can skip collaboration settings
- Mobile responsive
- Proper form validation

---

### 4.5 Phase 5: Enhanced Repository Detail Page (3-4 days)

#### Task 5.1: Update Repository Detail Page
**File**: `/app/repo/[id]/page.tsx` (Enhance existing)

Add to existing page:

```typescript
// Add to imports
import { CollaborationSection } from './components/CollaborationSection'
import { SuggestionsSection } from './components/SuggestionsSection'

// Add to data fetching
const session = await auth()

// Fetch collaboration status if user is logged in
let userCollabRequest = null
if (session?.user?.id) {
  userCollabRequest = await prisma.collaborationRequest.findFirst({
    where: {
      requestorId: session.user.id,
      targetRepoId: params.id,
      status: 'PENDING',
    },
  })
}

// Fetch active collaboration requests for this repo
const activeRequests = await prisma.collaborationRequest.findMany({
  where: {
    targetRepoId: params.id,
    status: 'ACCEPTED',
  },
  include: {
    requestor: {
      select: {
        id: true,
        name: true,
        githubUsername: true,
        image: true,
      },
    },
  },
  take: 5,
})

// Add to JSX (after main repository info)
{/* Collaboration Section */}
{repository.collaborationRole && (
  <CollaborationSection
    repository={repository}
    currentUserId={session?.user?.id}
    userRequest={userCollabRequest}
    activeCollaborators={activeRequests}
  />
)}

{/* Suggestions Section */}
<SuggestionsSection
  repositoryId={params.id}
  isOwner={session?.user?.id === repository.userId}
/>
```

#### Task 5.2: Create Collaboration Section Component
**File**: `/app/repo/[id]/components/CollaborationSection.tsx`

```typescript
'use client'

import { useState } from 'react'
import { CollaborationRole, CollaborationType, Repository } from '@prisma/client'
import { RequestCollaborationForm } from './RequestCollaborationForm'

interface Props {
  repository: Repository & {
    user: {
      id: string
      name: string | null
      githubUsername: string | null
    }
  }
  currentUserId?: string
  userRequest: any // Existing pending request
  activeCollaborators: any[]
}

export function CollaborationSection({
  repository,
  currentUserId,
  userRequest,
  activeCollaborators,
}: Props) {
  const [showRequestForm, setShowRequestForm] = useState(false)
  const isOwner = currentUserId === repository.userId

  return (
    <div className="border-t border-[--yard-border] p-4">
      <h2 className="text-lg font-bold mono mb-4">collaboration</h2>

      {/* Role Badge */}
      <div className="mb-4">
        <span className="inline-block px-3 py-1 bg-[--yard-orange] text-white text-sm font-medium">
          {repository.collaborationRole === 'SEEKER' && '🔍 seeking help'}
          {repository.collaborationRole === 'PROVIDER' && '🤝 offering expertise'}
          {repository.collaborationRole === 'BOTH' && '↔️ open to both'}
        </span>
      </div>

      {/* Collaboration Types */}
      {repository.collaborationTypes && repository.collaborationTypes.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">interested in:</h3>
          <div className="flex flex-wrap gap-2">
            {repository.collaborationTypes.map((type) => (
              <span
                key={type}
                className="text-xs px-3 py-1 border border-[--yard-border] bg-[--yard-light-gray]"
              >
                {formatCollaborationType(type)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Details */}
      {repository.collaborationDetails && (
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">details:</h3>
          <p className="text-sm">{repository.collaborationDetails}</p>
        </div>
      )}

      {/* Active Collaborators */}
      {activeCollaborators.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">active collaborators:</h3>
          <div className="flex flex-wrap gap-3">
            {activeCollaborators.map((req) => (
              <div key={req.id} className="flex items-center gap-2">
                {req.requestor.image && (
                  <img
                    src={req.requestor.image}
                    alt={req.requestor.name || 'User'}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm">
                  {req.requestor.name || req.requestor.githubUsername}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!isOwner && currentUserId && repository.isAcceptingCollaborators && (
        <div>
          {userRequest ? (
            <div className="p-3 bg-yellow-50 border border-yellow-200 text-sm">
              You have a pending collaboration request for this repository.
            </div>
          ) : showRequestForm ? (
            <RequestCollaborationForm
              repositoryId={repository.id}
              availableTypes={repository.collaborationTypes}
              onCancel={() => setShowRequestForm(false)}
              onSuccess={() => setShowRequestForm(false)}
            />
          ) : (
            <button
              onClick={() => setShowRequestForm(true)}
              className="yard-button"
            >
              request collaboration
            </button>
          )}
        </div>
      )}

      {!isOwner && !currentUserId && repository.isAcceptingCollaborators && (
        <div className="p-3 bg-[--yard-light-gray] border border-[--yard-border] text-sm">
          Sign in to request collaboration
        </div>
      )}

      {!repository.isAcceptingCollaborators && !isOwner && (
        <div className="p-3 bg-[--yard-light-gray] border border-[--yard-border] text-sm">
          Not currently accepting collaboration requests
        </div>
      )}
    </div>
  )
}

function formatCollaborationType(type: CollaborationType): string {
  const map: Record<CollaborationType, string> = {
    CODE_REVIEW: '📝 code reviews',
    BUG_FIX_HELP: '🐛 bug fixes',
    TEAM_FORMATION: '👥 team building',
    EXPERTISE_OFFER: '💡 expertise',
    MENTORSHIP: '🎓 mentorship',
    GENERAL_COLLABORATION: '🤝 collaboration',
  }
  return map[type] || type
}
```

**File**: `/app/repo/[id]/components/RequestCollaborationForm.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CollaborationType } from '@prisma/client'

interface Props {
  repositoryId: string
  availableTypes: CollaborationType[]
  onCancel: () => void
  onSuccess: () => void
}

export function RequestCollaborationForm({
  repositoryId,
  availableTypes,
  onCancel,
  onSuccess,
}: Props) {
  const [selectedType, setSelectedType] = useState<CollaborationType | null>(null)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (!selectedType || message.length < 20) {
        throw new Error('Please select a type and provide a detailed message')
      }

      const response = await fetch('/api/collaboration-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetRepoId: repositoryId,
          collaborationType: selectedType,
          message,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send request')
      }

      onSuccess()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send request')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-[--yard-border] p-4">
      <h3 className="text-sm font-bold mb-3">request collaboration</h3>

      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 text-xs">
          {error}
        </div>
      )}

      <div className="mb-3">
        <label className="block text-xs font-medium mb-2">collaboration type</label>
        <select
          value={selectedType || ''}
          onChange={(e) => setSelectedType(e.target.value as CollaborationType)}
          className="yard-input w-full"
          required
        >
          <option value="">select type...</option>
          {availableTypes.map((type) => (
            <option key={type} value={type}>
              {type.replace(/_/g, ' ').toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label className="block text-xs font-medium mb-2">
          message (min 20 characters)
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Explain why you want to collaborate and what you can contribute..."
          className="yard-input w-full h-24 resize-none"
          minLength={20}
          maxLength={1000}
          required
        />
        <p className="yard-meta text-xs mt-1">{message.length}/1000 characters</p>
      </div>

      <div className="flex gap-2">
        <button type="submit" className="yard-button" disabled={isLoading}>
          {isLoading ? 'sending...' : 'send request'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="yard-button bg-gray-300 border-gray-300 text-black hover:bg-gray-400 hover:border-gray-400"
          disabled={isLoading}
        >
          cancel
        </button>
      </div>
    </form>
  )
}
```

**Acceptance Criteria**:
- Repository detail page shows collaboration options
- Displays role badge (Seeker/Provider/Both)
- Shows collaboration types as chips
- Displays collaboration details if provided
- Shows active collaborators
- Allows users to request collaboration
- Prevents duplicate requests
- Only shows for repositories accepting collaborators

---

## 5. Key Decision Points

### 5.1 Technical Decisions

**Decision 1: Collaboration Role Model**
- **Chosen**: Per-repository roles (user can be Seeker for one repo, Provider for another)
- **Rationale**: More flexible, allows users to wear different hats
- **Alternative**: Global user role - rejected as too rigid

**Decision 2: Collaboration Types as Array**
- **Chosen**: Multiple types per repository (array in Prisma)
- **Rationale**: Projects often need multiple types of help
- **Implementation**: PostgreSQL array column type

**Decision 3: Request Management**
- **Chosen**: Status-based workflow (PENDING → ACCEPTED/DECLINED/WITHDRAWN)
- **Rationale**: Simple state machine, easy to query
- **Alternative**: Complex approval chains - rejected for Phase 1

**Decision 4: Suggestions vs Issues**
- **Chosen**: Separate ImprovementSuggestion model
- **Rationale**: Different from GitHub issues, community-driven, upvote-based
- **Future**: Could integrate with GitHub issues

### 5.2 UX Decisions

**Decision 1: Two-Step Add Repo Form**
- **Chosen**: Modal with optional collaboration step
- **Rationale**: Doesn't overwhelm users, collaboration is opt-in
- **Alternative**: Single long form - rejected as intimidating

**Decision 2: Workbench vs My Yard**
- **Chosen**: "Workbench" terminology
- **Rationale**: More descriptive of functionality, aligns with "junkyard" theme
- **Update Required**: Rename any "my yard" references

**Decision 3: Public vs Private Analytics**
- **Chosen**: Workbench shows private detailed analytics, public pages show basic counts
- **Rationale**: Respects privacy while maintaining transparency

---

## 6. Testing Strategy

### 6.1 Unit Tests
- Prisma schema validation
- API endpoint logic
- Form validation functions
- Type guards and transformers

### 6.2 Integration Tests
- Repository creation with collaboration options
- Collaboration request workflows
- Workbench data aggregation
- Suggestion creation and upvoting

### 6.3 E2E Tests (Playwright)
- Complete add repository flow with collaboration setup
- Send and respond to collaboration requests
- Navigate workbench and view analytics
- Create and upvote suggestions

---

## 7. Migration & Deployment Strategy

### 7.1 Database Migration
1. Run migration in development
2. Test with seed data
3. Create migration rollback script
4. Run migration in staging
5. Verify data integrity
6. Deploy to production with backup

### 7.2 Feature Flags (Optional)
Consider feature flags for:
- Collaboration requests (can disable if issues arise)
- Improvement suggestions
- Workbench analytics

### 7.3 Rollback Plan
- Database migration rollback script
- API endpoint versioning
- Frontend feature toggles

---

## 8. Performance Considerations

### 8.1 Database Indexes
Already specified in schema:
- `repositoryId`, `userId`, `status` on collaboration requests
- `createdAt` for chronological queries
- Composite indexes for common query patterns

### 8.2 Query Optimization
- Use `Promise.all()` for parallel queries
- Limit result sets (take/skip pagination)
- Select only needed fields
- Cache workbench stats with short TTL

### 8.3 Frontend Performance
- Lazy load modal components
- Debounce form inputs
- Optimistic UI updates for votes/follows
- Use Next.js ISR for public pages

---

## 9. Security Considerations

### 9.1 Authorization Checks
- Verify repository ownership before updates
- Check collaboration request permissions
- Validate user can accept/decline requests
- Prevent self-collaboration

### 9.2 Input Validation
- Zod schemas for all API endpoints
- Sanitize user-generated content
- Rate limiting on request creation
- Message length limits

### 9.3 Privacy
- Workbench is auth-protected
- Private analytics not exposed in public API
- Collaboration requests only visible to involved parties

---

## 10. Documentation Updates Needed

### 10.1 User-Facing Docs
- How to set up collaboration options
- Guide for Seekers vs Providers
- How to send/respond to requests
- Workbench feature tour

### 10.2 Developer Docs
- API endpoint documentation
- Database schema updates
- Component API docs
- Testing guide updates

---

## 11. Future Enhancements (Out of Scope for Phase 1)

1. **In-App Messaging**: Direct messages between collaborators
2. **Collaboration Analytics**: Track successful collaborations
3. **Reputation System**: Rate collaborators after working together
4. **Matching Algorithm**: AI-powered Seeker-Provider matching
5. **Team Workspaces**: Shared workbenches for teams
6. **Integration with GitHub Issues**: Sync improvement suggestions
7. **Notification System**: Email/push notifications for requests
8. **Advanced Filtering**: Filter collaborators by tech stack, experience
9. **Collaboration Contracts**: Define expectations upfront
10. **Payment Integration**: Optional paid consultations

---

## 12. Success Metrics

### 12.1 Adoption Metrics
- % of repositories with collaboration options set
- Number of collaboration requests sent per week
- Request acceptance rate
- Average time to respond to requests

### 12.2 Engagement Metrics
- Daily active users on workbench
- Time spent on workbench
- Number of improvement suggestions created
- Suggestion upvote rate

### 12.3 Quality Metrics
- Successfully matched collaborations (accepted requests)
- User satisfaction (future survey)
- Feature usage distribution

---

## 13. Implementation Timeline

### Week 1
- **Days 1-2**: Database schema, migrations, TypeScript types
- **Days 3-4**: API endpoints (repositories, collaboration requests)
- **Day 5**: API endpoints (workbench stats, suggestions)

### Week 2
- **Days 1-2**: Workbench page and components
- **Days 3-4**: Enhanced add repository form with collaboration options
- **Day 5**: Repository detail page enhancements

### Week 3
- **Days 1-2**: Testing (unit, integration, E2E)
- **Day 3**: Bug fixes and polish
- **Day 4**: Documentation
- **Day 5**: Deployment and monitoring

---

## 14. Dependencies & Prerequisites

### 14.1 Existing Features Required
- [x] GitHub OAuth authentication
- [x] Repository connection to database
- [x] Basic repository display
- [x] User session management

### 14.2 External Services
- GitHub API (already integrated)
- PostgreSQL with array support
- Redis (optional for caching)

### 14.3 NPM Packages Needed
- `zod` (already installed)
- `date-fns` (for date formatting)
- No additional packages required

---

## 15. Risk Assessment

### 15.1 High-Risk Areas
1. **Database Migration**: Large schema changes
   - **Mitigation**: Thorough testing, rollback script, backup

2. **Request Spam**: Users spamming collaboration requests
   - **Mitigation**: Rate limiting, duplicate detection

3. **Privacy Concerns**: Exposing private repo info
   - **Mitigation**: Auth checks, careful API design

### 15.2 Medium-Risk Areas
1. **Performance**: Complex workbench queries
   - **Mitigation**: Proper indexing, caching

2. **UX Complexity**: Too many options confusing users
   - **Mitigation**: Progressive disclosure, defaults, help text

### 15.3 Low-Risk Areas
1. **Frontend Components**: Isolated, well-tested patterns
2. **Existing Features**: No breaking changes to current functionality

---

## Conclusion

This implementation plan provides a comprehensive roadmap for adding Workbench and Collaboration features to Vibeyard. The phased approach allows for incremental development and testing, while the detailed specifications ensure all stakeholders understand the technical requirements and design decisions.

**Next Steps**:
1. Review and approve this plan
2. Create JIRA tickets for each phase/task
3. Set up feature branch
4. Begin Phase 1: Database Schema & Types

**Questions for Discussion**:
1. Should we implement notification system in Phase 1 or defer?
2. Do we want analytics/tracking on collaboration feature usage?
3. Should we add collaboration options to existing repositories (migration script)?
4. Any additional collaboration types to include?

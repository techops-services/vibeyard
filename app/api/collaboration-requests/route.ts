import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { notifyNewCollaborationRequest } from '@/services/notifications/notification-service'

// Schema for creating a collaboration request
const createCollaborationRequestSchema = z.object({
  targetRepoId: z.string(),
  collaborationType: z.enum([
    'CODE_REVIEW',
    'BUG_FIX_HELP',
    'TEAM_FORMATION',
    'EXPERTISE_OFFER',
    'MENTORSHIP',
    'GENERAL_COLLABORATION',
  ]),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  requestorRepoId: z.string().optional(),
})

/**
 * GET /api/collaboration-requests
 * Get collaboration requests for the authenticated user
 * Query params:
 *   - type: 'sent' | 'received' (default: 'received')
 *   - collaborationType: filter by collaboration type
 *   - status: filter by status (PENDING, ACCEPTED, DECLINED, WITHDRAWN, COMPLETED)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'received'
    const collaborationType = searchParams.get('collaborationType')
    const status = searchParams.get('status')

    // Build where clause based on type
    const whereClause: {
      requestorId?: string
      targetOwnerId?: string
      collaborationType?: 'CODE_REVIEW' | 'BUG_FIX_HELP' | 'TEAM_FORMATION' | 'EXPERTISE_OFFER' | 'MENTORSHIP' | 'GENERAL_COLLABORATION'
      status?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN' | 'COMPLETED'
    } = {}

    if (type === 'sent') {
      whereClause.requestorId = session.user.id
    } else {
      whereClause.targetOwnerId = session.user.id
    }

    // Add optional filters
    if (collaborationType && ['CODE_REVIEW', 'BUG_FIX_HELP', 'TEAM_FORMATION', 'EXPERTISE_OFFER', 'MENTORSHIP', 'GENERAL_COLLABORATION'].includes(collaborationType)) {
      whereClause.collaborationType = collaborationType as typeof whereClause.collaborationType
    }

    if (status && ['PENDING', 'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'COMPLETED'].includes(status)) {
      whereClause.status = status as typeof whereClause.status
    }

    const requests = await prisma.collaborationRequest.findMany({
      where: whereClause,
      include: {
        requestor: {
          select: {
            id: true,
            name: true,
            email: true,
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
            htmlUrl: true,
            language: true,
            owner: true,
          },
        },
        targetOwner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            githubUsername: true,
          },
        },
        requestorRepo: {
          select: {
            id: true,
            name: true,
            fullName: true,
            description: true,
            htmlUrl: true,
            language: true,
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
      { error: 'Failed to fetch collaboration requests' },
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

    // Parse and validate request body
    const body = await request.json()
    const data = createCollaborationRequestSchema.parse(body)

    // Verify target repository exists
    const targetRepo = await prisma.repository.findUnique({
      where: { id: data.targetRepoId },
      select: {
        id: true,
        name: true,
        title: true,
        userId: true,
        isAcceptingCollaborators: true,
      },
    })

    if (!targetRepo) {
      return NextResponse.json(
        { error: 'Target repository not found' },
        { status: 404 }
      )
    }

    // Prevent self-collaboration
    if (targetRepo.userId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot send collaboration request to your own repository' },
        { status: 400 }
      )
    }

    // Check if repository is accepting collaborators
    if (!targetRepo.isAcceptingCollaborators) {
      return NextResponse.json(
        { error: 'This repository is not currently accepting collaboration requests' },
        { status: 400 }
      )
    }

    // Verify requestor repo if provided
    if (data.requestorRepoId) {
      const requestorRepo = await prisma.repository.findUnique({
        where: { id: data.requestorRepoId },
        select: { userId: true },
      })

      if (!requestorRepo) {
        return NextResponse.json(
          { error: 'Requestor repository not found' },
          { status: 404 }
        )
      }

      if (requestorRepo.userId !== session.user.id) {
        return NextResponse.json(
          { error: 'You can only specify your own repositories' },
          { status: 403 }
        )
      }
    }

    // Check for existing pending request
    const existingRequest = await prisma.collaborationRequest.findFirst({
      where: {
        requestorId: session.user.id,
        targetRepoId: data.targetRepoId,
        status: 'PENDING',
      },
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending collaboration request for this repository' },
        { status: 409 }
      )
    }

    // Create collaboration request
    const collaborationRequest = await prisma.collaborationRequest.create({
      data: {
        requestorId: session.user.id,
        targetRepoId: data.targetRepoId,
        targetOwnerId: targetRepo.userId,
        collaborationType: data.collaborationType,
        message: data.message,
        requestorRepoId: data.requestorRepoId,
      },
      include: {
        requestor: {
          select: {
            id: true,
            name: true,
            email: true,
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
            htmlUrl: true,
            language: true,
            owner: true,
          },
        },
        targetOwner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            githubUsername: true,
          },
        },
        requestorRepo: {
          select: {
            id: true,
            name: true,
            fullName: true,
            description: true,
            htmlUrl: true,
            language: true,
          },
        },
      },
    })

    // Notify repository owner
    await notifyNewCollaborationRequest(
      targetRepo.userId,
      session.user.name || 'Someone',
      targetRepo.id,
      targetRepo.name || targetRepo.title || 'Untitled',
      data.collaborationType.toLowerCase().replace(/_/g, ' ')
    )

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
      { error: 'Failed to create collaboration request' },
      { status: 500 }
    )
  }
}

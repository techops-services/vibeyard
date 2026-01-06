import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { notifyCollaborationStatusChange } from '@/services/notifications/notification-service'

// Schema for updating collaboration request status
const updateCollaborationRequestSchema = z.object({
  status: z.enum(['ACCEPTED', 'DECLINED', 'WITHDRAWN', 'COMPLETED']),
  responseMessage: z.string().optional(),
})

/**
 * PATCH /api/collaboration-requests/[id]
 * Update the status of a collaboration request
 * Authorization:
 *   - Only target owner can ACCEPT or DECLINE
 *   - Only requestor can WITHDRAW
 *   - Either party can mark as COMPLETED
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const { status, responseMessage } = updateCollaborationRequestSchema.parse(body)

    // Await params for Next.js 15
    const { id } = await params

    // Fetch the collaboration request
    const collaborationRequest = await prisma.collaborationRequest.findUnique({
      where: { id },
      select: {
        id: true,
        requestorId: true,
        targetOwnerId: true,
        status: true,
      },
    })

    if (!collaborationRequest) {
      return NextResponse.json(
        { error: 'Collaboration request not found' },
        { status: 404 }
      )
    }

    // Verify authorization based on action
    const isRequestor = collaborationRequest.requestorId === session.user.id
    const isTargetOwner = collaborationRequest.targetOwnerId === session.user.id

    if (!isRequestor && !isTargetOwner) {
      return NextResponse.json(
        { error: 'You are not authorized to modify this collaboration request' },
        { status: 403 }
      )
    }

    // Validate status transitions
    if (status === 'ACCEPTED' || status === 'DECLINED') {
      if (!isTargetOwner) {
        return NextResponse.json(
          { error: 'Only the repository owner can accept or decline requests' },
          { status: 403 }
        )
      }

      if (collaborationRequest.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'Only pending requests can be accepted or declined' },
          { status: 400 }
        )
      }
    }

    if (status === 'WITHDRAWN') {
      if (!isRequestor) {
        return NextResponse.json(
          { error: 'Only the requestor can withdraw a request' },
          { status: 403 }
        )
      }

      if (collaborationRequest.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'Only pending requests can be withdrawn' },
          { status: 400 }
        )
      }
    }

    if (status === 'COMPLETED') {
      if (collaborationRequest.status !== 'ACCEPTED') {
        return NextResponse.json(
          { error: 'Only accepted requests can be marked as completed' },
          { status: 400 }
        )
      }
    }

    // Update the collaboration request
    const updatedRequest = await prisma.collaborationRequest.update({
      where: { id },
      data: {
        status,
        respondedAt: status !== 'COMPLETED' ? new Date() : undefined,
        responseMessage,
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
            title: true,
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

    // Notify requestor of status change (if owner updated it)
    if (isTargetOwner && (status === 'ACCEPTED' || status === 'DECLINED')) {
      await notifyCollaborationStatusChange(
        updatedRequest.requestorId,
        session.user.name || 'Repository owner',
        updatedRequest.targetRepo.name || updatedRequest.targetRepo.title || 'Untitled',
        status,
        updatedRequest.targetRepo.id
      )
    }

    return NextResponse.json(updatedRequest)
  } catch (error) {
    console.error('Error updating collaboration request:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update collaboration request' },
      { status: 500 }
    )
  }
}

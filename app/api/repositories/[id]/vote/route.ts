import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyNewVote } from '@/services/notifications/notification-service'

/**
 * POST /api/repositories/[id]/vote
 * Toggle vote for a repository (upvote or remove vote)
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if repository exists
    const repository = await prisma.repository.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!repository) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      )
    }

    // Check if user has already voted
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_repositoryId: {
          userId: session.user.id,
          repositoryId: params.id,
        },
      },
    })

    if (existingVote) {
      // Remove vote
      await prisma.vote.delete({
        where: {
          id: existingVote.id,
        },
      })

      // Decrement vote count
      await prisma.repository.update({
        where: { id: params.id },
        data: {
          votesCount: {
            decrement: 1,
          },
        },
      })

      return NextResponse.json({ voted: false, votesCount: repository.votesCount - 1 })
    } else {
      // Add vote
      await prisma.vote.create({
        data: {
          userId: session.user.id,
          repositoryId: params.id,
        },
      })

      // Increment vote count
      await prisma.repository.update({
        where: { id: params.id },
        data: {
          votesCount: {
            increment: 1,
          },
        },
      })

      // Create activity
      const activity = await prisma.activity.create({
        data: {
          actorId: session.user.id,
          type: 'vote_added',
          entityType: 'repository',
          entityId: params.id,
        },
      })

      // Notify repository owner (if not voting own repo)
      if (repository.userId !== session.user.id) {
        await notifyNewVote(
          repository.userId,
          session.user.name || 'Someone',
          repository.id,
          repository.name,
          activity.id
        )
      }

      return NextResponse.json({ voted: true, votesCount: repository.votesCount + 1 })
    }
  } catch (error) {
    console.error('Error toggling vote:', error)
    return NextResponse.json(
      { error: 'Failed to toggle vote' },
      { status: 500 }
    )
  }
}

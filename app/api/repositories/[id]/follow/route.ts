import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyNewFollower } from '@/services/notifications/notification-service'

/**
 * POST /api/repositories/[id]/follow
 * Toggle follow for a repository (follow if not following, unfollow if following)
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

    // Check if user is already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        userId_repositoryId: {
          userId: session.user.id,
          repositoryId: params.id,
        },
      },
    })

    if (existingFollow) {
      // Unfollow
      await prisma.follow.delete({
        where: {
          id: existingFollow.id,
        },
      })

      // Decrement followers count
      const updatedRepo = await prisma.repository.update({
        where: { id: params.id },
        data: {
          followersCount: {
            decrement: 1,
          },
        },
      })

      return NextResponse.json({
        following: false,
        followersCount: updatedRepo.followersCount,
      })
    } else {
      // Follow
      await prisma.follow.create({
        data: {
          userId: session.user.id,
          repositoryId: params.id,
        },
      })

      // Increment followers count
      const updatedRepo = await prisma.repository.update({
        where: { id: params.id },
        data: {
          followersCount: {
            increment: 1,
          },
        },
      })

      // Create activity
      const activity = await prisma.activity.create({
        data: {
          actorId: session.user.id,
          type: 'follow_added',
          entityType: 'repository',
          entityId: params.id,
        },
      })

      // Notify repository owner (if not following own repo)
      if (repository.userId !== session.user.id) {
        await notifyNewFollower(
          repository.userId,
          session.user.name || 'Someone',
          repository.id,
          repository.name || repository.title || 'Untitled',
          activity.id
        )
      }

      return NextResponse.json({
        following: true,
        followersCount: updatedRepo.followersCount,
      })
    }
  } catch (error) {
    console.error('Error toggling follow:', error)
    return NextResponse.json(
      { error: 'Failed to toggle follow' },
      { status: 500 }
    )
  }
}

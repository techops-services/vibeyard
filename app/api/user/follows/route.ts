import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/user/follows
 * List all repositories the current user is following
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const follows = await prisma.follow.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        repository: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                githubUsername: true,
              },
            },
            analysis: {
              select: {
                completenessScore: true,
                aiDetected: true,
                aiProvider: true,
              },
            },
            _count: {
              select: {
                votes: true,
                follows: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Get latest activity for each repository
    const repositoriesWithActivity = await Promise.all(
      follows.map(async (follow) => {
        const latestActivity = await prisma.activity.findFirst({
          where: {
            entityId: follow.repositoryId,
          },
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            actor: {
              select: {
                name: true,
                githubUsername: true,
              },
            },
          },
        })

        return {
          ...follow,
          latestActivity,
        }
      })
    )

    return NextResponse.json({
      follows: repositoriesWithActivity,
      total: follows.length,
    })
  } catch (error) {
    console.error('Error fetching follows:', error)
    return NextResponse.json(
      { error: 'Failed to fetch follows' },
      { status: 500 }
    )
  }
}

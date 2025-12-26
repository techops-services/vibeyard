import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(5000, 'Comment too long'),
  parentId: z.string().optional(),
})

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET /api/repositories/[id]/comments
 * Fetch all comments for a repository
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth()

    // Fetch repository to verify it exists
    const repository = await prisma.repository.findUnique({
      where: { id: params.id },
    })

    if (!repository) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      )
    }

    // Fetch all comments for the repository (flat list)
    const comments = await prisma.comment.findMany({
      where: {
        repositoryId: params.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            githubUsername: true,
          },
        },
        votes: session?.user?.id
          ? {
              where: {
                userId: session.user.id,
              },
              select: {
                id: true,
              },
            }
          : false,
        _count: {
          select: {
            votes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Transform comments to include hasVoted flag and actual votesCount
    const transformedComments = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      userId: comment.userId,
      repositoryId: comment.repositoryId,
      parentId: comment.parentId,
      depth: comment.depth,
      votesCount: comment._count.votes,
      isDeleted: comment.isDeleted,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      user: comment.user,
      hasVoted: Array.isArray(comment.votes) ? comment.votes.length > 0 : false,
    }))

    return NextResponse.json(transformedComments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/repositories/[id]/comments
 * Create a new comment
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const { content, parentId } = createCommentSchema.parse(body)

    // Fetch repository to verify it exists
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

    // If replying to a comment, verify parent exists and calculate depth
    let depth = 0
    let parentComment = null

    if (parentId) {
      parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      })

      if (!parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        )
      }

      // Max depth of 6 levels, after that keep it flat
      depth = Math.min(parentComment.depth + 1, 6)
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content,
        userId: session.user.id,
        repositoryId: params.id,
        parentId,
        depth,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            githubUsername: true,
          },
        },
      },
    })

    // Create notification for repository owner (if not commenting on own repo)
    if (repository.userId !== session.user.id && !parentId) {
      await prisma.notification.create({
        data: {
          userId: repository.userId,
          type: 'NEW_COMMENT',
          title: 'New comment on your repository',
          message: `${session.user.name || 'Someone'} commented on ${repository.name}`,
          repositoryId: params.id,
        },
      })
    }

    // Create notification for parent comment author (if replying)
    if (parentId && parentComment && parentComment.userId !== session.user.id) {
      await prisma.notification.create({
        data: {
          userId: parentComment.userId,
          type: 'COMMENT_REPLY',
          title: 'New reply to your comment',
          message: `${session.user.name || 'Someone'} replied to your comment on ${repository.name}`,
          repositoryId: params.id,
        },
      })
    }

    // Return comment with hasVoted flag
    return NextResponse.json(
      {
        ...comment,
        votesCount: 0,
        hasVoted: false,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating comment:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}

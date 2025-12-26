import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * POST /api/comments/[id]/vote
 * Toggle upvote on a comment
 */
export async function POST(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: params.id },
    })

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Check if user already voted
    const existingVote = await prisma.commentVote.findUnique({
      where: {
        userId_commentId: {
          userId: session.user.id,
          commentId: params.id,
        },
      },
    })

    let hasVoted: boolean
    let votesCount: number

    if (existingVote) {
      // Remove vote
      await prisma.commentVote.delete({
        where: { id: existingVote.id },
      })

      // Get updated count
      const count = await prisma.commentVote.count({
        where: { commentId: params.id },
      })

      hasVoted = false
      votesCount = count
    } else {
      // Add vote
      await prisma.commentVote.create({
        data: {
          userId: session.user.id,
          commentId: params.id,
        },
      })

      // Get updated count
      const count = await prisma.commentVote.count({
        where: { commentId: params.id },
      })

      hasVoted = true
      votesCount = count
    }

    return NextResponse.json({
      hasVoted,
      votesCount,
    })
  } catch (error) {
    console.error('Error toggling comment vote:', error)
    return NextResponse.json(
      { error: 'Failed to toggle vote' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/suggestions/[id]/upvote
 * Toggle upvote on a suggestion
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Await params for Next.js 15
    const { id } = await params

    // Verify suggestion exists
    const suggestion = await prisma.improvementSuggestion.findUnique({
      where: { id },
      select: { id: true, upvotesCount: true },
    })

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      )
    }

    // Check if user already upvoted
    const existingUpvote = await prisma.suggestionUpvote.findUnique({
      where: {
        userId_suggestionId: {
          userId: session.user.id,
          suggestionId: id,
        },
      },
    })

    if (existingUpvote) {
      // Remove upvote
      await prisma.suggestionUpvote.delete({
        where: { id: existingUpvote.id },
      })

      const updated = await prisma.improvementSuggestion.update({
        where: { id },
        data: {
          upvotesCount: {
            decrement: 1,
          },
        },
        select: {
          id: true,
          upvotesCount: true,
        },
      })

      return NextResponse.json(updated)
    } else {
      // Add upvote
      await prisma.suggestionUpvote.create({
        data: {
          userId: session.user.id,
          suggestionId: id,
        },
      })

      const updated = await prisma.improvementSuggestion.update({
        where: { id },
        data: {
          upvotesCount: {
            increment: 1,
          },
        },
        select: {
          id: true,
          upvotesCount: true,
        },
      })

      return NextResponse.json(updated)
    }
  } catch (error) {
    console.error('Error toggling upvote:', error)

    return NextResponse.json(
      { error: 'Failed to toggle upvote' },
      { status: 500 }
    )
  }
}

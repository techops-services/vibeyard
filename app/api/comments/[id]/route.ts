import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * DELETE /api/comments/[id]
 * Soft delete a comment (only by the comment author)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch comment to verify ownership
    const comment = await prisma.comment.findUnique({
      where: { id: params.id },
    })

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (comment.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own comments' },
        { status: 403 }
      )
    }

    // Soft delete: set isDeleted to true and replace content
    const deletedComment = await prisma.comment.update({
      where: { id: params.id },
      data: {
        isDeleted: true,
        content: '[deleted]',
      },
    })

    return NextResponse.json({
      message: 'Comment deleted successfully',
      comment: {
        id: deletedComment.id,
        isDeleted: deletedComment.isDeleted,
        content: deletedComment.content,
      },
    })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    )
  }
}

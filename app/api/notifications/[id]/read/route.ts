import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { markAsRead } from '@/services/notifications/notification-service'

/**
 * POST /api/notifications/[id]/read
 * Mark a single notification as read
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

    const notification = await markAsRead(params.id, session.user.id)

    return NextResponse.json({ notification })
  } catch (error) {
    console.error('Error marking notification as read:', error)

    if (error instanceof Error && error.message === 'Notification not found') {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
}

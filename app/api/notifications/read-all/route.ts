import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { markAllAsRead } from '@/services/notifications/notification-service'

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read for the current user
 */
export async function POST() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await markAllAsRead(session.user.id)

    return NextResponse.json({
      success: true,
      count: result.count,
    })
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    )
  }
}

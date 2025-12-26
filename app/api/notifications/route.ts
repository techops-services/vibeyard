import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getNotifications } from '@/services/notifications/notification-service'

/**
 * GET /api/notifications
 * List notifications with pagination
 * Query params: unreadOnly, limit, offset
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '25')
    const offset = parseInt(searchParams.get('offset') || '0')

    const result = await getNotifications(session.user.id, {
      unreadOnly,
      limit,
      offset,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

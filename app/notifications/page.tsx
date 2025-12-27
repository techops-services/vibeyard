'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { YardHeader } from '@/app/components/YardHeader'
import { NotificationItem } from '@/app/components/ui/NotificationItem'
import { NotificationType } from '@prisma/client'

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  repositoryId: string | null
  read: boolean
  createdAt: string
  repository?: {
    id: string
    name: string
    owner: string
    fullName: string
  } | null
}

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const limit = 50

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications(0)
    }
  }, [session?.user?.id, filter])

  const fetchNotifications = async (newOffset: number) => {
    setIsLoading(true)
    try {
      const unreadParam = filter === 'unread' ? '&unreadOnly=true' : ''
      const response = await fetch(
        `/api/notifications?limit=${limit}&offset=${newOffset}${unreadParam}`
      )

      if (response.ok) {
        const data = await response.json()
        if (newOffset === 0) {
          setNotifications(data.notifications)
        } else {
          setNotifications([...notifications, ...data.notifications])
        }
        setHasMore(data.hasMore)
        setOffset(newOffset)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      })

      if (response.ok) {
        setNotifications(
          notifications.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        )
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
      })

      if (response.ok) {
        setNotifications(notifications.map((n) => ({ ...n, read: true })))
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const loadMore = () => {
    fetchNotifications(offset + limit)
  }

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex flex-col">
        <YardHeader />
        <main className="flex-1 max-w-4xl w-full mx-auto p-4">
          <div className="text-center yard-meta">Loading...</div>
        </main>
      </div>
    )
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="min-h-screen flex flex-col">
      <YardHeader />

      <main className="flex-1 max-w-4xl w-full mx-auto">
        {/* Header */}
        <div className="border-b border-[--yard-border] p-4">
          <h1 className="text-2xl font-bold mono mb-2">Notifications</h1>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFilter('all')}
                className={
                  filter === 'all'
                    ? 'yard-button text-xs'
                    : 'yard-button-secondary text-xs'
                }
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={
                  filter === 'unread'
                    ? 'yard-button text-xs'
                    : 'yard-button-secondary text-xs'
                }
              >
                Unread ({unreadCount})
              </button>
            </div>

            {unreadCount > 0 && filter === 'all' && (
              <button
                onClick={handleMarkAllAsRead}
                className="yard-button-secondary text-xs"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Notifications list */}
        <div>
          {isLoading && notifications.length === 0 ? (
            <div className="p-8 text-center yard-meta">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center yard-meta">
              {filter === 'unread'
                ? 'No unread notifications'
                : 'No notifications yet'}
            </div>
          ) : (
            <>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  id={notification.id}
                  type={notification.type}
                  title={notification.title}
                  message={notification.message}
                  repositoryName={notification.repository?.name}
                  repositoryOwner={notification.repository?.owner}
                  read={notification.read}
                  createdAt={new Date(notification.createdAt)}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}

              {hasMore && (
                <div className="p-4 text-center border-t border-[--yard-border]">
                  <button
                    onClick={loadMore}
                    disabled={isLoading}
                    className="yard-button-secondary text-xs"
                  >
                    {isLoading ? 'Loading...' : 'Load more'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

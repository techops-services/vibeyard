'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { NotificationItem } from './NotificationItem'
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
    fullName: string
  } | null
}

export function NotificationBell() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Fetch unread count
  useEffect(() => {
    if (session?.user?.id) {
      fetchUnreadCount()
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000)
      return () => clearInterval(interval)
    }
  }, [session?.user?.id])

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/count')
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.count)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/notifications?limit=10')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBellClick = () => {
    if (!isOpen) {
      fetchNotifications()
    }
    setIsOpen(!isOpen)
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      })

      if (response.ok) {
        setNotifications(notifications.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        ))
        setUnreadCount(Math.max(0, unreadCount - 1))
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
        setNotifications(notifications.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  if (!session) {
    return null
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleBellClick}
        className="relative text-xs hover:opacity-80 flex items-center gap-1"
      >
        <span>🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[--yard-error] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-[--yard-border] shadow-lg z-50">
          {/* Header */}
          <div className="p-3 border-b border-[--yard-border] flex items-center justify-between">
            <h3 className="font-semibold text-sm mono">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs yard-meta hover:text-[--yard-orange]"
              >
                mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center yard-meta text-xs">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center yard-meta text-xs">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  id={notification.id}
                  type={notification.type}
                  title={notification.title}
                  message={notification.message}
                  repositoryId={notification.repositoryId}
                  repositoryName={notification.repository?.name}
                  read={notification.read}
                  createdAt={new Date(notification.createdAt)}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 border-t border-[--yard-border] text-center">
              <button
                onClick={() => {
                  setIsOpen(false)
                  router.push('/notifications')
                }}
                className="text-xs yard-meta hover:text-[--yard-orange]"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

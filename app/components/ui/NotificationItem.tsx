'use client'

import Link from 'next/link'
import { formatRelativeTime } from '@/lib/utils'
import { NotificationType } from '@prisma/client'

interface NotificationItemProps {
  id: string
  type: NotificationType
  title: string
  message: string
  repositoryId?: string | null
  repositoryName?: string | null
  read: boolean
  createdAt: Date
  onMarkAsRead?: (id: string) => void
}

function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case 'NEW_VOTE':
      return '▲'
    case 'NEW_FOLLOWER':
      return '👁'
    case 'NEW_COLLABORATION_REQUEST':
      return '🤝'
    case 'COLLABORATION_STATUS_CHANGE':
      return '📝'
    case 'NEW_SUGGESTION':
      return '💡'
    case 'NEW_ANALYSIS_COMPLETE':
      return '✓'
    default:
      return '•'
  }
}

export function NotificationItem({
  id,
  type,
  title,
  message,
  repositoryId,
  read,
  createdAt,
  onMarkAsRead,
}: NotificationItemProps) {
  const handleClick = () => {
    if (!read && onMarkAsRead) {
      onMarkAsRead(id)
    }
  }

  const content = (
    <div
      className={`p-3 border-b border-[--yard-border] hover:bg-[--yard-hover] cursor-pointer transition-colors ${
        !read ? 'bg-[--yard-light-orange]' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-2">
        <span className="text-base yard-meta flex-shrink-0 mt-0.5">
          {getNotificationIcon(type)}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="font-medium text-xs">{title}</div>
            {!read && (
              <span className="w-2 h-2 bg-[--yard-orange] rounded-full flex-shrink-0 mt-1"></span>
            )}
          </div>
          <div className="yard-meta text-xs mt-0.5 leading-relaxed">
            {message}
          </div>
          <div className="yard-meta text-xs mt-1">
            {formatRelativeTime(new Date(createdAt))}
          </div>
        </div>
      </div>
    </div>
  )

  if (repositoryId) {
    return (
      <Link href={`/repo/${repositoryId}`} className="block">
        {content}
      </Link>
    )
  }

  return content
}

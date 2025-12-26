'use client'

import { CollaborationRequestStatus } from '@prisma/client'

interface Props {
  status: CollaborationRequestStatus
  size?: 'sm' | 'md'
}

const statusConfig: Record<CollaborationRequestStatus, { label: string; className: string }> = {
  PENDING: {
    label: 'pending',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  ACCEPTED: {
    label: 'accepted',
    className: 'bg-green-100 text-green-800 border-green-200'
  },
  DECLINED: {
    label: 'declined',
    className: 'bg-red-100 text-red-800 border-red-200'
  },
  WITHDRAWN: {
    label: 'withdrawn',
    className: 'bg-gray-100 text-gray-800 border-gray-200'
  },
  COMPLETED: {
    label: 'completed',
    className: 'bg-blue-100 text-blue-800 border-blue-200'
  },
}

export function StatusBadge({ status, size = 'sm' }: Props) {
  const config = statusConfig[status]

  return (
    <span
      className={`inline-block font-medium border ${config.className} ${
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'
      }`}
    >
      {config.label}
    </span>
  )
}

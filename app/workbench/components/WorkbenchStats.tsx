'use client'

import { Repository } from '@prisma/client'

interface Props {
  repositories: (Repository & {
    _count: {
      votes: number
      follows: number
      views: number
      collaborationRequestsReceived: number
    }
  })[]
}

export function WorkbenchStats({ repositories }: Props) {
  const stats = {
    totalRepos: repositories.length,
    totalVotes: repositories.reduce((sum, r) => sum + r._count.votes, 0),
    totalFollows: repositories.reduce((sum, r) => sum + r._count.follows, 0),
    totalViews: repositories.reduce((sum, r) => sum + r._count.views, 0),
    pendingRequests: repositories.reduce(
      (sum, r) => sum + r._count.collaborationRequestsReceived,
      0
    ),
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <StatCard label="repositories" value={stats.totalRepos} />
      <StatCard label="total votes" value={stats.totalVotes} />
      <StatCard label="total follows" value={stats.totalFollows} />
      <StatCard label="total views" value={stats.totalViews} />
      <StatCard
        label="pending requests"
        value={stats.pendingRequests}
        highlight={stats.pendingRequests > 0}
      />
    </div>
  )
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <div
      className={`border border-[--yard-border] p-4 ${
        highlight ? 'bg-[--yard-light-orange] border-[--yard-orange]' : ''
      }`}
    >
      <div className="text-2xl font-bold mono">{value}</div>
      <div className="yard-meta text-xs mt-1">{label}</div>
    </div>
  )
}

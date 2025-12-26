'use client'

import { CollaborationType } from '@prisma/client'

interface Props {
  type: CollaborationType
  size?: 'sm' | 'md'
}

const typeConfig: Record<CollaborationType, { label: string; emoji: string }> = {
  CODE_REVIEW: { label: 'code reviews', emoji: '📝' },
  BUG_FIX_HELP: { label: 'bug fixes', emoji: '🐛' },
  TEAM_FORMATION: { label: 'team building', emoji: '👥' },
  EXPERTISE_OFFER: { label: 'expertise', emoji: '💡' },
  MENTORSHIP: { label: 'mentorship', emoji: '🎓' },
  GENERAL_COLLABORATION: { label: 'collaboration', emoji: '🤝' },
}

export function CollaborationTypeChip({ type, size = 'sm' }: Props) {
  const config = typeConfig[type]

  return (
    <span
      className={`inline-flex items-center gap-1 border border-[--yard-border] bg-[--yard-light-gray] text-[--yard-gray] ${
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'
      }`}
    >
      <span>{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  )
}

export function formatCollaborationType(type: CollaborationType): string {
  return typeConfig[type]?.label || type.replace(/_/g, ' ').toLowerCase()
}

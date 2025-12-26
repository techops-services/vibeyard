'use client'

import { CollaborationType } from '@prisma/client'
import { CollaborationOptions } from '@/types/collaboration'

interface Props {
  options: CollaborationOptions
  onChange: (options: CollaborationOptions) => void
}

const COLLABORATION_TYPES: { value: CollaborationType; label: string; description: string }[] = [
  {
    value: 'CODE_REVIEW',
    label: 'Code Review',
    description: 'Human code review requests',
  },
  {
    value: 'BUG_FIX_HELP',
    label: 'Bug Fix Help',
    description: 'Help fixing specific issues',
  },
  {
    value: 'TEAM_FORMATION',
    label: 'Team Formation',
    description: 'Looking to form dev team',
  },
  {
    value: 'EXPERTISE_OFFER',
    label: 'Expertise Offer',
    description: 'Offering technical expertise',
  },
  {
    value: 'MENTORSHIP',
    label: 'Mentorship',
    description: 'Mentorship/guidance',
  },
  {
    value: 'GENERAL_COLLABORATION',
    label: 'General Collaboration',
    description: 'General collaboration',
  },
]

export function CollaborationOptionsForm({ options, onChange }: Props) {
  const handleTypeToggle = (type: CollaborationType) => {
    const newTypes = options.types.includes(type)
      ? options.types.filter((t) => t !== type)
      : [...options.types, type]
    // Always set role to SEEKER when collaboration is enabled
    onChange({ ...options, types: newTypes, role: 'SEEKER' })
  }

  const handleDetailsChange = (details: string) => {
    onChange({ ...options, details })
  }

  const handleIsAcceptingChange = (isAccepting: boolean) => {
    onChange({ ...options, isAccepting, role: 'SEEKER' })
  }

  return (
    <div className="space-y-4">
      {/* Collaboration Types */}
      <div>
        <label className="block text-sm font-medium mb-2 mono">
          Collaboration Types
          <span className="yard-meta ml-2 font-normal">(select all that apply)</span>
        </label>
        <div className="space-y-2">
          {COLLABORATION_TYPES.map((type) => (
            <label
              key={type.value}
              className="flex items-start gap-2 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={options.types.includes(type.value)}
                onChange={() => handleTypeToggle(type.value)}
                className="mt-0.5 accent-[--yard-orange]"
              />
              <div className="flex-1">
                <div className="text-sm group-hover:text-[--yard-orange]">
                  {type.label}
                </div>
                <div className="yard-meta text-xs">{type.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Details */}
      <div>
        <label className="block text-sm font-medium mb-2 mono">
          Additional Details
          <span className="yard-meta ml-2 font-normal">(optional)</span>
        </label>
        <textarea
          value={options.details || ''}
          onChange={(e) => handleDetailsChange(e.target.value)}
          placeholder="Describe what kind of collaboration you're looking for or offering..."
          className="yard-input w-full min-h-24 resize-y"
          rows={4}
        />
      </div>

      {/* Is Accepting */}
      <div>
        <label className="flex items-start gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={options.isAccepting}
            onChange={(e) => handleIsAcceptingChange(e.target.checked)}
            className="mt-0.5 accent-[--yard-orange]"
          />
          <div className="flex-1">
            <div className="text-sm group-hover:text-[--yard-orange]">
              Accepting collaboration requests
            </div>
            <div className="yard-meta text-xs">
              Allow others to send you collaboration requests for this repository
            </div>
          </div>
        </label>
      </div>
    </div>
  )
}

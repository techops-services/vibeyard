'use client'

import { useState } from 'react'
import { CollaborationType } from '@prisma/client'
import { CollaborationOptionsForm } from '@/app/components/CollaborationOptionsForm'
import { CollaborationOptions } from '@/types/collaboration'

interface Props {
  repositoryId: string
  initialTypes: CollaborationType[]
  initialDetails: string | null
  initialIsAccepting: boolean
}

export function EditCollaborationOptions({
  repositoryId,
  initialTypes,
  initialDetails,
  initialIsAccepting,
}: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [options, setOptions] = useState<CollaborationOptions>({
    role: 'SEEKER',
    types: initialTypes,
    details: initialDetails || '',
    isAccepting: initialIsAccepting,
  })
  const [savedOptions, setSavedOptions] = useState<CollaborationOptions>({
    role: 'SEEKER',
    types: initialTypes,
    details: initialDetails || '',
    isAccepting: initialIsAccepting,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/repositories/${repositoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collaborationTypes: options.types,
          collaborationDetails: options.details || null,
          isAcceptingCollaborators: options.isAccepting,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update')
      }

      setSavedOptions(options)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setOptions(savedOptions)
    setError(null)
    setIsEditing(false)
  }

  const hasCollaboration = savedOptions.types.length > 0 || savedOptions.isAccepting

  if (isEditing) {
    return (
      <div className="mt-3 p-3 bg-[--yard-light-gray] border border-[--yard-border]">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium mono">Collaboration Options</span>
        </div>

        <CollaborationOptionsForm options={options} onChange={setOptions} />

        {error && (
          <p className="text-xs text-red-500 mt-3">{error}</p>
        )}

        <div className="flex gap-2 mt-4 pt-3 border-t border-[--yard-border]">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="text-xs px-3 py-1.5 bg-[--yard-orange] text-white hover:bg-[#cc5200] disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="text-xs px-3 py-1.5 bg-white border border-[--yard-border] text-[--yard-gray] hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-2">
      {hasCollaboration ? (
        <div className="flex items-center gap-2 text-xs">
          <span className="yard-meta">collaboration:</span>
          {savedOptions.isAccepting && (
            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px]">
              accepting requests
            </span>
          )}
          <button
            onClick={() => setIsEditing(true)}
            className="yard-meta hover:text-[--yard-orange]"
          >
            edit
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className="text-xs yard-meta hover:text-[--yard-orange] flex items-center gap-1"
        >
          <span>+</span> configure collaboration
        </button>
      )}
    </div>
  )
}

'use client'

import { CollaborationType } from '@prisma/client'
import { useState } from 'react'

interface RequestCollaborationFormProps {
  repositoryId: string
  repositoryName: string
  targetOwnerId: string
  availableTypes: CollaborationType[]
  onClose: () => void
  onSuccess: () => void
}

export function RequestCollaborationForm({
  repositoryId,
  repositoryName: _repositoryName,
  targetOwnerId,
  availableTypes,
  onClose,
  onSuccess,
}: RequestCollaborationFormProps) {
  const [selectedType, setSelectedType] = useState<CollaborationType | ''>('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!selectedType) {
      setError('Please select a collaboration type')
      return
    }

    if (message.length < 20) {
      setError('Message must be at least 20 characters')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/collaboration-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetRepoId: repositoryId,
          targetOwnerId,
          collaborationType: selectedType,
          message,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send request')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send request')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="border border-[--yard-border] bg-[--yard-light-gray] p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold mono mb-1">
          request collaboration
        </h3>
        <p className="text-xs yard-meta">
          Send a collaboration request to the repository owner
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Collaboration Type Select */}
        <div>
          <label htmlFor="collaborationType" className="block text-xs yard-meta mb-1">
            collaboration type *
          </label>
          <select
            id="collaborationType"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as CollaborationType)}
            className="w-full yard-input"
            disabled={isSubmitting}
            required
          >
            <option value="">-- select type --</option>
            {availableTypes.map((type) => (
              <option key={type} value={type}>
                {formatCollaborationType(type)}
              </option>
            ))}
          </select>
        </div>

        {/* Message Textarea */}
        <div>
          <label htmlFor="message" className="block text-xs yard-meta mb-1">
            message * (min 20 characters)
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full yard-input resize-none"
            rows={4}
            placeholder="Explain why you'd like to collaborate and what you can contribute..."
            disabled={isSubmitting}
            required
            minLength={20}
          />
          <div className="text-xs yard-meta mt-1">
            {message.length} / 20 minimum
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 p-2">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting || !selectedType || message.length < 20}
            className="yard-button flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'sending...' : 'send request'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3 py-1 text-xs border border-[--yard-border] bg-white hover:bg-[--yard-light-gray] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            cancel
          </button>
        </div>
      </form>
    </div>
  )
}

function formatCollaborationType(type: CollaborationType): string {
  return type
    .toLowerCase()
    .replace(/_/g, ' ')
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Repository, CollaborationType } from '@prisma/client'
import { CollaborationOptions } from '@/types/collaboration'
import { CollaborationOptionsForm } from '@/app/components/CollaborationOptionsForm'

interface Props {
  isOpen: boolean
  onClose: () => void
  repository: Repository
}

export function EditVibeModal({ isOpen, onClose, repository }: Props) {
  const router = useRouter()

  // Form state
  const [title, setTitle] = useState(repository.title || '')
  const [description, setDescription] = useState(repository.description || '')
  const [screenshotUrl, setScreenshotUrl] = useState(repository.screenshotUrl || '')
  const [deployedUrl, setDeployedUrl] = useState(repository.deployedUrl || '')
  const [collaborationOptions, setCollaborationOptions] = useState<CollaborationOptions>({
    role: 'SEEKER',
    types: (repository.collaborationTypes as CollaborationType[]) || [],
    details: repository.collaborationDetails || '',
    isAccepting: repository.isAcceptingCollaborators,
  })

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleClose = () => {
    if (!isLoading) {
      setError(null)
      setShowDeleteConfirm(false)
      onClose()
    }
  }

  // Helper to validate URL format
  const isValidUrl = (url: string): boolean => {
    if (!url.trim()) return true // Empty is valid (optional field)
    try {
      new URL(url.trim())
      return true
    } catch {
      return false
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Client-side URL validation
    if (!isValidUrl(screenshotUrl)) {
      setError('Screenshot URL must be a valid URL')
      return
    }
    if (!isValidUrl(deployedUrl)) {
      setError('Live URL must be a valid URL')
      return
    }

    setIsLoading(true)

    try {
      const payload: {
        title?: string
        description?: string | null
        screenshotUrl?: string | null
        deployedUrl?: string | null
        collaborationTypes?: CollaborationType[]
        collaborationDetails?: string | null
        isAcceptingCollaborators?: boolean
      } = {}

      // Only include title for non-GitHub vibes
      if (!repository.githubId && title.trim()) {
        payload.title = title.trim()
      }

      // Description can be updated for both GitHub and non-GitHub vibes
      payload.description = description.trim() || null

      // URLs
      payload.screenshotUrl = screenshotUrl.trim() || null
      payload.deployedUrl = deployedUrl.trim() || null

      // Collaboration
      payload.collaborationTypes = collaborationOptions.types
      payload.collaborationDetails = collaborationOptions.details || null
      payload.isAcceptingCollaborators = collaborationOptions.isAccepting

      const response = await fetch(`/api/repositories/${repository.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update vibe')
      }

      handleClose()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update vibe')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/repositories/${repository.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        // If 404, the item was already deleted
        if (response.status === 404) {
          handleClose()
          router.refresh()
          return
        }
        throw new Error('Failed to delete')
      }

      handleClose()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete vibe')
      // Keep showDeleteConfirm=true so user must re-confirm after error
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return null
  }

  const displayName = repository.title || repository.fullName || repository.name || 'Untitled Vibe'
  const isGitHubVibe = !!repository.githubId

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50">
      <div className="bg-[--yard-bg] border-2 border-[--yard-border] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b-2 border-[--yard-border] p-4 flex items-center justify-between bg-[--yard-light-gray]">
          <h2 className="text-lg font-bold mono">Edit Vibe</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-[--yard-gray] hover:text-[--yard-fg] text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSave} className="space-y-4">
            {/* Title - only editable for non-GitHub vibes */}
            <div>
              <label className="block text-sm font-medium mb-2 mono">
                Vibe Title {!isGitHubVibe && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Awesome Project"
                className="yard-input w-full"
                disabled={isLoading || isGitHubVibe}
                required={!isGitHubVibe}
              />
              {isGitHubVibe ? (
                <p className="yard-meta text-xs mt-1">
                  Title is synced from GitHub and cannot be edited
                </p>
              ) : (
                <p className="yard-meta text-xs mt-1">
                  Give your vibe a name
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2 mono">
                Description <span className="yard-meta font-normal">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of your vibe..."
                className="yard-input w-full h-20 resize-none"
                disabled={isLoading}
              />
              <p className="yard-meta text-xs mt-1">
                {isGitHubVibe ? 'Override the GitHub description' : 'Tell people what your vibe is about'}
              </p>
            </div>

            {/* Screenshot URL */}
            <div>
              <label className="block text-sm font-medium mb-2 mono">
                Screenshot URL <span className="yard-meta font-normal">(optional)</span>
              </label>
              <input
                type="url"
                value={screenshotUrl}
                onChange={(e) => setScreenshotUrl(e.target.value)}
                placeholder="https://i.imgur.com/example.png"
                className="yard-input w-full"
                disabled={isLoading}
              />
              <p className="yard-meta text-xs mt-1">
                Link to an image showing your vibe in action
              </p>
            </div>

            {/* Live URL */}
            <div>
              <label className="block text-sm font-medium mb-2 mono">
                Live URL <span className="yard-meta font-normal">(optional)</span>
              </label>
              <input
                type="url"
                value={deployedUrl}
                onChange={(e) => setDeployedUrl(e.target.value)}
                placeholder="https://your-app.com"
                className="yard-input w-full"
                disabled={isLoading}
              />
              <p className="yard-meta text-xs mt-1">
                If your vibe is deployed and live, add the URL to show it off
              </p>
            </div>

            {/* Collaboration Options */}
            <div className="border-t border-[--yard-border] pt-4">
              <h3 className="text-sm font-medium mb-3 mono">Collaboration Options</h3>
              <CollaborationOptionsForm
                options={collaborationOptions}
                onChange={setCollaborationOptions}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="yard-button"
                disabled={isLoading || (!isGitHubVibe && !title.trim())}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="yard-button bg-gray-300 border-gray-300 text-black hover:bg-gray-400 hover:border-gray-400"
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Delete Section */}
          <div className="mt-6 pt-6 border-t-2 border-[--yard-border]">
            <h3 className="text-sm font-medium mb-2 mono text-red-600">Danger Zone</h3>
            <p className="yard-meta text-xs mb-3">
              Permanently delete this vibe and all associated data (votes, follows, views, comments, etc.)
            </p>

            {showDeleteConfirm ? (
              <div className="bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-800 mb-3 font-medium">
                  Are you sure you want to delete &quot;{displayName}&quot;? This action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="text-sm px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Deleting...' : 'Yes, Delete Permanently'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isLoading}
                    className="text-sm px-3 py-1.5 bg-gray-200 text-black hover:bg-gray-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading}
                className="text-sm px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                Delete Vibe
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { CollaborationOptions } from '@/types/collaboration'
import { CollaborationOptionsForm } from './CollaborationOptionsForm'

const PENDING_VIBE_KEY = 'vibeyard_pending_vibe'

interface PendingVibeData {
  repoUrl: string
  vibeTitle: string
  vibeDescription: string
  screenshotUrl: string
  deployedUrl: string
  collaborationOptions: CollaborationOptions
  includeCollaboration: boolean
}

interface Props {
  isOpen: boolean
  onClose: () => void
  isLoggedIn?: boolean
}

type Step = 'repo' | 'collaboration'

export function AddVibeModal({ isOpen, onClose, isLoggedIn = false }: Props) {
  const [step, setStep] = useState<Step>('repo')
  const [repoUrl, setRepoUrl] = useState('')
  const [vibeTitle, setVibeTitle] = useState('')
  const [vibeDescription, setVibeDescription] = useState('')
  const [screenshotUrl, setScreenshotUrl] = useState('')
  const [deployedUrl, setDeployedUrl] = useState('')
  const [collaborationOptions, setCollaborationOptions] = useState<CollaborationOptions>({
    role: 'SEEKER',
    types: [],
    details: '',
    isAccepting: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoSubmitting, setAutoSubmitting] = useState(false)
  const router = useRouter()

  // Check for pending vibe data when modal opens and user is logged in
  useEffect(() => {
    if (isOpen && isLoggedIn) {
      const pendingData = sessionStorage.getItem(PENDING_VIBE_KEY)
      if (pendingData) {
        try {
          const data: PendingVibeData = JSON.parse(pendingData)
          // Restore form state
          setRepoUrl(data.repoUrl || '')
          setVibeTitle(data.vibeTitle || '')
          setVibeDescription(data.vibeDescription || '')
          setScreenshotUrl(data.screenshotUrl || '')
          setDeployedUrl(data.deployedUrl || '')
          setCollaborationOptions(data.collaborationOptions)
          // Clear pending data
          sessionStorage.removeItem(PENDING_VIBE_KEY)
          // Auto-submit
          setAutoSubmitting(true)
        } catch {
          sessionStorage.removeItem(PENDING_VIBE_KEY)
        }
      }
    }
  }, [isOpen, isLoggedIn])

  // Handle auto-submit after restoring pending data
  useEffect(() => {
    if (autoSubmitting && (repoUrl || vibeTitle)) {
      const includeCollaboration = collaborationOptions.types.length > 0
      submitRepository(includeCollaboration)
      setAutoSubmitting(false)
    }
  }, [autoSubmitting, repoUrl, vibeTitle])

  const handleClose = () => {
    if (!isLoading) {
      setStep('repo')
      setRepoUrl('')
      setVibeTitle('')
      setVibeDescription('')
      setScreenshotUrl('')
      setDeployedUrl('')
      setCollaborationOptions({
        role: 'SEEKER',
        types: [],
        details: '',
        isAccepting: false,
      })
      setError(null)
      onClose()
    }
  }

  const parseRepoUrl = (url: string): { owner: string; name: string } | null => {
    const match =
      url.match(/github\.com\/([^\/]+)\/([^\/\s]+)/) ||
      url.match(/^([^\/\s]+)\/([^\/\s]+)$/)

    if (!match) {
      return null
    }

    const [, owner, name] = match
    return {
      owner: owner.trim(),
      name: name.trim().replace(/\.git$/, ''),
    }
  }

  const handleRepoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Check if either GitHub repo or title is provided
    if (!repoUrl && !vibeTitle.trim()) {
      setError('Please provide either a GitHub repository or a vibe title')
      return
    }

    // If GitHub repo is provided, validate format
    if (repoUrl) {
      const parsed = parseRepoUrl(repoUrl)
      if (!parsed) {
        setError('Invalid GitHub format. Use "owner/repo" or GitHub URL')
        return
      }
    }

    setStep('collaboration')
  }

  const handleSkipCollaboration = async () => {
    await submitRepository(false)
  }

  const handleCollaborationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitRepository(true)
  }

  const submitRepository = async (includeCollaboration: boolean) => {
    setError(null)
    setIsLoading(true)

    try {
      const parsed = repoUrl ? parseRepoUrl(repoUrl) : null
      const isGitHubVibe = !!parsed

      // Validate that we have either GitHub repo or title
      if (!isGitHubVibe && !vibeTitle.trim()) {
        throw new Error('Please provide either a GitHub repository or a vibe title')
      }

      // If not logged in, store data and redirect to login
      if (!isLoggedIn) {
        const pendingData: PendingVibeData = {
          repoUrl,
          vibeTitle,
          vibeDescription,
          screenshotUrl,
          deployedUrl,
          collaborationOptions,
          includeCollaboration,
        }
        sessionStorage.setItem(PENDING_VIBE_KEY, JSON.stringify(pendingData))
        // Redirect to login - will return to homepage where pending data will be processed
        signIn('github')
        return
      }

      const payload: {
        owner?: string
        name?: string
        title?: string
        description?: string
        screenshotUrl?: string
        deployedUrl?: string
        collaborationOptions?: CollaborationOptions
      } = {
        screenshotUrl: screenshotUrl.trim() || undefined,
        deployedUrl: deployedUrl.trim() || undefined,
      }

      if (isGitHubVibe && parsed) {
        payload.owner = parsed.owner
        payload.name = parsed.name
        // Include description for GitHub vibes too (user can override GitHub description)
        if (vibeDescription.trim()) {
          payload.description = vibeDescription.trim()
        }
      } else {
        payload.title = vibeTitle.trim()
        payload.description = vibeDescription.trim() || undefined
      }

      if (includeCollaboration && collaborationOptions.types.length > 0) {
        payload.collaborationOptions = collaborationOptions
      }

      const response = await fetch('/api/repositories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add vibe')
      }

      handleClose()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add vibe')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50">
      <div className="bg-[--yard-bg] border-2 border-[--yard-border] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b-2 border-[--yard-border] p-4 flex items-center justify-between bg-[--yard-light-gray]">
          <h2 className="text-lg font-bold mono">
            {step === 'repo' ? 'Add Vibe' : 'Collaboration Options'}
          </h2>
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
          {step === 'repo' && (
            <form onSubmit={handleRepoSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2 mono">
                  Vibe Title {!repoUrl && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={vibeTitle}
                  onChange={(e) => setVibeTitle(e.target.value)}
                  placeholder="My Awesome Project"
                  className="yard-input w-full"
                  autoFocus
                  disabled={isLoading}
                />
                <p className="yard-meta text-xs mt-1">
                  {repoUrl ? 'Override the GitHub repo name with a custom title' : 'Give your vibe a name'}
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2 mono">
                  Description <span className="yard-meta font-normal">(optional)</span>
                </label>
                <textarea
                  value={vibeDescription}
                  onChange={(e) => setVibeDescription(e.target.value)}
                  placeholder="A brief description of your vibe..."
                  className="yard-input w-full h-20 resize-none"
                  disabled={isLoading}
                />
                <p className="yard-meta text-xs mt-1">
                  {repoUrl ? 'Leave empty to use GitHub description' : 'Tell people what your vibe is about'}
                </p>
              </div>

              {/* GitHub Repository */}
              <div className="border-t border-[--yard-border] pt-4">
                <label className="block text-sm font-medium mb-2 mono">
                  GitHub Repository <span className="yard-meta font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="owner/repo or github.com/owner/repo"
                  className="yard-input w-full"
                  disabled={isLoading}
                />
                <p className="yard-meta text-xs mt-1">
                  Link a GitHub repository to import stats and metadata
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

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3">
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="yard-button"
                  disabled={isLoading || (!repoUrl && !vibeTitle.trim())}
                >
                  Next: Collaboration Options
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
          )}

          {step === 'collaboration' && (
            <div className="space-y-4">
              <p className="yard-meta text-sm mb-4">
                Configure collaboration options for{' '}
                <span className="mono text-[--yard-fg] font-medium">
                  {repoUrl || vibeTitle}
                </span>
              </p>

              {!isLoggedIn && (
                <div className="bg-[--yard-light-orange] border border-[--yard-orange] text-sm p-3 mb-4">
                  You&apos;ll be asked to login with GitHub to complete adding your vibe.
                </div>
              )}

              <form onSubmit={handleCollaborationSubmit}>
                <CollaborationOptionsForm
                  options={collaborationOptions}
                  onChange={setCollaborationOptions}
                />

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 mt-4">
                    {error}
                  </div>
                )}

                <div className="flex gap-2 pt-6 border-t border-[--yard-border] mt-6">
                  <button
                    type="submit"
                    className="yard-button"
                    disabled={isLoading || collaborationOptions.types.length === 0}
                  >
                    {isLoading ? 'Adding...' : isLoggedIn ? 'Add with Collaboration' : 'Login & Add Vibe'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSkipCollaboration}
                    className="yard-button bg-[--yard-light-gray] border-[--yard-border] text-[--yard-fg] hover:bg-gray-200"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Adding...' : isLoggedIn ? 'Skip & Add Vibe' : 'Login & Skip Collab'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('repo')
                      setError(null)
                    }}
                    className="yard-button bg-gray-300 border-gray-300 text-black hover:bg-gray-400 hover:border-gray-400"
                    disabled={isLoading}
                  >
                    Back
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

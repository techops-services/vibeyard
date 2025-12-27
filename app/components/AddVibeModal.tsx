'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CollaborationOptions } from '@/types/collaboration'
import { CollaborationOptionsForm } from './CollaborationOptionsForm'

interface Props {
  isOpen: boolean
  onClose: () => void
}

type Step = 'repo' | 'collaboration'

export function AddVibeModal({ isOpen, onClose }: Props) {
  const [step, setStep] = useState<Step>('repo')
  const [repoUrl, setRepoUrl] = useState('')
  const [deployedUrl, setDeployedUrl] = useState('')
  const [collaborationOptions, setCollaborationOptions] = useState<CollaborationOptions>({
    role: 'SEEKER',
    types: [],
    details: '',
    isAccepting: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleClose = () => {
    if (!isLoading) {
      setStep('repo')
      setRepoUrl('')
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

    const parsed = parseRepoUrl(repoUrl)
    if (!parsed) {
      setError('Invalid format. Use "owner/repo" or GitHub URL')
      return
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
      const parsed = parseRepoUrl(repoUrl)
      if (!parsed) {
        throw new Error('Invalid repository format')
      }

      const payload: {
        owner: string
        name: string
        deployedUrl?: string
        collaborationOptions?: CollaborationOptions
      } = {
        owner: parsed.owner,
        name: parsed.name,
        deployedUrl: deployedUrl.trim() || undefined,
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
        throw new Error(data.error || 'Failed to add repository')
      }

      handleClose()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add repository')
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
              <div>
                <label className="block text-sm font-medium mb-2 mono">
                  GitHub Repository
                </label>
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="owner/repo or github.com/owner/repo"
                  className="yard-input w-full"
                  autoFocus
                  disabled={isLoading}
                />
                <p className="yard-meta text-xs mt-1">
                  Enter a GitHub repository in the format &quot;owner/repo&quot; or paste the full GitHub URL
                </p>
              </div>

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
                  disabled={isLoading || !repoUrl}
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
                <span className="mono text-[--yard-fg] font-medium">{repoUrl}</span>
              </p>

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
                    {isLoading ? 'Adding...' : 'Add with Collaboration'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSkipCollaboration}
                    className="yard-button bg-[--yard-light-gray] border-[--yard-border] text-[--yard-fg] hover:bg-gray-200"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Adding...' : 'Skip & Add Vibe'}
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

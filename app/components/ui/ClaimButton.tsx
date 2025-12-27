'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ClaimButtonProps {
  repositoryId: string
  repositoryName: string
}

export function ClaimButton({ repositoryId, repositoryName }: ClaimButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleClaim = async () => {
    if (isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/repositories/${repositoryId}/claim`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to claim repository')
      }

      setSuccess(true)
      // Refresh the page to show updated ownership
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim repository')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-700 text-xs p-3">
        Successfully claimed! You now own this vibe.
      </div>
    )
  }

  return (
    <div className="border border-[--yard-border] bg-[--yard-light-gray] p-4">
      <div className="flex items-start gap-3">
        <span className="text-xl">🔑</span>
        <div className="flex-1">
          <h3 className="font-medium text-sm mb-1">Is this your repo?</h3>
          <p className="yard-meta text-xs mb-3">
            You&apos;re the owner of <span className="mono">{repositoryName}</span> on GitHub.
            Claim this vibe to manage it and access owner features.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-2 mb-3">
              {error}
            </div>
          )}

          <button
            onClick={handleClaim}
            disabled={isLoading}
            className="yard-button text-xs"
          >
            {isLoading ? 'Claiming...' : 'Claim this vibe'}
          </button>
        </div>
      </div>
    </div>
  )
}

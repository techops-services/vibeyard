'use client'

import { useState, useEffect } from 'react'

interface AnalysisStatusProps {
  repositoryId: string
  initialStatus?: string
  onAnalysisComplete?: () => void
  size?: 'sm' | 'md'
}

type AnalysisState = 'pending' | 'processing' | 'completed' | 'failed'

/**
 * AnalysisStatus Component
 *
 * Shows analysis status: pending, processing, completed, failed
 * - Loading spinner for processing
 * - "Analyze" button for pending/failed
 * - Integrates with POST /api/repositories/[id]/analyze endpoint
 */
export function AnalysisStatus({
  repositoryId,
  initialStatus = 'pending',
  onAnalysisComplete,
  size = 'md'
}: AnalysisStatusProps) {
  const [status, setStatus] = useState<AnalysisState>(initialStatus as AnalysisState)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  // Poll for status updates when processing
  useEffect(() => {
    if (status !== 'processing') return

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/repositories/${repositoryId}/analysis`)

        if (!response.ok) {
          throw new Error('Failed to fetch status')
        }

        const data = await response.json()

        if (data.status === 'completed' && data.analysis) {
          setStatus('completed')
          setProgress(100)
          onAnalysisComplete?.()
          clearInterval(pollInterval)
        } else if (data.status === 'failed') {
          setStatus('failed')
          setError(data.message || 'Analysis failed')
          clearInterval(pollInterval)
        } else if (data.job?.progress) {
          setProgress(data.job.progress)
        }
      } catch (err) {
        console.error('Error polling status:', err)
      }
    }, 3000) // Poll every 3 seconds

    return () => clearInterval(pollInterval)
  }, [status, repositoryId, onAnalysisComplete])

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch(`/api/repositories/${repositoryId}/analyze`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to start analysis')
      }

      const data = await response.json()

      if (data.status === 'queued') {
        setStatus('processing')
        setProgress(0)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start analysis')
      setStatus('failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1'
  }

  // Completed state - no UI needed (handled by star rating)
  if (status === 'completed') {
    return null
  }

  // Processing state
  if (status === 'processing' || isAnalyzing) {
    return (
      <div className={`inline-flex items-center gap-2 ${sizeClasses[size]}`}>
        <Spinner size={size} />
        <span className="yard-meta">
          analyzing{progress > 0 && ` (${progress}%)`}...
        </span>
      </div>
    )
  }

  // Pending or Failed state - show analyze button
  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={handleAnalyze}
        className={`yard-button ${sizeClasses[size]}`}
        disabled={isAnalyzing}
      >
        {status === 'failed' ? '↻ retry analysis' : '→ analyze'}
      </button>
      {error && (
        <span className="text-xs text-[--yard-error]" title={error}>
          {status === 'failed' ? 'failed' : ''}
        </span>
      )}
    </div>
  )
}

interface SpinnerProps {
  size?: 'sm' | 'md'
}

function Spinner({ size = 'md' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4'
  }

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]} text-[--yard-orange]`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-label="Loading"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

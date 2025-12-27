'use client'

import { useState } from 'react'

interface Props {
  repositoryId: string
  initialUrl: string | null
}

export function EditDeployedUrl({ repositoryId, initialUrl }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [url, setUrl] = useState(initialUrl || '')
  const [savedUrl, setSavedUrl] = useState(initialUrl)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/repositories/${repositoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deployedUrl: url.trim() || null }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update')
      }

      setSavedUrl(url.trim() || null)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setUrl(savedUrl || '')
    setError(null)
    setIsEditing(false)
  }

  const handleRemove = async () => {
    setUrl('')
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/repositories/${repositoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deployedUrl: null }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update')
      }

      setSavedUrl(null)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove')
    } finally {
      setIsLoading(false)
    }
  }

  if (isEditing) {
    return (
      <div className="mt-2">
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-app.com"
            className="yard-input text-xs py-1 px-2 flex-1"
            disabled={isLoading}
            autoFocus
          />
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="text-xs px-2 py-1 bg-[--yard-orange] text-white hover:bg-[#cc5200] disabled:opacity-50"
          >
            {isLoading ? '...' : 'Save'}
          </button>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="text-xs px-2 py-1 bg-[--yard-light-gray] text-[--yard-gray] hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
      </div>
    )
  }

  if (savedUrl) {
    return (
      <div className="mt-2 flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span className="live-dot" />
          <a
            href={savedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-green-600 hover:text-green-700 hover:underline mono"
          >
            {new URL(savedUrl).hostname}
          </a>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="text-xs yard-meta hover:text-[--yard-orange]"
        >
          edit
        </button>
        <button
          onClick={handleRemove}
          disabled={isLoading}
          className="text-xs yard-meta hover:text-red-500"
        >
          remove
        </button>
        <style jsx>{`
          .live-dot {
            width: 6px;
            height: 6px;
            background: #22c55e;
            border-radius: 50%;
            box-shadow: 0 0 4px #22c55e;
            animation: pulse 2s ease-in-out infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    )
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="mt-2 text-xs yard-meta hover:text-[--yard-orange] flex items-center gap-1"
    >
      <span>+</span> add live url
    </button>
  )
}

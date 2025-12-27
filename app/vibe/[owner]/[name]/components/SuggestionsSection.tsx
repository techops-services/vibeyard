'use client'

import Image from 'next/image'
import { useState } from 'react'
import { formatRelativeTime } from '@/lib/utils'

interface Suggestion {
  id: string
  title: string
  description: string
  category: string
  priority: string
  status: string
  upvotesCount: number
  createdAt: Date
  suggestedBy: {
    id: string
    name: string | null
    image: string | null
    githubUsername: string | null
  }
  ownerResponse?: string | null
}

interface SuggestionsSectionProps {
  repositoryId: string
  isLoggedIn: boolean
  currentUserId?: string
  suggestions: Suggestion[]
}

const CATEGORIES = [
  { value: 'bug', label: 'bug' },
  { value: 'feature', label: 'feature' },
  { value: 'performance', label: 'performance' },
  { value: 'documentation', label: 'documentation' },
  { value: 'other', label: 'other' },
]

export function SuggestionsSection({
  repositoryId,
  isLoggedIn,
  currentUserId: _currentUserId,
  suggestions: initialSuggestions,
}: SuggestionsSectionProps) {
  const [suggestions, setSuggestions] = useState(initialSuggestions)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('feature')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (title.length < 5) {
      setError('Title must be at least 5 characters')
      return
    }

    if (description.length < 20) {
      setError('Description must be at least 20 characters')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repositoryId,
          title,
          description,
          category,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create suggestion')
      }

      const newSuggestion = await response.json()
      setSuggestions([newSuggestion, ...suggestions])

      // Reset form
      setTitle('')
      setDescription('')
      setCategory('feature')
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create suggestion')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpvote = async (suggestionId: string) => {
    if (!isLoggedIn) {
      setError('Please sign in to upvote')
      return
    }

    try {
      const response = await fetch(`/api/suggestions/${suggestionId}/upvote`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to upvote')
      }

      const updated = await response.json()

      setSuggestions(suggestions.map(s =>
        s.id === suggestionId
          ? { ...s, upvotesCount: updated.upvotesCount }
          : s
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upvote')
    }
  }

  return (
    <div className="border border-[--yard-border] bg-white">
      <div className="p-4 border-b border-[--yard-border] flex items-center justify-between">
        <h2 className="text-sm font-semibold mono">
          improvement suggestions ({suggestions.length})
        </h2>
        {isLoggedIn && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs yard-meta hover:text-[--yard-orange] hover:underline"
          >
            + suggest
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 text-xs text-red-600 bg-red-50 border border-red-200 p-2">
          {error}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="p-4 border-b border-[--yard-border] bg-[--yard-light-gray]">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="title" className="block text-xs yard-meta mb-1">
                title * (min 5 characters)
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full yard-input"
                placeholder="Brief summary of the suggestion..."
                disabled={isSubmitting}
                required
                minLength={5}
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-xs yard-meta mb-1">
                category *
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full yard-input"
                disabled={isSubmitting}
                required
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-xs yard-meta mb-1">
                description * (min 20 characters)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full yard-input resize-none"
                rows={4}
                placeholder="Detailed description of the improvement..."
                disabled={isSubmitting}
                required
                minLength={20}
              />
              <div className="text-xs yard-meta mt-1">
                {description.length} / 20 minimum
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting || title.length < 5 || description.length < 20}
                className="yard-button flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'creating...' : 'create suggestion'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setError(null)
                }}
                disabled={isSubmitting}
                className="px-3 py-1 text-xs border border-[--yard-border] bg-white hover:bg-[--yard-light-gray] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Suggestions List */}
      {suggestions.length === 0 ? (
        <div className="p-4 yard-meta text-sm text-center">
          No suggestions yet. Be the first to suggest an improvement!
        </div>
      ) : (
        <div className="divide-y divide-[--yard-border]">
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="p-4">
              <div className="flex gap-3">
                {/* Upvote */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => handleUpvote(suggestion.id)}
                    className="yard-vote text-lg"
                    disabled={!isLoggedIn}
                    title={isLoggedIn ? 'Upvote' : 'Sign in to upvote'}
                  >
                    ▲
                  </button>
                  <div className="yard-meta font-medium text-xs">
                    {suggestion.upvotesCount}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-medium text-sm">{suggestion.title}</h3>
                    <div className="flex gap-1">
                      <span className="px-2 py-0.5 bg-[--yard-light-gray] text-[--yard-gray] text-xs mono whitespace-nowrap">
                        {suggestion.category}
                      </span>
                      {suggestion.status !== 'open' && (
                        <span className="px-2 py-0.5 bg-[--yard-orange] text-white text-xs mono whitespace-nowrap">
                          {suggestion.status}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed mb-2">
                    {suggestion.description}
                  </p>

                  <div className="flex items-center gap-2 yard-meta text-xs">
                    {suggestion.suggestedBy.image && (
                      <Image
                        src={suggestion.suggestedBy.image}
                        alt={suggestion.suggestedBy.name || 'User'}
                        width={16}
                        height={16}
                        className="w-4 h-4 rounded-full"
                      />
                    )}
                    <span>
                      {suggestion.suggestedBy.name || suggestion.suggestedBy.githubUsername}
                    </span>
                    <span>•</span>
                    <span>{formatRelativeTime(new Date(suggestion.createdAt))}</span>
                  </div>

                  {/* Owner Response */}
                  {suggestion.ownerResponse && (
                    <div className="mt-2 p-2 bg-[--yard-light-gray] border-l-2 border-[--yard-orange]">
                      <div className="text-xs yard-meta mb-1">owner response:</div>
                      <p className="text-xs">{suggestion.ownerResponse}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sign in prompt */}
      {!isLoggedIn && suggestions.length > 0 && (
        <div className="p-4 border-t border-[--yard-border] text-center yard-meta text-xs">
          Sign in to create suggestions and upvote
        </div>
      )}
    </div>
  )
}

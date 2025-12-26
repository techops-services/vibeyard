'use client'

import { useState } from 'react'

interface CommentFormProps {
  repositoryId: string
  parentId?: string
  onSubmit: (content: string, parentId?: string) => Promise<void>
  onCancel?: () => void
  placeholder?: string
  autoFocus?: boolean
}

export function CommentForm({
  parentId,
  onSubmit,
  onCancel,
  placeholder = 'Add a comment...',
  autoFocus = false,
}: CommentFormProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      setError('Comment cannot be empty')
      return
    }

    if (content.length > 5000) {
      setError('Comment is too long (max 5000 characters)')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit(content.trim(), parentId)
      setContent('')
      if (onCancel) {
        onCancel()
      }
    } catch (err) {
      console.error('Error submitting comment:', err)
      setError('Failed to post comment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={isSubmitting}
        rows={4}
        className="w-full border border-[--yard-border] p-2 text-xs resize-y focus:outline-none focus:border-[--yard-orange] disabled:bg-[--yard-light-gray] disabled:cursor-not-allowed"
        style={{ fontFamily: 'inherit' }}
      />

      {error && (
        <div className="text-[--yard-error] text-xs">{error}</div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="yard-button"
        >
          {isSubmitting ? 'Posting...' : parentId ? 'Reply' : 'Add Comment'}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="yard-button-secondary"
          >
            Cancel
          </button>
        )}

        <div className="yard-meta text-xs self-center ml-auto">
          {content.length}/5000
        </div>
      </div>
    </form>
  )
}

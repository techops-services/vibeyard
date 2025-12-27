'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface CommentVoteProps {
  commentId: string
  initialVoted: boolean
  initialCount: number
  onVoteChange?: (hasVoted: boolean, newCount: number) => void
}

export function CommentVote({
  commentId,
  initialVoted,
  initialCount,
  onVoteChange,
}: CommentVoteProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [hasVoted, setHasVoted] = useState(initialVoted)
  const [votesCount, setVotesCount] = useState(initialCount)
  const [isLoading, setIsLoading] = useState(false)

  const handleVote = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!session) {
      router.push('/signin')
      return
    }

    if (isLoading) return

    // Optimistic update
    const previousVoted = hasVoted
    const previousCount = votesCount

    setHasVoted(!hasVoted)
    setVotesCount(hasVoted ? votesCount - 1 : votesCount + 1)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/comments/${commentId}/vote`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to toggle vote')
      }

      const data = await response.json()
      setHasVoted(data.hasVoted)
      setVotesCount(data.votesCount)

      if (onVoteChange) {
        onVoteChange(data.hasVoted, data.votesCount)
      }
    } catch (error) {
      console.error('Error toggling vote:', error)
      // Revert on error
      setHasVoted(previousVoted)
      setVotesCount(previousCount)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <span
      onClick={handleVote}
      className={`cursor-pointer select-none inline-flex items-center gap-0.5 ${
        hasVoted ? 'text-[--yard-orange]' : 'text-[--yard-gray]'
      } hover:text-[--yard-orange]`}
      title={hasVoted ? 'Remove upvote' : 'Upvote'}
    >
      <span className="text-xs">▲</span>
      {votesCount > 0 && (
        <span className="text-xs font-medium">{votesCount}</span>
      )}
    </span>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { formatDate } from '@/lib/utils'
import { CollaborationRole } from '@prisma/client'
import { StarRating } from './ui/StarRating'

interface RepoItemProps {
  id: string
  rank: number
  name: string
  fullName: string
  description: string | null
  owner: string
  htmlUrl: string
  language: string | null
  stargazersCount: number
  forksCount: number
  votesCount: number
  followersCount?: number
  createdAt: Date
  userHasVoted?: boolean
  collaborationRole?: CollaborationRole | null
  isAcceptingCollaborators?: boolean
  completenessScore?: number | null
}

export function RepoItem({
  id,
  rank,
  name,
  fullName,
  description,
  owner,
  htmlUrl,
  language,
  stargazersCount,
  forksCount,
  votesCount,
  followersCount = 0,
  createdAt,
  userHasVoted = false,
  collaborationRole,
  isAcceptingCollaborators = false,
  completenessScore,
}: RepoItemProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [votes, setVotes] = useState(votesCount)
  const [voted, setVoted] = useState(userHasVoted)
  const [isVoting, setIsVoting] = useState(false)

  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!session) {
      window.location.href = '/signin'
      return
    }

    if (isVoting) return

    setIsVoting(true)

    try {
      const response = await fetch(`/api/repositories/${id}/vote`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to vote')
      }

      const data = await response.json()
      setVoted(data.voted)
      setVotes(data.votesCount)
    } catch (error) {
      console.error('Error voting:', error)
      setVoted(!voted)
      setVotes(voted ? votes + 1 : votes - 1)
    } finally {
      setIsVoting(false)
    }
  }

  const handleRowClick = () => {
    router.push(`/vibe/${owner}/${name}`)
  }

  const handleGithubClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '')
    } catch {
      return 'github.com'
    }
  }

  return (
    <div
      className="yard-item flex gap-2 cursor-pointer hover:bg-[--yard-hover]"
      onClick={handleRowClick}
    >
      {/* Vote section */}
      <div className="flex flex-col items-center justify-start pt-1 w-8">
        <div
          className={`yard-vote text-base ${voted ? 'voted' : ''}`}
          onClick={handleVote}
          title="Upvote"
        >
          ▲
        </div>
        <div className="yard-meta">{votes}</div>
      </div>

      {/* Content section */}
      <div className="flex-1">
        {/* Rank and title */}
        <div className="flex items-start gap-1">
          <span className="yard-meta mr-1">{rank}.</span>
          <div className="flex-1">
            <span className="yard-link font-medium">
              {name}
            </span>
            <span className="yard-meta ml-1 text-xs">
              ({getHostname(htmlUrl)})
            </span>
            {collaborationRole === 'SEEKER' && isAcceptingCollaborators && (
              <span className="ml-2 text-xs px-2 py-0.5 bg-[--yard-orange] text-white font-medium">
                seeker
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {description && (
          <div className="yard-meta text-xs mt-0.5 leading-relaxed">
            {description}
          </div>
        )}

        {/* Metadata */}
        <div className="yard-meta flex items-center gap-2 mt-1 text-xs">
          <span className="mono">{fullName}</span>
          {language && (
            <>
              <span>•</span>
              <span>{language}</span>
            </>
          )}
          <span>•</span>
          <span>{stargazersCount.toLocaleString()} stars</span>
          <span>•</span>
          <span>{forksCount.toLocaleString()} forks</span>
          {followersCount > 0 && (
            <>
              <span>•</span>
              <span>{followersCount} {followersCount === 1 ? 'follower' : 'followers'}</span>
            </>
          )}
          <span>•</span>
          <span>{formatDate(createdAt)}</span>
          <span>•</span>
          <a
            href={htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[--yard-orange] hover:underline"
            onClick={handleGithubClick}
          >
            github
          </a>
        </div>

        {/* Completeness Rating - only show if analyzed */}
        {completenessScore !== null && completenessScore !== undefined && (
          <div className="flex items-center gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
            <StarRating score={completenessScore} size="sm" />
          </div>
        )}
      </div>
    </div>
  )
}

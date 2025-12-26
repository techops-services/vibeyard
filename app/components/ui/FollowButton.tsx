'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface FollowButtonProps {
  repositoryId: string
  initialFollowing: boolean
  initialFollowersCount: number
}

export function FollowButton({
  repositoryId,
  initialFollowing,
  initialFollowersCount,
}: FollowButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [following, setFollowing] = useState(initialFollowing)
  const [followersCount, setFollowersCount] = useState(initialFollowersCount)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggleFollow = async () => {
    if (!session) {
      router.push('/api/auth/signin')
      return
    }

    if (isLoading) return

    // Optimistic update
    const previousFollowing = following
    const previousCount = followersCount

    setFollowing(!following)
    setFollowersCount(following ? followersCount - 1 : followersCount + 1)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/repositories/${repositoryId}/follow`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to toggle follow')
      }

      const data = await response.json()
      setFollowing(data.following)
      setFollowersCount(data.followersCount)
    } catch (error) {
      console.error('Error toggling follow:', error)
      // Revert on error
      setFollowing(previousFollowing)
      setFollowersCount(previousCount)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggleFollow}
        disabled={isLoading}
        className={
          following
            ? 'yard-button-secondary text-xs'
            : 'yard-button text-xs'
        }
      >
        {following ? 'Following' : 'Follow'}
      </button>
      <span className="yard-meta text-xs">
        {followersCount} {followersCount === 1 ? 'follower' : 'followers'}
      </span>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Repository } from '@prisma/client'
import { Trash2 } from 'lucide-react'
import { StarRating } from '@/app/components/ui/StarRating'
import { AnalysisStatus } from '@/app/components/ui/AnalysisStatus'
import { EditDeployedUrl } from './EditDeployedUrl'
import { EditCollaborationOptions } from './EditCollaborationOptions'

interface RepositoryWithAnalytics extends Repository {
  _count: {
    votes: number
    follows: number
    views: number
    collaborationRequestsReceived: number
  }
  analysis?: {
    completenessScore: number | null
  } | null
}

interface Props {
  repositories: RepositoryWithAnalytics[]
}

export function RepositoryList({ repositories }: Props) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (repoId: string, repoName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${repoName}"? This action is permanent and will delete all votes, follows, comments, and other related data.`
      )
    ) {
      return
    }

    setDeletingId(repoId)
    try {
      const response = await fetch(`/api/repositories/${repoId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        // If 404, the item was already deleted (possibly by another tab/session)
        // Still refresh the UI to remove it
        if (response.status === 404) {
          router.refresh()
          return
        }
        throw new Error('Failed to delete')
      }

      // Refresh the page to update the list
      router.refresh()
    } catch (error) {
      console.error('Error deleting repository:', error)
      alert('Failed to delete vibe. Please try again.')
      setDeletingId(null)
    }
  }

  if (repositories.length === 0) {
    return (
      <div className="border border-[--yard-border] p-6">
        <h2 className="text-lg font-bold mono mb-2">your repositories</h2>
        <p className="yard-meta text-sm">
          No repositories connected yet. Add one from the{' '}
          <Link href="/" className="hover:text-[--yard-orange] hover:underline">
            yard lot
          </Link>
          .
        </p>
      </div>
    )
  }

  return (
    <div className="border border-[--yard-border]">
      <div className="p-4 border-b border-[--yard-border]">
        <h2 className="text-lg font-bold mono">your repositories</h2>
      </div>

      <div className="divide-y divide-[--yard-border]">
        {repositories.map((repo) => (
          <div key={repo.id} className="p-4 hover:bg-[--yard-light-gray]">
            <div className="flex items-start justify-between mb-2">
              <Link
                href={`/vibe/${repo.owner}/${repo.name}`}
                className="font-medium mono hover:text-[--yard-orange] hover:underline"
              >
                {repo.fullName}
              </Link>
              {repo.collaborationRole === 'SEEKER' && repo.isAcceptingCollaborators && (
                <span className="text-xs px-2 py-0.5 bg-[--yard-orange] text-white font-medium">
                  seeker
                </span>
              )}
            </div>

            {repo.description && (
              <p className="text-sm yard-meta mb-2">{repo.description}</p>
            )}

            <div className="flex flex-wrap gap-3 yard-meta text-xs">
              <span>{repo._count.votes} votes</span>
              <span>•</span>
              <span>{repo._count.follows} follows</span>
              <span>•</span>
              <span>{repo._count.views} views</span>
              {repo._count.collaborationRequestsReceived > 0 && (
                <>
                  <span>•</span>
                  <span className="text-[--yard-orange] font-medium">
                    {repo._count.collaborationRequestsReceived} pending requests
                  </span>
                </>
              )}
            </div>

            {/* Completeness Score */}
            <div className="flex items-center gap-2 mt-2">
              {repo.analysis?.completenessScore !== null && repo.analysis?.completenessScore !== undefined ? (
                <StarRating score={repo.analysis.completenessScore} size="sm" />
              ) : (
                <AnalysisStatus
                  repositoryId={repo.id}
                  initialStatus={repo.analysisStatus}
                  size="sm"
                />
              )}
            </div>

            {/* Deployed URL */}
            <EditDeployedUrl
              repositoryId={repo.id}
              initialUrl={repo.deployedUrl}
            />

            {/* Collaboration Options */}
            <EditCollaborationOptions
              repositoryId={repo.id}
              initialTypes={repo.collaborationTypes || []}
              initialDetails={repo.collaborationDetails}
              initialIsAccepting={repo.isAcceptingCollaborators}
            />

            {/* Delete Button */}
            <div className="mt-3 pt-3 border-t border-[--yard-border]">
              <button
                onClick={() =>
                  handleDelete(
                    repo.id,
                    repo.fullName || repo.title || 'Untitled Vibe'
                  )
                }
                disabled={deletingId === repo.id}
                className="text-xs yard-meta hover:text-red-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Trash2 size={14} />
                {deletingId === repo.id ? 'Deleting...' : 'Delete vibe'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

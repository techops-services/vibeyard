'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Repository } from '@prisma/client'
import { StarRating } from '@/app/components/ui/StarRating'
import { AnalysisStatus } from '@/app/components/ui/AnalysisStatus'
import { EditVibeModal } from './EditVibeModal'

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
  const [editingRepo, setEditingRepo] = useState<RepositoryWithAnalytics | null>(null)

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
                href={repo.owner ? `/vibe/${repo.owner}/${repo.name}` : `/vibe/_/${repo.id}`}
                className="font-medium mono hover:text-[--yard-orange] hover:underline"
              >
                {repo.title || repo.fullName || 'Untitled Vibe'}
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

            {/* Deployed URL - Read Only Display */}
            {repo.deployedUrl && (
              <div className="mt-2 flex items-center gap-1.5">
                <span className="live-dot" />
                <a
                  href={repo.deployedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-600 hover:text-green-700 hover:underline mono"
                >
                  {(() => { try { return new URL(repo.deployedUrl).hostname } catch { return repo.deployedUrl } })()}
                </a>
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
            )}

            {/* Collaboration - Read Only Display */}
            {(repo.collaborationTypes && repo.collaborationTypes.length > 0) || repo.isAcceptingCollaborators ? (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="yard-meta">collaboration:</span>
                {repo.isAcceptingCollaborators && (
                  <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px]">
                    accepting requests
                  </span>
                )}
                {repo.collaborationTypes && repo.collaborationTypes.length > 0 && (
                  <span className="yard-meta">
                    {repo.collaborationTypes.length} type{repo.collaborationTypes.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            ) : null}

            {/* Edit Button */}
            <div className="mt-3 pt-3 border-t border-[--yard-border]">
              <button
                onClick={() => setEditingRepo(repo)}
                className="text-xs yard-meta hover:text-[--yard-orange] hover:underline"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Vibe Modal */}
      {editingRepo && (
        <EditVibeModal
          isOpen={true}
          onClose={() => setEditingRepo(null)}
          repository={editingRepo}
        />
      )}
    </div>
  )
}

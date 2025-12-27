'use client'

import Link from 'next/link'
import { Repository } from '@prisma/client'
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
                href={`/repo/${repo.id}`}
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
          </div>
        ))}
      </div>
    </div>
  )
}

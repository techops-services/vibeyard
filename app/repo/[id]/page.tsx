import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { YardHeader } from '@/app/components/YardHeader'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { CollaborationSection } from './components/CollaborationSection'
import { AnalysisSection } from './components/AnalysisSection'
import { FollowButton } from '@/app/components/ui/FollowButton'
import { DeployedBadge } from '@/app/components/ui/DeployedBadge'
import { CommentThread } from '@/app/components/comments/CommentThread'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: {
    id: string
  }
}

export default async function RepoDetailPage({ params }: PageProps) {
  // Auth check
  const session = await auth()

  // Fetch repository with all details
  const repository = await prisma.repository.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          githubUsername: true,
        },
      },
      analysis: true,
      _count: {
        select: {
          votes: true,
          follows: true,
          views: true,
        },
      },
    },
  })

  if (!repository) {
    notFound()
  }

  // Track view (server-side)
  await prisma.repositoryView.create({
    data: {
      repositoryId: params.id,
    },
  })

  await prisma.repository.update({
    where: { id: params.id },
    data: {
      viewsCount: {
        increment: 1,
      },
    },
  })

  // Fetch active collaborators (users with accepted collaboration requests)
  const activeCollaborators = await prisma.collaborationRequest.findMany({
    where: {
      targetRepoId: params.id,
      status: 'ACCEPTED',
    },
    include: {
      requestor: {
        select: {
          id: true,
          name: true,
          image: true,
          githubUsername: true,
        },
      },
    },
    take: 5,
  })

  const isOwner = session?.user?.id === repository.userId
  const isLoggedIn = !!session?.user?.id

  // Check if current user is following
  let isFollowing = false
  if (session?.user?.id) {
    const follow = await prisma.follow.findUnique({
      where: {
        userId_repositoryId: {
          userId: session.user.id,
          repositoryId: params.id,
        },
      },
    })
    isFollowing = !!follow
  }

  return (
    <div className="min-h-screen flex flex-col">
      <YardHeader />

      <main className="flex-1 max-w-4xl w-full mx-auto">
        {/* Breadcrumb */}
        <div className="border-b border-[--yard-border] p-2 yard-meta text-xs">
          <Link href="/" className="hover:text-[--yard-orange] hover:underline">
            ← back to yard lot
          </Link>
        </div>

        {/* Repository header */}
        <div className="border-b border-[--yard-border] p-4">
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div className="yard-vote text-2xl cursor-pointer">▲</div>
              <div className="yard-meta font-medium">{repository._count.votes}</div>
              <div className="yard-meta text-xs mt-1">votes</div>
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-2xl font-bold mono">{repository.fullName}</h1>
                {repository.deployedUrl && (
                  <DeployedBadge url={repository.deployedUrl} />
                )}
              </div>

              {repository.description && (
                <p className="text-sm mb-3 leading-relaxed">
                  {repository.description}
                </p>
              )}

              <div className="flex flex-wrap gap-3 yard-meta text-xs">
                <a
                  href={repository.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[--yard-orange] hover:underline"
                >
                  → View on GitHub
                </a>
                <span>•</span>
                <span>{repository.stargazersCount.toLocaleString()} stars</span>
                <span>•</span>
                <span>{repository.forksCount.toLocaleString()} forks</span>
                <span>•</span>
                <span>{repository.viewsCount.toLocaleString()} views</span>
                {repository.language && (
                  <>
                    <span>•</span>
                    <span>{repository.language}</span>
                  </>
                )}
              </div>

              {/* Topics */}
              {repository.topics && repository.topics.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {repository.topics.map((topic) => (
                    <span
                      key={topic}
                      className="px-2 py-0.5 bg-[--yard-light-gray] text-[--yard-gray] text-xs mono"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              )}

              {/* Follow Button */}
              {!isOwner && (
                <div className="mt-4">
                  <FollowButton
                    repositoryId={repository.id}
                    initialFollowing={isFollowing}
                    initialFollowersCount={repository._count.follows}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Repository details */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-6">
            {/* Left column */}
            <div>
              <h2 className="text-sm font-semibold mb-3 mono">Repository Info</h2>
              <dl className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <dt className="yard-meta">Owner:</dt>
                  <dd className="mono">
                    <a
                      href={`https://github.com/${repository.owner}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[--yard-orange] hover:underline"
                    >
                      {repository.owner}
                    </a>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="yard-meta">Added by:</dt>
                  <dd className="mono">{repository.user.githubUsername}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="yard-meta">Added on:</dt>
                  <dd>{formatDate(repository.createdAt)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="yard-meta">Last updated:</dt>
                  <dd>{formatDate(repository.updatedAt)}</dd>
                </div>
                {repository.license && (
                  <div className="flex justify-between">
                    <dt className="yard-meta">License:</dt>
                    <dd>{repository.license}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="yard-meta">Open issues:</dt>
                  <dd>{repository.openIssuesCount}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="yard-meta">Visibility:</dt>
                  <dd>{repository.isPrivate ? '🔒 Private' : '🌍 Public'}</dd>
                </div>
              </dl>
            </div>

            {/* Right column */}
            <div>
              <h2 className="text-sm font-semibold mb-3 mono">Engagement</h2>
              <dl className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <dt className="yard-meta">Upvotes:</dt>
                  <dd className="font-medium">{repository._count.votes}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="yard-meta">Followers:</dt>
                  <dd>{repository._count.follows}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="yard-meta">Views:</dt>
                  <dd>{repository._count.views}</dd>
                </div>
              </dl>

              <AnalysisSection
                repositoryId={repository.id}
                completenessScore={repository.analysis?.completenessScore ?? null}
                analysisStatus={repository.analysisStatus}
                aiDetected={repository.analysis?.aiDetected}
                aiProvider={repository.analysis?.aiProvider}
                aiConfidence={repository.analysis?.aiConfidence}
                isOwner={isOwner}
              />
            </div>
          </div>
        </div>

        {/* Collaboration Section */}
        <div className="p-4 border-t border-[--yard-border]">
          <CollaborationSection
            repositoryId={repository.id}
            repositoryName={repository.name}
            ownerId={repository.userId}
            isOwner={isOwner}
            isLoggedIn={isLoggedIn}
            currentUserId={session?.user?.id}
            isSeeker={repository.collaborationRole === 'SEEKER'}
            collaborationTypes={repository.collaborationTypes}
            collaborationDetails={repository.collaborationDetails}
            isAcceptingCollaborators={repository.isAcceptingCollaborators}
            activeCollaborators={activeCollaborators.map(req => ({
              id: req.requestor.id,
              name: req.requestor.name,
              image: req.requestor.image,
              githubUsername: req.requestor.githubUsername,
              role: req.collaborationType.toLowerCase().replace(/_/g, ' '),
            }))}
          />
        </div>

        {/* Comments Section */}
        <CommentThread
          repositoryId={repository.id}
          repositoryName={repository.name}
        />

      </main>
    </div>
  )
}

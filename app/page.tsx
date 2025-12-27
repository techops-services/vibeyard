import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { YardHeader } from './components/YardHeader'
import { RepoItem } from './components/RepoItem'
import { AddVibeForm } from './components/AddVibeForm'
import { YardFooter } from './components/YardFooter'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const session = await auth()

  // Fetch all repositories, ordered by votes then creation date
  const repositories = await prisma.repository.findMany({
    orderBy: [{ votesCount: 'desc' }, { createdAt: 'desc' }],
    take: 50, // Limit to top 50
    include: {
      user: {
        select: {
          githubUsername: true,
        },
      },
      analysis: {
        select: {
          completenessScore: true,
        },
      },
    },
  })

  // If user is logged in, fetch their votes
  let userVotes: Set<string> = new Set()
  if (session?.user?.id) {
    const votes = await prisma.vote.findMany({
      where: {
        userId: session.user.id,
        repositoryId: {
          in: repositories.map((r) => r.id),
        },
      },
      select: {
        repositoryId: true,
      },
    })
    userVotes = new Set(votes.map((v) => v.repositoryId))
  }

  return (
    <div className="min-h-screen flex flex-col">
      <YardHeader />

      <main className="flex-1 max-w-4xl w-full mx-auto">
        {/* Add vibe bar */}
        <div className="border-b border-[--yard-border] p-2 flex items-center justify-end">
          <AddVibeForm />
        </div>

        {/* Repository list */}
        {repositories.length === 0 ? (
          <div className="p-8 text-center yard-meta">
            <p className="mb-2">No repositories in the yard yet.</p>
            <p className="text-xs">
              Be the first to add a vibe using the &quot;+ add vibe&quot; button above.
            </p>
          </div>
        ) : (
          <div>
            {repositories.map((repo, index) => (
              <RepoItem
                key={repo.id}
                id={repo.id}
                rank={index + 1}
                name={repo.name}
                fullName={repo.fullName}
                description={repo.description}
                owner={repo.owner}
                htmlUrl={repo.htmlUrl}
                language={repo.language}
                stargazersCount={repo.stargazersCount}
                forksCount={repo.forksCount}
                votesCount={repo.votesCount}
                followersCount={repo.followersCount}
                createdAt={repo.createdAt}
                userHasVoted={userVotes.has(repo.id)}
                collaborationRole={repo.collaborationRole}
                isAcceptingCollaborators={repo.isAcceptingCollaborators}
                completenessScore={repo.analysis?.completenessScore ?? null}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <YardFooter />
      </main>
    </div>
  )
}

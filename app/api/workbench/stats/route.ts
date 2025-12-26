import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/workbench/stats
 * Get aggregated workbench statistics for the authenticated user
 * Returns:
 *   - totalRepos: Total number of repositories
 *   - totalVotes: Total votes received across all repositories
 *   - totalFollows: Total follows across all repositories
 *   - totalViews: Total views across all repositories
 *   - pendingCollabRequests: Number of pending collaboration requests (received)
 *   - activeSuggestions: Number of open improvement suggestions across repositories
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all repositories for the user
    const repositories = await prisma.repository.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        votesCount: true,
        followersCount: true,
        viewsCount: true,
      },
    })

    const totalRepos = repositories.length
    const totalVotes = repositories.reduce((sum, repo) => sum + repo.votesCount, 0)
    const totalFollows = repositories.reduce((sum, repo) => sum + repo.followersCount, 0)
    const totalViews = repositories.reduce((sum, repo) => sum + repo.viewsCount, 0)

    // Get pending collaboration requests received by the user
    const pendingCollabRequests = await prisma.collaborationRequest.count({
      where: {
        targetOwnerId: session.user.id,
        status: 'PENDING',
      },
    })

    // Get active (open) improvement suggestions across all user's repositories
    const activeSuggestions = await prisma.improvementSuggestion.count({
      where: {
        repositoryId: {
          in: repositories.map((repo) => repo.id),
        },
        status: 'open',
      },
    })

    const stats = {
      totalRepos,
      totalVotes,
      totalFollows,
      totalViews,
      pendingCollabRequests,
      activeSuggestions,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching workbench stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workbench statistics' },
      { status: 500 }
    )
  }
}

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { WorkbenchStats } from './components/WorkbenchStats'
import { RepositoryList } from './components/RepositoryList'
import { CollaborationRequests } from './components/CollaborationRequests'
import { ImprovementSuggestions } from './components/ImprovementSuggestions'

export const dynamic = 'force-dynamic'

export default async function WorkbenchPage() {
  const session = await auth()

  if (!session?.user?.id) {
    return null // Layout will redirect
  }

  // Fetch user's repositories with analytics
  const repositories = await prisma.repository.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      analysis: {
        select: {
          completenessScore: true,
        },
      },
      _count: {
        select: {
          votes: true,
          follows: true,
          views: true,
          collaborationRequestsReceived: {
            where: {
              status: 'PENDING',
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Fetch pending collaboration requests
  const pendingRequests = await prisma.collaborationRequest.findMany({
    where: {
      targetOwnerId: session.user.id,
      status: 'PENDING',
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
      targetRepo: {
        select: {
          id: true,
          name: true,
          owner: true,
          fullName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
  })

  // Fetch active improvement suggestions
  const activeSuggestions = await prisma.improvementSuggestion.findMany({
    where: {
      repository: {
        userId: session.user.id,
      },
      status: 'open',
    },
    include: {
      repository: {
        select: {
          id: true,
          name: true,
          owner: true,
        },
      },
      suggestedBy: {
        select: {
          id: true,
          name: true,
          githubUsername: true,
        },
      },
    },
    orderBy: [
      { upvotesCount: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 5,
  })

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto p-4">
      {/* Breadcrumb */}
      <div className="mb-4 yard-meta text-xs">
        <Link href="/" className="hover:text-[--yard-orange] hover:underline">
          ← back to yard lot
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mono mb-2">the workbench</h1>
        <p className="yard-meta text-sm">
          Your private workspace for managing vibecode projects
        </p>
      </div>

      {/* Stats Overview */}
      <WorkbenchStats repositories={repositories} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Left Column */}
        <div className="space-y-6">
          <RepositoryList repositories={repositories} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <CollaborationRequests requests={pendingRequests} />
          <ImprovementSuggestions suggestions={activeSuggestions} />
        </div>
      </div>
    </main>
  )
}

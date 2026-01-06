import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createGitHubClient } from '@/services/integrations/github-client'
import { z } from 'zod'

// Schema for adding a repository
const addRepoSchema = z.object({
  // GitHub repo info (optional - can add vibes without GitHub)
  owner: z.string().optional(),
  name: z.string().optional(),
  // Custom vibe info (used when no GitHub repo)
  title: z.string().optional(),
  description: z.string().optional(),
  // Deployed URL (optional)
  deployedUrl: z.string().url().optional().or(z.literal('')),
  // Screenshot URL (optional)
  screenshotUrl: z.string().url().optional().or(z.literal('')),
  // Collaboration options
  collaborationOptions: z.object({
    role: z.enum(['SEEKER', 'PROVIDER', 'BOTH']).optional(),
    types: z.array(z.enum([
      'CODE_REVIEW',
      'BUG_FIX_HELP',
      'TEAM_FORMATION',
      'EXPERTISE_OFFER',
      'MENTORSHIP',
      'GENERAL_COLLABORATION'
    ])).optional(),
    details: z.string().optional(),
    isAccepting: z.boolean().default(false),
  }).optional(),
}).refine(
  (data) => (data.owner && data.name) || data.title,
  { message: 'Either GitHub repository (owner/name) or a title is required' }
)

/**
 * GET /api/repositories
 * Get all repositories for the authenticated user
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch repositories from database
    const repositories = await prisma.repository.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            votes: true,
            follows: true,
          },
        },
      },
    })

    return NextResponse.json(repositories)
  } catch (error) {
    console.error('Error fetching repositories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/repositories
 * Add a repository (with or without GitHub) to the user's Yard Lot
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const { owner, name, title, description, deployedUrl, screenshotUrl, collaborationOptions } = addRepoSchema.parse(body)

    const isGitHubVibe = owner && name

    if (isGitHubVibe) {
      // GitHub-linked vibe: validate with GitHub API
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { githubAccessToken: true },
      })

      if (!user?.githubAccessToken) {
        return NextResponse.json(
          { error: 'GitHub access token not found. Please re-authenticate.' },
          { status: 401 }
        )
      }

      // Fetch repository from GitHub
      const githubClient = createGitHubClient(user.githubAccessToken)
      const githubRepo = await githubClient.getRepository(owner, name)

      // Check if repository already exists
      const existingRepo = await prisma.repository.findUnique({
        where: { githubId: githubRepo.id },
      })

      if (existingRepo) {
        return NextResponse.json(
          { error: 'Repository already added' },
          { status: 409 }
        )
      }

      // Create GitHub-linked repository in database
      // Use user-provided description if given, otherwise fallback to GitHub description
      const repository = await prisma.repository.create({
        data: {
          githubId: githubRepo.id,
          name: githubRepo.name,
          fullName: githubRepo.full_name,
          description: description?.trim() || githubRepo.description,
          owner: githubRepo.owner.login,
          ownerAvatarUrl: githubRepo.owner.avatar_url,
          htmlUrl: githubRepo.html_url,
          language: githubRepo.language,
          topics: githubRepo.topics,
          stargazersCount: githubRepo.stargazers_count,
          forksCount: githubRepo.forks_count,
          openIssuesCount: githubRepo.open_issues_count,
          license: githubRepo.license?.spdx_id,
          isPrivate: githubRepo.private,
          userId: session.user.id,
          deployedUrl: deployedUrl || null,
          screenshotUrl: screenshotUrl || null,
          collaborationRole: collaborationOptions?.role,
          collaborationTypes: collaborationOptions?.types || [],
          collaborationDetails: collaborationOptions?.details,
          isAcceptingCollaborators: collaborationOptions?.isAccepting || false,
        },
      })

      await prisma.activity.create({
        data: {
          actorId: session.user.id,
          type: 'repository_connected',
          entityType: 'repository',
          entityId: repository.id,
        },
      })

      return NextResponse.json(repository, { status: 201 })
    } else {
      // Non-GitHub vibe: create with user-provided title
      // Validate that title exists and is not empty
      if (!title || !title.trim()) {
        return NextResponse.json(
          { error: 'Title is required for non-GitHub vibes' },
          { status: 400 }
        )
      }

      const repository = await prisma.repository.create({
        data: {
          title: title.trim(),
          description: description || null,
          userId: session.user.id,
          deployedUrl: deployedUrl || null,
          screenshotUrl: screenshotUrl || null,
          collaborationRole: collaborationOptions?.role,
          collaborationTypes: collaborationOptions?.types || [],
          collaborationDetails: collaborationOptions?.details,
          isAcceptingCollaborators: collaborationOptions?.isAccepting || false,
        },
      })

      await prisma.activity.create({
        data: {
          actorId: session.user.id,
          type: 'repository_connected',
          entityType: 'repository',
          entityId: repository.id,
        },
      })

      return NextResponse.json(repository, { status: 201 })
    }
  } catch (error) {
    console.error('Error adding repository:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to add repository' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for creating an improvement suggestion
const createSuggestionSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.enum(['bug', 'feature', 'performance', 'documentation', 'security', 'testing', 'refactoring', 'other']),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
})

/**
 * GET /api/repositories/[id]/suggestions
 * Get improvement suggestions for a repository
 * Query params:
 *   - status: filter by status (open, acknowledged, implemented, closed)
 *   - category: filter by category
 *   - sortBy: 'recent' | 'popular' (default: 'popular')
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Await params for Next.js 15
    const { id: repositoryId } = await params

    // Verify repository exists
    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
      select: { id: true },
    })

    if (!repository) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const sortBy = searchParams.get('sortBy') || 'popular'

    // Build where clause
    const whereClause: {
      repositoryId: string
      status?: string
      category?: string
    } = {
      repositoryId,
    }

    if (status) {
      whereClause.status = status
    }

    if (category) {
      whereClause.category = category
    }

    // Determine sort order
    const orderBy = sortBy === 'popular'
      ? { upvotesCount: 'desc' as const }
      : { createdAt: 'desc' as const }

    const suggestions = await prisma.improvementSuggestion.findMany({
      where: whereClause,
      include: {
        suggestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            githubUsername: true,
          },
        },
        upvotes: {
          where: {
            userId: session.user.id,
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: [orderBy, { createdAt: 'desc' }],
    })

    // Transform to include hasUpvoted flag
    const transformedSuggestions = suggestions.map(({ upvotes, ...suggestion }) => ({
      ...suggestion,
      hasUpvoted: upvotes.length > 0,
    }))

    return NextResponse.json(transformedSuggestions)
  } catch (error) {
    console.error('Error fetching improvement suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch improvement suggestions' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/repositories/[id]/suggestions
 * Create a new improvement suggestion for a repository
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Await params for Next.js 15
    const { id: repositoryId } = await params

    // Verify repository exists
    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
      select: { id: true, userId: true },
    })

    if (!repository) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const data = createSuggestionSchema.parse(body)

    // Prevent duplicate suggestions (same title from same user for same repo)
    const existingSuggestion = await prisma.improvementSuggestion.findFirst({
      where: {
        repositoryId,
        suggestedById: session.user.id,
        title: data.title,
        status: {
          in: ['open', 'acknowledged'],
        },
      },
    })

    if (existingSuggestion) {
      return NextResponse.json(
        { error: 'You already have a similar active suggestion for this repository' },
        { status: 409 }
      )
    }

    // Create the suggestion
    const suggestion = await prisma.improvementSuggestion.create({
      data: {
        repositoryId,
        suggestedById: session.user.id,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
      },
      include: {
        suggestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            githubUsername: true,
          },
        },
      },
    })

    return NextResponse.json(suggestion, { status: 201 })
  } catch (error) {
    console.error('Error creating improvement suggestion:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create improvement suggestion' },
      { status: 500 }
    )
  }
}

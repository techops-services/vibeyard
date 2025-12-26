import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { notifyNewSuggestion } from '@/services/notifications/notification-service'

const createSuggestionSchema = z.object({
  repositoryId: z.string(),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.enum(['bug', 'feature', 'performance', 'documentation', 'other']),
})

/**
 * POST /api/suggestions
 * Create a new improvement suggestion
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createSuggestionSchema.parse(body)

    // Verify repository exists
    const repository = await prisma.repository.findUnique({
      where: { id: data.repositoryId },
      select: { id: true, name: true, userId: true },
    })

    if (!repository) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      )
    }

    // Create the suggestion
    const suggestion = await prisma.improvementSuggestion.create({
      data: {
        repositoryId: data.repositoryId,
        suggestedById: session.user.id,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: 'medium',
        status: 'open',
      },
      include: {
        suggestedBy: {
          select: {
            id: true,
            name: true,
            image: true,
            githubUsername: true,
          },
        },
        repository: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Notify repository owner (if not suggesting on own repo)
    if (repository.userId !== session.user.id) {
      await notifyNewSuggestion(
        repository.userId,
        session.user.name || 'Someone',
        repository.id,
        repository.name,
        data.title
      )
    }

    return NextResponse.json(suggestion, { status: 201 })
  } catch (error) {
    console.error('Error creating suggestion:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create suggestion' },
      { status: 500 }
    )
  }
}

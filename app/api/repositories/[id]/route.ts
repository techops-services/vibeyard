import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateRepoSchema = z.object({
  deployedUrl: z.string().url().nullable().optional(),
})

/**
 * GET /api/repositories/[id]
 * Get detailed information about a specific repository
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const repository = await prisma.repository.findUnique({
      where: {
        id: params.id,
      },
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
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      )
    }

    // Track view
    await prisma.repositoryView.create({
      data: {
        repositoryId: params.id,
      },
    })

    // Increment views count
    await prisma.repository.update({
      where: { id: params.id },
      data: {
        viewsCount: {
          increment: 1,
        },
      },
    })

    return NextResponse.json(repository)
  } catch (error) {
    console.error('Error fetching repository:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repository' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/repositories/[id]
 * Update repository settings (owner only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check ownership
    const repository = await prisma.repository.findUnique({
      where: { id: params.id },
      select: { userId: true },
    })

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    if (repository.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const { deployedUrl } = updateRepoSchema.parse(body)

    // Update repository
    const updated = await prisma.repository.update({
      where: { id: params.id },
      data: {
        deployedUrl: deployedUrl || null,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating repository:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update repository' },
      { status: 500 }
    )
  }
}

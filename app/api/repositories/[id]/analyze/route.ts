/**
 * POST /api/repositories/[id]/analyze
 *
 * Triggers repository analysis by adding a job to the queue.
 * Requires authentication.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { analysisQueue } from '@/services/queue/analysis-queue'
import { JOB_PRIORITIES } from '@/services/queue/queue-config'

/**
 * POST - Trigger repository analysis
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const repositoryId = params.id

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        githubAccessToken: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.githubAccessToken) {
      return NextResponse.json(
        { error: 'GitHub account not connected' },
        { status: 400 }
      )
    }

    // Get repository
    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
      select: {
        id: true,
        owner: true,
        name: true,
        userId: true,
        analysisStatus: true,
      },
    })

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    // Verify ownership
    if (repository.userId !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to analyze this repository' },
        { status: 403 }
      )
    }

    // Check if analysis is already in progress
    if (repository.analysisStatus === 'processing') {
      // Check if there's an active job
      const latestJob = await analysisQueue.getLatestRepositoryJob(repositoryId)

      if (latestJob) {
        const state = await latestJob.getState()
        if (state === 'active' || state === 'waiting') {
          return NextResponse.json(
            {
              message: 'Analysis already in progress',
              jobId: latestJob.id,
              status: repository.analysisStatus,
            },
            { status: 200 }
          )
        }
      }
    }

    // Parse request body for priority (optional)
    let priority = JOB_PRIORITIES.NORMAL
    try {
      const body = await request.json()
      if (body.priority && typeof body.priority === 'number') {
        priority = body.priority
      }
    } catch {
      // No body or invalid JSON, use default priority
    }

    // Add analysis job to queue
    const job = await analysisQueue.addAnalysisJob(
      {
        repositoryId: repository.id,
        owner: repository.owner,
        repo: repository.name,
        userId: user.id,
      },
      priority
    )

    console.log(
      `Analysis job ${job.id} queued for repository ${repository.owner}/${repository.name}`
    )

    return NextResponse.json(
      {
        message: 'Analysis job queued successfully',
        jobId: job.id,
        repositoryId: repository.id,
        status: 'queued',
      },
      { status: 202 } // 202 Accepted
    )
  } catch (error) {
    console.error('Failed to queue analysis job:', error)

    return NextResponse.json(
      {
        error: 'Failed to queue analysis',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

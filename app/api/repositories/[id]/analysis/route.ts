/**
 * GET /api/repositories/[id]/analysis
 *
 * Retrieves repository analysis results and status.
 * Public endpoint (no authentication required).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { analysisQueue } from '@/services/queue/analysis-queue'

/**
 * GET - Get repository analysis
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const repositoryId = params.id

    // Get repository with analysis
    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
      select: {
        id: true,
        name: true,
        fullName: true,
        owner: true,
        analysisStatus: true,
        lastAnalyzedAt: true,
        analysis: true,
      },
    })

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    // If analysis exists, return it
    if (repository.analysis) {
      return NextResponse.json({
        status: repository.analysisStatus,
        lastAnalyzedAt: repository.lastAnalyzedAt,
        analysis: {
          id: repository.analysis.id,
          // AI Detection
          aiDetected: repository.analysis.aiDetected,
          aiProvider: repository.analysis.aiProvider,
          aiConfidence: repository.analysis.aiConfidence,
          aiEvidence: repository.analysis.aiEvidence,
          // Analysis Results
          projectType: repository.analysis.projectType,
          framework: repository.analysis.framework,
          completenessScore: repository.analysis.completenessScore,
          // AI Insights
          purpose: repository.analysis.purpose,
          techStack: repository.analysis.techStack,
          features: repository.analysis.features,
          improvements: repository.analysis.improvements,
          mistakes: repository.analysis.mistakes,
          // Timeline
          firstCommitAt: repository.analysis.firstCommitAt,
          lastCommitAt: repository.analysis.lastCommitAt,
          commitCount: repository.analysis.commitCount,
          contributorCount: repository.analysis.contributorCount,
          // Metadata
          createdAt: repository.analysis.createdAt,
          updatedAt: repository.analysis.updatedAt,
        },
      })
    }

    // If no analysis exists, check for pending job
    if (
      repository.analysisStatus === 'processing' ||
      repository.analysisStatus === 'pending'
    ) {
      const latestJob = await analysisQueue.getLatestRepositoryJob(repositoryId)

      if (latestJob) {
        const jobStatus = await analysisQueue.getJobStatus(latestJob.id!)

        return NextResponse.json({
          status: repository.analysisStatus,
          lastAnalyzedAt: repository.lastAnalyzedAt,
          job: {
            id: latestJob.id,
            state: jobStatus.state,
            progress: jobStatus.progress || 0,
            attemptsMade: jobStatus.attemptsMade || 0,
            failedReason: jobStatus.failedReason,
          },
          message:
            jobStatus.state === 'active'
              ? 'Analysis in progress'
              : jobStatus.state === 'waiting'
              ? 'Analysis queued'
              : jobStatus.state === 'failed'
              ? 'Analysis failed'
              : 'Analysis pending',
        })
      }
    }

    // No analysis and no job
    return NextResponse.json({
      status: repository.analysisStatus,
      lastAnalyzedAt: repository.lastAnalyzedAt,
      message: 'Analysis not started. Trigger analysis to begin.',
    })
  } catch (error) {
    console.error('Failed to retrieve analysis:', error)

    return NextResponse.json(
      {
        error: 'Failed to retrieve analysis',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Repository Analysis Worker
 *
 * BullMQ worker that processes repository analysis jobs.
 * Handles job execution, progress updates, error handling, and retries.
 */

import { Worker, Job } from 'bullmq'
import { prisma } from '@/lib/prisma'
import { createRepositoryAnalyzer } from '@/services/analysis/repository-analyzer'
import {
  defaultWorkerOptions,
  QUEUE_NAMES,
} from '@/services/queue/queue-config'
import type {
  AnalysisJobData,
  AnalysisJobResult,
} from '@/services/queue/analysis-queue'

/**
 * Analysis Worker
 * Processes repository analysis jobs from the queue
 */
class AnalysisWorker {
  private worker: Worker<AnalysisJobData, AnalysisJobResult>

  constructor() {
    this.worker = new Worker<AnalysisJobData, AnalysisJobResult>(
      QUEUE_NAMES.REPOSITORY_ANALYSIS,
      this.processJob.bind(this),
      {
        ...defaultWorkerOptions,
        concurrency: 3, // Process 3 analysis jobs concurrently
      }
    )

    this.setupEventHandlers()

    console.log('✓ Analysis worker started')
  }

  /**
   * Process an analysis job
   * @private
   */
  private async processJob(
    job: Job<AnalysisJobData, AnalysisJobResult>
  ): Promise<AnalysisJobResult> {
    const { repositoryId, owner, repo, userId } = job.data

    console.log(`Processing analysis job ${job.id} for ${owner}/${repo}`)

    try {
      // Update job progress
      await job.updateProgress(0)

      // Get user's GitHub access token
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { githubAccessToken: true },
      })

      if (!user?.githubAccessToken) {
        throw new Error('User GitHub access token not found')
      }

      // Create analyzer instance
      const analyzer = createRepositoryAnalyzer(user.githubAccessToken)

      // Progress callback
      const onProgress = async (progress: number, status: string) => {
        await job.updateProgress(progress)
        await job.log(`Progress: ${progress}% - ${status}`)
      }

      // Execute analysis
      const result = await analyzer.analyzeRepository(
        repositoryId,
        owner,
        repo,
        onProgress
      )

      await analyzer.close()

      // Return result
      if (result.success) {
        await job.log('Analysis completed successfully')
        return {
          repositoryId,
          success: true,
          analysisId: result.analysisId,
          completedAt: new Date(),
        }
      } else {
        throw new Error(result.error || 'Analysis failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      console.error(`Analysis job ${job.id} failed:`, errorMessage)

      await job.log(`Error: ${errorMessage}`)

      // Mark repository as failed
      await prisma.repository.update({
        where: { id: repositoryId },
        data: { analysisStatus: 'failed' },
      })

      // Return failure result
      return {
        repositoryId,
        success: false,
        error: errorMessage,
        completedAt: new Date(),
      }
    }
  }

  /**
   * Setup event handlers for worker monitoring
   * @private
   */
  private setupEventHandlers(): void {
    this.worker.on('completed', (job, result) => {
      console.log(
        `✓ Job ${job.id} completed successfully for repository ${result.repositoryId}`
      )
    })

    this.worker.on('failed', (job, error) => {
      console.error(`✗ Job ${job?.id} failed:`, error.message)
    })

    this.worker.on('error', (error) => {
      console.error('Worker error:', error)
    })

    this.worker.on('stalled', (jobId) => {
      console.warn(`⚠ Job ${jobId} stalled`)
    })

    this.worker.on('active', (job) => {
      console.log(`→ Job ${job.id} is now active`)
    })

    this.worker.on('progress', (job, progress) => {
      console.log(`Job ${job.id} progress: ${progress}%`)
    })
  }

  /**
   * Pause the worker
   */
  async pause(): Promise<void> {
    await this.worker.pause()
    console.log('Worker paused')
  }

  /**
   * Resume the worker
   */
  async resume(): Promise<void> {
    await this.worker.resume()
    console.log('Worker resumed')
  }

  /**
   * Close the worker
   */
  async close(): Promise<void> {
    await this.worker.close()
    console.log('Worker closed')
  }

  /**
   * Get worker status
   */
  async getStatus(): Promise<{
    isRunning: boolean
    isPaused: boolean
  }> {
    return {
      isRunning: await this.worker.isRunning(),
      isPaused: await this.worker.isPaused(),
    }
  }
}

// Export singleton instance
export const analysisWorker = new AnalysisWorker()

/**
 * Start the analysis worker
 * Call this function to start processing jobs
 */
export function startAnalysisWorker(): AnalysisWorker {
  return analysisWorker
}

/**
 * Stop the analysis worker
 * Call this function to gracefully shutdown the worker
 */
export async function stopAnalysisWorker(): Promise<void> {
  await analysisWorker.close()
}

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down worker...')
  await stopAnalysisWorker()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down worker...')
  await stopAnalysisWorker()
  process.exit(0)
})

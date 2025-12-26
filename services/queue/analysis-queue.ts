/**
 * Repository Analysis Queue
 *
 * BullMQ queue for managing repository analysis jobs.
 * Handles job creation, status tracking, and queue management.
 */

import { Queue, Job } from 'bullmq'
import {
  defaultQueueOptions,
  analysisJobOptions,
  QUEUE_NAMES,
  JOB_NAMES,
  JOB_PRIORITIES,
} from './queue-config'

/**
 * Repository analysis job data
 */
export interface AnalysisJobData {
  repositoryId: string
  owner: string
  repo: string
  userId: string
  priority?: number
}

/**
 * Analysis job result
 */
export interface AnalysisJobResult {
  repositoryId: string
  success: boolean
  analysisId?: string
  error?: string
  completedAt: Date
}

/**
 * Repository Analysis Queue
 * Manages background jobs for analyzing repositories
 */
class RepositoryAnalysisQueue {
  private queue: Queue<AnalysisJobData, AnalysisJobResult>

  constructor() {
    this.queue = new Queue<AnalysisJobData, AnalysisJobResult>(
      QUEUE_NAMES.REPOSITORY_ANALYSIS,
      defaultQueueOptions
    )

    this.setupEventHandlers()
  }

  /**
   * Add a repository analysis job to the queue
   *
   * @param data - Job data containing repository information
   * @param priority - Job priority (default: NORMAL)
   * @returns Created job
   */
  async addAnalysisJob(
    data: AnalysisJobData,
    priority: number = JOB_PRIORITIES.NORMAL
  ): Promise<Job<AnalysisJobData, AnalysisJobResult>> {
    try {
      // Check if there's already a pending job for this repository
      const existingJobs = await this.queue.getJobs(['waiting', 'active', 'delayed'])
      const existingJob = existingJobs.find(
        (job) => job.data.repositoryId === data.repositoryId
      )

      if (existingJob) {
        console.log(
          `Analysis job already exists for repository ${data.repositoryId}:`,
          existingJob.id
        )
        return existingJob
      }

      // Create new job
      const job = await this.queue.add(
        JOB_NAMES.ANALYZE_REPOSITORY,
        {
          ...data,
          priority,
        },
        {
          ...analysisJobOptions,
          priority,
          jobId: `analysis-${data.repositoryId}-${Date.now()}`,
        }
      )

      console.log(
        `Added analysis job ${job.id} for repository ${data.owner}/${data.repo}`
      )

      return job
    } catch (error) {
      console.error('Failed to add analysis job:', error)
      throw error
    }
  }

  /**
   * Get job by ID
   *
   * @param jobId - Job identifier
   * @returns Job instance or null
   */
  async getJob(
    jobId: string
  ): Promise<Job<AnalysisJobData, AnalysisJobResult> | undefined> {
    return this.queue.getJob(jobId)
  }

  /**
   * Get all jobs for a repository
   *
   * @param repositoryId - Repository identifier
   * @returns Array of jobs
   */
  async getRepositoryJobs(
    repositoryId: string
  ): Promise<Job<AnalysisJobData, AnalysisJobResult>[]> {
    const allJobs = await this.queue.getJobs([
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed',
    ])

    return allJobs.filter((job) => job.data.repositoryId === repositoryId)
  }

  /**
   * Get the latest job for a repository
   *
   * @param repositoryId - Repository identifier
   * @returns Latest job or null
   */
  async getLatestRepositoryJob(
    repositoryId: string
  ): Promise<Job<AnalysisJobData, AnalysisJobResult> | null> {
    const jobs = await this.getRepositoryJobs(repositoryId)
    if (jobs.length === 0) return null

    // Sort by timestamp (newest first)
    jobs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    return jobs[0]
  }

  /**
   * Get job status
   *
   * @param jobId - Job identifier
   * @returns Job status object
   */
  async getJobStatus(jobId: string): Promise<{
    state: string | 'unknown'
    progress?: number
    result?: AnalysisJobResult
    failedReason?: string
    attemptsMade?: number
  }> {
    const job = await this.getJob(jobId)
    if (!job) {
      return { state: 'unknown' }
    }

    const state = await job.getState()
    const progress = job.progress as number | undefined
    const failedReason = job.failedReason

    return {
      state,
      progress,
      result: job.returnvalue,
      failedReason,
      attemptsMade: job.attemptsMade,
    }
  }

  /**
   * Remove a job from the queue
   *
   * @param jobId - Job identifier
   */
  async removeJob(jobId: string): Promise<void> {
    const job = await this.getJob(jobId)
    if (job) {
      await job.remove()
      console.log(`Removed job ${jobId}`)
    }
  }

  /**
   * Get queue metrics
   *
   * @returns Queue statistics
   */
  async getQueueMetrics(): Promise<{
    waiting: number
    active: number
    completed: number
    failed: number
    delayed: number
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ])

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
    }
  }

  /**
   * Clean old jobs from the queue
   *
   * @param olderThanMs - Remove jobs older than this (default: 7 days)
   */
  async cleanOldJobs(olderThanMs: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    await this.queue.clean(olderThanMs, 100, 'completed')
    await this.queue.clean(olderThanMs * 4, 100, 'failed') // Keep failed jobs longer
    console.log('Cleaned old jobs from queue')
  }

  /**
   * Pause the queue (stop processing jobs)
   */
  async pause(): Promise<void> {
    await this.queue.pause()
    console.log('Queue paused')
  }

  /**
   * Resume the queue (start processing jobs)
   */
  async resume(): Promise<void> {
    await this.queue.resume()
    console.log('Queue resumed')
  }

  /**
   * Close the queue connection
   */
  async close(): Promise<void> {
    await this.queue.close()
    console.log('Queue closed')
  }

  /**
   * Setup event handlers for queue monitoring
   * @private
   */
  private setupEventHandlers(): void {
    this.queue.on('error', (error: Error) => {
      console.error('Queue error:', error)
    })

    // Note: BullMQ v5 uses different event signatures
    // These are logged in the worker instead
  }

  /**
   * Get the underlying BullMQ queue instance
   * Useful for advanced operations
   */
  getQueue(): Queue<AnalysisJobData, AnalysisJobResult> {
    return this.queue
  }
}

// Export singleton instance
export const analysisQueue = new RepositoryAnalysisQueue()

/**
 * Helper function to add an analysis job
 * Convenience wrapper around analysisQueue.addAnalysisJob
 *
 * @param data - Job data
 * @param priority - Job priority
 * @returns Created job
 */
export async function addAnalysisJob(
  data: AnalysisJobData,
  priority?: number
): Promise<Job<AnalysisJobData, AnalysisJobResult>> {
  return analysisQueue.addAnalysisJob(data, priority)
}

/**
 * Helper function to get analysis job status
 * Convenience wrapper around analysisQueue.getJobStatus
 *
 * @param jobId - Job identifier
 * @returns Job status
 */
export async function getAnalysisJobStatus(jobId: string) {
  return analysisQueue.getJobStatus(jobId)
}

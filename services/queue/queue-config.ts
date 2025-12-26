/**
 * BullMQ Queue Configuration
 *
 * Centralized configuration for BullMQ queues and Redis connection.
 * Provides consistent connection settings, retry strategies, and queue options.
 */

import { QueueOptions, WorkerOptions, JobsOptions } from 'bullmq'
import { redis } from '@/lib/redis'

/**
 * Redis connection configuration for BullMQ
 * Reuses the existing Redis instance from lib/redis.ts
 */
export const redisConnection = {
  host: redis.options.host || 'localhost',
  port: redis.options.port || 6379,
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
}

/**
 * Default queue options
 * Applied to all queues unless overridden
 */
export const defaultQueueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // 2 seconds base delay
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000, // Keep last 1000 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
      count: 5000, // Keep last 5000 failed jobs
    },
  },
}

/**
 * Default worker options
 * Applied to all workers unless overridden
 */
export const defaultWorkerOptions: WorkerOptions = {
  connection: redisConnection,
  concurrency: 5, // Process 5 jobs concurrently
  limiter: {
    max: 10, // Max 10 jobs
    duration: 60000, // per 60 seconds
  },
}

/**
 * Job options for repository analysis
 * Higher priority and custom retry settings
 */
export const analysisJobOptions: JobsOptions = {
  attempts: 5, // More retries for analysis jobs
  backoff: {
    type: 'exponential',
    delay: 5000, // 5 seconds base delay
  },
  removeOnComplete: {
    age: 7 * 24 * 3600, // Keep for 7 days
    count: 5000,
  },
  removeOnFail: {
    age: 30 * 24 * 3600, // Keep failed for 30 days
    count: 10000,
  },
}

/**
 * Queue names
 * Centralized queue naming for consistency
 */
export const QUEUE_NAMES = {
  REPOSITORY_ANALYSIS: 'repository-analysis',
} as const

/**
 * Job names
 * Centralized job naming for consistency
 */
export const JOB_NAMES = {
  ANALYZE_REPOSITORY: 'analyze-repository',
} as const

/**
 * Job priorities
 * Higher number = higher priority
 */
export const JOB_PRIORITIES = {
  LOW: 1,
  NORMAL: 5,
  HIGH: 10,
  URGENT: 20,
} as const

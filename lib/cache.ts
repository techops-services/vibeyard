import { redis } from './redis'

/**
 * Cache Service Wrapper
 *
 * Provides a clean, type-safe interface for Redis caching operations.
 * Used by GitHub client and other services to cache API responses.
 *
 * Features:
 * - Type-safe get/set operations
 * - Configurable TTL per cache entry
 * - Graceful error handling (never throws)
 * - Cache key generators for consistency
 * - Pattern-based deletion for cache invalidation
 */
export class CacheService {
  /**
   * Get value from cache
   * @param key - Cache key
   * @returns Parsed value or null if not found/error
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key)
      if (!value) return null
      return JSON.parse(value) as T
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error)
      return null // Fail gracefully - caching is not critical
    }
  }

  /**
   * Set value in cache with TTL
   * @param key - Cache key
   * @param value - Value to cache (will be JSON serialized)
   * @param ttlSeconds - Time to live in seconds (default: 1 hour)
   */
  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value))
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error)
      // Don't throw - caching is not critical
    }
  }

  /**
   * Delete key from cache
   * @param key - Cache key to delete
   */
  async del(key: string): Promise<void> {
    try {
      await redis.del(key)
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error)
    }
  }

  /**
   * Delete multiple keys matching pattern
   * Uses Redis KEYS command followed by DEL
   * @param pattern - Redis key pattern (e.g., "github:repo:*")
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error(`Cache delete pattern error for ${pattern}:`, error)
    }
  }

  /**
   * Check if key exists in cache
   * @param key - Cache key
   * @returns True if key exists, false otherwise
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key)
      return result === 1
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error)
      return false
    }
  }

  // =========================================================================
  // Cache Key Generators
  // =========================================================================
  // These methods ensure consistent cache key naming across the application

  /**
   * Generate cache key for GitHub repository metadata
   * TTL: 1 hour (repositories change infrequently)
   */
  githubRepoKey(owner: string, repo: string): string {
    return `github:repo:${owner}/${repo}`
  }

  /**
   * Generate cache key for user's GitHub repositories list
   * TTL: 5 minutes (users frequently add repositories)
   */
  githubUserReposKey(userId: string, page: number = 1): string {
    return `github:user:${userId}:repos:${page}`
  }

  /**
   * Generate cache key for repository contents/file
   * TTL: 1 hour
   */
  githubRepoContentsKey(owner: string, repo: string, path: string): string {
    return `github:repo:${owner}/${repo}:contents:${path}`
  }

  /**
   * Generate cache key for commit history
   * TTL: 1 hour
   */
  githubCommitsKey(owner: string, repo: string, page: number = 1): string {
    return `github:repo:${owner}/${repo}:commits:${page}`
  }

  /**
   * Generate cache key for repository topics
   * TTL: 1 day (topics rarely change)
   */
  githubTopicsKey(owner: string, repo: string): string {
    return `github:repo:${owner}/${repo}:topics`
  }

  /**
   * Generate cache key for repository languages
   * TTL: 1 day (language breakdown rarely changes)
   */
  githubLanguagesKey(owner: string, repo: string): string {
    return `github:repo:${owner}/${repo}:languages`
  }

  /**
   * Generate cache key for repository tree/file structure
   * TTL: 1 hour
   */
  githubTreeKey(owner: string, repo: string, branch: string = 'main'): string {
    return `github:repo:${owner}/${repo}:tree:${branch}`
  }

  /**
   * Generate cache key for GitHub rate limit status
   * TTL: 1 minute (check frequently)
   */
  githubRateLimitKey(userId: string): string {
    return `github:ratelimit:${userId}`
  }

  /**
   * Generate cache key for repository list with filters
   * TTL: 2 minutes (short-lived for dynamic content)
   */
  repositoryListKey(filters: Record<string, any>): string {
    const filterHash = Buffer.from(JSON.stringify(filters)).toString('base64')
    return `repositories:list:${filterHash}`
  }

  /**
   * Generate cache key for repository analysis results
   * TTL: Until invalidated (analysis changes infrequently)
   */
  repositoryAnalysisKey(repositoryId: string): string {
    return `repository:${repositoryId}:analysis`
  }

  /**
   * Invalidate all GitHub-related cache for a specific repository
   * Useful when repository is updated or disconnected
   */
  async invalidateGitHubRepoCache(owner: string, repo: string): Promise<void> {
    await this.delPattern(`github:repo:${owner}/${repo}*`)
  }

  /**
   * Invalidate all cache for a specific user's GitHub data
   * Useful when user reconnects their GitHub account
   */
  async invalidateUserGitHubCache(userId: string): Promise<void> {
    await this.delPattern(`github:user:${userId}*`)
  }
}

// Export singleton instance
export const cacheService = new CacheService()

// Export TTL constants for consistency
export const CACHE_TTL = {
  USER_REPOS: 5 * 60, // 5 minutes
  REPO_METADATA: 60 * 60, // 1 hour
  REPO_CONTENTS: 60 * 60, // 1 hour
  COMMIT_HISTORY: 60 * 60, // 1 hour
  TOPICS: 24 * 60 * 60, // 1 day
  LANGUAGES: 24 * 60 * 60, // 1 day
  TREE: 60 * 60, // 1 hour
  RATE_LIMIT: 60, // 1 minute
  REPO_LIST: 2 * 60, // 2 minutes
} as const

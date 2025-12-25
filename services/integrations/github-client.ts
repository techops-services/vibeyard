/**
 * GitHub API Client Service
 *
 * Centralized GitHub API client using Octokit with:
 * - Authentication via user's GitHub access token
 * - Rate limiting and tracking
 * - Redis caching for all responses
 * - Comprehensive error handling
 * - Retry logic with exponential backoff
 *
 * @see https://docs.github.com/en/rest
 */

import { Octokit } from '@octokit/rest'
import { cacheService, CACHE_TTL } from '@/lib/cache'
import {
  handleGitHubError,
  isRetryableError,
  calculateRetryDelay,
  RateLimitError,
  GitHubAPIError,
} from '@/lib/errors/github-errors'
import type {
  GitHubRepository,
  GitHubCommit,
  GitHubContent,
  GitHubTree,
  GitHubRateLimitResponse,
  CommitOptions,
  RepositoryListOptions,
  LanguageBreakdown,
} from '@/types/github'

/**
 * Configuration options for GitHubClient
 */
interface GitHubClientOptions {
  /** Maximum number of retry attempts for failed requests */
  maxRetries?: number
  /** Base delay for exponential backoff (ms) */
  retryBaseDelay?: number
  /** Request timeout in milliseconds */
  timeout?: number
  /** Enable request/response logging (development only) */
  enableLogging?: boolean
  /** Optional Octokit instance (for testing) */
  octokitInstance?: Octokit
}

/**
 * GitHub API Client
 *
 * Handles all interactions with the GitHub API.
 */
export class GitHubClient {
  private octokit: Octokit
  private maxRetries: number
  private retryBaseDelay: number
  private enableLogging: boolean

  constructor(
    private accessToken: string,
    options: GitHubClientOptions = {}
  ) {
    if (!accessToken) {
      throw new Error('GitHub access token is required')
    }

    this.maxRetries = options.maxRetries ?? 3
    this.retryBaseDelay = options.retryBaseDelay ?? 1000
    this.enableLogging = options.enableLogging ?? process.env.NODE_ENV === 'development'

    // Initialize Octokit client (or use provided instance for testing)
    this.octokit =
      options.octokitInstance ??
      new Octokit({
        auth: accessToken,
        userAgent: 'vibeyard/1.0',
        request: {
          timeout: options.timeout ?? 10000, // 10 seconds default
        },
      })

    if (this.enableLogging) {
      console.log('GitHubClient initialized')
    }
  }

  // ===========================================================================
  // USER REPOSITORIES
  // ===========================================================================

  /**
   * Get authenticated user's repositories
   * Cached for 5 minutes
   *
   * @param options - Repository list options
   * @returns Array of GitHub repositories
   */
  async getUserRepositories(
    options: RepositoryListOptions = {}
  ): Promise<GitHubRepository[]> {
    const cacheKey = cacheService.githubUserReposKey(
      this.accessToken.substring(0, 10), // Use token prefix as user ID
      options.page ?? 1
    )

    // Check cache
    const cached = await cacheService.get<GitHubRepository[]>(cacheKey)
    if (cached) {
      this.log('Cache hit: user repositories', { page: options.page })
      return cached
    }

    // Fetch from GitHub
    this.log('Fetching user repositories from GitHub', options)

    const response = await this.executeWithRetry(async () => {
      await this.checkRateLimit()
      return this.octokit.repos.listForAuthenticatedUser({
        type: options.type ?? 'all',
        sort: options.sort ?? 'updated',
        direction: options.direction ?? 'desc',
        per_page: options.per_page ?? 30,
        page: options.page ?? 1,
      })
    })

    const repositories = response.data as GitHubRepository[]

    // Cache for 5 minutes
    await cacheService.set(cacheKey, repositories, CACHE_TTL.USER_REPOS)

    return repositories
  }

  // ===========================================================================
  // REPOSITORY DETAILS
  // ===========================================================================

  /**
   * Get repository details
   * Cached for 1 hour
   *
   * @param owner - Repository owner username
   * @param repo - Repository name
   * @returns Repository details
   */
  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    const cacheKey = cacheService.githubRepoKey(owner, repo)

    // Check cache
    const cached = await cacheService.get<GitHubRepository>(cacheKey)
    if (cached) {
      this.log('Cache hit: repository', { owner, repo })
      return cached
    }

    // Fetch from GitHub
    this.log('Fetching repository from GitHub', { owner, repo })

    const response = await this.executeWithRetry(async () => {
      await this.checkRateLimit()
      return this.octokit.repos.get({ owner, repo })
    })

    const repository = response.data as GitHubRepository

    // Cache for 1 hour
    await cacheService.set(cacheKey, repository, CACHE_TTL.REPO_METADATA)

    return repository
  }

  // ===========================================================================
  // REPOSITORY CONTENTS
  // ===========================================================================

  /**
   * Get repository contents (file or directory)
   * Cached for 1 hour
   *
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param path - File/directory path
   * @returns Content data
   */
  async getRepositoryContents(
    owner: string,
    repo: string,
    path: string = ''
  ): Promise<GitHubContent | GitHubContent[]> {
    const cacheKey = cacheService.githubRepoContentsKey(owner, repo, path)

    // Check cache
    const cached = await cacheService.get<GitHubContent | GitHubContent[]>(cacheKey)
    if (cached) {
      this.log('Cache hit: repository contents', { owner, repo, path })
      return cached
    }

    // Fetch from GitHub
    this.log('Fetching repository contents from GitHub', { owner, repo, path })

    const response = await this.executeWithRetry(async () => {
      await this.checkRateLimit()
      return this.octokit.repos.getContent({ owner, repo, path })
    })

    const contents = response.data as GitHubContent | GitHubContent[]

    // Cache for 1 hour
    await cacheService.set(cacheKey, contents, CACHE_TTL.REPO_CONTENTS)

    return contents
  }

  /**
   * Get file content as decoded string
   * Convenience method for fetching file contents
   *
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param path - File path
   * @returns Decoded file content
   */
  async getFileContent(owner: string, repo: string, path: string): Promise<string> {
    const content = await this.getRepositoryContents(owner, repo, path)

    // Ensure it's a file, not a directory
    if (Array.isArray(content)) {
      throw new Error(`Path "${path}" is a directory, not a file`)
    }

    if (content.type !== 'file') {
      throw new Error(`Path "${path}" is not a file (type: ${content.type})`)
    }

    // Decode base64 content
    if (content.encoding === 'base64' && content.content) {
      return Buffer.from(content.content, 'base64').toString('utf-8')
    }

    return content.content || ''
  }

  /**
   * Get repository file tree
   * Cached for 1 hour
   *
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param branch - Branch name (default: 'main')
   * @returns Git tree with file structure
   */
  async getRepositoryTree(
    owner: string,
    repo: string,
    branch: string = 'main'
  ): Promise<GitHubTree> {
    const cacheKey = cacheService.githubTreeKey(owner, repo, branch)

    // Check cache
    const cached = await cacheService.get<GitHubTree>(cacheKey)
    if (cached) {
      this.log('Cache hit: repository tree', { owner, repo, branch })
      return cached
    }

    // Fetch from GitHub
    this.log('Fetching repository tree from GitHub', { owner, repo, branch })

    try {
      const response = await this.executeWithRetry(async () => {
        await this.checkRateLimit()
        return this.octokit.git.getTree({
          owner,
          repo,
          tree_sha: branch,
          recursive: 'true',
        })
      })

      const tree = response.data as GitHubTree

      // Cache for 1 hour
      await cacheService.set(cacheKey, tree, CACHE_TTL.TREE)

      return tree
    } catch (error) {
      // If 'main' branch doesn't exist, try 'master'
      if (branch === 'main') {
        this.log('main branch not found, trying master')
        return this.getRepositoryTree(owner, repo, 'master')
      }
      throw error
    }
  }

  // ===========================================================================
  // COMMIT HISTORY
  // ===========================================================================

  /**
   * Get commit history for repository
   * Cached for 1 hour
   *
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param options - Commit options (pagination, filters)
   * @returns Array of commits
   */
  async getCommitHistory(
    owner: string,
    repo: string,
    options: CommitOptions = {}
  ): Promise<GitHubCommit[]> {
    const cacheKey = cacheService.githubCommitsKey(owner, repo, options.page ?? 1)

    // Check cache
    const cached = await cacheService.get<GitHubCommit[]>(cacheKey)
    if (cached) {
      this.log('Cache hit: commit history', { owner, repo, page: options.page })
      return cached
    }

    // Fetch from GitHub
    this.log('Fetching commit history from GitHub', { owner, repo, options })

    const response = await this.executeWithRetry(async () => {
      await this.checkRateLimit()
      return this.octokit.repos.listCommits({
        owner,
        repo,
        sha: options.sha,
        path: options.path,
        author: options.author,
        since: options.since,
        until: options.until,
        per_page: options.per_page ?? 100,
        page: options.page ?? 1,
      })
    })

    const commits = response.data as GitHubCommit[]

    // Cache for 1 hour
    await cacheService.set(cacheKey, commits, CACHE_TTL.COMMIT_HISTORY)

    return commits
  }

  // ===========================================================================
  // TOPICS AND METADATA
  // ===========================================================================

  /**
   * Get repository topics
   * Cached for 1 day
   *
   * @param owner - Repository owner
   * @param repo - Repository name
   * @returns Array of topic strings
   */
  async getRepositoryTopics(owner: string, repo: string): Promise<string[]> {
    const cacheKey = cacheService.githubTopicsKey(owner, repo)

    // Check cache
    const cached = await cacheService.get<string[]>(cacheKey)
    if (cached) {
      this.log('Cache hit: repository topics', { owner, repo })
      return cached
    }

    // Fetch from GitHub
    this.log('Fetching repository topics from GitHub', { owner, repo })

    const response = await this.executeWithRetry(async () => {
      await this.checkRateLimit()
      return this.octokit.repos.getAllTopics({ owner, repo })
    })

    const topics = response.data.names

    // Cache for 1 day
    await cacheService.set(cacheKey, topics, CACHE_TTL.TOPICS)

    return topics
  }

  /**
   * Get repository language breakdown
   * Cached for 1 day
   *
   * @param owner - Repository owner
   * @param repo - Repository name
   * @returns Object with language names as keys and byte counts as values
   */
  async getRepositoryLanguages(
    owner: string,
    repo: string
  ): Promise<LanguageBreakdown> {
    const cacheKey = cacheService.githubLanguagesKey(owner, repo)

    // Check cache
    const cached = await cacheService.get<LanguageBreakdown>(cacheKey)
    if (cached) {
      this.log('Cache hit: repository languages', { owner, repo })
      return cached
    }

    // Fetch from GitHub
    this.log('Fetching repository languages from GitHub', { owner, repo })

    const response = await this.executeWithRetry(async () => {
      await this.checkRateLimit()
      return this.octokit.repos.listLanguages({ owner, repo })
    })

    const languages = response.data as LanguageBreakdown

    // Cache for 1 day
    await cacheService.set(cacheKey, languages, CACHE_TTL.LANGUAGES)

    return languages
  }

  // ===========================================================================
  // RATE LIMITING
  // ===========================================================================

  /**
   * Get current rate limit status
   *
   * @returns Rate limit information
   */
  async getRateLimitStatus(): Promise<GitHubRateLimitResponse> {
    const response = await this.octokit.rateLimit.get()
    return response.data as GitHubRateLimitResponse
  }

  /**
   * Check rate limit before making requests
   * Throws RateLimitError if limit is exceeded
   *
   * @private
   */
  private async checkRateLimit(): Promise<void> {
    try {
      const rateLimitData = await this.getRateLimitStatus()
      const coreLimit = rateLimitData.resources.core

      // Log rate limit status periodically
      if (this.enableLogging && coreLimit.remaining < 100) {
        console.warn(
          `⚠️ GitHub API rate limit: ${coreLimit.remaining}/${coreLimit.limit} remaining`
        )
      }

      // If rate limit exceeded, throw error
      if (coreLimit.remaining === 0) {
        const resetAt = new Date(coreLimit.reset * 1000)
        throw new RateLimitError(resetAt, 0)
      }

      // If approaching limit (less than 10 remaining), log warning
      if (coreLimit.remaining < 10) {
        console.warn(
          `⚠️ GitHub API rate limit critically low: ${coreLimit.remaining} remaining`
        )
      }
    } catch (error) {
      // If rate limit check itself fails, log but don't block
      if (!(error instanceof RateLimitError)) {
        console.error('Failed to check rate limit:', error)
      } else {
        throw error
      }
    }
  }

  // ===========================================================================
  // CACHE MANAGEMENT
  // ===========================================================================

  /**
   * Invalidate all cached data for a repository
   *
   * @param owner - Repository owner
   * @param repo - Repository name
   */
  async invalidateRepositoryCache(owner: string, repo: string): Promise<void> {
    await cacheService.invalidateGitHubRepoCache(owner, repo)
    this.log('Invalidated repository cache', { owner, repo })
  }

  // ===========================================================================
  // HELPER METHODS
  // ===========================================================================

  /**
   * Execute a request with retry logic
   * Retries on network errors and 5xx server errors
   *
   * @private
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    attempt: number = 0
  ): Promise<T> {
    try {
      return await fn()
    } catch (error) {
      const githubError = this.wrapError(error)

      // Don't retry if max retries exceeded
      if (attempt >= this.maxRetries) {
        this.log('Max retries exceeded', { attempt, error: githubError.message })
        throw githubError
      }

      // Check if error is retryable
      if (!isRetryableError(githubError)) {
        throw githubError
      }

      // Calculate delay and retry
      const delay = calculateRetryDelay(attempt, this.retryBaseDelay)
      this.log('Retrying request', { attempt: attempt + 1, delay })

      await new Promise((resolve) => setTimeout(resolve, delay))
      return this.executeWithRetry(fn, attempt + 1)
    }
  }

  /**
   * Wrap unknown errors in GitHubAPIError
   *
   * @private
   */
  private wrapError(error: any): GitHubAPIError {
    try {
      return handleGitHubError(error)
    } catch (wrappedError) {
      return wrappedError as GitHubAPIError
    }
  }

  /**
   * Log messages (only in development mode)
   *
   * @private
   */
  private log(message: string, data?: any): void {
    if (this.enableLogging) {
      console.log(`[GitHubClient] ${message}`, data ? data : '')
    }
  }
}

/**
 * Create a new GitHub client instance
 * Convenience factory function
 *
 * @param accessToken - GitHub personal access token
 * @param options - Client options
 * @returns GitHubClient instance
 */
export function createGitHubClient(
  accessToken: string,
  options?: GitHubClientOptions
): GitHubClient {
  return new GitHubClient(accessToken, options)
}

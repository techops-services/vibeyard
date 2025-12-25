/**
 * GitHub API Error Classes
 *
 * Custom error types for GitHub API interactions.
 * Provides structured error handling with specific error types.
 */

/**
 * Base GitHub API Error
 */
export class GitHubAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: any
  ) {
    super(message)
    this.name = 'GitHubAPIError'
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Rate Limit Error
 * Thrown when GitHub API rate limit is exceeded
 */
export class RateLimitError extends GitHubAPIError {
  constructor(
    public resetAt: Date,
    public remaining: number = 0,
    response?: any
  ) {
    const message = `GitHub API rate limit exceeded. Resets at ${resetAt.toISOString()}`
    super(message, 429, response)
    this.name = 'RateLimitError'
  }
}

/**
 * Not Found Error
 * Thrown when repository or resource is not found (404)
 */
export class NotFoundError extends GitHubAPIError {
  constructor(resource: string, response?: any) {
    super(`GitHub resource not found: ${resource}`, 404, response)
    this.name = 'NotFoundError'
  }
}

/**
 * Unauthorized Error
 * Thrown when GitHub token is invalid or expired (401)
 */
export class UnauthorizedError extends GitHubAPIError {
  constructor(message: string = 'Invalid or expired GitHub token', response?: any) {
    super(message, 401, response)
    this.name = 'UnauthorizedError'
  }
}

/**
 * Forbidden Error
 * Thrown when user doesn't have access to private repository (403)
 */
export class ForbiddenError extends GitHubAPIError {
  constructor(
    message: string = 'Access forbidden. You may not have permission to access this resource.',
    response?: any
  ) {
    super(message, 403, response)
    this.name = 'ForbiddenError'
  }
}

/**
 * Network Error
 * Thrown for network/timeout issues
 */
export class NetworkError extends GitHubAPIError {
  constructor(message: string = 'Network error occurred', originalError?: Error) {
    super(message, 0, originalError)
    this.name = 'NetworkError'
  }
}

/**
 * Validation Error
 * Thrown when GitHub API returns validation errors (422)
 */
export class ValidationError extends GitHubAPIError {
  constructor(
    message: string,
    public errors: Array<{ field: string; code: string; message: string }>,
    response?: any
  ) {
    super(message, 422, response)
    this.name = 'ValidationError'
  }
}

/**
 * Handle GitHub API errors and throw appropriate custom error
 * @param error - Error from Octokit or fetch
 * @throws Appropriate GitHubAPIError subclass
 */
export function handleGitHubError(error: any): never {
  // Check if it's already our custom error
  if (error instanceof GitHubAPIError) {
    throw error
  }

  // Handle Octokit RequestError
  if (error.status) {
    const status = error.status
    const message = error.message || 'GitHub API error'

    switch (status) {
      case 401:
        throw new UnauthorizedError(message, error)

      case 403:
        // Check if it's a rate limit error
        if (error.response?.headers?.['x-ratelimit-remaining'] === '0') {
          const resetTimestamp =
            parseInt(error.response.headers['x-ratelimit-reset']) * 1000
          const resetAt = new Date(resetTimestamp)
          throw new RateLimitError(resetAt, 0, error)
        }
        throw new ForbiddenError(message, error)

      case 404:
        throw new NotFoundError(message, error)

      case 422:
        const errors = error.response?.data?.errors || []
        throw new ValidationError(message, errors, error)

      case 429:
        // Rate limit error
        const resetTimestamp =
          parseInt(error.response?.headers?.['x-ratelimit-reset'] || '0') * 1000
        const resetAt = new Date(resetTimestamp)
        const remaining = parseInt(
          error.response?.headers?.['x-ratelimit-remaining'] || '0'
        )
        throw new RateLimitError(resetAt, remaining, error)

      default:
        throw new GitHubAPIError(message, status, error)
    }
  }

  // Handle network errors
  if (
    error.code === 'ECONNREFUSED' ||
    error.code === 'ETIMEDOUT' ||
    error.code === 'ENOTFOUND'
  ) {
    throw new NetworkError(
      `Network error: ${error.message || 'Connection failed'}`,
      error
    )
  }

  // Unknown error
  throw new GitHubAPIError(
    error.message || 'Unknown GitHub API error',
    500,
    error
  )
}

/**
 * Check if error is retryable
 * @param error - Error to check
 * @returns True if error is retryable (network issues, 5xx errors)
 */
export function isRetryableError(error: GitHubAPIError): boolean {
  // Network errors are retryable
  if (error instanceof NetworkError) {
    return true
  }

  // 5xx server errors are retryable
  if (error.statusCode >= 500 && error.statusCode < 600) {
    return true
  }

  // Rate limit errors are not retryable (need to wait)
  if (error instanceof RateLimitError) {
    return false
  }

  // 4xx client errors are not retryable
  return false
}

/**
 * Calculate retry delay with exponential backoff
 * @param attempt - Retry attempt number (0-indexed)
 * @param baseDelay - Base delay in milliseconds (default: 1000)
 * @param maxDelay - Maximum delay in milliseconds (default: 60000)
 * @returns Delay in milliseconds
 */
export function calculateRetryDelay(
  attempt: number,
  baseDelay: number = 1000,
  maxDelay: number = 60000
): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt)
  const jitter = Math.random() * 0.1 * exponentialDelay // Add 10% jitter
  return Math.min(exponentialDelay + jitter, maxDelay)
}

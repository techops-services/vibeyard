/**
 * Cache Service Unit Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { CacheService, CACHE_TTL } from '../cache'
import { redis } from '../redis'

// Mock Redis
vi.mock('../redis', () => ({
  redis: {
    get: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
    keys: vi.fn(),
    exists: vi.fn(),
  },
}))

describe('CacheService', () => {
  let cacheService: CacheService

  beforeEach(() => {
    cacheService = new CacheService()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('get', () => {
    it('should return parsed value when key exists', async () => {
      const testData = { name: 'test-repo', id: 123 }
      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(testData))

      const result = await cacheService.get('test-key')

      expect(result).toEqual(testData)
      expect(redis.get).toHaveBeenCalledWith('test-key')
    })

    it('should return null when key does not exist', async () => {
      vi.mocked(redis.get).mockResolvedValue(null)

      const result = await cacheService.get('non-existent-key')

      expect(result).toBeNull()
    })

    it('should return null on error and not throw', async () => {
      vi.mocked(redis.get).mockRejectedValue(new Error('Redis error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await cacheService.get('error-key')

      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should handle JSON parse errors gracefully', async () => {
      vi.mocked(redis.get).mockResolvedValue('invalid json')

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await cacheService.get('bad-json-key')

      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should preserve types with generics', async () => {
      interface TestType {
        id: number
        name: string
      }

      const testData: TestType = { id: 1, name: 'test' }
      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(testData))

      const result = await cacheService.get<TestType>('typed-key')

      expect(result).toEqual(testData)
      expect(result?.id).toBe(1)
      expect(result?.name).toBe('test')
    })
  })

  describe('set', () => {
    it('should set value with default TTL', async () => {
      const testData = { name: 'test-repo' }
      vi.mocked(redis.setex).mockResolvedValue('OK')

      await cacheService.set('test-key', testData)

      expect(redis.setex).toHaveBeenCalledWith(
        'test-key',
        3600, // Default TTL
        JSON.stringify(testData)
      )
    })

    it('should set value with custom TTL', async () => {
      const testData = { name: 'test-repo' }
      vi.mocked(redis.setex).mockResolvedValue('OK')

      await cacheService.set('test-key', testData, 300)

      expect(redis.setex).toHaveBeenCalledWith(
        'test-key',
        300,
        JSON.stringify(testData)
      )
    })

    it('should not throw on error', async () => {
      vi.mocked(redis.setex).mockRejectedValue(new Error('Redis error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(cacheService.set('error-key', { data: 'test' })).resolves.toBeUndefined()

      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should serialize complex objects', async () => {
      const complexData = {
        nested: { deep: { value: 123 } },
        array: [1, 2, 3],
        date: new Date().toISOString(),
      }
      vi.mocked(redis.setex).mockResolvedValue('OK')

      await cacheService.set('complex-key', complexData)

      expect(redis.setex).toHaveBeenCalledWith(
        'complex-key',
        3600,
        JSON.stringify(complexData)
      )
    })
  })

  describe('del', () => {
    it('should delete key', async () => {
      vi.mocked(redis.del).mockResolvedValue(1)

      await cacheService.del('test-key')

      expect(redis.del).toHaveBeenCalledWith('test-key')
    })

    it('should not throw on error', async () => {
      vi.mocked(redis.del).mockRejectedValue(new Error('Redis error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(cacheService.del('error-key')).resolves.toBeUndefined()

      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('delPattern', () => {
    it('should delete all keys matching pattern', async () => {
      const matchingKeys = ['repo:1', 'repo:2', 'repo:3']
      vi.mocked(redis.keys).mockResolvedValue(matchingKeys)
      vi.mocked(redis.del).mockResolvedValue(3)

      await cacheService.delPattern('repo:*')

      expect(redis.keys).toHaveBeenCalledWith('repo:*')
      expect(redis.del).toHaveBeenCalledWith(...matchingKeys)
    })

    it('should not call del if no keys match', async () => {
      vi.mocked(redis.keys).mockResolvedValue([])

      await cacheService.delPattern('nonexistent:*')

      expect(redis.keys).toHaveBeenCalledWith('nonexistent:*')
      expect(redis.del).not.toHaveBeenCalled()
    })

    it('should not throw on error', async () => {
      vi.mocked(redis.keys).mockRejectedValue(new Error('Redis error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(cacheService.delPattern('error:*')).resolves.toBeUndefined()

      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('exists', () => {
    it('should return true when key exists', async () => {
      vi.mocked(redis.exists).mockResolvedValue(1)

      const result = await cacheService.exists('existing-key')

      expect(result).toBe(true)
      expect(redis.exists).toHaveBeenCalledWith('existing-key')
    })

    it('should return false when key does not exist', async () => {
      vi.mocked(redis.exists).mockResolvedValue(0)

      const result = await cacheService.exists('non-existent-key')

      expect(result).toBe(false)
    })

    it('should return false on error', async () => {
      vi.mocked(redis.exists).mockRejectedValue(new Error('Redis error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await cacheService.exists('error-key')

      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('Cache key generators', () => {
    it('should generate GitHub repo key', () => {
      const key = cacheService.githubRepoKey('owner', 'repo')
      expect(key).toBe('github:repo:owner/repo')
    })

    it('should generate GitHub user repos key', () => {
      const key = cacheService.githubUserReposKey('user123', 2)
      expect(key).toBe('github:user:user123:repos:2')
    })

    it('should generate GitHub user repos key with default page', () => {
      const key = cacheService.githubUserReposKey('user123')
      expect(key).toBe('github:user:user123:repos:1')
    })

    it('should generate GitHub repo contents key', () => {
      const key = cacheService.githubRepoContentsKey('owner', 'repo', 'src/index.ts')
      expect(key).toBe('github:repo:owner/repo:contents:src/index.ts')
    })

    it('should generate GitHub commits key', () => {
      const key = cacheService.githubCommitsKey('owner', 'repo', 3)
      expect(key).toBe('github:repo:owner/repo:commits:3')
    })

    it('should generate GitHub topics key', () => {
      const key = cacheService.githubTopicsKey('owner', 'repo')
      expect(key).toBe('github:repo:owner/repo:topics')
    })

    it('should generate GitHub languages key', () => {
      const key = cacheService.githubLanguagesKey('owner', 'repo')
      expect(key).toBe('github:repo:owner/repo:languages')
    })

    it('should generate GitHub tree key', () => {
      const key = cacheService.githubTreeKey('owner', 'repo', 'develop')
      expect(key).toBe('github:repo:owner/repo:tree:develop')
    })

    it('should generate GitHub tree key with default branch', () => {
      const key = cacheService.githubTreeKey('owner', 'repo')
      expect(key).toBe('github:repo:owner/repo:tree:main')
    })

    it('should generate GitHub rate limit key', () => {
      const key = cacheService.githubRateLimitKey('user123')
      expect(key).toBe('github:ratelimit:user123')
    })

    it('should generate repository list key', () => {
      const filters = { language: 'TypeScript', aiDetected: true }
      const key = cacheService.repositoryListKey(filters)
      expect(key).toContain('repositories:list:')
      expect(key.length).toBeGreaterThan(20) // Base64 encoded
    })

    it('should generate repository analysis key', () => {
      const key = cacheService.repositoryAnalysisKey('repo-123')
      expect(key).toBe('repository:repo-123:analysis')
    })

    it('should generate consistent keys for same filters', () => {
      const filters = { language: 'TypeScript', page: 1 }
      const key1 = cacheService.repositoryListKey(filters)
      const key2 = cacheService.repositoryListKey(filters)
      expect(key1).toBe(key2)
    })

    it('should generate different keys for different filters', () => {
      const filters1 = { language: 'TypeScript' }
      const filters2 = { language: 'JavaScript' }
      const key1 = cacheService.repositoryListKey(filters1)
      const key2 = cacheService.repositoryListKey(filters2)
      expect(key1).not.toBe(key2)
    })
  })

  describe('Cache invalidation methods', () => {
    it('should invalidate GitHub repo cache', async () => {
      const matchingKeys = [
        'github:repo:owner/repo',
        'github:repo:owner/repo:contents:file.ts',
        'github:repo:owner/repo:commits:1',
      ]
      vi.mocked(redis.keys).mockResolvedValue(matchingKeys)
      vi.mocked(redis.del).mockResolvedValue(3)

      await cacheService.invalidateGitHubRepoCache('owner', 'repo')

      expect(redis.keys).toHaveBeenCalledWith('github:repo:owner/repo*')
      expect(redis.del).toHaveBeenCalledWith(...matchingKeys)
    })

    it('should invalidate user GitHub cache', async () => {
      const matchingKeys = [
        'github:user:user123:repos:1',
        'github:user:user123:repos:2',
      ]
      vi.mocked(redis.keys).mockResolvedValue(matchingKeys)
      vi.mocked(redis.del).mockResolvedValue(2)

      await cacheService.invalidateUserGitHubCache('user123')

      expect(redis.keys).toHaveBeenCalledWith('github:user:user123*')
      expect(redis.del).toHaveBeenCalledWith(...matchingKeys)
    })
  })

  describe('CACHE_TTL constants', () => {
    it('should export TTL constants', () => {
      expect(CACHE_TTL.USER_REPOS).toBe(5 * 60)
      expect(CACHE_TTL.REPO_METADATA).toBe(60 * 60)
      expect(CACHE_TTL.REPO_CONTENTS).toBe(60 * 60)
      expect(CACHE_TTL.COMMIT_HISTORY).toBe(60 * 60)
      expect(CACHE_TTL.TOPICS).toBe(24 * 60 * 60)
      expect(CACHE_TTL.LANGUAGES).toBe(24 * 60 * 60)
      expect(CACHE_TTL.TREE).toBe(60 * 60)
      expect(CACHE_TTL.RATE_LIMIT).toBe(60)
      expect(CACHE_TTL.REPO_LIST).toBe(2 * 60)
    })
  })
})

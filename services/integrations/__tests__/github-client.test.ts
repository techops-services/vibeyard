/**
 * GitHub Client Unit Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { GitHubClient } from '../github-client'
import { cacheService } from '@/lib/cache'
import {
  RateLimitError,
  NotFoundError,
  UnauthorizedError,
} from '@/lib/errors/github-errors'
import type { GitHubRepository, GitHubCommit } from '@/types/github'

// Mock dependencies
vi.mock('@/lib/cache')

// Create mock Octokit instance
const mockOctokitInstance = {
  repos: {
    listForAuthenticatedUser: vi.fn(),
    get: vi.fn(),
    getContent: vi.fn(),
    listCommits: vi.fn(),
    getAllTopics: vi.fn(),
    listLanguages: vi.fn(),
  },
  git: {
    getTree: vi.fn(),
  },
  rateLimit: {
    get: vi.fn(),
  },
}

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(() => mockOctokitInstance),
}))

describe('GitHubClient', () => {
  let client: GitHubClient
  let mockOctokit: typeof mockOctokitInstance

  const mockRepository: GitHubRepository = {
    id: 12345,
    node_id: 'R_123',
    name: 'test-repo',
    full_name: 'owner/test-repo',
    owner: {
      login: 'owner',
      id: 1,
      node_id: 'U_1',
      avatar_url: 'https://example.com/avatar.jpg',
      gravatar_id: null,
      url: 'https://api.github.com/users/owner',
      html_url: 'https://github.com/owner',
      followers_url: 'https://api.github.com/users/owner/followers',
      following_url: 'https://api.github.com/users/owner/following{/other_user}',
      gists_url: 'https://api.github.com/users/owner/gists{/gist_id}',
      starred_url: 'https://api.github.com/users/owner/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.github.com/users/owner/subscriptions',
      organizations_url: 'https://api.github.com/users/owner/orgs',
      repos_url: 'https://api.github.com/users/owner/repos',
      events_url: 'https://api.github.com/users/owner/events{/privacy}',
      received_events_url: 'https://api.github.com/users/owner/received_events',
      type: 'User',
      site_admin: false,
    },
    private: false,
    html_url: 'https://github.com/owner/test-repo',
    description: 'A test repository',
    fork: false,
    url: 'https://api.github.com/repos/owner/test-repo',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    pushed_at: '2024-01-15T00:00:00Z',
    git_url: 'git://github.com/owner/test-repo.git',
    ssh_url: 'git@github.com:owner/test-repo.git',
    clone_url: 'https://github.com/owner/test-repo.git',
    svn_url: 'https://github.com/owner/test-repo',
    homepage: null,
    size: 100,
    stargazers_count: 10,
    watchers_count: 10,
    language: 'TypeScript',
    has_issues: true,
    has_projects: true,
    has_downloads: true,
    has_wiki: true,
    has_pages: false,
    has_discussions: false,
    forks_count: 2,
    mirror_url: null,
    archived: false,
    disabled: false,
    open_issues_count: 5,
    license: {
      key: 'mit',
      name: 'MIT License',
      spdx_id: 'MIT',
      url: 'https://api.github.com/licenses/mit',
      node_id: 'L_1',
    },
    allow_forking: true,
    is_template: false,
    web_commit_signoff_required: false,
    topics: ['typescript', 'nextjs'],
    visibility: 'public',
    forks: 2,
    open_issues: 5,
    watchers: 10,
    default_branch: 'main',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Reset all mock functions
    Object.values(mockOctokitInstance.repos).forEach((fn) => fn.mockReset())
    Object.values(mockOctokitInstance.git).forEach((fn) => fn.mockReset())
    mockOctokitInstance.rateLimit.get.mockReset()

    // Create client with test token and mocked octokit
    client = new GitHubClient('ghp_test_token_123456789', {
      enableLogging: false,
      octokitInstance: mockOctokitInstance as any,
    })

    // Use the shared mock instance
    mockOctokit = mockOctokitInstance

    // Mock cache service methods
    vi.mocked(cacheService.get).mockResolvedValue(null)
    vi.mocked(cacheService.set).mockResolvedValue(undefined)
    vi.mocked(cacheService.del).mockResolvedValue(undefined)
    vi.mocked(cacheService.delPattern).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Constructor', () => {
    it('should create client with access token', () => {
      expect(client).toBeDefined()
      expect((client as any).accessToken).toBe('ghp_test_token_123456789')
    })

    it('should throw error without access token', () => {
      expect(() => new GitHubClient('')).toThrow('GitHub access token is required')
    })

    it('should accept custom options', () => {
      const customClient = new GitHubClient('token', {
        maxRetries: 5,
        retryBaseDelay: 2000,
        timeout: 20000,
      })

      expect((customClient as any).maxRetries).toBe(5)
      expect((customClient as any).retryBaseDelay).toBe(2000)
    })
  })

  describe('getUserRepositories', () => {
    it('should fetch user repositories from GitHub', async () => {
      const mockRepos = [mockRepository]
      mockOctokit.repos.listForAuthenticatedUser.mockResolvedValue({ data: mockRepos })
      mockOctokit.rateLimit.get.mockResolvedValue({
        data: {
          resources: {
            core: { limit: 5000, remaining: 4999, reset: Date.now() / 1000 + 3600 },
          },
        },
      })

      const result = await client.getUserRepositories()

      expect(result).toEqual(mockRepos)
      expect(mockOctokit.repos.listForAuthenticatedUser).toHaveBeenCalled()
      expect(cacheService.set).toHaveBeenCalled()
    })

    it('should return cached data if available', async () => {
      const mockRepos = [mockRepository]
      vi.mocked(cacheService.get).mockResolvedValue(mockRepos)

      const result = await client.getUserRepositories()

      expect(result).toEqual(mockRepos)
      expect(mockOctokit.repos.listForAuthenticatedUser).not.toHaveBeenCalled()
    })

    it('should accept pagination options', async () => {
      const mockRepos = [mockRepository]
      mockOctokit.repos.listForAuthenticatedUser.mockResolvedValue({ data: mockRepos })
      mockOctokit.rateLimit.get.mockResolvedValue({
        data: {
          resources: {
            core: { limit: 5000, remaining: 4999, reset: Date.now() / 1000 + 3600 },
          },
        },
      })

      await client.getUserRepositories({
        page: 2,
        per_page: 50,
        sort: 'created',
        direction: 'asc',
      })

      expect(mockOctokit.repos.listForAuthenticatedUser).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          per_page: 50,
          sort: 'created',
          direction: 'asc',
        })
      )
    })
  })

  describe('getRepository', () => {
    it('should fetch repository from GitHub', async () => {
      mockOctokit.repos.get.mockResolvedValue({ data: mockRepository })
      mockOctokit.rateLimit.get.mockResolvedValue({
        data: {
          resources: {
            core: { limit: 5000, remaining: 4999, reset: Date.now() / 1000 + 3600 },
          },
        },
      })

      const result = await client.getRepository('owner', 'test-repo')

      expect(result).toEqual(mockRepository)
      expect(mockOctokit.repos.get).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'test-repo',
      })
      expect(cacheService.set).toHaveBeenCalled()
    })

    it('should return cached data if available', async () => {
      vi.mocked(cacheService.get).mockResolvedValue(mockRepository)

      const result = await client.getRepository('owner', 'test-repo')

      expect(result).toEqual(mockRepository)
      expect(mockOctokit.repos.get).not.toHaveBeenCalled()
    })

    it('should throw NotFoundError for non-existent repo', async () => {
      mockOctokit.repos.get.mockRejectedValue({
        status: 404,
        message: 'Not Found',
      })
      mockOctokit.rateLimit.get.mockResolvedValue({
        data: {
          resources: {
            core: { limit: 5000, remaining: 4999, reset: Date.now() / 1000 + 3600 },
          },
        },
      })

      await expect(client.getRepository('owner', 'nonexistent')).rejects.toThrow(
        NotFoundError
      )
    })
  })

  describe('getFileContent', () => {
    it('should fetch and decode file content', async () => {
      const fileContent = Buffer.from('Hello World').toString('base64')
      mockOctokit.repos.getContent.mockResolvedValue({
        data: {
          type: 'file',
          encoding: 'base64',
          content: fileContent,
          name: 'README.md',
          path: 'README.md',
        },
      })
      mockOctokit.rateLimit.get.mockResolvedValue({
        data: {
          resources: {
            core: { limit: 5000, remaining: 4999, reset: Date.now() / 1000 + 3600 },
          },
        },
      })

      const result = await client.getFileContent('owner', 'repo', 'README.md')

      expect(result).toBe('Hello World')
    })

    it('should throw error for directory path', async () => {
      mockOctokit.repos.getContent.mockResolvedValue({
        data: [
          { type: 'file', name: 'file1.ts', path: 'src/file1.ts' },
          { type: 'file', name: 'file2.ts', path: 'src/file2.ts' },
        ],
      })
      mockOctokit.rateLimit.get.mockResolvedValue({
        data: {
          resources: {
            core: { limit: 5000, remaining: 4999, reset: Date.now() / 1000 + 3600 },
          },
        },
      })

      await expect(client.getFileContent('owner', 'repo', 'src')).rejects.toThrow(
        'is a directory'
      )
    })
  })

  describe('getCommitHistory', () => {
    it('should fetch commit history', async () => {
      const mockCommits: GitHubCommit[] = [
        {
          sha: 'abc123',
          node_id: 'C_123',
          commit: {
            author: {
              name: 'John Doe',
              email: 'john@example.com',
              date: '2024-01-15T00:00:00Z',
            },
            committer: {
              name: 'John Doe',
              email: 'john@example.com',
              date: '2024-01-15T00:00:00Z',
            },
            message: 'Initial commit',
            tree: {
              sha: 'tree123',
              url: 'https://api.github.com/repos/owner/repo/git/trees/tree123',
            },
            url: 'https://api.github.com/repos/owner/repo/git/commits/abc123',
            comment_count: 0,
            verification: {
              verified: false,
              reason: 'unsigned',
              signature: null,
              payload: null,
            },
          },
          url: 'https://api.github.com/repos/owner/repo/commits/abc123',
          html_url: 'https://github.com/owner/repo/commit/abc123',
          comments_url: 'https://api.github.com/repos/owner/repo/commits/abc123/comments',
          author: null,
          committer: null,
          parents: [],
        },
      ]

      mockOctokit.repos.listCommits.mockResolvedValue({ data: mockCommits })
      mockOctokit.rateLimit.get.mockResolvedValue({
        data: {
          resources: {
            core: { limit: 5000, remaining: 4999, reset: Date.now() / 1000 + 3600 },
          },
        },
      })

      const result = await client.getCommitHistory('owner', 'repo')

      expect(result).toEqual(mockCommits)
      expect(mockOctokit.repos.listCommits).toHaveBeenCalled()
    })

    it('should accept commit options', async () => {
      mockOctokit.repos.listCommits.mockResolvedValue({ data: [] })
      mockOctokit.rateLimit.get.mockResolvedValue({
        data: {
          resources: {
            core: { limit: 5000, remaining: 4999, reset: Date.now() / 1000 + 3600 },
          },
        },
      })

      await client.getCommitHistory('owner', 'repo', {
        author: 'john@example.com',
        since: '2024-01-01',
        per_page: 50,
        page: 2,
      })

      expect(mockOctokit.repos.listCommits).toHaveBeenCalledWith(
        expect.objectContaining({
          author: 'john@example.com',
          since: '2024-01-01',
          per_page: 50,
          page: 2,
        })
      )
    })
  })

  describe('Rate Limiting', () => {
    it('should check rate limit before requests', async () => {
      mockOctokit.repos.get.mockResolvedValue({ data: mockRepository })
      mockOctokit.rateLimit.get.mockResolvedValue({
        data: {
          resources: {
            core: { limit: 5000, remaining: 4999, reset: Date.now() / 1000 + 3600 },
          },
        },
      })

      await client.getRepository('owner', 'repo')

      expect(mockOctokit.rateLimit.get).toHaveBeenCalled()
    })

    it('should throw RateLimitError when limit exceeded', async () => {
      const resetTime = Math.floor(Date.now() / 1000) + 3600
      mockOctokit.rateLimit.get.mockResolvedValue({
        data: {
          resources: {
            core: { limit: 5000, remaining: 0, reset: resetTime },
          },
        },
      })

      await expect(client.getRepository('owner', 'repo')).rejects.toThrow(
        RateLimitError
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle 401 Unauthorized errors', async () => {
      mockOctokit.repos.get.mockRejectedValue({
        status: 401,
        message: 'Bad credentials',
      })
      mockOctokit.rateLimit.get.mockResolvedValue({
        data: {
          resources: {
            core: { limit: 5000, remaining: 4999, reset: Date.now() / 1000 + 3600 },
          },
        },
      })

      await expect(client.getRepository('owner', 'repo')).rejects.toThrow(
        UnauthorizedError
      )
    })

    it('should retry on network errors', async () => {
      mockOctokit.repos.get
        .mockRejectedValueOnce({
          code: 'ETIMEDOUT',
          message: 'Request timeout',
        })
        .mockResolvedValueOnce({ data: mockRepository })

      mockOctokit.rateLimit.get.mockResolvedValue({
        data: {
          resources: {
            core: { limit: 5000, remaining: 4999, reset: Date.now() / 1000 + 3600 },
          },
        },
      })

      const result = await client.getRepository('owner', 'repo')

      expect(result).toEqual(mockRepository)
      expect(mockOctokit.repos.get).toHaveBeenCalledTimes(2)
    })

    it('should not retry on 404 errors', async () => {
      mockOctokit.repos.get.mockRejectedValue({
        status: 404,
        message: 'Not Found',
      })
      mockOctokit.rateLimit.get.mockResolvedValue({
        data: {
          resources: {
            core: { limit: 5000, remaining: 4999, reset: Date.now() / 1000 + 3600 },
          },
        },
      })

      await expect(client.getRepository('owner', 'nonexistent')).rejects.toThrow(
        NotFoundError
      )

      expect(mockOctokit.repos.get).toHaveBeenCalledTimes(1)
    })
  })

  describe('Cache Invalidation', () => {
    it('should invalidate repository cache', async () => {
      await client.invalidateRepositoryCache('owner', 'repo')

      expect(cacheService.invalidateGitHubRepoCache).toHaveBeenCalledWith('owner', 'repo')
    })
  })

  describe('getRepositoryTree', () => {
    it('should fetch repository tree', async () => {
      const mockTree = {
        sha: 'tree123',
        url: 'https://api.github.com/repos/owner/repo/git/trees/tree123',
        tree: [
          { path: 'src', mode: '040000', type: 'tree' as const, sha: 'abc', url: 'url' },
          { path: 'README.md', mode: '100644', type: 'blob' as const, sha: 'def', url: 'url' },
        ],
        truncated: false,
      }

      mockOctokit.git.getTree.mockResolvedValue({ data: mockTree })
      mockOctokit.rateLimit.get.mockResolvedValue({
        data: {
          resources: {
            core: { limit: 5000, remaining: 4999, reset: Date.now() / 1000 + 3600 },
          },
        },
      })

      const result = await client.getRepositoryTree('owner', 'repo')

      expect(result).toEqual(mockTree)
    })

    it('should fallback to master branch if main fails', async () => {
      const mockTree = {
        sha: 'tree123',
        url: 'url',
        tree: [],
        truncated: false,
      }

      mockOctokit.git.getTree
        .mockRejectedValueOnce({ status: 404, message: 'Not Found' })
        .mockResolvedValueOnce({ data: mockTree })

      mockOctokit.rateLimit.get.mockResolvedValue({
        data: {
          resources: {
            core: { limit: 5000, remaining: 4999, reset: Date.now() / 1000 + 3600 },
          },
        },
      })

      const result = await client.getRepositoryTree('owner', 'repo', 'main')

      expect(result).toEqual(mockTree)
      expect(mockOctokit.git.getTree).toHaveBeenCalledTimes(2)
    })
  })
})

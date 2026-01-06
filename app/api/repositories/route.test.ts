import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createGitHubClient } from '@/services/integrations/github-client'

// Mock dependencies
vi.mock('@/lib/auth')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    repository: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    activity: {
      create: vi.fn(),
    },
  },
}))
vi.mock('@/services/integrations/github-client')

describe('POST /api/repositories', () => {
  const mockUserId = 'user-123'
  const mockGitHubAccessToken = 'github-token-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Screenshot URL Validation', () => {
    it('should accept a valid screenshot URL', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      const mockRepository = {
        id: 'repo-123',
        title: 'My Vibe',
        screenshotUrl: 'https://i.imgur.com/example.png',
        userId: mockUserId,
      }

      vi.mocked(prisma.repository.create).mockResolvedValueOnce(mockRepository as any)
      vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

      const request = new NextRequest('http://localhost:3000/api/repositories', {
        method: 'POST',
        body: JSON.stringify({
          title: 'My Vibe',
          screenshotUrl: 'https://i.imgur.com/example.png',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(data.screenshotUrl).toBe('https://i.imgur.com/example.png')
      expect(prisma.repository.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          screenshotUrl: 'https://i.imgur.com/example.png',
        }),
      })
    })

    it('should accept an empty string for screenshot URL', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      const mockRepository = {
        id: 'repo-123',
        title: 'My Vibe',
        screenshotUrl: null,
        userId: mockUserId,
      }

      vi.mocked(prisma.repository.create).mockResolvedValueOnce(mockRepository as any)
      vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

      const request = new NextRequest('http://localhost:3000/api/repositories', {
        method: 'POST',
        body: JSON.stringify({
          title: 'My Vibe',
          screenshotUrl: '',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(prisma.repository.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          screenshotUrl: null,
        }),
      })
    })

    it('should accept missing screenshot URL (optional field)', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      const mockRepository = {
        id: 'repo-123',
        title: 'My Vibe',
        screenshotUrl: null,
        userId: mockUserId,
      }

      vi.mocked(prisma.repository.create).mockResolvedValueOnce(mockRepository as any)
      vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

      const request = new NextRequest('http://localhost:3000/api/repositories', {
        method: 'POST',
        body: JSON.stringify({
          title: 'My Vibe',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(prisma.repository.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          screenshotUrl: null,
        }),
      })
    })

    it('should reject invalid screenshot URL format', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories', {
        method: 'POST',
        body: JSON.stringify({
          title: 'My Vibe',
          screenshotUrl: 'not-a-valid-url',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request data')
      expect(data.details).toBeDefined()
      expect(prisma.repository.create).not.toHaveBeenCalled()
    })

    it('should reject screenshot URL with invalid protocol', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories', {
        method: 'POST',
        body: JSON.stringify({
          title: 'My Vibe',
          screenshotUrl: 'ftp://example.com/image.png',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request data')
      expect(prisma.repository.create).not.toHaveBeenCalled()
    })

    it('should handle screenshot URL with special characters', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      const screenshotUrl = 'https://example.com/images/screenshot%20(1).png?v=1234'
      const mockRepository = {
        id: 'repo-123',
        title: 'My Vibe',
        screenshotUrl,
        userId: mockUserId,
      }

      vi.mocked(prisma.repository.create).mockResolvedValueOnce(mockRepository as any)
      vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

      const request = new NextRequest('http://localhost:3000/api/repositories', {
        method: 'POST',
        body: JSON.stringify({
          title: 'My Vibe',
          screenshotUrl,
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(data.screenshotUrl).toBe(screenshotUrl)
    })
  })

  describe('GitHub Vibe Creation with Screenshot', () => {
    it('should create GitHub vibe with screenshot URL', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: mockUserId,
        githubAccessToken: mockGitHubAccessToken,
      } as any)

      const mockGitHubRepo = {
        id: 123456,
        name: 'react',
        full_name: 'facebook/react',
        description: 'A declarative, efficient, and flexible JavaScript library',
        owner: { login: 'facebook', avatar_url: 'https://avatars.githubusercontent.com/u/69631' },
        html_url: 'https://github.com/facebook/react',
        language: 'JavaScript',
        topics: ['javascript', 'react'],
        stargazers_count: 200000,
        forks_count: 40000,
        open_issues_count: 800,
        license: { spdx_id: 'MIT' },
        private: false,
      }

      const mockGitHubClient = {
        getRepository: vi.fn().mockResolvedValueOnce(mockGitHubRepo),
      }

      vi.mocked(createGitHubClient).mockReturnValueOnce(mockGitHubClient as any)
      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce(null)

      const mockRepository = {
        id: 'repo-123',
        githubId: 123456,
        name: 'react',
        fullName: 'facebook/react',
        screenshotUrl: 'https://example.com/react-screenshot.png',
        userId: mockUserId,
      }

      vi.mocked(prisma.repository.create).mockResolvedValueOnce(mockRepository as any)
      vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

      const request = new NextRequest('http://localhost:3000/api/repositories', {
        method: 'POST',
        body: JSON.stringify({
          owner: 'facebook',
          name: 'react',
          screenshotUrl: 'https://example.com/react-screenshot.png',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(data.screenshotUrl).toBe('https://example.com/react-screenshot.png')
      expect(prisma.repository.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          githubId: 123456,
          name: 'react',
          screenshotUrl: 'https://example.com/react-screenshot.png',
        }),
      })
    })

    it('should create GitHub vibe without screenshot URL', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: mockUserId,
        githubAccessToken: mockGitHubAccessToken,
      } as any)

      const mockGitHubRepo = {
        id: 123456,
        name: 'react',
        full_name: 'facebook/react',
        description: 'A declarative, efficient, and flexible JavaScript library',
        owner: { login: 'facebook', avatar_url: 'https://avatars.githubusercontent.com/u/69631' },
        html_url: 'https://github.com/facebook/react',
        language: 'JavaScript',
        topics: ['javascript', 'react'],
        stargazers_count: 200000,
        forks_count: 40000,
        open_issues_count: 800,
        license: { spdx_id: 'MIT' },
        private: false,
      }

      const mockGitHubClient = {
        getRepository: vi.fn().mockResolvedValueOnce(mockGitHubRepo),
      }

      vi.mocked(createGitHubClient).mockReturnValueOnce(mockGitHubClient as any)
      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce(null)

      const mockRepository = {
        id: 'repo-123',
        githubId: 123456,
        name: 'react',
        fullName: 'facebook/react',
        screenshotUrl: null,
        userId: mockUserId,
      }

      vi.mocked(prisma.repository.create).mockResolvedValueOnce(mockRepository as any)
      vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

      const request = new NextRequest('http://localhost:3000/api/repositories', {
        method: 'POST',
        body: JSON.stringify({
          owner: 'facebook',
          name: 'react',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(prisma.repository.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          screenshotUrl: null,
        }),
      })
    })
  })

  describe('Non-GitHub Vibe Creation with Screenshot', () => {
    it('should create non-GitHub vibe with screenshot URL', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      const mockRepository = {
        id: 'repo-123',
        title: 'My Awesome Project',
        description: 'A custom vibe without GitHub',
        screenshotUrl: 'https://i.imgur.com/my-project.png',
        userId: mockUserId,
      }

      vi.mocked(prisma.repository.create).mockResolvedValueOnce(mockRepository as any)
      vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

      const request = new NextRequest('http://localhost:3000/api/repositories', {
        method: 'POST',
        body: JSON.stringify({
          title: 'My Awesome Project',
          description: 'A custom vibe without GitHub',
          screenshotUrl: 'https://i.imgur.com/my-project.png',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(data.title).toBe('My Awesome Project')
      expect(data.screenshotUrl).toBe('https://i.imgur.com/my-project.png')
      expect(prisma.repository.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'My Awesome Project',
          description: 'A custom vibe without GitHub',
          screenshotUrl: 'https://i.imgur.com/my-project.png',
        }),
      })
    })

    it('should create non-GitHub vibe without screenshot URL', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      const mockRepository = {
        id: 'repo-123',
        title: 'My Awesome Project',
        screenshotUrl: null,
        userId: mockUserId,
      }

      vi.mocked(prisma.repository.create).mockResolvedValueOnce(mockRepository as any)
      vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

      const request = new NextRequest('http://localhost:3000/api/repositories', {
        method: 'POST',
        body: JSON.stringify({
          title: 'My Awesome Project',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(data.screenshotUrl).toBeNull()
      expect(prisma.repository.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'My Awesome Project',
          screenshotUrl: null,
        }),
      })
    })
  })

  describe('Description Fallback Logic for GitHub Vibes', () => {
    it('should use user-provided description when available for GitHub vibe', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: mockUserId,
        githubAccessToken: mockGitHubAccessToken,
      } as any)

      const mockGitHubRepo = {
        id: 123456,
        name: 'react',
        full_name: 'facebook/react',
        description: 'GitHub default description',
        owner: { login: 'facebook', avatar_url: 'https://avatars.githubusercontent.com/u/69631' },
        html_url: 'https://github.com/facebook/react',
        language: 'JavaScript',
        topics: [],
        stargazers_count: 200000,
        forks_count: 40000,
        open_issues_count: 800,
        license: { spdx_id: 'MIT' },
        private: false,
      }

      const mockGitHubClient = {
        getRepository: vi.fn().mockResolvedValueOnce(mockGitHubRepo),
      }

      vi.mocked(createGitHubClient).mockReturnValueOnce(mockGitHubClient as any)
      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce(null)
      vi.mocked(prisma.repository.create).mockResolvedValueOnce({} as any)
      vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

      const request = new NextRequest('http://localhost:3000/api/repositories', {
        method: 'POST',
        body: JSON.stringify({
          owner: 'facebook',
          name: 'react',
          description: 'My custom description for React',
        }),
      })

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(201)
      expect(prisma.repository.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: 'My custom description for React',
        }),
      })
    })

    it('should use GitHub description when user description is not provided', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: mockUserId,
        githubAccessToken: mockGitHubAccessToken,
      } as any)

      const mockGitHubRepo = {
        id: 123456,
        name: 'react',
        full_name: 'facebook/react',
        description: 'GitHub default description',
        owner: { login: 'facebook', avatar_url: 'https://avatars.githubusercontent.com/u/69631' },
        html_url: 'https://github.com/facebook/react',
        language: 'JavaScript',
        topics: [],
        stargazers_count: 200000,
        forks_count: 40000,
        open_issues_count: 800,
        license: { spdx_id: 'MIT' },
        private: false,
      }

      const mockGitHubClient = {
        getRepository: vi.fn().mockResolvedValueOnce(mockGitHubRepo),
      }

      vi.mocked(createGitHubClient).mockReturnValueOnce(mockGitHubClient as any)
      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce(null)
      vi.mocked(prisma.repository.create).mockResolvedValueOnce({} as any)
      vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

      const request = new NextRequest('http://localhost:3000/api/repositories', {
        method: 'POST',
        body: JSON.stringify({
          owner: 'facebook',
          name: 'react',
        }),
      })

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(201)
      expect(prisma.repository.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: 'GitHub default description',
        }),
      })
    })

    it('should use GitHub description when user description is empty string', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: mockUserId,
        githubAccessToken: mockGitHubAccessToken,
      } as any)

      const mockGitHubRepo = {
        id: 123456,
        name: 'react',
        full_name: 'facebook/react',
        description: 'GitHub default description',
        owner: { login: 'facebook', avatar_url: 'https://avatars.githubusercontent.com/u/69631' },
        html_url: 'https://github.com/facebook/react',
        language: 'JavaScript',
        topics: [],
        stargazers_count: 200000,
        forks_count: 40000,
        open_issues_count: 800,
        license: { spdx_id: 'MIT' },
        private: false,
      }

      const mockGitHubClient = {
        getRepository: vi.fn().mockResolvedValueOnce(mockGitHubRepo),
      }

      vi.mocked(createGitHubClient).mockReturnValueOnce(mockGitHubClient as any)
      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce(null)
      vi.mocked(prisma.repository.create).mockResolvedValueOnce({} as any)
      vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

      const request = new NextRequest('http://localhost:3000/api/repositories', {
        method: 'POST',
        body: JSON.stringify({
          owner: 'facebook',
          name: 'react',
          description: '',
        }),
      })

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(201)
      expect(prisma.repository.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: 'GitHub default description',
        }),
      })
    })

    it('should use GitHub description when user description is whitespace only', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: mockUserId,
        githubAccessToken: mockGitHubAccessToken,
      } as any)

      const mockGitHubRepo = {
        id: 123456,
        name: 'react',
        full_name: 'facebook/react',
        description: 'GitHub default description',
        owner: { login: 'facebook', avatar_url: 'https://avatars.githubusercontent.com/u/69631' },
        html_url: 'https://github.com/facebook/react',
        language: 'JavaScript',
        topics: [],
        stargazers_count: 200000,
        forks_count: 40000,
        open_issues_count: 800,
        license: { spdx_id: 'MIT' },
        private: false,
      }

      const mockGitHubClient = {
        getRepository: vi.fn().mockResolvedValueOnce(mockGitHubRepo),
      }

      vi.mocked(createGitHubClient).mockReturnValueOnce(mockGitHubClient as any)
      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce(null)
      vi.mocked(prisma.repository.create).mockResolvedValueOnce({} as any)
      vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

      const request = new NextRequest('http://localhost:3000/api/repositories', {
        method: 'POST',
        body: JSON.stringify({
          owner: 'facebook',
          name: 'react',
          description: '   ',
        }),
      })

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(201)
      expect(prisma.repository.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: 'GitHub default description',
        }),
      })
    })

    it('should handle GitHub repo with no description and user provides one', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: mockUserId,
        githubAccessToken: mockGitHubAccessToken,
      } as any)

      const mockGitHubRepo = {
        id: 123456,
        name: 'react',
        full_name: 'facebook/react',
        description: null, // GitHub repo has no description
        owner: { login: 'facebook', avatar_url: 'https://avatars.githubusercontent.com/u/69631' },
        html_url: 'https://github.com/facebook/react',
        language: 'JavaScript',
        topics: [],
        stargazers_count: 200000,
        forks_count: 40000,
        open_issues_count: 800,
        license: { spdx_id: 'MIT' },
        private: false,
      }

      const mockGitHubClient = {
        getRepository: vi.fn().mockResolvedValueOnce(mockGitHubRepo),
      }

      vi.mocked(createGitHubClient).mockReturnValueOnce(mockGitHubClient as any)
      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce(null)
      vi.mocked(prisma.repository.create).mockResolvedValueOnce({} as any)
      vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

      const request = new NextRequest('http://localhost:3000/api/repositories', {
        method: 'POST',
        body: JSON.stringify({
          owner: 'facebook',
          name: 'react',
          description: 'User provided description',
        }),
      })

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(201)
      expect(prisma.repository.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: 'User provided description',
        }),
      })
    })
  })

  describe('Combined Screenshot and Description', () => {
    it('should create vibe with both screenshot and custom description', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      const mockRepository = {
        id: 'repo-123',
        title: 'My Project',
        description: 'Custom description',
        screenshotUrl: 'https://example.com/screenshot.png',
        deployedUrl: 'https://myproject.com',
        userId: mockUserId,
      }

      vi.mocked(prisma.repository.create).mockResolvedValueOnce(mockRepository as any)
      vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

      const request = new NextRequest('http://localhost:3000/api/repositories', {
        method: 'POST',
        body: JSON.stringify({
          title: 'My Project',
          description: 'Custom description',
          screenshotUrl: 'https://example.com/screenshot.png',
          deployedUrl: 'https://myproject.com',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(data.screenshotUrl).toBe('https://example.com/screenshot.png')
      expect(data.description).toBe('Custom description')
      expect(data.deployedUrl).toBe('https://myproject.com')
    })

    it('should create GitHub vibe with screenshot, custom description, and collaboration options', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: mockUserId,
        githubAccessToken: mockGitHubAccessToken,
      } as any)

      const mockGitHubRepo = {
        id: 123456,
        name: 'my-project',
        full_name: 'user/my-project',
        description: 'GitHub description',
        owner: { login: 'user', avatar_url: 'https://avatars.githubusercontent.com/u/123' },
        html_url: 'https://github.com/user/my-project',
        language: 'TypeScript',
        topics: ['typescript', 'react'],
        stargazers_count: 100,
        forks_count: 20,
        open_issues_count: 5,
        license: { spdx_id: 'MIT' },
        private: false,
      }

      const mockGitHubClient = {
        getRepository: vi.fn().mockResolvedValueOnce(mockGitHubRepo),
      }

      vi.mocked(createGitHubClient).mockReturnValueOnce(mockGitHubClient as any)
      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce(null)
      vi.mocked(prisma.repository.create).mockResolvedValueOnce({} as any)
      vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

      const request = new NextRequest('http://localhost:3000/api/repositories', {
        method: 'POST',
        body: JSON.stringify({
          owner: 'user',
          name: 'my-project',
          description: 'My custom description',
          screenshotUrl: 'https://example.com/screenshot.png',
          deployedUrl: 'https://myproject.com',
          collaborationOptions: {
            role: 'PROVIDER',
            types: ['CODE_REVIEW', 'MENTORSHIP'],
            details: 'Happy to help with code reviews',
            isAccepting: true,
          },
        }),
      })

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(201)
      expect(prisma.repository.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: 'My custom description',
          screenshotUrl: 'https://example.com/screenshot.png',
          deployedUrl: 'https://myproject.com',
          collaborationRole: 'PROVIDER',
          collaborationTypes: ['CODE_REVIEW', 'MENTORSHIP'],
          collaborationDetails: 'Happy to help with code reviews',
          isAcceptingCollaborators: true,
        }),
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long screenshot URLs', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      const longUrl = 'https://example.com/' + 'a'.repeat(1000) + '.png'
      const mockRepository = {
        id: 'repo-123',
        title: 'My Vibe',
        screenshotUrl: longUrl,
        userId: mockUserId,
      }

      vi.mocked(prisma.repository.create).mockResolvedValueOnce(mockRepository as any)
      vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

      const request = new NextRequest('http://localhost:3000/api/repositories', {
        method: 'POST',
        body: JSON.stringify({
          title: 'My Vibe',
          screenshotUrl: longUrl,
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(data.screenshotUrl).toBe(longUrl)
    })

    it('should handle screenshot URLs with various image extensions', async () => {
      // Arrange
      const extensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']

      for (const ext of extensions) {
        vi.clearAllMocks()
        vi.mocked(auth).mockResolvedValueOnce({
          user: { id: mockUserId },
          expires: new Date().toISOString(),
        } as any)

        const screenshotUrl = `https://example.com/image.${ext}`
        const mockRepository = {
          id: 'repo-123',
          title: 'My Vibe',
          screenshotUrl,
          userId: mockUserId,
        }

        vi.mocked(prisma.repository.create).mockResolvedValueOnce(mockRepository as any)
        vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

        const request = new NextRequest('http://localhost:3000/api/repositories', {
          method: 'POST',
          body: JSON.stringify({
            title: 'My Vibe',
            screenshotUrl,
          }),
        })

        // Act
        const response = await POST(request)
        const data = await response.json()

        // Assert
        expect(response.status).toBe(201)
        expect(data.screenshotUrl).toBe(screenshotUrl)
      }
    })

    it('should trim whitespace from description before checking if empty', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: mockUserId,
        githubAccessToken: mockGitHubAccessToken,
      } as any)

      const mockGitHubRepo = {
        id: 123456,
        name: 'react',
        full_name: 'facebook/react',
        description: 'GitHub description',
        owner: { login: 'facebook', avatar_url: 'https://avatars.githubusercontent.com/u/69631' },
        html_url: 'https://github.com/facebook/react',
        language: 'JavaScript',
        topics: [],
        stargazers_count: 200000,
        forks_count: 40000,
        open_issues_count: 800,
        license: { spdx_id: 'MIT' },
        private: false,
      }

      const mockGitHubClient = {
        getRepository: vi.fn().mockResolvedValueOnce(mockGitHubRepo),
      }

      vi.mocked(createGitHubClient).mockReturnValueOnce(mockGitHubClient as any)
      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce(null)
      vi.mocked(prisma.repository.create).mockResolvedValueOnce({} as any)
      vi.mocked(prisma.activity.create).mockResolvedValueOnce({} as any)

      const request = new NextRequest('http://localhost:3000/api/repositories', {
        method: 'POST',
        body: JSON.stringify({
          owner: 'facebook',
          name: 'react',
          description: '  Description with spaces  ',
        }),
      })

      // Act
      const response = await POST(request)

      // Assert
      expect(response.status).toBe(201)
      expect(prisma.repository.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: 'Description with spaces',
        }),
      })
    })
  })
})

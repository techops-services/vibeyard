import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { PATCH } from './route'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Mock dependencies
vi.mock('@/lib/auth')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    repository: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

describe('PATCH /api/repositories/[id]', () => {
  const mockUserId = 'user-123'
  const mockOtherUserId = 'user-456'
  const mockRepoId = 'repo-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Authentication & Authorization', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'New Title' }),
      })

      // Act
      const response = await PATCH(request, { params: { id: mockRepoId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Unauthorized' })
      expect(prisma.repository.findUnique).not.toHaveBeenCalled()
    })

    it('should return 401 when session exists but has no user ID', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: {},
        expires: new Date().toISOString(),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'New Title' }),
      })

      // Act
      const response = await PATCH(request, { params: { id: mockRepoId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Unauthorized' })
    })

    it('should return 404 when repository does not exist', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'New Title' }),
      })

      // Act
      const response = await PATCH(request, { params: { id: mockRepoId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Repository not found' })
      expect(prisma.repository.update).not.toHaveBeenCalled()
    })

    it('should return 403 when user tries to update repository owned by another user', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockOtherUserId,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'New Title' }),
      })

      // Act
      const response = await PATCH(request, { params: { id: mockRepoId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(403)
      expect(data).toEqual({ error: 'Forbidden' })
      expect(prisma.repository.update).not.toHaveBeenCalled()
    })
  })

  describe('Title Validation', () => {
    it('should accept valid title for non-GitHub vibe', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
        githubId: null, // Non-GitHub vibe
      } as any)

      const updatedRepo = {
        id: mockRepoId,
        title: 'My Awesome Project',
        userId: mockUserId,
      }

      vi.mocked(prisma.repository.update).mockResolvedValueOnce(updatedRepo as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'My Awesome Project' }),
      })

      // Act
      const response = await PATCH(request, { params: { id: mockRepoId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.title).toBe('My Awesome Project')
      expect(prisma.repository.update).toHaveBeenCalledWith({
        where: { id: mockRepoId },
        data: { title: 'My Awesome Project' },
      })
    })

    it('should reject empty title for non-GitHub vibe', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
        githubId: null,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'PATCH',
        body: JSON.stringify({ title: '' }),
      })

      // Act
      const response = await PATCH(request, { params: { id: mockRepoId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid input')
      expect(prisma.repository.update).not.toHaveBeenCalled()
    })

    it('should reject title exceeding 200 characters', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
        githubId: null,
      } as any)

      const longTitle = 'a'.repeat(201)
      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'PATCH',
        body: JSON.stringify({ title: longTitle }),
      })

      // Act
      const response = await PATCH(request, { params: { id: mockRepoId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid input')
      expect(prisma.repository.update).not.toHaveBeenCalled()
    })

    it('should accept title with exactly 200 characters', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
        githubId: null,
      } as any)

      const maxLengthTitle = 'a'.repeat(200)
      vi.mocked(prisma.repository.update).mockResolvedValueOnce({
        id: mockRepoId,
        title: maxLengthTitle,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'PATCH',
        body: JSON.stringify({ title: maxLengthTitle }),
      })

      // Act
      const response = await PATCH(request, { params: { id: mockRepoId } })

      // Assert
      expect(response.status).toBe(200)
      expect(prisma.repository.update).toHaveBeenCalledWith({
        where: { id: mockRepoId },
        data: { title: maxLengthTitle },
      })
    })

    it('should accept title with single character', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
        githubId: null,
      } as any)

      vi.mocked(prisma.repository.update).mockResolvedValueOnce({
        id: mockRepoId,
        title: 'A',
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'A' }),
      })

      // Act
      const response = await PATCH(request, { params: { id: mockRepoId } })

      // Assert
      expect(response.status).toBe(200)
    })

    it('should allow updating GitHub vibe without changing title', async () => {
      // Arrange - GitHub vibes should not have title in update
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
        githubId: 12345, // GitHub vibe
      } as any)

      vi.mocked(prisma.repository.update).mockResolvedValueOnce({
        id: mockRepoId,
        description: 'New description',
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'PATCH',
        body: JSON.stringify({ description: 'New description' }),
      })

      // Act
      const response = await PATCH(request, { params: { id: mockRepoId } })

      // Assert
      expect(response.status).toBe(200)
      expect(prisma.repository.update).toHaveBeenCalledWith({
        where: { id: mockRepoId },
        data: { description: 'New description' },
      })
    })
  })

  describe('Description Validation', () => {
    it('should accept valid description', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
      } as any)

      vi.mocked(prisma.repository.update).mockResolvedValueOnce({
        id: mockRepoId,
        description: 'This is a great project',
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'PATCH',
        body: JSON.stringify({ description: 'This is a great project' }),
      })

      // Act
      const response = await PATCH(request, { params: { id: mockRepoId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.description).toBe('This is a great project')
    })

    it('should accept null description', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
      } as any)

      vi.mocked(prisma.repository.update).mockResolvedValueOnce({
        id: mockRepoId,
        description: null,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'PATCH',
        body: JSON.stringify({ description: null }),
      })

      // Act
      const response = await PATCH(request, { params: { id: mockRepoId } })

      // Assert
      expect(response.status).toBe(200)
    })

    it('should reject description exceeding 1000 characters', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
      } as any)

      const longDescription = 'a'.repeat(1001)
      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'PATCH',
        body: JSON.stringify({ description: longDescription }),
      })

      // Act
      const response = await PATCH(request, { params: { id: mockRepoId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid input')
    })

    it('should accept description with exactly 1000 characters', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
      } as any)

      const maxDescription = 'a'.repeat(1000)
      vi.mocked(prisma.repository.update).mockResolvedValueOnce({
        id: mockRepoId,
        description: maxDescription,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'PATCH',
        body: JSON.stringify({ description: maxDescription }),
      })

      // Act
      const response = await PATCH(request, { params: { id: mockRepoId } })

      // Assert
      expect(response.status).toBe(200)
    })

    it('should convert empty string description to null', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
      } as any)

      vi.mocked(prisma.repository.update).mockResolvedValueOnce({
        id: mockRepoId,
        description: null,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'PATCH',
        body: JSON.stringify({ description: '' }),
      })

      // Act
      const response = await PATCH(request, { params: { id: mockRepoId } })

      // Assert
      expect(response.status).toBe(200)
      expect(prisma.repository.update).toHaveBeenCalledWith({
        where: { id: mockRepoId },
        data: { description: null },
      })
    })
  })

  describe('Screenshot URL Validation', () => {
    it('should accept valid screenshot URL', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
      } as any)

      vi.mocked(prisma.repository.update).mockResolvedValueOnce({
        id: mockRepoId,
        screenshotUrl: 'https://i.imgur.com/example.png',
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'PATCH',
        body: JSON.stringify({ screenshotUrl: 'https://i.imgur.com/example.png' }),
      })

      // Act
      const response = await PATCH(request, { params: { id: mockRepoId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.screenshotUrl).toBe('https://i.imgur.com/example.png')
    })

    it('should accept null screenshot URL', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
      } as any)

      vi.mocked(prisma.repository.update).mockResolvedValueOnce({
        id: mockRepoId,
        screenshotUrl: null,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'PATCH',
        body: JSON.stringify({ screenshotUrl: null }),
      })

      // Act
      const response = await PATCH(request, { params: { id: mockRepoId } })

      // Assert
      expect(response.status).toBe(200)
    })

    it('should reject invalid screenshot URL', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'PATCH',
        body: JSON.stringify({ screenshotUrl: 'not-a-valid-url' }),
      })

      // Act
      const response = await PATCH(request, { params: { id: mockRepoId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid input')
    })

    it('should reject empty string screenshot URL', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'PATCH',
        body: JSON.stringify({ screenshotUrl: '' }),
      })

      // Act
      const response = await PATCH(request, { params: { id: mockRepoId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid input')
      expect(prisma.repository.update).not.toHaveBeenCalled()
    })
  })

  describe('Deployed URL Validation', () => {
    it('should accept valid deployed URL', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
      } as any)

      vi.mocked(prisma.repository.update).mockResolvedValueOnce({
        id: mockRepoId,
        deployedUrl: 'https://myapp.vercel.app',
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'PATCH',
        body: JSON.stringify({ deployedUrl: 'https://myapp.vercel.app' }),
      })

      // Act
      const response = await PATCH(request, { params: { id: mockRepoId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.deployedUrl).toBe('https://myapp.vercel.app')
    })

    it('should accept null deployed URL', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
      } as any)

      vi.mocked(prisma.repository.update).mockResolvedValueOnce({
        id: mockRepoId,
        deployedUrl: null,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'PATCH',
        body: JSON.stringify({ deployedUrl: null }),
      })

      // Act
      const response = await PATCH(request, { params: { id: mockRepoId } })

      // Assert
      expect(response.status).toBe(200)
    })

    it('should reject invalid deployed URL', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'PATCH',
        body: JSON.stringify({ deployedUrl: 'invalid-url' }),
      })

      // Act
      const response = await PATCH(request, { params: { id: mockRepoId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid input')
    })
  })

  describe('Collaboration Fields', () => {
    it('should update collaboration types and set role to SEEKER', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
      } as any)

      vi.mocked(prisma.repository.update).mockResolvedValueOnce({
        id: mockRepoId,
        collaborationTypes: ['CODE_REVIEW', 'MENTORSHIP'],
        collaborationRole: 'SEEKER',
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'PATCH',
        body: JSON.stringify({
          collaborationTypes: ['CODE_REVIEW', 'MENTORSHIP'],
        }),
      })

      // Act
      const response = await PATCH(request, { params: { id: mockRepoId } })

      // Assert
      expect(response.status).toBe(200)
      expect(prisma.repository.update).toHaveBeenCalledWith({
        where: { id: mockRepoId },
        data: {
          collaborationTypes: ['CODE_REVIEW', 'MENTORSHIP'],
          collaborationRole: 'SEEKER',
        },
      })
    })

    it('should clear role when collaboration types array is empty', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
      } as any)

      vi.mocked(prisma.repository.update).mockResolvedValueOnce({
        id: mockRepoId,
        collaborationTypes: [],
        collaborationRole: null,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'PATCH',
        body: JSON.stringify({
          collaborationTypes: [],
        }),
      })

      // Act
      const response = await PATCH(request, { params: { id: mockRepoId } })

      // Assert
      expect(response.status).toBe(200)
      expect(prisma.repository.update).toHaveBeenCalledWith({
        where: { id: mockRepoId },
        data: {
          collaborationTypes: [],
          collaborationRole: null,
        },
      })
    })

    it('should update collaboration details', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
      } as any)

      vi.mocked(prisma.repository.update).mockResolvedValueOnce({
        id: mockRepoId,
        collaborationDetails: 'Looking for help with React hooks',
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'PATCH',
        body: JSON.stringify({
          collaborationDetails: 'Looking for help with React hooks',
        }),
      })

      // Act
      const response = await PATCH(request, { params: { id: mockRepoId } })

      // Assert
      expect(response.status).toBe(200)
    })

    it('should update isAcceptingCollaborators flag', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
      } as any)

      vi.mocked(prisma.repository.update).mockResolvedValueOnce({
        id: mockRepoId,
        isAcceptingCollaborators: true,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'PATCH',
        body: JSON.stringify({
          isAcceptingCollaborators: true,
        }),
      })

      // Act
      const response = await PATCH(request, { params: { id: mockRepoId } })

      // Assert
      expect(response.status).toBe(200)
    })

    it('should reject invalid collaboration type', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'PATCH',
        body: JSON.stringify({
          collaborationTypes: ['INVALID_TYPE'],
        }),
      })

      // Act
      const response = await PATCH(request, { params: { id: mockRepoId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid input')
    })
  })

  describe('Multiple Fields Update', () => {
    it('should update multiple fields at once', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
        githubId: null,
      } as any)

      vi.mocked(prisma.repository.update).mockResolvedValueOnce({
        id: mockRepoId,
        title: 'Updated Title',
        description: 'Updated description',
        screenshotUrl: 'https://example.com/new-screenshot.png',
        deployedUrl: 'https://myapp.com',
        collaborationTypes: ['CODE_REVIEW'],
        collaborationDetails: 'Need help',
        isAcceptingCollaborators: true,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'PATCH',
        body: JSON.stringify({
          title: 'Updated Title',
          description: 'Updated description',
          screenshotUrl: 'https://example.com/new-screenshot.png',
          deployedUrl: 'https://myapp.com',
          collaborationTypes: ['CODE_REVIEW'],
          collaborationDetails: 'Need help',
          isAcceptingCollaborators: true,
        }),
      })

      // Act
      const response = await PATCH(request, { params: { id: mockRepoId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.title).toBe('Updated Title')
      expect(data.description).toBe('Updated description')
      expect(data.screenshotUrl).toBe('https://example.com/new-screenshot.png')
      expect(data.deployedUrl).toBe('https://myapp.com')
    })

    it('should update only provided fields', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
      } as any)

      vi.mocked(prisma.repository.update).mockResolvedValueOnce({
        id: mockRepoId,
        description: 'Only description changed',
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'PATCH',
        body: JSON.stringify({
          description: 'Only description changed',
        }),
      })

      // Act
      const response = await PATCH(request, { params: { id: mockRepoId } })

      // Assert
      expect(response.status).toBe(200)
      expect(prisma.repository.update).toHaveBeenCalledWith({
        where: { id: mockRepoId },
        data: {
          description: 'Only description changed',
        },
      })
    })
  })

  describe('Error Handling', () => {
    it('should return error for invalid JSON body', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'PATCH',
        body: 'invalid json',
      })

      // Act
      const response = await PATCH(request, { params: { id: mockRepoId } })
      const data = await response.json()

      // Assert
      // Invalid JSON should cause an error (either 400 or 500 depending on where it fails)
      expect(response.status).toBeGreaterThanOrEqual(400)
      expect(data.error).toBeDefined()
    })

    it('should return 500 when database error occurs', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
      } as any)

      const dbError = new Error('Database connection failed')
      vi.mocked(prisma.repository.update).mockRejectedValueOnce(dbError)

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'PATCH',
        body: JSON.stringify({ description: 'Test' }),
      })

      // Act
      const response = await PATCH(request, { params: { id: mockRepoId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update repository')
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating repository:', dbError)

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty request body', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
      } as any)

      vi.mocked(prisma.repository.update).mockResolvedValueOnce({
        id: mockRepoId,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'PATCH',
        body: JSON.stringify({}),
      })

      // Act
      const response = await PATCH(request, { params: { id: mockRepoId } })

      // Assert
      expect(response.status).toBe(200)
      // Should not update anything but still succeed
      expect(prisma.repository.update).toHaveBeenCalledWith({
        where: { id: mockRepoId },
        data: {},
      })
    })

    it('should handle special characters in fields', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
        githubId: null,
      } as any)

      const specialTitle = 'My Project! @#$% & (Special) <Chars>'
      vi.mocked(prisma.repository.update).mockResolvedValueOnce({
        id: mockRepoId,
        title: specialTitle,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'PATCH',
        body: JSON.stringify({ title: specialTitle }),
      })

      // Act
      const response = await PATCH(request, { params: { id: mockRepoId } })

      // Assert
      expect(response.status).toBe(200)
    })

    it('should handle Unicode characters in title and description', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
        githubId: null,
      } as any)

      const unicodeTitle = '我的项目 🚀 Проект'
      vi.mocked(prisma.repository.update).mockResolvedValueOnce({
        id: mockRepoId,
        title: unicodeTitle,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'PATCH',
        body: JSON.stringify({ title: unicodeTitle }),
      })

      // Act
      const response = await PATCH(request, { params: { id: mockRepoId } })

      // Assert
      expect(response.status).toBe(200)
    })
  })
})

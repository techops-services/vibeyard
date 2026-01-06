import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { DELETE, PATCH, GET } from './route'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Mock dependencies
vi.mock('@/lib/auth')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    repository: {
      findUnique: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    repositoryView: {
      create: vi.fn(),
    },
    vote: {
      deleteMany: vi.fn(),
    },
    follow: {
      deleteMany: vi.fn(),
    },
    comment: {
      deleteMany: vi.fn(),
    },
    repositoryAnalysis: {
      delete: vi.fn(),
    },
  },
}))

describe('DELETE /api/repositories/[id]', () => {
  const mockUserId = 'user-123'
  const mockOtherUserId = 'user-456'
  const mockRepoId = 'repo-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'DELETE',
      })

      // Act
      const response = await DELETE(request, { params: { id: mockRepoId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Unauthorized' })
      expect(prisma.repository.findUnique).not.toHaveBeenCalled()
      expect(prisma.repository.delete).not.toHaveBeenCalled()
    })

    it('should return 401 when session exists but has no user ID', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: {},
        expires: new Date().toISOString(),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'DELETE',
      })

      // Act
      const response = await DELETE(request, { params: { id: mockRepoId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data).toEqual({ error: 'Unauthorized' })
    })
  })

  describe('Repository Existence', () => {
    it('should return 404 when repository does not exist', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'DELETE',
      })

      // Act
      const response = await DELETE(request, { params: { id: mockRepoId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Repository not found' })
      expect(prisma.repository.findUnique).toHaveBeenCalledWith({
        where: { id: mockRepoId },
        select: { userId: true },
      })
      expect(prisma.repository.delete).not.toHaveBeenCalled()
    })

    it('should return 404 for non-existent repository ID format', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/repositories/invalid-id-123', {
        method: 'DELETE',
      })

      // Act
      const response = await DELETE(request, { params: { id: 'invalid-id-123' } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Repository not found' })
    })
  })

  describe('Authorization', () => {
    it('should return 403 when user tries to delete repository owned by another user', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockOtherUserId, // Different user owns this repo
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'DELETE',
      })

      // Act
      const response = await DELETE(request, { params: { id: mockRepoId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(403)
      expect(data).toEqual({ error: 'Forbidden' })
      expect(prisma.repository.findUnique).toHaveBeenCalledWith({
        where: { id: mockRepoId },
        select: { userId: true },
      })
      expect(prisma.repository.delete).not.toHaveBeenCalled()
    })

    it('should not allow deletion when userId is null', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: null,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'DELETE',
      })

      // Act
      const response = await DELETE(request, { params: { id: mockRepoId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(403)
      expect(data).toEqual({ error: 'Forbidden' })
    })
  })

  describe('Successful Deletion', () => {
    it('should successfully delete own repository and return 200', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId, // Same user owns this repo
      } as any)

      vi.mocked(prisma.repository.delete).mockResolvedValueOnce({
        id: mockRepoId,
        userId: mockUserId,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'DELETE',
      })

      // Act
      const response = await DELETE(request, { params: { id: mockRepoId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toEqual({ success: true })
      expect(prisma.repository.delete).toHaveBeenCalledWith({
        where: { id: mockRepoId },
      })
    })

    it('should successfully delete repository with different repo ID format', async () => {
      // Arrange
      const customRepoId = 'cuid-xyz789'
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
      } as any)

      vi.mocked(prisma.repository.delete).mockResolvedValueOnce({
        id: customRepoId,
        userId: mockUserId,
      } as any)

      const request = new NextRequest(`http://localhost:3000/api/repositories/${customRepoId}`, {
        method: 'DELETE',
      })

      // Act
      const response = await DELETE(request, { params: { id: customRepoId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toEqual({ success: true })
      expect(prisma.repository.delete).toHaveBeenCalledWith({
        where: { id: customRepoId },
      })
    })
  })

  describe('Cascade Deletion', () => {
    it('should rely on database cascade to delete related data', async () => {
      // Arrange
      // According to the Prisma schema, the following relationships have onDelete: Cascade:
      // - RepositoryAnalysis
      // - Vote
      // - Follow
      // - RepositoryView
      // - Activity
      // - CollaborationRequest (both as target and requestor repo)
      // - ImprovementSuggestion
      // - Comment (and nested CommentVote)
      // - Notification (onDelete: SetNull but should be handled)

      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
      } as any)

      vi.mocked(prisma.repository.delete).mockResolvedValueOnce({
        id: mockRepoId,
        userId: mockUserId,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'DELETE',
      })

      // Act
      const response = await DELETE(request, { params: { id: mockRepoId } })

      // Assert
      expect(response.status).toBe(200)

      // Verify that we're calling delete on the repository itself
      // The database cascades will handle the related data automatically
      expect(prisma.repository.delete).toHaveBeenCalledWith({
        where: { id: mockRepoId },
      })

      // We should NOT be calling deleteMany on related tables - cascades handle this
      expect(prisma.vote.deleteMany).not.toHaveBeenCalled()
      expect(prisma.follow.deleteMany).not.toHaveBeenCalled()
      expect(prisma.comment.deleteMany).not.toHaveBeenCalled()
    })

    it('should successfully delete repository with complex related data', async () => {
      // Arrange
      // This test verifies that even with a complex web of relationships,
      // a simple delete call works (relying on DB cascades)
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      // Repository with many related records (just in metadata for context)
      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
        // In reality, this would have:
        // - Multiple votes
        // - Multiple follows
        // - Multiple comments with nested replies
        // - Analysis data
        // - Collaboration requests
        // - Views
        // - Activities
        // - Improvement suggestions
      } as any)

      vi.mocked(prisma.repository.delete).mockResolvedValueOnce({
        id: mockRepoId,
        userId: mockUserId,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'DELETE',
      })

      // Act
      const response = await DELETE(request, { params: { id: mockRepoId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toEqual({ success: true })
    })
  })

  describe('Error Handling', () => {
    it('should return 500 when database error occurs during findUnique', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      const dbError = new Error('Database connection failed')
      vi.mocked(prisma.repository.findUnique).mockRejectedValueOnce(dbError)

      // Spy on console.error to verify error logging
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'DELETE',
      })

      // Act
      const response = await DELETE(request, { params: { id: mockRepoId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to delete repository' })
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error deleting repository:', dbError)

      // Cleanup
      consoleErrorSpy.mockRestore()
    })

    it('should return 500 when database error occurs during delete', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
      } as any)

      const deleteError = new Error('Foreign key constraint violation')
      vi.mocked(prisma.repository.delete).mockRejectedValueOnce(deleteError)

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'DELETE',
      })

      // Act
      const response = await DELETE(request, { params: { id: mockRepoId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to delete repository' })
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error deleting repository:', deleteError)

      consoleErrorSpy.mockRestore()
    })

    it('should handle unexpected auth errors gracefully', async () => {
      // Arrange
      const authError = new Error('Auth service unavailable')
      vi.mocked(auth).mockRejectedValueOnce(authError)

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'DELETE',
      })

      // Act
      const response = await DELETE(request, { params: { id: mockRepoId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data).toEqual({ error: 'Failed to delete repository' })
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error deleting repository:', authError)

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty repository ID parameter', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/repositories/', {
        method: 'DELETE',
      })

      // Act
      const response = await DELETE(request, { params: { id: '' } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Repository not found' })
    })

    it('should handle very long repository ID gracefully', async () => {
      // Arrange
      const longId = 'a'.repeat(500)
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce(null)

      const request = new NextRequest(`http://localhost:3000/api/repositories/${longId}`, {
        method: 'DELETE',
      })

      // Act
      const response = await DELETE(request, { params: { id: longId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Repository not found' })
    })

    it('should handle special characters in repository ID', async () => {
      // Arrange
      const specialId = 'repo-@#$%^&*()'
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce(null)

      const request = new NextRequest(`http://localhost:3000/api/repositories/${specialId}`, {
        method: 'DELETE',
      })

      // Act
      const response = await DELETE(request, { params: { id: specialId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data).toEqual({ error: 'Repository not found' })
    })

    it('should verify ownership check is performed before deletion', async () => {
      // Arrange - Ensure ownership check happens BEFORE delete attempt
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      // First call for ownership check
      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockOtherUserId,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'DELETE',
      })

      // Act
      const response = await DELETE(request, { params: { id: mockRepoId } })

      // Assert
      expect(response.status).toBe(403)

      // Verify findUnique was called but delete was NOT
      expect(prisma.repository.findUnique).toHaveBeenCalledTimes(1)
      expect(prisma.repository.delete).not.toHaveBeenCalled()
    })
  })

  describe('Integration with Schema', () => {
    it('should work with repository that has all optional fields set', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      // Repository with all fields populated
      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
        title: 'Custom Vibe',
        githubId: 12345,
        name: 'awesome-repo',
        fullName: 'user/awesome-repo',
        description: 'An awesome repository',
        owner: 'user',
        deployedUrl: 'https://example.com',
        collaborationRole: 'SEEKER',
        collaborationTypes: ['CODE_REVIEW', 'MENTORSHIP'],
        collaborationDetails: 'Looking for help with React',
        isAcceptingCollaborators: true,
      } as any)

      vi.mocked(prisma.repository.delete).mockResolvedValueOnce({
        id: mockRepoId,
        userId: mockUserId,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'DELETE',
      })

      // Act
      const response = await DELETE(request, { params: { id: mockRepoId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toEqual({ success: true })
    })

    it('should work with minimal repository (non-GitHub vibe)', async () => {
      // Arrange
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      // Minimal repository with only required fields
      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
        title: 'My Custom Vibe',
        githubId: null,
        name: null,
        deployedUrl: null,
      } as any)

      vi.mocked(prisma.repository.delete).mockResolvedValueOnce({
        id: mockRepoId,
        userId: mockUserId,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'DELETE',
      })

      // Act
      const response = await DELETE(request, { params: { id: mockRepoId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toEqual({ success: true })
    })
  })

  describe('Request Validation', () => {
    it('should process DELETE request regardless of request body', async () => {
      // Arrange - DELETE requests typically don't have bodies, but should handle if present
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      vi.mocked(prisma.repository.findUnique).mockResolvedValueOnce({
        userId: mockUserId,
      } as any)

      vi.mocked(prisma.repository.delete).mockResolvedValueOnce({
        id: mockRepoId,
        userId: mockUserId,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'DELETE',
        body: JSON.stringify({ someData: 'ignored' }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Act
      const response = await DELETE(request, { params: { id: mockRepoId } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toEqual({ success: true })
    })

    it('should handle concurrent delete attempts on same repository', async () => {
      // Arrange - Simulating race condition where two requests try to delete same repo
      vi.mocked(auth).mockResolvedValue({
        user: { id: mockUserId },
        expires: new Date().toISOString(),
      } as any)

      // First request succeeds
      vi.mocked(prisma.repository.findUnique)
        .mockResolvedValueOnce({ userId: mockUserId } as any)

      vi.mocked(prisma.repository.delete)
        .mockResolvedValueOnce({ id: mockRepoId, userId: mockUserId } as any)

      const request1 = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'DELETE',
      })

      // Act - First request
      const response1 = await DELETE(request1, { params: { id: mockRepoId } })
      const data1 = await response1.json()

      // Assert - First request succeeds
      expect(response1.status).toBe(200)
      expect(data1).toEqual({ success: true })

      // Second request would find repository already deleted
      vi.mocked(prisma.repository.findUnique)
        .mockResolvedValueOnce(null)

      const request2 = new NextRequest('http://localhost:3000/api/repositories/repo-123', {
        method: 'DELETE',
      })

      // Act - Second request
      const response2 = await DELETE(request2, { params: { id: mockRepoId } })
      const data2 = await response2.json()

      // Assert - Second request gets 404
      expect(response2.status).toBe(404)
      expect(data2).toEqual({ error: 'Repository not found' })
    })
  })
})

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from '../route'
import { prisma } from '@/lib/prisma'

// Mock the prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    repository: {
      findMany: vi.fn(),
    },
  },
}))

describe('RSS Feed Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return valid RSS 2.0 XML', async () => {
    // Mock repository data
    const mockRepos = [
      {
        id: 'repo-1',
        name: 'test-repo',
        owner: 'testuser',
        description: 'A test repository',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        user: {
          githubUsername: 'testuser',
        },
        analysis: {
          aiProvider: 'claude',
        },
      },
      {
        id: 'repo-2',
        name: 'another-repo',
        owner: 'anotheruser',
        description: 'Another test repository',
        createdAt: new Date('2024-01-02T00:00:00Z'),
        user: {
          githubUsername: 'anotheruser',
        },
        analysis: null,
      },
    ]

    ;(prisma.repository.findMany as any).mockResolvedValue(mockRepos)

    const response = await GET()
    expect(response.status).toBe(200)

    const xml = await response.text()

    // Verify XML structure
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain('<rss version="2.0"')
    expect(xml).toContain('xmlns:atom="http://www.w3.org/2005/Atom"')
    expect(xml).toContain('<channel>')
    expect(xml).toContain('<title>Vibeyard - Latest Repositories</title>')
    expect(xml).toContain(
      '<description>A junkyard for vibecode with potential. Discover AI-assisted code projects.</description>'
    )

    // Verify items
    expect(xml).toContain('<item>')
    expect(xml).toContain('<title>test-repo by testuser</title>')
    expect(xml).toContain('<description>A test repository</description>')
    expect(xml).toContain('<guid isPermaLink="true">')
    expect(xml).toContain('<pubDate>')
    expect(xml).toContain('<category>claude</category>')

    // Verify second item without category
    expect(xml).toContain('<title>another-repo by anotheruser</title>')
    expect(xml).toContain('<description>Another test repository</description>')
  })

  it('should handle empty repository list', async () => {
    ;(prisma.repository.findMany as jest.Mock).mockResolvedValue([])

    const response = await GET()
    expect(response.status).toBe(200)

    const xml = await response.text()
    expect(xml).toContain('<channel>')
    expect(xml).not.toContain('<item>')
  })

  it('should escape XML special characters', async () => {
    const mockRepos = [
      {
        id: 'repo-1',
        name: 'test&repo<>',
        owner: 'user"name',
        description: "A repo with <special> chars & quotes'",
        createdAt: new Date('2024-01-01T00:00:00Z'),
        user: {
          githubUsername: 'user"name',
        },
        analysis: null,
      },
    ]

    ;(prisma.repository.findMany as any).mockResolvedValue(mockRepos)

    const response = await GET()
    const xml = await response.text()

    // Verify special characters are escaped
    expect(xml).toContain('&amp;')
    expect(xml).toContain('&lt;')
    expect(xml).toContain('&gt;')
    expect(xml).toContain('&quot;')
    expect(xml).toContain('&apos;')
  })

  it('should set correct headers', async () => {
    ;(prisma.repository.findMany as jest.Mock).mockResolvedValue([])

    const response = await GET()

    expect(response.headers.get('Content-Type')).toBe('application/xml')
    expect(response.headers.get('Cache-Control')).toContain('public')
    expect(response.headers.get('Cache-Control')).toContain('s-maxage=900')
  })

  it('should query only public repositories', async () => {
    ;(prisma.repository.findMany as jest.Mock).mockResolvedValue([])

    await GET()

    expect(prisma.repository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isPrivate: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
      })
    )
  })

  it('should handle database errors gracefully', async () => {
    ;(prisma.repository.findMany as jest.Mock).mockRejectedValue(
      new Error('Database error')
    )

    const response = await GET()

    expect(response.status).toBe(500)
    const text = await response.text()
    expect(text).toContain('Error generating RSS feed')
  })
})

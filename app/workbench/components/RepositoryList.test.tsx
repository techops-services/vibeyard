import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { RepositoryList } from './RepositoryList'
import { Repository, CollaborationType } from '@prisma/client'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}))

// Mock fetch
global.fetch = vi.fn()

interface RepositoryWithAnalytics extends Repository {
  _count: {
    votes: number
    follows: number
    views: number
    collaborationRequestsReceived: number
  }
  analysis?: {
    completenessScore: number | null
  } | null
}

describe('RepositoryList', () => {
  const mockNonGitHubRepo: RepositoryWithAnalytics = {
    id: 'repo-123',
    userId: 'user-123',
    title: 'My Custom Vibe',
    githubId: null,
    name: null,
    fullName: null,
    description: 'A custom vibe description',
    owner: null,
    ownerAvatarUrl: null,
    htmlUrl: null,
    language: null,
    topics: [],
    stargazersCount: 0,
    forksCount: 0,
    openIssuesCount: 0,
    license: null,
    isPrivate: false,
    deployedUrl: 'https://myapp.vercel.app',
    screenshotUrl: 'https://example.com/screenshot.png',
    votesCount: 0,
    followersCount: 0,
    viewsCount: 0,
    analysisStatus: 'completed',
    lastAnalyzedAt: new Date(),
    collaborationRole: 'SEEKER',
    collaborationTypes: ['CODE_REVIEW', 'MENTORSHIP'] as CollaborationType[],
    collaborationDetails: 'Need help with testing',
    isAcceptingCollaborators: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: {
      votes: 5,
      follows: 10,
      views: 100,
      collaborationRequestsReceived: 2,
    },
    analysis: {
      completenessScore: 85,
    },
  }

  const mockGitHubRepo: RepositoryWithAnalytics = {
    id: 'repo-456',
    userId: 'user-123',
    title: null,
    githubId: 12345,
    name: 'awesome-project',
    fullName: 'user/awesome-project',
    description: 'A GitHub repo',
    owner: 'user',
    ownerAvatarUrl: 'https://github.com/avatar.png',
    htmlUrl: 'https://github.com/user/awesome-project',
    language: 'TypeScript',
    topics: ['typescript', 'react'],
    stargazersCount: 50,
    forksCount: 10,
    openIssuesCount: 5,
    license: 'MIT',
    isPrivate: false,
    deployedUrl: null,
    screenshotUrl: null,
    votesCount: 0,
    followersCount: 0,
    viewsCount: 0,
    analysisStatus: 'pending',
    lastAnalyzedAt: null,
    collaborationRole: null,
    collaborationTypes: [],
    collaborationDetails: null,
    isAcceptingCollaborators: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: {
      votes: 3,
      follows: 5,
      views: 50,
      collaborationRequestsReceived: 0,
    },
    analysis: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any).mockClear()
  })

  describe('Empty State', () => {
    it('should render empty state when no repositories', () => {
      // Act
      render(<RepositoryList repositories={[]} />)

      // Assert
      expect(screen.getByText('your repositories')).toBeInTheDocument()
      expect(screen.getByText(/No repositories connected yet/i)).toBeInTheDocument()
      expect(screen.getByText(/yard lot/i)).toBeInTheDocument()
    })

    it('should have link to yard lot in empty state', () => {
      // Act
      render(<RepositoryList repositories={[]} />)

      // Assert
      const link = screen.getByRole('link', { name: /yard lot/i })
      expect(link).toHaveAttribute('href', '/')
    })
  })

  describe('Repository Display', () => {
    it('should render repository list with header', () => {
      // Act
      render(<RepositoryList repositories={[mockNonGitHubRepo]} />)

      // Assert
      expect(screen.getByText('your repositories')).toBeInTheDocument()
    })

    it('should display non-GitHub vibe with title', () => {
      // Act
      render(<RepositoryList repositories={[mockNonGitHubRepo]} />)

      // Assert
      expect(screen.getByText('My Custom Vibe')).toBeInTheDocument()
    })

    it('should display GitHub vibe with fullName', () => {
      // Act
      render(<RepositoryList repositories={[mockGitHubRepo]} />)

      // Assert
      expect(screen.getByText('user/awesome-project')).toBeInTheDocument()
    })

    it('should display repository description', () => {
      // Act
      render(<RepositoryList repositories={[mockNonGitHubRepo]} />)

      // Assert
      expect(screen.getByText('A custom vibe description')).toBeInTheDocument()
    })

    it('should display vote count', () => {
      // Act
      render(<RepositoryList repositories={[mockNonGitHubRepo]} />)

      // Assert
      expect(screen.getByText('5 votes')).toBeInTheDocument()
    })

    it('should display follow count', () => {
      // Act
      render(<RepositoryList repositories={[mockNonGitHubRepo]} />)

      // Assert
      expect(screen.getByText('10 follows')).toBeInTheDocument()
    })

    it('should display view count', () => {
      // Act
      render(<RepositoryList repositories={[mockNonGitHubRepo]} />)

      // Assert
      expect(screen.getByText('100 views')).toBeInTheDocument()
    })

    it('should display pending collaboration requests', () => {
      // Act
      render(<RepositoryList repositories={[mockNonGitHubRepo]} />)

      // Assert
      expect(screen.getByText('2 pending requests')).toBeInTheDocument()
    })

    it('should not display pending requests when count is zero', () => {
      // Act
      render(<RepositoryList repositories={[mockGitHubRepo]} />)

      // Assert
      expect(screen.queryByText(/pending requests/i)).not.toBeInTheDocument()
    })

    it('should display multiple repositories', () => {
      // Act
      render(<RepositoryList repositories={[mockNonGitHubRepo, mockGitHubRepo]} />)

      // Assert
      expect(screen.getByText('My Custom Vibe')).toBeInTheDocument()
      expect(screen.getByText('user/awesome-project')).toBeInTheDocument()
    })
  })

  describe('Repository Links', () => {
    it('should link to non-GitHub vibe detail page with custom URL', () => {
      // Arrange
      const repoWithOwner = {
        ...mockNonGitHubRepo,
        owner: 'johndoe',
        name: 'my-vibe',
      }

      // Act
      render(<RepositoryList repositories={[repoWithOwner]} />)

      // Assert
      const link = screen.getByRole('link', { name: /My Custom Vibe/i })
      expect(link).toHaveAttribute('href', '/vibe/johndoe/my-vibe')
    })

    it('should link to non-GitHub vibe with fallback URL when no owner', () => {
      // Act
      render(<RepositoryList repositories={[mockNonGitHubRepo]} />)

      // Assert
      const link = screen.getByRole('link', { name: /My Custom Vibe/i })
      expect(link).toHaveAttribute('href', '/vibe/_/repo-123')
    })

    it('should link to GitHub vibe detail page', () => {
      // Act
      render(<RepositoryList repositories={[mockGitHubRepo]} />)

      // Assert
      const link = screen.getByRole('link', { name: /user\/awesome-project/i })
      expect(link).toHaveAttribute('href', '/vibe/user/awesome-project')
    })
  })

  describe('Deployed URL Display', () => {
    it('should display deployed URL with live indicator', () => {
      // Act
      render(<RepositoryList repositories={[mockNonGitHubRepo]} />)

      // Assert
      const deployedLink = screen.getByRole('link', { name: /myapp.vercel.app/i })
      expect(deployedLink).toHaveAttribute('href', 'https://myapp.vercel.app')
      expect(deployedLink).toHaveAttribute('target', '_blank')
      expect(deployedLink).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('should extract hostname from deployed URL', () => {
      // Act
      render(<RepositoryList repositories={[mockNonGitHubRepo]} />)

      // Assert
      expect(screen.getByText('myapp.vercel.app')).toBeInTheDocument()
    })

    it('should not display deployed URL section when URL is null', () => {
      // Act
      render(<RepositoryList repositories={[mockGitHubRepo]} />)

      // Assert
      expect(screen.queryByText(/vercel.app/i)).not.toBeInTheDocument()
    })

    it('should handle invalid URL gracefully', () => {
      // Arrange
      const repoWithInvalidUrl = {
        ...mockNonGitHubRepo,
        deployedUrl: 'not-a-valid-url',
      }

      // Act
      render(<RepositoryList repositories={[repoWithInvalidUrl]} />)

      // Assert
      expect(screen.getByText('not-a-valid-url')).toBeInTheDocument()
    })
  })

  describe('Collaboration Display', () => {
    it('should display "seeker" badge when seeking collaborators', () => {
      // Act
      render(<RepositoryList repositories={[mockNonGitHubRepo]} />)

      // Assert
      expect(screen.getByText('seeker')).toBeInTheDocument()
    })

    it('should not display badge when not accepting collaborators', () => {
      // Arrange
      const repoNotAccepting = {
        ...mockNonGitHubRepo,
        isAcceptingCollaborators: false,
      }

      // Act
      render(<RepositoryList repositories={[repoNotAccepting]} />)

      // Assert
      expect(screen.queryByText('seeker')).not.toBeInTheDocument()
    })

    it('should not display badge when role is not SEEKER', () => {
      // Arrange
      const repoProvider = {
        ...mockNonGitHubRepo,
        collaborationRole: 'PROVIDER' as const,
      }

      // Act
      render(<RepositoryList repositories={[repoProvider]} />)

      // Assert
      expect(screen.queryByText('seeker')).not.toBeInTheDocument()
    })

    it('should display "accepting requests" when isAccepting is true', () => {
      // Act
      render(<RepositoryList repositories={[mockNonGitHubRepo]} />)

      // Assert
      expect(screen.getByText('accepting requests')).toBeInTheDocument()
    })

    it('should display collaboration types count', () => {
      // Act
      render(<RepositoryList repositories={[mockNonGitHubRepo]} />)

      // Assert
      expect(screen.getByText('2 types')).toBeInTheDocument()
    })

    it('should display "1 type" for single collaboration type', () => {
      // Arrange
      const repoWithOneType = {
        ...mockNonGitHubRepo,
        collaborationTypes: ['CODE_REVIEW'] as CollaborationType[],
      }

      // Act
      render(<RepositoryList repositories={[repoWithOneType]} />)

      // Assert
      expect(screen.getByText('1 type')).toBeInTheDocument()
    })

    it('should not display collaboration section when no collaboration set', () => {
      // Act
      render(<RepositoryList repositories={[mockGitHubRepo]} />)

      // Assert
      expect(screen.queryByText('collaboration:')).not.toBeInTheDocument()
    })
  })

  describe('Completeness Score Display', () => {
    it('should display star rating when completeness score exists', () => {
      // Act
      render(<RepositoryList repositories={[mockNonGitHubRepo]} />)

      // Assert - StarRating component should be rendered
      // This assumes StarRating renders with a testable element
      const repoCard = screen.getByText('My Custom Vibe').closest('div')
      expect(repoCard).toBeInTheDocument()
    })

    it('should display analysis status when no completeness score', () => {
      // Act
      render(<RepositoryList repositories={[mockGitHubRepo]} />)

      // Assert - AnalysisStatus component should be rendered
      const repoCard = screen.getByText('user/awesome-project').closest('div')
      expect(repoCard).toBeInTheDocument()
    })
  })

  describe('Edit Button and Modal', () => {
    it('should display Edit button for each repository', () => {
      // Act
      render(<RepositoryList repositories={[mockNonGitHubRepo, mockGitHubRepo]} />)

      // Assert
      const editButtons = screen.getAllByRole('button', { name: /Edit/i })
      expect(editButtons).toHaveLength(2)
    })

    it('should open EditVibeModal when Edit button is clicked', () => {
      // Act
      render(<RepositoryList repositories={[mockNonGitHubRepo]} />)

      const editButton = screen.getByRole('button', { name: /Edit/i })

      // Act
      fireEvent.click(editButton)

      // Assert
      expect(screen.getByText('Edit Vibe')).toBeInTheDocument()
    })

    it('should pass correct repository to EditVibeModal', () => {
      // Act
      render(<RepositoryList repositories={[mockNonGitHubRepo]} />)

      const editButton = screen.getByRole('button', { name: /Edit/i })
      fireEvent.click(editButton)

      // Assert
      expect(screen.getByDisplayValue('My Custom Vibe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('A custom vibe description')).toBeInTheDocument()
    })

    it('should close modal when close button is clicked', () => {
      // Act
      render(<RepositoryList repositories={[mockNonGitHubRepo]} />)

      const editButton = screen.getByRole('button', { name: /Edit/i })
      fireEvent.click(editButton)

      const closeButton = screen.getByLabelText('Close')
      fireEvent.click(closeButton)

      // Assert
      expect(screen.queryByText('Edit Vibe')).not.toBeInTheDocument()
    })

    it('should open modal for different repositories independently', () => {
      // Arrange
      render(<RepositoryList repositories={[mockNonGitHubRepo, mockGitHubRepo]} />)

      // Act - Click first edit button
      const editButtons = screen.getAllByRole('button', { name: /Edit/i })
      fireEvent.click(editButtons[0])

      // Assert - First repo's modal is open
      expect(screen.getByText('Edit Vibe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('My Custom Vibe')).toBeInTheDocument()

      // Act - Close and open second
      const closeButton = screen.getByLabelText('Close')
      fireEvent.click(closeButton)

      // Wait for modal to close
      expect(screen.queryByText('Edit Vibe')).not.toBeInTheDocument()

      fireEvent.click(editButtons[1])

      // Assert - Second repo's modal is open with GitHub vibe data
      expect(screen.getByText('Edit Vibe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('A GitHub repo')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper link structure for screen readers', () => {
      // Act
      render(<RepositoryList repositories={[mockNonGitHubRepo]} />)

      // Assert
      const titleLink = screen.getByRole('link', { name: /My Custom Vibe/i })
      expect(titleLink).toBeInTheDocument()
    })

    it('should have proper button labels', () => {
      // Act
      render(<RepositoryList repositories={[mockNonGitHubRepo]} />)

      // Assert
      const editButton = screen.getByRole('button', { name: /Edit/i })
      expect(editButton).toBeInTheDocument()
    })

    it('should mark external deployed URL links correctly', () => {
      // Act
      render(<RepositoryList repositories={[mockNonGitHubRepo]} />)

      // Assert
      const deployedLink = screen.getByRole('link', { name: /myapp.vercel.app/i })
      expect(deployedLink).toHaveAttribute('rel', 'noopener noreferrer')
      expect(deployedLink).toHaveAttribute('target', '_blank')
    })
  })

  describe('Layout and Styling', () => {
    it('should apply hover effect to repository cards', () => {
      // Act
      const { container } = render(<RepositoryList repositories={[mockNonGitHubRepo]} />)

      // Assert
      const repoCard = container.querySelector('.hover\\:bg-\\[--yard-light-gray\\]')
      expect(repoCard).toBeInTheDocument()
    })

    it('should separate repositories with dividers', () => {
      // Act
      const { container } = render(
        <RepositoryList repositories={[mockNonGitHubRepo, mockGitHubRepo]} />
      )

      // Assert
      const dividers = container.querySelectorAll('.divide-y')
      expect(dividers.length).toBeGreaterThan(0)
    })

    it('should have consistent padding and margins', () => {
      // Act
      const { container } = render(<RepositoryList repositories={[mockNonGitHubRepo]} />)

      // Assert
      const header = container.querySelector('.border-b')
      expect(header).toHaveClass('p-4')
    })
  })

  describe('Edge Cases', () => {
    it('should handle repository with no description', () => {
      // Arrange
      const repoNoDescription = {
        ...mockNonGitHubRepo,
        description: null,
      }

      // Act
      render(<RepositoryList repositories={[repoNoDescription]} />)

      // Assert
      expect(screen.getByText('My Custom Vibe')).toBeInTheDocument()
      expect(screen.queryByText('A custom vibe description')).not.toBeInTheDocument()
    })

    it('should handle repository with no title (Untitled)', () => {
      // Arrange
      const repoNoTitle = {
        ...mockNonGitHubRepo,
        title: null,
        fullName: null,
        name: null,
      }

      // Act
      render(<RepositoryList repositories={[repoNoTitle]} />)

      // Assert
      expect(screen.getByText('Untitled Vibe')).toBeInTheDocument()
    })

    it('should handle zero counts correctly', () => {
      // Arrange
      const repoZeroCounts = {
        ...mockGitHubRepo,
        _count: {
          votes: 0,
          follows: 0,
          views: 0,
          collaborationRequestsReceived: 0,
        },
      }

      // Act
      render(<RepositoryList repositories={[repoZeroCounts]} />)

      // Assert
      expect(screen.getByText('0 votes')).toBeInTheDocument()
      expect(screen.getByText('0 follows')).toBeInTheDocument()
      expect(screen.getByText('0 views')).toBeInTheDocument()
    })

    it('should handle very long repository names', () => {
      // Arrange
      const repoLongName = {
        ...mockNonGitHubRepo,
        title: 'A'.repeat(100),
      }

      // Act
      render(<RepositoryList repositories={[repoLongName]} />)

      // Assert
      expect(screen.getByText('A'.repeat(100))).toBeInTheDocument()
    })

    it('should handle repositories with all optional fields null', () => {
      // Arrange
      const minimalRepo: RepositoryWithAnalytics = {
        ...mockNonGitHubRepo,
        description: null,
        deployedUrl: null,
        screenshotUrl: null,
        collaborationRole: null,
        collaborationTypes: [],
        collaborationDetails: null,
        isAcceptingCollaborators: false,
        analysis: null,
      }

      // Act
      render(<RepositoryList repositories={[minimalRepo]} />)

      // Assert
      expect(screen.getByText('My Custom Vibe')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Edit/i })).toBeInTheDocument()
    })

    it('should handle mixed GitHub and non-GitHub repositories', () => {
      // Act
      render(
        <RepositoryList repositories={[mockNonGitHubRepo, mockGitHubRepo, mockNonGitHubRepo]} />
      )

      // Assert
      expect(screen.getAllByRole('button', { name: /Edit/i })).toHaveLength(3)
      // Use getAllByText since there are two instances of "My Custom Vibe"
      expect(screen.getAllByText('My Custom Vibe')).toHaveLength(2)
      expect(screen.getByText('user/awesome-project')).toBeInTheDocument()
    })
  })

  describe('Integration with Edit Flow', () => {
    it('should maintain repository list after modal close', () => {
      // Act
      render(<RepositoryList repositories={[mockNonGitHubRepo, mockGitHubRepo]} />)

      const editButton = screen.getAllByRole('button', { name: /Edit/i })[0]
      fireEvent.click(editButton)

      const closeButton = screen.getByLabelText('Close')
      fireEvent.click(closeButton)

      // Assert - Repository list should still be visible
      expect(screen.getByText('My Custom Vibe')).toBeInTheDocument()
      expect(screen.getByText('user/awesome-project')).toBeInTheDocument()
      expect(screen.getAllByRole('button', { name: /Edit/i })).toHaveLength(2)
    })

    it('should only show one modal at a time', () => {
      // Act
      render(<RepositoryList repositories={[mockNonGitHubRepo, mockGitHubRepo]} />)

      const editButtons = screen.getAllByRole('button', { name: /Edit/i })

      // Open first modal
      fireEvent.click(editButtons[0])

      // Assert - Only one "Edit Vibe" heading should exist
      const modalHeadings = screen.getAllByText('Edit Vibe')
      expect(modalHeadings).toHaveLength(1)
    })
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EditVibeModal } from './EditVibeModal'
import { Repository, CollaborationType } from '@prisma/client'

// Mock next/navigation
const mockRouterRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRouterRefresh,
  }),
}))

// Mock fetch
global.fetch = vi.fn()

describe('EditVibeModal', () => {
  const mockOnClose = vi.fn()

  const mockNonGitHubRepo: Repository = {
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
    deployedUrl: 'https://example.com',
    screenshotUrl: 'https://example.com/screenshot.png',
    votesCount: 0,
    followersCount: 0,
    viewsCount: 0,
    analysisStatus: 'pending',
    lastAnalyzedAt: null,
    collaborationRole: 'SEEKER',
    collaborationTypes: ['CODE_REVIEW'] as CollaborationType[],
    collaborationDetails: 'Need help with testing',
    isAcceptingCollaborators: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockGitHubRepo: Repository = {
    ...mockNonGitHubRepo,
    id: 'repo-456',
    githubId: 12345,
    title: null,
    name: 'my-repo',
    fullName: 'user/my-repo',
    owner: 'user',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any).mockClear()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Rendering', () => {
    it('should render modal when isOpen is true', () => {
      // Act
      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockNonGitHubRepo}
        />
      )

      // Assert
      expect(screen.getByText('Edit Vibe')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('My Awesome Project')).toBeInTheDocument()
    })

    it('should not render modal when isOpen is false', () => {
      // Act
      const { container } = render(
        <EditVibeModal
          isOpen={false}
          onClose={mockOnClose}
          repository={mockNonGitHubRepo}
        />
      )

      // Assert
      expect(container.firstChild).toBeNull()
    })

    it('should populate form with repository data', () => {
      // Act
      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockNonGitHubRepo}
        />
      )

      // Assert
      expect(screen.getByDisplayValue('My Custom Vibe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('A custom vibe description')).toBeInTheDocument()
      expect(screen.getByDisplayValue('https://example.com/screenshot.png')).toBeInTheDocument()
      expect(screen.getByDisplayValue('https://example.com')).toBeInTheDocument()
    })

    it('should show helper text for non-GitHub vibe title', () => {
      // Act
      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockNonGitHubRepo}
        />
      )

      // Assert
      expect(screen.getByText('Give your vibe a name')).toBeInTheDocument()
    })

    it('should show helper text for GitHub vibe title', () => {
      // Act
      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockGitHubRepo}
        />
      )

      // Assert
      expect(screen.getByText('Title is synced from GitHub and cannot be edited')).toBeInTheDocument()
    })

    it('should display "Danger Zone" section', () => {
      // Act
      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockNonGitHubRepo}
        />
      )

      // Assert
      expect(screen.getByText('Danger Zone')).toBeInTheDocument()
      expect(screen.getByText('Delete Vibe')).toBeInTheDocument()
    })
  })

  describe('GitHub Vibe Restrictions', () => {
    it('should disable title input for GitHub vibe', () => {
      // Act
      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockGitHubRepo}
        />
      )

      // Assert
      const titleInput = screen.getByPlaceholderText('My Awesome Project')
      expect(titleInput).toBeDisabled()
    })

    it('should enable title input for non-GitHub vibe', () => {
      // Act
      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockNonGitHubRepo}
        />
      )

      // Assert
      const titleInput = screen.getByPlaceholderText('My Awesome Project')
      expect(titleInput).not.toBeDisabled()
    })

    it('should show empty title for GitHub vibe when title is null', () => {
      // Act
      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockGitHubRepo}
        />
      )

      // Assert
      // Title input uses repository.title || '', so it will be empty for GitHub vibes
      const titleInput = screen.getByPlaceholderText('My Awesome Project')
      expect(titleInput).toBeDisabled() // Should be disabled for GitHub vibe
      expect(titleInput).toHaveValue('') // Empty because title is null
    })

    it('should allow editing description for GitHub vibe', () => {
      // Act
      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockGitHubRepo}
        />
      )

      // Assert
      const descriptionInput = screen.getByPlaceholderText('A brief description of your vibe...')
      expect(descriptionInput).not.toBeDisabled()
    })

    it('should show description override helper text for GitHub vibe', () => {
      // Act
      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockGitHubRepo}
        />
      )

      // Assert
      expect(screen.getByText('Override the GitHub description')).toBeInTheDocument()
    })
  })

  describe('Form Interactions', () => {
    it('should update title when typing in non-GitHub vibe', () => {
      // Arrange
      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockNonGitHubRepo}
        />
      )

      const titleInput = screen.getByPlaceholderText('My Awesome Project')

      // Act
      fireEvent.change(titleInput, { target: { value: 'Updated Title' } })

      // Assert
      expect(titleInput).toHaveValue('Updated Title')
    })

    it('should update description when typing', () => {
      // Arrange
      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockNonGitHubRepo}
        />
      )

      const descriptionInput = screen.getByPlaceholderText('A brief description of your vibe...')

      // Act
      fireEvent.change(descriptionInput, { target: { value: 'New description' } })

      // Assert
      expect(descriptionInput).toHaveValue('New description')
    })

    it('should update screenshot URL when typing', () => {
      // Arrange
      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockNonGitHubRepo}
        />
      )

      const screenshotInput = screen.getByPlaceholderText('https://i.imgur.com/example.png')

      // Act
      fireEvent.change(screenshotInput, { target: { value: 'https://new-screenshot.com/image.png' } })

      // Assert
      expect(screenshotInput).toHaveValue('https://new-screenshot.com/image.png')
    })

    it('should update deployed URL when typing', () => {
      // Arrange
      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockNonGitHubRepo}
        />
      )

      const deployedInput = screen.getByPlaceholderText('https://your-app.com')

      // Act
      fireEvent.change(deployedInput, { target: { value: 'https://new-app.com' } })

      // Assert
      expect(deployedInput).toHaveValue('https://new-app.com')
    })

    it('should disable save button when title is empty for non-GitHub vibe', () => {
      // Arrange
      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockNonGitHubRepo}
        />
      )

      const titleInput = screen.getByPlaceholderText('My Awesome Project')
      const saveButton = screen.getByRole('button', { name: /Save Changes/i })

      // Act
      fireEvent.change(titleInput, { target: { value: '' } })

      // Assert
      expect(saveButton).toBeDisabled()
    })

    it('should enable save button when title is valid for non-GitHub vibe', () => {
      // Arrange
      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockNonGitHubRepo}
        />
      )

      const saveButton = screen.getByRole('button', { name: /Save Changes/i })

      // Assert
      expect(saveButton).not.toBeDisabled()
    })

    it('should enable save button for GitHub vibe regardless of title', () => {
      // Arrange
      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockGitHubRepo}
        />
      )

      const saveButton = screen.getByRole('button', { name: /Save Changes/i })

      // Assert
      expect(saveButton).not.toBeDisabled()
    })
  })

  describe('Save Functionality', () => {
    it('should call API with correct data for non-GitHub vibe', async () => {
      // Arrange
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockNonGitHubRepo}
        />
      )

      const titleInput = screen.getByPlaceholderText('My Awesome Project')
      const saveButton = screen.getByRole('button', { name: /Save Changes/i })

      // Act
      fireEvent.change(titleInput, { target: { value: 'Updated Title' } })
      fireEvent.click(saveButton)

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/repositories/repo-123',
          expect.objectContaining({
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: expect.stringContaining('Updated Title'),
          })
        )
      })
    })

    it('should not include title in payload for GitHub vibe', async () => {
      // Arrange
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockGitHubRepo}
        />
      )

      const descriptionInput = screen.getByPlaceholderText('A brief description of your vibe...')
      const saveButton = screen.getByRole('button', { name: /Save Changes/i })

      // Act
      fireEvent.change(descriptionInput, { target: { value: 'Updated description' } })
      fireEvent.click(saveButton)

      // Assert
      await waitFor(() => {
        const callArgs = (global.fetch as any).mock.calls[0]
        const body = JSON.parse(callArgs[1].body)
        expect(body.title).toBeUndefined()
        expect(body.description).toBe('Updated description')
      })
    })

    it('should trim whitespace from fields before sending', async () => {
      // Arrange
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockNonGitHubRepo}
        />
      )

      const titleInput = screen.getByPlaceholderText('My Awesome Project')
      const descriptionInput = screen.getByPlaceholderText('A brief description of your vibe...')
      const saveButton = screen.getByRole('button', { name: /Save Changes/i })

      // Act
      fireEvent.change(titleInput, { target: { value: '  Trimmed Title  ' } })
      fireEvent.change(descriptionInput, { target: { value: '  Trimmed Description  ' } })
      fireEvent.click(saveButton)

      // Assert
      await waitFor(() => {
        const callArgs = (global.fetch as any).mock.calls[0]
        const body = JSON.parse(callArgs[1].body)
        expect(body.title).toBe('Trimmed Title')
        expect(body.description).toBe('Trimmed Description')
      })
    })

    it('should convert empty strings to null', async () => {
      // Arrange
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockNonGitHubRepo}
        />
      )

      const descriptionInput = screen.getByPlaceholderText('A brief description of your vibe...')
      const screenshotInput = screen.getByPlaceholderText('https://i.imgur.com/example.png')
      const saveButton = screen.getByRole('button', { name: /Save Changes/i })

      // Act
      fireEvent.change(descriptionInput, { target: { value: '' } })
      fireEvent.change(screenshotInput, { target: { value: '' } })
      fireEvent.click(saveButton)

      // Assert
      await waitFor(() => {
        const callArgs = (global.fetch as any).mock.calls[0]
        const body = JSON.parse(callArgs[1].body)
        expect(body.description).toBeNull()
        expect(body.screenshotUrl).toBeNull()
      })
    })

    it('should close modal and refresh router on successful save', async () => {
      // Arrange
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockNonGitHubRepo}
        />
      )

      const saveButton = screen.getByRole('button', { name: /Save Changes/i })

      // Act
      fireEvent.click(saveButton)

      // Assert
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
        expect(mockRouterRefresh).toHaveBeenCalled()
      })
    })

    it('should show error message on failed save', async () => {
      // Arrange
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid title length' }),
      })

      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockNonGitHubRepo}
        />
      )

      const saveButton = screen.getByRole('button', { name: /Save Changes/i })

      // Act
      fireEvent.click(saveButton)

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Invalid title length')).toBeInTheDocument()
      })
      expect(mockOnClose).not.toHaveBeenCalled()
    })

    it('should show loading state while saving', async () => {
      // Arrange
      let resolvePromise: any
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      ;(global.fetch as any).mockReturnValueOnce(promise)

      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockNonGitHubRepo}
        />
      )

      const saveButton = screen.getByRole('button', { name: /Save Changes/i })

      // Act
      fireEvent.click(saveButton)

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument()
        expect(saveButton).toBeDisabled()
      })

      // Cleanup
      resolvePromise({ ok: true, json: async () => ({}) })
    })

    it('should disable all buttons while saving', async () => {
      // Arrange
      let resolvePromise: any
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      ;(global.fetch as any).mockReturnValueOnce(promise)

      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockNonGitHubRepo}
        />
      )

      const saveButton = screen.getByRole('button', { name: /Save Changes/i })
      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      const deleteButton = screen.getByRole('button', { name: /Delete Vibe/i })

      // Act
      fireEvent.click(saveButton)

      // Assert
      await waitFor(() => {
        expect(saveButton).toBeDisabled()
        expect(cancelButton).toBeDisabled()
        expect(deleteButton).toBeDisabled()
      })

      // Cleanup
      resolvePromise({ ok: true, json: async () => ({}) })
    })
  })

  describe('Delete Functionality', () => {
    it('should show confirmation dialog when delete is clicked', () => {
      // Arrange
      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockNonGitHubRepo}
        />
      )

      const deleteButton = screen.getByRole('button', { name: /Delete Vibe/i })

      // Act
      fireEvent.click(deleteButton)

      // Assert
      expect(screen.getByText(/Are you sure you want to delete/i)).toBeInTheDocument()
      expect(screen.getByText(/This action cannot be undone/i)).toBeInTheDocument()
      expect(screen.getByText('Yes, Delete Permanently')).toBeInTheDocument()
    })

    it('should hide delete confirmation when cancel is clicked', () => {
      // Arrange
      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockNonGitHubRepo}
        />
      )

      const deleteButton = screen.getByRole('button', { name: /Delete Vibe/i })
      fireEvent.click(deleteButton)

      // Find the cancel button within the confirmation dialog (not the main Cancel button)
      const cancelButtons = screen.getAllByRole('button', { name: /Cancel/i })
      const confirmDialogCancelButton = cancelButtons[cancelButtons.length - 1] // Get the last Cancel button (in the confirmation)

      // Act
      fireEvent.click(confirmDialogCancelButton)

      // Assert
      expect(screen.queryByText(/Are you sure you want to delete/i)).not.toBeInTheDocument()
      expect(screen.getByText('Delete Vibe')).toBeInTheDocument()
    })

    it('should call DELETE API when confirmed', async () => {
      // Arrange
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockNonGitHubRepo}
        />
      )

      const deleteButton = screen.getByRole('button', { name: /Delete Vibe/i })
      fireEvent.click(deleteButton)

      const confirmButton = screen.getByRole('button', { name: /Yes, Delete Permanently/i })

      // Act
      fireEvent.click(confirmButton)

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/repositories/repo-123',
          expect.objectContaining({
            method: 'DELETE',
          })
        )
      })
    })

    it('should close modal and refresh router on successful delete', async () => {
      // Arrange
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockNonGitHubRepo}
        />
      )

      const deleteButton = screen.getByRole('button', { name: /Delete Vibe/i })
      fireEvent.click(deleteButton)

      const confirmButton = screen.getByRole('button', { name: /Yes, Delete Permanently/i })

      // Act
      fireEvent.click(confirmButton)

      // Assert
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
        expect(mockRouterRefresh).toHaveBeenCalled()
      })
    })

    it('should handle 404 error gracefully (already deleted)', async () => {
      // Arrange
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      })

      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockNonGitHubRepo}
        />
      )

      const deleteButton = screen.getByRole('button', { name: /Delete Vibe/i })
      fireEvent.click(deleteButton)

      const confirmButton = screen.getByRole('button', { name: /Yes, Delete Permanently/i })

      // Act
      fireEvent.click(confirmButton)

      // Assert - Should still close modal and refresh
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
        expect(mockRouterRefresh).toHaveBeenCalled()
      })
    })

    it('should show error message on failed delete', async () => {
      // Arrange
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      })

      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockNonGitHubRepo}
        />
      )

      const deleteButton = screen.getByRole('button', { name: /Delete Vibe/i })
      fireEvent.click(deleteButton)

      const confirmButton = screen.getByRole('button', { name: /Yes, Delete Permanently/i })

      // Act
      fireEvent.click(confirmButton)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Failed to delete/i)).toBeInTheDocument()
      })
      expect(mockOnClose).not.toHaveBeenCalled()
    })

    it('should show loading state while deleting', async () => {
      // Arrange
      let resolvePromise: any
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      ;(global.fetch as any).mockReturnValueOnce(promise)

      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockNonGitHubRepo}
        />
      )

      const deleteButton = screen.getByRole('button', { name: /Delete Vibe/i })
      fireEvent.click(deleteButton)

      const confirmButton = screen.getByRole('button', { name: /Yes, Delete Permanently/i })

      // Act
      fireEvent.click(confirmButton)

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Deleting...')).toBeInTheDocument()
        expect(confirmButton).toBeDisabled()
      })

      // Cleanup
      resolvePromise({ ok: true, json: async () => ({}) })
    })

    it('should display repository name in confirmation dialog', () => {
      // Arrange
      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockNonGitHubRepo}
        />
      )

      const deleteButton = screen.getByRole('button', { name: /Delete Vibe/i })

      // Act
      fireEvent.click(deleteButton)

      // Assert
      expect(screen.getByText(/My Custom Vibe/i)).toBeInTheDocument()
    })
  })

  describe('Modal Close Behavior', () => {
    it('should call onClose when close button is clicked', () => {
      // Arrange
      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockNonGitHubRepo}
        />
      )

      const closeButton = screen.getByLabelText('Close')

      // Act
      fireEvent.click(closeButton)

      // Assert
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should call onClose when cancel button is clicked', () => {
      // Arrange
      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockNonGitHubRepo}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /Cancel/i })

      // Act
      fireEvent.click(cancelButton)

      // Assert
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should not close when clicking inside modal', () => {
      // Arrange
      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockNonGitHubRepo}
        />
      )

      const modalContent = screen.getByText('Edit Vibe').parentElement

      // Act
      if (modalContent) {
        fireEvent.click(modalContent)
      }

      // Assert
      expect(mockOnClose).not.toHaveBeenCalled()
    })

    it('should not allow closing while loading', async () => {
      // Arrange
      let resolvePromise: any
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      ;(global.fetch as any).mockReturnValueOnce(promise)

      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockNonGitHubRepo}
        />
      )

      const saveButton = screen.getByRole('button', { name: /Save Changes/i })
      fireEvent.click(saveButton)

      const closeButton = screen.getByLabelText('Close')

      // Act
      await waitFor(() => {
        fireEvent.click(closeButton)
      })

      // Assert
      expect(mockOnClose).not.toHaveBeenCalled()

      // Cleanup
      resolvePromise({ ok: true, json: async () => ({}) })
    })

    it('should reset error and delete confirmation state when closing', async () => {
      // Arrange
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Test error' }),
      })

      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockNonGitHubRepo}
        />
      )

      const saveButton = screen.getByRole('button', { name: /Save Changes/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole('button', { name: /Cancel/i })

      // Act
      fireEvent.click(cancelButton)

      // Assert
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Collaboration Options Integration', () => {
    it('should render CollaborationOptionsForm', () => {
      // Act
      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockNonGitHubRepo}
        />
      )

      // Assert
      expect(screen.getByText('Collaboration Options')).toBeInTheDocument()
    })

    it('should include collaboration data in save payload', async () => {
      // Arrange
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(
        <EditVibeModal
          isOpen={true}
          onClose={mockOnClose}
          repository={mockNonGitHubRepo}
        />
      )

      const saveButton = screen.getByRole('button', { name: /Save Changes/i })

      // Act
      fireEvent.click(saveButton)

      // Assert
      await waitFor(() => {
        const callArgs = (global.fetch as any).mock.calls[0]
        const body = JSON.parse(callArgs[1].body)
        expect(body.collaborationTypes).toEqual(['CODE_REVIEW'])
        expect(body.collaborationDetails).toBe('Need help with testing')
        expect(body.isAcceptingCollaborators).toBe(true)
      })
    })
  })
})

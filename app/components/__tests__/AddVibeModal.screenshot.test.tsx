import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AddVibeModal } from '../AddVibeModal'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}))

// Mock fetch
global.fetch = vi.fn()

describe('AddVibeModal - Screenshot URL Feature', () => {
  const mockRouter = {
    refresh: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as any).mockReturnValue(mockRouter)
    sessionStorage.clear()
  })

  describe('Screenshot URL Field Rendering', () => {
    it('should render screenshot URL input field in step 1', () => {
      render(<AddVibeModal isOpen={true} onClose={vi.fn()} isLoggedIn={true} />)

      expect(screen.getByLabelText(/Screenshot URL/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/imgur.com\/example.png/i)).toBeInTheDocument()
    })

    it('should display help text for screenshot URL field', () => {
      render(<AddVibeModal isOpen={true} onClose={vi.fn()} isLoggedIn={true} />)

      expect(screen.getByText(/Link to an image showing your vibe in action/i)).toBeInTheDocument()
    })

    it('should mark screenshot URL as optional', () => {
      render(<AddVibeModal isOpen={true} onClose={vi.fn()} isLoggedIn={true} />)

      const label = screen.getByText(/Screenshot URL/i)
      expect(label.textContent).toContain('optional')
    })

    it('should position screenshot URL field in correct order', () => {
      render(<AddVibeModal isOpen={true} onClose={vi.fn()} isLoggedIn={true} />)

      const inputs = screen.getAllByRole('textbox')
      const labels = Array.from(document.querySelectorAll('label')).map(l => l.textContent)

      // Check that Screenshot URL comes after Description and GitHub Repository
      const screenshotIndex = labels.findIndex(l => l?.includes('Screenshot URL'))
      const descriptionIndex = labels.findIndex(l => l?.includes('Description'))
      const githubIndex = labels.findIndex(l => l?.includes('GitHub Repository'))

      expect(screenshotIndex).toBeGreaterThan(descriptionIndex)
      expect(screenshotIndex).toBeGreaterThan(githubIndex)
    })
  })

  describe('Screenshot URL Input Behavior', () => {
    it('should allow entering a valid screenshot URL', () => {
      render(<AddVibeModal isOpen={true} onClose={vi.fn()} isLoggedIn={true} />)

      const screenshotInput = screen.getByPlaceholderText(/imgur.com\/example.png/i)
      fireEvent.change(screenshotInput, {
        target: { value: 'https://i.imgur.com/screenshot.png' }
      })

      expect(screenshotInput).toHaveValue('https://i.imgur.com/screenshot.png')
    })

    it('should allow clearing screenshot URL', () => {
      render(<AddVibeModal isOpen={true} onClose={vi.fn()} isLoggedIn={true} />)

      const screenshotInput = screen.getByPlaceholderText(/imgur.com\/example.png/i)
      fireEvent.change(screenshotInput, {
        target: { value: 'https://example.com/image.png' }
      })
      expect(screenshotInput).toHaveValue('https://example.com/image.png')

      fireEvent.change(screenshotInput, { target: { value: '' } })
      expect(screenshotInput).toHaveValue('')
    })

    it('should preserve screenshot URL when navigating to step 2', async () => {
      render(<AddVibeModal isOpen={true} onClose={vi.fn()} isLoggedIn={true} />)

      // Fill in required field and screenshot URL
      const titleInput = screen.getByPlaceholderText(/My Awesome Project/i)
      const screenshotInput = screen.getByPlaceholderText(/imgur.com\/example.png/i)

      fireEvent.change(titleInput, { target: { value: 'Test Vibe' } })
      fireEvent.change(screenshotInput, {
        target: { value: 'https://example.com/screenshot.png' }
      })

      // Go to step 2
      fireEvent.click(screen.getByText('Next: Collaboration Options'))

      await waitFor(() => {
        expect(screen.getByText('Collaboration Options')).toBeInTheDocument()
      })

      // Go back to step 1
      fireEvent.click(screen.getByText('Back'))

      // Screenshot URL should be preserved
      expect(screen.getByPlaceholderText(/imgur.com\/example.png/i)).toHaveValue(
        'https://example.com/screenshot.png'
      )
    })

    it('should reset screenshot URL when modal is closed', () => {
      const onClose = vi.fn()
      const { rerender } = render(
        <AddVibeModal isOpen={true} onClose={onClose} isLoggedIn={true} />
      )

      const screenshotInput = screen.getByPlaceholderText(/imgur.com\/example.png/i)
      fireEvent.change(screenshotInput, {
        target: { value: 'https://example.com/screenshot.png' }
      })

      // Close modal
      fireEvent.click(screen.getByText('Cancel'))

      // Reopen modal
      rerender(<AddVibeModal isOpen={false} onClose={onClose} isLoggedIn={true} />)
      rerender(<AddVibeModal isOpen={true} onClose={onClose} isLoggedIn={true} />)

      // Screenshot URL should be cleared
      expect(screen.getByPlaceholderText(/imgur.com\/example.png/i)).toHaveValue('')
    })
  })

  describe('Submitting with Screenshot URL', () => {
    it('should submit non-GitHub vibe with screenshot URL', async () => {
      const mockOnClose = vi.fn()
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: '123',
          title: 'My Vibe',
          screenshotUrl: 'https://example.com/screenshot.png',
        }),
      })

      render(<AddVibeModal isOpen={true} onClose={mockOnClose} isLoggedIn={true} />)

      // Fill in title and screenshot URL
      const titleInput = screen.getByPlaceholderText(/My Awesome Project/i)
      const screenshotInput = screen.getByPlaceholderText(/imgur.com\/example.png/i)

      fireEvent.change(titleInput, { target: { value: 'My Vibe' } })
      fireEvent.change(screenshotInput, {
        target: { value: 'https://example.com/screenshot.png' }
      })

      // Go to step 2
      fireEvent.click(screen.getByText('Next: Collaboration Options'))

      await waitFor(() => {
        expect(screen.getByText('Skip & Add Vibe')).toBeInTheDocument()
      })

      // Submit without collaboration
      fireEvent.click(screen.getByText('Skip & Add Vibe'))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/repositories',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('screenshotUrl'),
          })
        )
      })

      const call = (global.fetch as any).mock.calls[0]
      const body = JSON.parse(call[1].body)
      expect(body.screenshotUrl).toBe('https://example.com/screenshot.png')
      expect(body.title).toBe('My Vibe')
    })

    it('should submit GitHub vibe with screenshot URL', async () => {
      const mockOnClose = vi.fn()
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: '123',
          name: 'react',
          screenshotUrl: 'https://example.com/react-screenshot.png',
        }),
      })

      render(<AddVibeModal isOpen={true} onClose={mockOnClose} isLoggedIn={true} />)

      // Fill in GitHub repo and screenshot URL
      const repoInput = screen.getByPlaceholderText(/owner\/repo or github.com/i)
      const screenshotInput = screen.getByPlaceholderText(/imgur.com\/example.png/i)

      fireEvent.change(repoInput, { target: { value: 'facebook/react' } })
      fireEvent.change(screenshotInput, {
        target: { value: 'https://example.com/react-screenshot.png' }
      })

      // Go to step 2
      fireEvent.click(screen.getByText('Next: Collaboration Options'))

      await waitFor(() => {
        expect(screen.getByText('Skip & Add Vibe')).toBeInTheDocument()
      })

      // Submit without collaboration
      fireEvent.click(screen.getByText('Skip & Add Vibe'))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/repositories',
          expect.objectContaining({
            method: 'POST',
          })
        )
      })

      const call = (global.fetch as any).mock.calls[0]
      const body = JSON.parse(call[1].body)
      expect(body.owner).toBe('facebook')
      expect(body.name).toBe('react')
      expect(body.screenshotUrl).toBe('https://example.com/react-screenshot.png')
    })

    it('should submit without screenshot URL when field is empty', async () => {
      const mockOnClose = vi.fn()
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '123', title: 'My Vibe' }),
      })

      render(<AddVibeModal isOpen={true} onClose={mockOnClose} isLoggedIn={true} />)

      // Fill in only title
      const titleInput = screen.getByPlaceholderText(/My Awesome Project/i)
      fireEvent.change(titleInput, { target: { value: 'My Vibe' } })

      // Go to step 2 and submit
      fireEvent.click(screen.getByText('Next: Collaboration Options'))

      await waitFor(() => {
        expect(screen.getByText('Skip & Add Vibe')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Skip & Add Vibe'))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const call = (global.fetch as any).mock.calls[0]
      const body = JSON.parse(call[1].body)
      expect(body.screenshotUrl).toBeUndefined()
    })

    it('should trim whitespace from screenshot URL before submitting', async () => {
      const mockOnClose = vi.fn()
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '123', title: 'My Vibe' }),
      })

      render(<AddVibeModal isOpen={true} onClose={mockOnClose} isLoggedIn={true} />)

      // Fill in title and screenshot URL with whitespace
      const titleInput = screen.getByPlaceholderText(/My Awesome Project/i)
      const screenshotInput = screen.getByPlaceholderText(/imgur.com\/example.png/i)

      fireEvent.change(titleInput, { target: { value: 'My Vibe' } })
      fireEvent.change(screenshotInput, {
        target: { value: '  https://example.com/screenshot.png  ' }
      })

      // Go to step 2 and submit
      fireEvent.click(screen.getByText('Next: Collaboration Options'))

      await waitFor(() => {
        expect(screen.getByText('Skip & Add Vibe')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Skip & Add Vibe'))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const call = (global.fetch as any).mock.calls[0]
      const body = JSON.parse(call[1].body)
      expect(body.screenshotUrl).toBe('https://example.com/screenshot.png')
    })

    it('should not submit screenshot URL when it is only whitespace', async () => {
      const mockOnClose = vi.fn()
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '123', title: 'My Vibe' }),
      })

      render(<AddVibeModal isOpen={true} onClose={mockOnClose} isLoggedIn={true} />)

      // Fill in title and whitespace screenshot URL
      const titleInput = screen.getByPlaceholderText(/My Awesome Project/i)
      const screenshotInput = screen.getByPlaceholderText(/imgur.com\/example.png/i)

      fireEvent.change(titleInput, { target: { value: 'My Vibe' } })
      fireEvent.change(screenshotInput, { target: { value: '   ' } })

      // Go to step 2 and submit
      fireEvent.click(screen.getByText('Next: Collaboration Options'))

      await waitFor(() => {
        expect(screen.getByText('Skip & Add Vibe')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Skip & Add Vibe'))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const call = (global.fetch as any).mock.calls[0]
      const body = JSON.parse(call[1].body)
      expect(body.screenshotUrl).toBeUndefined()
    })
  })

  describe('Screenshot URL with Collaboration Options', () => {
    it('should submit vibe with both screenshot URL and collaboration options', async () => {
      const mockOnClose = vi.fn()
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '123', title: 'My Vibe' }),
      })

      render(<AddVibeModal isOpen={true} onClose={mockOnClose} isLoggedIn={true} />)

      // Step 1: Fill in title and screenshot URL
      const titleInput = screen.getByPlaceholderText(/My Awesome Project/i)
      const screenshotInput = screen.getByPlaceholderText(/imgur.com\/example.png/i)

      fireEvent.change(titleInput, { target: { value: 'My Vibe' } })
      fireEvent.change(screenshotInput, {
        target: { value: 'https://example.com/screenshot.png' }
      })

      fireEvent.click(screen.getByText('Next: Collaboration Options'))

      // Step 2: Configure collaboration
      await waitFor(() => {
        expect(screen.getByText('Collaboration Options')).toBeInTheDocument()
      })

      const providerRadio = screen.getByLabelText(/Offering Help/i)
      fireEvent.click(providerRadio)

      const codeReviewCheckbox = screen.getByLabelText(/Code Review/i)
      fireEvent.click(codeReviewCheckbox)

      // Submit with collaboration
      fireEvent.click(screen.getByText('Add with Collaboration'))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const call = (global.fetch as any).mock.calls[0]
      const body = JSON.parse(call[1].body)
      expect(body.screenshotUrl).toBe('https://example.com/screenshot.png')
      expect(body.collaborationOptions).toEqual({
        role: 'PROVIDER',
        types: ['CODE_REVIEW'],
        details: '',
        isAccepting: false,
      })
    })
  })

  describe('Screenshot URL with Deployed URL', () => {
    it('should submit vibe with both screenshot URL and deployed URL', async () => {
      const mockOnClose = vi.fn()
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '123', title: 'My Vibe' }),
      })

      render(<AddVibeModal isOpen={true} onClose={mockOnClose} isLoggedIn={true} />)

      // Fill in all URLs
      const titleInput = screen.getByPlaceholderText(/My Awesome Project/i)
      const screenshotInput = screen.getByPlaceholderText(/imgur.com\/example.png/i)
      const deployedInput = screen.getByPlaceholderText(/your-app.com/i)

      fireEvent.change(titleInput, { target: { value: 'My Vibe' } })
      fireEvent.change(screenshotInput, {
        target: { value: 'https://example.com/screenshot.png' }
      })
      fireEvent.change(deployedInput, {
        target: { value: 'https://myapp.com' }
      })

      // Go to step 2 and submit
      fireEvent.click(screen.getByText('Next: Collaboration Options'))

      await waitFor(() => {
        expect(screen.getByText('Skip & Add Vibe')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Skip & Add Vibe'))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const call = (global.fetch as any).mock.calls[0]
      const body = JSON.parse(call[1].body)
      expect(body.screenshotUrl).toBe('https://example.com/screenshot.png')
      expect(body.deployedUrl).toBe('https://myapp.com')
    })
  })

  describe('Pending Vibe Data with Screenshot', () => {
    it('should persist screenshot URL in sessionStorage when user is not logged in', async () => {
      ;(signIn as any).mockImplementationOnce(() => {})

      render(<AddVibeModal isOpen={true} onClose={vi.fn()} isLoggedIn={false} />)

      // Fill in form including screenshot URL
      const titleInput = screen.getByPlaceholderText(/My Awesome Project/i)
      const screenshotInput = screen.getByPlaceholderText(/imgur.com\/example.png/i)

      fireEvent.change(titleInput, { target: { value: 'My Vibe' } })
      fireEvent.change(screenshotInput, {
        target: { value: 'https://example.com/screenshot.png' }
      })

      // Go to step 2 and submit (will redirect to login)
      fireEvent.click(screen.getByText('Next: Collaboration Options'))

      await waitFor(() => {
        expect(screen.getByText('Login & Skip Collab')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Login & Skip Collab'))

      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith('github')
      })

      // Check sessionStorage
      const pendingData = sessionStorage.getItem('vibeyard_pending_vibe')
      expect(pendingData).toBeTruthy()

      const parsed = JSON.parse(pendingData!)
      expect(parsed.screenshotUrl).toBe('https://example.com/screenshot.png')
      expect(parsed.vibeTitle).toBe('My Vibe')
    })

    it('should restore screenshot URL from sessionStorage after login', async () => {
      // Set up pending data as if user just logged in
      const pendingData = {
        repoUrl: '',
        vibeTitle: 'My Vibe',
        vibeDescription: 'Description',
        screenshotUrl: 'https://example.com/screenshot.png',
        deployedUrl: 'https://myapp.com',
        collaborationOptions: {
          role: 'SEEKER',
          types: [],
          details: '',
          isAccepting: false,
        },
        includeCollaboration: false,
      }
      sessionStorage.setItem('vibeyard_pending_vibe', JSON.stringify(pendingData))

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '123', title: 'My Vibe' }),
      })

      render(<AddVibeModal isOpen={true} onClose={vi.fn()} isLoggedIn={true} />)

      // Wait for auto-submit to complete
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      }, { timeout: 3000 })

      const call = (global.fetch as any).mock.calls[0]
      const body = JSON.parse(call[1].body)
      expect(body.title).toBe('My Vibe')
      expect(body.screenshotUrl).toBe('https://example.com/screenshot.png')
      expect(body.deployedUrl).toBe('https://myapp.com')

      // Pending data should be cleared
      expect(sessionStorage.getItem('vibeyard_pending_vibe')).toBeNull()
    })
  })

  describe('Custom Description with Screenshot', () => {
    it('should submit GitHub vibe with custom description and screenshot', async () => {
      const mockOnClose = vi.fn()
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '123', name: 'my-repo' }),
      })

      render(<AddVibeModal isOpen={true} onClose={mockOnClose} isLoggedIn={true} />)

      // Fill in GitHub repo, description, and screenshot
      const repoInput = screen.getByPlaceholderText(/owner\/repo or github.com/i)
      const descriptionInput = screen.getByPlaceholderText(/A brief description/i)
      const screenshotInput = screen.getByPlaceholderText(/imgur.com\/example.png/i)

      fireEvent.change(repoInput, { target: { value: 'user/my-repo' } })
      fireEvent.change(descriptionInput, {
        target: { value: 'My custom description' }
      })
      fireEvent.change(screenshotInput, {
        target: { value: 'https://example.com/screenshot.png' }
      })

      // Go to step 2 and submit
      fireEvent.click(screen.getByText('Next: Collaboration Options'))

      await waitFor(() => {
        expect(screen.getByText('Skip & Add Vibe')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Skip & Add Vibe'))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const call = (global.fetch as any).mock.calls[0]
      const body = JSON.parse(call[1].body)
      expect(body.owner).toBe('user')
      expect(body.name).toBe('my-repo')
      expect(body.description).toBe('My custom description')
      expect(body.screenshotUrl).toBe('https://example.com/screenshot.png')
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors when submitting with screenshot URL', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to upload screenshot' }),
      })

      render(<AddVibeModal isOpen={true} onClose={vi.fn()} isLoggedIn={true} />)

      // Fill in form
      const titleInput = screen.getByPlaceholderText(/My Awesome Project/i)
      const screenshotInput = screen.getByPlaceholderText(/imgur.com\/example.png/i)

      fireEvent.change(titleInput, { target: { value: 'My Vibe' } })
      fireEvent.change(screenshotInput, {
        target: { value: 'https://example.com/screenshot.png' }
      })

      // Submit
      fireEvent.click(screen.getByText('Next: Collaboration Options'))

      await waitFor(() => {
        expect(screen.getByText('Skip & Add Vibe')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Skip & Add Vibe'))

      await waitFor(() => {
        expect(screen.getByText('Failed to upload screenshot')).toBeInTheDocument()
      })
    })
  })

  describe('Field Interaction', () => {
    it('should not disable screenshot URL field during loading', () => {
      render(<AddVibeModal isOpen={true} onClose={vi.fn()} isLoggedIn={true} />)

      const screenshotInput = screen.getByPlaceholderText(/imgur.com\/example.png/i)
      expect(screenshotInput).not.toBeDisabled()
    })

    it('should allow tab navigation to screenshot URL field', () => {
      render(<AddVibeModal isOpen={true} onClose={vi.fn()} isLoggedIn={true} />)

      const inputs = screen.getAllByRole('textbox')
      const screenshotInput = screen.getByPlaceholderText(/imgur.com\/example.png/i) as HTMLInputElement

      // Screenshot URL should be focusable
      screenshotInput.focus()
      expect(document.activeElement).toBe(screenshotInput)
    })
  })
})

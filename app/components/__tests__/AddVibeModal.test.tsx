import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AddVibeModal } from '../AddVibeModal'
import { useRouter } from 'next/navigation'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

describe('AddVibeModal', () => {
  const mockRouter = {
    refresh: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  it('does not render when closed', () => {
    render(<AddVibeModal isOpen={false} onClose={jest.fn()} />)
    expect(screen.queryByText('Add Vibe')).not.toBeInTheDocument()
  })

  it('renders step 1 when open', () => {
    render(<AddVibeModal isOpen={true} onClose={jest.fn()} />)
    expect(screen.getByText('Add Vibe')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/owner\/repo/i)).toBeInTheDocument()
  })

  it('validates repository URL format', () => {
    render(<AddVibeModal isOpen={true} onClose={jest.fn()} />)

    const input = screen.getByPlaceholderText(/owner\/repo/i)
    const nextButton = screen.getByText('Next: Collaboration Options')

    // Enter invalid format
    fireEvent.change(input, { target: { value: 'invalid-format' } })
    fireEvent.click(nextButton)

    expect(screen.getByText(/Invalid format/i)).toBeInTheDocument()
  })

  it('accepts valid owner/repo format', () => {
    render(<AddVibeModal isOpen={true} onClose={jest.fn()} />)

    const input = screen.getByPlaceholderText(/owner\/repo/i)
    const nextButton = screen.getByText('Next: Collaboration Options')

    // Enter valid format
    fireEvent.change(input, { target: { value: 'facebook/react' } })
    fireEvent.click(nextButton)

    // Should move to step 2
    expect(screen.getByText('Collaboration Options')).toBeInTheDocument()
  })

  it('accepts valid GitHub URL format', () => {
    render(<AddVibeModal isOpen={true} onClose={jest.fn()} />)

    const input = screen.getByPlaceholderText(/owner\/repo/i)
    const nextButton = screen.getByText('Next: Collaboration Options')

    // Enter valid URL
    fireEvent.change(input, { target: { value: 'https://github.com/facebook/react' } })
    fireEvent.click(nextButton)

    // Should move to step 2
    expect(screen.getByText('Collaboration Options')).toBeInTheDocument()
  })

  it('allows skipping collaboration options', async () => {
    const mockOnClose = jest.fn()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '123', name: 'react' }),
    })

    render(<AddVibeModal isOpen={true} onClose={mockOnClose} />)

    // Step 1: Enter repo
    const input = screen.getByPlaceholderText(/owner\/repo/i)
    fireEvent.change(input, { target: { value: 'facebook/react' } })
    fireEvent.click(screen.getByText('Next: Collaboration Options'))

    // Step 2: Skip collaboration
    await waitFor(() => {
      expect(screen.getByText('Skip & Add Vibe')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Skip & Add Vibe'))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/repositories',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            owner: 'facebook',
            name: 'react',
          }),
        })
      )
      expect(mockRouter.refresh).toHaveBeenCalled()
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('submits with collaboration options', async () => {
    const mockOnClose = jest.fn()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '123', name: 'react' }),
    })

    render(<AddVibeModal isOpen={true} onClose={mockOnClose} />)

    // Step 1: Enter repo
    const input = screen.getByPlaceholderText(/owner\/repo/i)
    fireEvent.change(input, { target: { value: 'facebook/react' } })
    fireEvent.click(screen.getByText('Next: Collaboration Options'))

    // Step 2: Configure collaboration
    await waitFor(() => {
      expect(screen.getByText('Collaboration Options')).toBeInTheDocument()
    })

    // Select a role
    const providerRadio = screen.getByLabelText(/Offering Help/i)
    fireEvent.click(providerRadio)

    // Select collaboration types
    const codeReviewCheckbox = screen.getByLabelText(/Code Review/i)
    fireEvent.click(codeReviewCheckbox)

    // Add details
    const detailsTextarea = screen.getByPlaceholderText(/Describe what kind of collaboration/i)
    fireEvent.change(detailsTextarea, { target: { value: 'Happy to help with code reviews' } })

    // Enable accepting requests
    const acceptingCheckbox = screen.getByLabelText(/Accepting collaboration requests/i)
    fireEvent.click(acceptingCheckbox)

    // Submit
    fireEvent.click(screen.getByText('Add with Collaboration'))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/repositories',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('collaborationOptions'),
        })
      )
    })

    const call = (global.fetch as jest.Mock).mock.calls[0]
    const body = JSON.parse(call[1].body)
    expect(body.collaborationOptions).toEqual({
      role: 'PROVIDER',
      types: ['CODE_REVIEW'],
      details: 'Happy to help with code reviews',
      isAccepting: true,
    })
  })

  it('handles API errors gracefully', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Repository already added' }),
    })

    render(<AddVibeModal isOpen={true} onClose={jest.fn()} />)

    // Step 1: Enter repo
    const input = screen.getByPlaceholderText(/owner\/repo/i)
    fireEvent.change(input, { target: { value: 'facebook/react' } })
    fireEvent.click(screen.getByText('Next: Collaboration Options'))

    // Step 2: Skip collaboration
    await waitFor(() => {
      expect(screen.getByText('Skip & Add Vibe')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Skip & Add Vibe'))

    await waitFor(() => {
      expect(screen.getByText('Repository already added')).toBeInTheDocument()
    })
  })

  it('allows going back from step 2 to step 1', async () => {
    render(<AddVibeModal isOpen={true} onClose={jest.fn()} />)

    // Go to step 2
    const input = screen.getByPlaceholderText(/owner\/repo/i)
    fireEvent.change(input, { target: { value: 'facebook/react' } })
    fireEvent.click(screen.getByText('Next: Collaboration Options'))

    await waitFor(() => {
      expect(screen.getByText('Collaboration Options')).toBeInTheDocument()
    })

    // Go back
    fireEvent.click(screen.getByText('Back'))

    expect(screen.getByText('Add Vibe')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/owner\/repo/i)).toHaveValue('facebook/react')
  })
})

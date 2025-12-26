import { render, screen, fireEvent } from '@testing-library/react'
import { CollaborationOptionsForm } from '../CollaborationOptionsForm'
import { CollaborationOptions } from '@/types/collaboration'

describe('CollaborationOptionsForm', () => {
  const defaultOptions: CollaborationOptions = {
    role: 'SEEKER',
    types: [],
    details: '',
    isAccepting: false,
  }

  it('renders all role options', () => {
    const onChange = jest.fn()
    render(<CollaborationOptionsForm options={defaultOptions} onChange={onChange} />)

    expect(screen.getByLabelText(/Seeking Help/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Offering Help/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Open to Both/i)).toBeInTheDocument()
  })

  it('renders all collaboration type options', () => {
    const onChange = jest.fn()
    render(<CollaborationOptionsForm options={defaultOptions} onChange={onChange} />)

    expect(screen.getByLabelText(/Code Review/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Bug Fix Help/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Team Formation/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Expertise Offer/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Mentorship/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/General Collaboration/i)).toBeInTheDocument()
  })

  it('calls onChange when role is changed', () => {
    const onChange = jest.fn()
    render(<CollaborationOptionsForm options={defaultOptions} onChange={onChange} />)

    const providerRadio = screen.getByLabelText(/Offering Help/i)
    fireEvent.click(providerRadio)

    expect(onChange).toHaveBeenCalledWith({
      ...defaultOptions,
      role: 'PROVIDER',
    })
  })

  it('calls onChange when collaboration type is toggled', () => {
    const onChange = jest.fn()
    render(<CollaborationOptionsForm options={defaultOptions} onChange={onChange} />)

    const codeReviewCheckbox = screen.getByLabelText(/Code Review/i)
    fireEvent.click(codeReviewCheckbox)

    expect(onChange).toHaveBeenCalledWith({
      ...defaultOptions,
      types: ['CODE_REVIEW'],
    })
  })

  it('can select multiple collaboration types', () => {
    const onChange = jest.fn()
    const options: CollaborationOptions = {
      role: 'SEEKER',
      types: ['CODE_REVIEW'],
      details: '',
      isAccepting: false,
    }

    render(<CollaborationOptionsForm options={options} onChange={onChange} />)

    const mentorshipCheckbox = screen.getByLabelText(/Mentorship/i)
    fireEvent.click(mentorshipCheckbox)

    expect(onChange).toHaveBeenCalledWith({
      ...options,
      types: ['CODE_REVIEW', 'MENTORSHIP'],
    })
  })

  it('can deselect collaboration types', () => {
    const onChange = jest.fn()
    const options: CollaborationOptions = {
      role: 'SEEKER',
      types: ['CODE_REVIEW', 'MENTORSHIP'],
      details: '',
      isAccepting: false,
    }

    render(<CollaborationOptionsForm options={options} onChange={onChange} />)

    const codeReviewCheckbox = screen.getByLabelText(/Code Review/i)
    fireEvent.click(codeReviewCheckbox)

    expect(onChange).toHaveBeenCalledWith({
      ...options,
      types: ['MENTORSHIP'],
    })
  })

  it('calls onChange when details are updated', () => {
    const onChange = jest.fn()
    render(<CollaborationOptionsForm options={defaultOptions} onChange={onChange} />)

    const detailsTextarea = screen.getByPlaceholderText(/Describe what kind of collaboration/i)
    fireEvent.change(detailsTextarea, { target: { value: 'Looking for help with React' } })

    expect(onChange).toHaveBeenCalledWith({
      ...defaultOptions,
      details: 'Looking for help with React',
    })
  })

  it('calls onChange when isAccepting is toggled', () => {
    const onChange = jest.fn()
    render(<CollaborationOptionsForm options={defaultOptions} onChange={onChange} />)

    const acceptingCheckbox = screen.getByLabelText(/Accepting collaboration requests/i)
    fireEvent.click(acceptingCheckbox)

    expect(onChange).toHaveBeenCalledWith({
      ...defaultOptions,
      isAccepting: true,
    })
  })

  it('displays current option values correctly', () => {
    const onChange = jest.fn()
    const options: CollaborationOptions = {
      role: 'BOTH',
      types: ['CODE_REVIEW', 'MENTORSHIP'],
      details: 'I am experienced in React and Node.js',
      isAccepting: true,
    }

    render(<CollaborationOptionsForm options={options} onChange={onChange} />)

    // Check role
    expect(screen.getByLabelText(/Open to Both/i)).toBeChecked()

    // Check types
    expect(screen.getByLabelText(/Code Review/i)).toBeChecked()
    expect(screen.getByLabelText(/Mentorship/i)).toBeChecked()
    expect(screen.getByLabelText(/Bug Fix Help/i)).not.toBeChecked()

    // Check details
    expect(screen.getByPlaceholderText(/Describe what kind of collaboration/i)).toHaveValue(
      'I am experienced in React and Node.js'
    )

    // Check isAccepting
    expect(screen.getByLabelText(/Accepting collaboration requests/i)).toBeChecked()
  })
})

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { StarRating } from '../StarRating'

describe('StarRating', () => {
  it('renders 1 star for score 0-20', () => {
    const { container } = render(<StarRating score={15} />)
    const filledStars = container.querySelectorAll('svg.fill-\\[--yard-orange\\]')
    expect(filledStars).toHaveLength(1)
  })

  it('renders 2 stars for score 21-40', () => {
    const { container } = render(<StarRating score={35} />)
    const filledStars = container.querySelectorAll('svg.fill-\\[--yard-orange\\]')
    expect(filledStars).toHaveLength(2)
  })

  it('renders 3 stars for score 41-60', () => {
    const { container } = render(<StarRating score={50} />)
    const filledStars = container.querySelectorAll('svg.fill-\\[--yard-orange\\]')
    expect(filledStars).toHaveLength(3)
  })

  it('renders 4 stars for score 61-80', () => {
    const { container } = render(<StarRating score={75} />)
    const filledStars = container.querySelectorAll('svg.fill-\\[--yard-orange\\]')
    expect(filledStars).toHaveLength(4)
  })

  it('renders 5 stars for score 81-100', () => {
    const { container } = render(<StarRating score={95} />)
    const filledStars = container.querySelectorAll('svg.fill-\\[--yard-orange\\]')
    expect(filledStars).toHaveLength(5)
  })

  it('shows score in title attribute', () => {
    const { container } = render(<StarRating score={75} />)
    const element = container.querySelector('[title]')
    expect(element).toHaveAttribute('title', 'Completeness: 75/100')
  })

  it('optionally displays numeric score', () => {
    render(<StarRating score={85} showScore />)
    expect(screen.getByText('85')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    const { container } = render(<StarRating score={50} onClick={handleClick} />)

    const element = container.querySelector('[role="button"]')
    expect(element).toBeInTheDocument()

    if (element) {
      fireEvent.click(element)
      expect(handleClick).toHaveBeenCalledTimes(1)
    }
  })

  it('is keyboard accessible when clickable', () => {
    const handleClick = vi.fn()
    const { container } = render(<StarRating score={50} onClick={handleClick} />)

    const element = container.querySelector('[role="button"]')
    expect(element).toHaveAttribute('tabIndex', '0')

    if (element) {
      fireEvent.keyDown(element, { key: 'Enter' })
      expect(handleClick).toHaveBeenCalledTimes(1)

      fireEvent.keyDown(element, { key: ' ' })
      expect(handleClick).toHaveBeenCalledTimes(2)
    }
  })

  it('has proper ARIA labels', () => {
    const { container } = render(<StarRating score={75} />)
    const element = container.querySelector('[aria-label]')
    expect(element).toHaveAttribute(
      'aria-label',
      'Repository completeness score: 75 out of 100, 4 stars'
    )
  })

  it('applies correct size classes', () => {
    const { container: smContainer } = render(<StarRating score={50} size="sm" />)
    expect(smContainer.querySelector('.text-xs')).toBeInTheDocument()

    const { container: mdContainer } = render(<StarRating score={50} size="md" />)
    expect(mdContainer.querySelector('.text-sm')).toBeInTheDocument()

    const { container: lgContainer } = render(<StarRating score={50} size="lg" />)
    expect(lgContainer.querySelector('.text-lg')).toBeInTheDocument()
  })

  it('handles edge case of score 0', () => {
    const { container } = render(<StarRating score={0} />)
    const filledStars = container.querySelectorAll('svg.fill-\\[--yard-orange\\]')
    // Minimum 1 star for any score
    expect(filledStars).toHaveLength(1)
  })

  it('handles edge case of score 100', () => {
    const { container } = render(<StarRating score={100} />)
    const filledStars = container.querySelectorAll('svg.fill-\\[--yard-orange\\]')
    expect(filledStars).toHaveLength(5)
  })
})

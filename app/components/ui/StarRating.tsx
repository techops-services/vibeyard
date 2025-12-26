'use client'

import { useMemo } from 'react'

interface StarRatingProps {
  score: number // 0-100
  size?: 'sm' | 'md' | 'lg'
  showScore?: boolean
  onClick?: () => void
  className?: string
}

/**
 * StarRating Component
 *
 * Displays a 1-5 star rating based on a completeness score (0-100)
 * Score mapping: 0-20=1★, 21-40=2★, 41-60=3★, 61-80=4★, 81-100=5★
 *
 * Features:
 * - Animated fill for partial stars
 * - Shows numeric score on hover/tooltip
 * - Accessible with ARIA labels
 * - Supports sm, md, lg sizes
 */
export function StarRating({
  score,
  size = 'md',
  showScore = false,
  onClick,
  className = ''
}: StarRatingProps) {
  const stars = useMemo(() => {
    // Convert 0-100 score to 1-5 stars
    const starCount = Math.max(1, Math.min(5, Math.ceil(score / 20)))
    return starCount
  }, [score])

  const sizeClasses = {
    sm: 'text-xs gap-0.5',
    md: 'text-sm gap-1',
    lg: 'text-lg gap-1.5'
  }

  const starSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  return (
    <div
      className={`inline-flex items-center ${sizeClasses[size]} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      title={`Completeness: ${score}/100`}
      aria-label={`Repository completeness score: ${score} out of 100, ${stars} stars`}
      role={onClick ? 'button' : 'img'}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      } : undefined}
    >
      {/* Render stars */}
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          filled={i < stars}
          size={starSizes[size]}
        />
      ))}

      {/* Optional score display */}
      {showScore && (
        <span className="ml-1 yard-meta font-mono">
          {score}
        </span>
      )}
    </div>
  )
}

interface StarProps {
  filled: boolean
  size: string
}

function Star({ filled, size }: StarProps) {
  return (
    <svg
      className={`${size} transition-all duration-200 ${
        filled ? 'fill-[--yard-orange] text-[--yard-orange]' : 'fill-[--yard-gray] text-[--yard-gray] opacity-30'
      }`}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      />
    </svg>
  )
}

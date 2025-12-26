'use client'

interface Props {
  size?: 'sm' | 'md' | 'lg'
}

export function SeekerBadge({ size = 'md' }: Props) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  }

  return (
    <span
      className={`inline-flex items-center font-medium bg-[--yard-orange] text-white ${sizeClasses[size]}`}
    >
      seeker
    </span>
  )
}

'use client'

import Image from 'next/image'

interface Props {
  src?: string | null
  alt?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeConfig = {
  sm: { classes: 'w-6 h-6', width: 24, height: 24 },
  md: { classes: 'w-10 h-10', width: 40, height: 40 },
  lg: { classes: 'w-14 h-14', width: 56, height: 56 },
}

export function UserAvatar({ src, alt = 'User', size = 'md', className = '' }: Props) {
  const config = sizeConfig[size]

  if (!src) {
    return (
      <div
        className={`${config.classes} rounded-full bg-[--yard-light-gray] border border-[--yard-border] flex items-center justify-center text-[--yard-gray] ${className}`}
      >
        <span className={size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-lg' : 'text-sm'}>
          {alt.charAt(0).toUpperCase()}
        </span>
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={config.width}
      height={config.height}
      className={`${config.classes} rounded-full object-cover ${className}`}
    />
  )
}

'use client'

import { useState } from 'react'

interface Props {
  src: string
  alt: string
}

export function ScreenshotImage({ src, alt }: Props) {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return null
  }

  return (
    <div className="mb-4 border border-[--yard-border] overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="w-full h-auto max-h-[400px] object-contain bg-[--yard-light-gray]"
        onError={() => setHasError(true)}
      />
    </div>
  )
}

'use client'

import { useState } from 'react'
import { AddVibeModal } from './AddVibeModal'

export function AddVibeForm() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="yard-button"
      >
        + add vibe
      </button>
      <AddVibeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}

'use client'

import { useState } from 'react'
import { AddRepoModal } from './AddRepoModal'

export function AddRepoForm() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="yard-button"
      >
        + add repo
      </button>
      <AddRepoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}

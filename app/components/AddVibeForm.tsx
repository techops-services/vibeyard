'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { AddVibeModal } from './AddVibeModal'

const PENDING_VIBE_KEY = 'vibeyard_pending_vibe'

export function AddVibeForm() {
  const { data: session, status } = useSession()
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Check for pending vibe data after login
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      const pendingVibe = sessionStorage.getItem(PENDING_VIBE_KEY)
      if (pendingVibe) {
        // Open modal with pending data - it will auto-submit
        setIsModalOpen(true)
      }
    }
  }, [status, session?.user?.id])

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
        isLoggedIn={!!session?.user?.id}
      />
    </>
  )
}

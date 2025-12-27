'use client'

import { signIn } from 'next-auth/react'

export function LoginPrompt() {
  return (
    <button
      onClick={() => signIn('github')}
      className="yard-button"
    >
      Login with GitHub
    </button>
  )
}

'use client'

import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function SignInContent() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const error = searchParams.get('error')

  return (
    <div className="min-h-screen flex flex-col bg-[--yard-bg]">
      {/* Header */}
      <header className="yard-header flex items-center justify-center">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80">
          <span className="text-lg">🏗️</span>
          <div className="flex flex-col leading-tight">
            <span className="font-bold">vibeyard</span>
            <span className="text-[10px] opacity-75">
              the junkyard for vibecode with potential
            </span>
          </div>
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="border-2 border-[--yard-border] bg-[--yard-bg]">
            {/* Title */}
            <div className="border-b-2 border-[--yard-border] p-6 bg-[--yard-light-gray]">
              <h1 className="text-2xl font-bold mono text-center">sign in</h1>
            </div>

            {/* Content */}
            <div className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 mb-4">
                  {error === 'OAuthSignin' && 'Error starting sign in flow.'}
                  {error === 'OAuthCallback' && 'Error completing sign in.'}
                  {error === 'OAuthAccountNotLinked' && 'This account is linked to another sign in method.'}
                  {error === 'Callback' && 'Error during callback.'}
                  {error === 'Default' && 'An error occurred during sign in.'}
                  {!['OAuthSignin', 'OAuthCallback', 'OAuthAccountNotLinked', 'Callback', 'Default'].includes(error) && 'An error occurred.'}
                </div>
              )}

              <p className="yard-meta text-sm text-center mb-6">
                Sign in with your GitHub account to add vibes, vote, follow, and collaborate.
              </p>

              <button
                onClick={() => signIn('github', { callbackUrl })}
                className="w-full yard-button flex items-center justify-center gap-2 py-3"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                Sign in with GitHub
              </button>

              <p className="yard-meta text-xs text-center mt-6">
                By signing in, you agree to let vibeyard access your public GitHub repositories.
              </p>
            </div>
          </div>

          {/* Back link */}
          <div className="text-center mt-4">
            <Link
              href="/"
              className="yard-meta text-xs hover:text-[--yard-orange] hover:underline"
            >
              ← back to yard lot
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="yard-meta">Loading...</div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}

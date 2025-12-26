'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'

export function YardHeader() {
  const { data: session } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="yard-header flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80">
          <span className="text-lg">🏗️</span>
          <div className="flex flex-col leading-tight">
            <span className="font-bold">vibeyard</span>
            <span className="text-[10px] opacity-75">
              the junkyard for vibecode with potential
            </span>
          </div>
        </Link>
        <nav className="flex items-center gap-3 text-xs border-l border-white/30 pl-4">
          {session && (
            <Link href="/workbench" className="hover:opacity-80">
              workbench
            </Link>
          )}
          <a
            href="/feed.xml"
            className="hover:opacity-80"
            title="RSS Feed"
          >
            rss
          </a>
          <Link href="/wtf" className="hover:opacity-80">
            wtf
          </Link>
          <Link href="/vibecode" className="hover:opacity-80">
            vibecode
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {session ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1 text-xs hover:opacity-80"
            >
              <span>{session.user?.githubUsername || session.user?.name}</span>
              <span className="text-[10px]">▼</span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-1 bg-[--yard-orange] border border-[#cc5200] shadow-lg min-w-[160px] z-50">
                <Link
                  href="/notifications"
                  className="block px-3 py-2 text-xs text-white hover:bg-[#cc5200] border-b border-[#cc5200]"
                  onClick={() => setShowUserMenu(false)}
                >
                  notifications
                  <NotificationCount />
                </Link>
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    signOut()
                  }}
                  className="block w-full text-left px-3 py-2 text-xs text-white hover:bg-[#cc5200]"
                >
                  logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => signIn('github')}
            className="text-xs hover:opacity-80"
          >
            login with github
          </button>
        )}
      </div>
    </header>
  )
}

function NotificationCount() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    async function fetchCount() {
      try {
        const response = await fetch('/api/notifications/count')
        if (response.ok) {
          const data = await response.json()
          setCount(data.count)
        }
      } catch {
        // Ignore errors
      }
    }
    fetchCount()
  }, [])

  if (count === 0) return null

  return (
    <span className="ml-2 px-1.5 py-0.5 bg-white text-[--yard-orange] text-[10px] font-medium">
      {count > 9 ? '9+' : count}
    </span>
  )
}

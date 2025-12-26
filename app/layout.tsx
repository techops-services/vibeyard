import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'vibeyard',
  description:
    'The junkyard for vibecode with potential',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Vibeyard RSS Feed"
          href="/feed.xml"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

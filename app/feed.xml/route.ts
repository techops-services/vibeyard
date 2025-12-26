import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /feed.xml
 * Returns an RSS 2.0 feed of the latest public repositories
 */
export async function GET() {
  try {
    // Fetch the last 50 public repositories, sorted by creation date (newest first)
    const repositories = await prisma.repository.findMany({
      where: {
        isPrivate: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
      include: {
        user: {
          select: {
            githubUsername: true,
          },
        },
        analysis: {
          select: {
            aiProvider: true,
          },
        },
      },
    })

    // Get base URL from environment or use default
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXTAUTH_URL ||
      'https://vibeyard.dev'

    // Build RSS feed
    const lastBuildDate = new Date().toUTCString()
    const feedUrl = `${baseUrl}/feed.xml`

    // Escape XML special characters
    const escapeXml = (str: string | null | undefined): string => {
      if (!str) return ''
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
    }

    // Generate RSS items
    const items = repositories
      .map((repo) => {
        const title = `${escapeXml(repo.name)} by ${escapeXml(repo.owner)}`
        const description = escapeXml(repo.description || 'No description provided')
        const link = `${baseUrl}/repo/${repo.id}`
        const pubDate = new Date(repo.createdAt).toUTCString()
        const category = repo.analysis?.aiProvider
          ? escapeXml(repo.analysis.aiProvider)
          : ''

        return `    <item>
      <title>${title}</title>
      <description>${description}</description>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>${category ? `\n      <category>${category}</category>` : ''}
    </item>`
      })
      .join('\n')

    // Build complete RSS feed
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Vibeyard - Latest Repositories</title>
    <description>A junkyard for vibecode with potential. Discover AI-assisted code projects.</description>
    <link>${baseUrl}</link>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items}
  </channel>
</rss>`

    // Return RSS feed with proper headers
    return new NextResponse(rss, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
      },
    })
  } catch (error) {
    console.error('Error generating RSS feed:', error)
    return new NextResponse('Error generating RSS feed', { status: 500 })
  }
}

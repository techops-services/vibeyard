import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const repositoryId = params.id

    // Fetch the repository
    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
      select: {
        id: true,
        owner: true,
        userId: true,
        name: true,
        fullName: true,
      },
    })

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    // Check if user already owns this repo in vibeyard
    if (repository.userId === session.user.id) {
      return NextResponse.json(
        { error: 'You already own this vibe' },
        { status: 400 }
      )
    }

    // Verify that the user's GitHub username matches the repo owner
    const githubUsername = session.user.githubUsername

    if (!githubUsername) {
      return NextResponse.json(
        { error: 'GitHub username not found. Please re-authenticate.' },
        { status: 400 }
      )
    }

    // Case-insensitive comparison (GitHub usernames are case-insensitive)
    if (githubUsername.toLowerCase() !== repository.owner.toLowerCase()) {
      return NextResponse.json(
        { error: 'You can only claim repositories you own on GitHub' },
        { status: 403 }
      )
    }

    // Transfer ownership
    await prisma.repository.update({
      where: { id: repositoryId },
      data: {
        userId: session.user.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Successfully claimed ${repository.fullName}`,
    })
  } catch (error) {
    console.error('Error claiming repository:', error)
    return NextResponse.json(
      { error: 'Failed to claim repository' },
      { status: 500 }
    )
  }
}

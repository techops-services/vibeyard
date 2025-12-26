import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const collaborationSettingsSchema = z.object({
  role: z.enum(['SEEKER', 'PROVIDER', 'BOTH']).nullable(),
  types: z.array(z.enum([
    'CODE_REVIEW',
    'BUG_FIX_HELP',
    'TEAM_FORMATION',
    'EXPERTISE_OFFER',
    'MENTORSHIP',
    'GENERAL_COLLABORATION'
  ])),
  details: z.string().nullable(),
  isAccepting: z.boolean(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const repository = await prisma.repository.findUnique({
      where: { id: params.id },
      select: { userId: true },
    })

    if (!repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }

    if (repository.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update settings
    const body = await request.json()
    const settings = collaborationSettingsSchema.parse(body)

    const updated = await prisma.repository.update({
      where: { id: params.id },
      data: {
        collaborationRole: settings.role,
        collaborationTypes: settings.types,
        collaborationDetails: settings.details,
        isAcceptingCollaborators: settings.isAccepting,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating collaboration settings:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}

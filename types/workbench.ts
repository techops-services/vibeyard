import { CollaborationRole, CollaborationType } from '@prisma/client'

export interface RepositoryWithAnalytics {
  id: string
  name: string
  fullName: string
  description: string | null
  votesCount: number
  followersCount: number
  viewsCount: number
  collaborationRole: CollaborationRole | null
  collaborationTypes: CollaborationType[]
  isAcceptingCollaborators: boolean
  _count: {
    votes: number
    follows: number
    views: number
    collaborationRequestsReceived: number
  }
  createdAt: Date
  updatedAt: Date
}

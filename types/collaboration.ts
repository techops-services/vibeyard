import { CollaborationRole, CollaborationType, CollaborationRequestStatus } from '@prisma/client'

export interface CollaborationOptions {
  role: CollaborationRole
  types: CollaborationType[]
  details?: string
  isAccepting: boolean
}

export interface CollaborationRequestWithRelations {
  id: string
  requestor: {
    id: string
    name: string | null
    image: string | null
    githubUsername: string | null
  }
  targetRepo: {
    id: string
    name: string
    fullName: string
  }
  targetOwner: {
    id: string
    name: string | null
  }
  collaborationType: CollaborationType
  message: string
  status: CollaborationRequestStatus
  createdAt: Date
  updatedAt: Date
  respondedAt?: Date | null
  responseMessage?: string | null
}

export interface ImprovementSuggestionWithRelations {
  id: string
  repositoryId: string
  repository: {
    id: string
    name: string
  }
  suggestedBy: {
    id: string
    name: string | null
    image: string | null
    githubUsername: string | null
  }
  title: string
  description: string
  category: string
  priority: string
  status: string
  upvotesCount: number
  ownerResponse?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface WorkbenchStats {
  totalRepos: number
  totalVotes: number
  totalFollows: number
  totalViews: number
  pendingCollabRequests: number
  activeSuggestions: number
}

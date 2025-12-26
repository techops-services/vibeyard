export interface Comment {
  id: string
  content: string
  userId: string
  repositoryId: string
  parentId: string | null
  depth: number
  votesCount: number
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
  user: {
    id: string
    name: string | null
    image: string | null
    githubUsername: string | null
  }
  votes?: CommentVote[]
  replies?: Comment[]
}

export interface CommentVote {
  id: string
  userId: string
  commentId: string
  createdAt: Date
}

export interface CommentWithUserVote extends Comment {
  hasVoted: boolean
}

export interface CommentTreeNode extends CommentWithUserVote {
  replies: CommentTreeNode[]
}

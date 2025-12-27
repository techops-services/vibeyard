'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CommentWithUserVote, CommentTreeNode } from '@/types/comment'
import { CommentItem } from './CommentItem'
import { CommentForm } from './CommentForm'

interface CommentThreadProps {
  repositoryId: string
  repositoryName: string
}

export function CommentThread({ repositoryId, repositoryName }: CommentThreadProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [comments, setComments] = useState<CommentTreeNode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch comments
  useEffect(() => {
    fetchComments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repositoryId])

  const fetchComments = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/repositories/${repositoryId}/comments`)

      if (!response.ok) {
        throw new Error('Failed to fetch comments')
      }

      const data: CommentWithUserVote[] = await response.json()

      // Build tree structure from flat list
      const tree = buildCommentTree(data)
      setComments(tree)
    } catch (err) {
      console.error('Error fetching comments:', err)
      setError('Failed to load comments')
    } finally {
      setIsLoading(false)
    }
  }

  // Build tree structure from flat comment list
  const buildCommentTree = (flatComments: CommentWithUserVote[]): CommentTreeNode[] => {
    const commentMap = new Map<string, CommentTreeNode>()
    const rootComments: CommentTreeNode[] = []

    // First pass: create map of all comments
    flatComments.forEach((comment) => {
      commentMap.set(comment.id, {
        ...comment,
        replies: [],
      })
    })

    // Second pass: build tree structure
    flatComments.forEach((comment) => {
      const node = commentMap.get(comment.id)!

      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId)
        if (parent) {
          parent.replies.push(node)
        } else {
          // Parent not found, treat as root
          rootComments.push(node)
        }
      } else {
        rootComments.push(node)
      }
    })

    // Sort by creation time (oldest first)
    const sortComments = (comments: CommentTreeNode[]) => {
      comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      comments.forEach((comment) => {
        if (comment.replies.length > 0) {
          sortComments(comment.replies)
        }
      })
    }

    sortComments(rootComments)

    return rootComments
  }

  const handleSubmitComment = async (content: string, parentId?: string) => {
    if (!session) {
      router.push('/signin')
      return
    }

    try {
      const response = await fetch(`/api/repositories/${repositoryId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          parentId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to post comment')
      }

      // Refresh comments
      await fetchComments()
    } catch (err) {
      console.error('Error posting comment:', err)
      throw err
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete comment')
      }

      // Refresh comments
      await fetchComments()
    } catch (err) {
      console.error('Error deleting comment:', err)
      throw err
    }
  }

  if (isLoading) {
    return (
      <div className="border-t border-[--yard-border] p-4">
        <div className="yard-meta text-xs">Loading comments...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="border-t border-[--yard-border] p-4">
        <div className="text-[--yard-error] text-xs">{error}</div>
      </div>
    )
  }

  return (
    <div className="border-t border-[--yard-border]">
      {/* Section header */}
      <div className="p-4 border-b border-[--yard-border]">
        <h2 className="text-sm font-semibold mono mb-3">
          Comments ({comments.reduce((acc, c) => acc + 1 + countReplies(c), 0)})
        </h2>

        {/* Add comment form */}
        {session ? (
          <CommentForm
            repositoryId={repositoryId}
            onSubmit={handleSubmitComment}
            placeholder={`Share your thoughts on ${repositoryName}...`}
          />
        ) : (
          <div className="text-xs yard-meta">
            <a
              href="/signin"
              className="text-[--yard-orange] hover:underline"
            >
              Sign in
            </a>{' '}
            to leave a comment
          </div>
        )}
      </div>

      {/* Comments list */}
      {comments.length === 0 ? (
        <div className="p-4 yard-meta text-xs">
          No comments yet. Be the first to share your thoughts!
        </div>
      ) : (
        <div className="bg-[--yard-light-gray]">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleSubmitComment}
              onDelete={handleDeleteComment}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Helper function to count all replies recursively
function countReplies(comment: CommentTreeNode): number {
  if (!comment.replies || comment.replies.length === 0) {
    return 0
  }

  return comment.replies.reduce((acc, reply) => acc + 1 + countReplies(reply), 0)
}

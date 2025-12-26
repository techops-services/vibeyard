'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { CommentTreeNode } from '@/types/comment'
import { CommentVote } from './CommentVote'
import { CommentForm } from './CommentForm'
import { formatRelativeTime } from '@/lib/utils'

interface CommentItemProps {
  comment: CommentTreeNode
  onReply: (content: string, parentId: string) => Promise<void>
  onDelete?: (commentId: string) => Promise<void>
}

export function CommentItem({ comment, onReply, onDelete }: CommentItemProps) {
  const { data: session } = useSession()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isReplying, setIsReplying] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isOwner = session?.user?.id === comment.userId
  const username = comment.user.githubUsername || comment.user.name || 'Anonymous'
  const indentLevel = Math.min(comment.depth, 6) // Max 6 levels of visual indentation

  const handleDelete = async () => {
    if (!onDelete || !confirm('Are you sure you want to delete this comment?')) {
      return
    }

    setIsDeleting(true)
    try {
      await onDelete(comment.id)
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('Failed to delete comment')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleReplySubmit = async (content: string) => {
    await onReply(content, comment.id)
    setIsReplying(false)
  }

  return (
    <div
      className="border-b border-[--yard-border] last:border-b-0"
      style={{ paddingLeft: `${indentLevel * 20}px` }}
    >
      {/* Comment header */}
      <div className="py-2 text-xs">
        <div className="flex items-center gap-2 mb-1">
          {/* Collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-[--yard-gray] hover:text-[--yard-orange] mono text-xs w-4"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? '[+]' : '[-]'}
          </button>

          {/* Username */}
          <span className="mono text-[--yard-gray] hover:underline cursor-pointer">
            {username}
          </span>

          {/* Time */}
          <span className="yard-meta">
            {formatRelativeTime(new Date(comment.createdAt))}
          </span>

          {/* Actions */}
          {!isCollapsed && (
            <>
              <span className="yard-meta">|</span>
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="yard-meta hover:text-[--yard-orange] hover:underline"
              >
                reply
              </button>

              {isOwner && !comment.isDeleted && (
                <>
                  <span className="yard-meta">|</span>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="yard-meta hover:text-[--yard-error] hover:underline disabled:opacity-50"
                  >
                    {isDeleting ? 'deleting...' : 'delete'}
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* Comment content */}
        {!isCollapsed && (
          <>
            <div
              className={`text-xs leading-relaxed whitespace-pre-wrap mb-2 ${
                comment.isDeleted ? 'yard-meta italic' : ''
              }`}
            >
              {comment.content}
            </div>

            {/* Vote and points */}
            <div className="flex items-center gap-2">
              {!comment.isDeleted && (
                <>
                  <CommentVote
                    commentId={comment.id}
                    initialVoted={comment.hasVoted}
                    initialCount={comment.votesCount}
                  />
                  {comment.votesCount > 0 && (
                    <span className="yard-meta text-xs">
                      {comment.votesCount === 1 ? 'point' : 'points'}
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Reply form */}
            {isReplying && (
              <div className="mt-3">
                <CommentForm
                  repositoryId={comment.repositoryId}
                  parentId={comment.id}
                  onSubmit={handleReplySubmit}
                  onCancel={() => setIsReplying(false)}
                  placeholder="Write your reply..."
                  autoFocus
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Nested replies */}
      {!isCollapsed && comment.replies && comment.replies.length > 0 && (
        <div>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

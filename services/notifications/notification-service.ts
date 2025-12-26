import { prisma } from '@/lib/prisma'
import { NotificationType } from '@prisma/client'

export interface CreateNotificationData {
  userId: string
  type: NotificationType
  title: string
  message: string
  repositoryId?: string
  activityId?: string
}

export interface GetNotificationsOptions {
  unreadOnly?: boolean
  limit?: number
  offset?: number
}

/**
 * Create a new notification for a user
 */
export async function createNotification(data: CreateNotificationData) {
  return await prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      repositoryId: data.repositoryId,
      activityId: data.activityId,
    },
    include: {
      repository: {
        select: {
          id: true,
          name: true,
          fullName: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  })
}

/**
 * Get notifications for a user
 */
export async function getNotifications(
  userId: string,
  options: GetNotificationsOptions = {}
) {
  const { unreadOnly = false, limit = 25, offset = 0 } = options

  const where = {
    userId,
    ...(unreadOnly ? { read: false } : {}),
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      include: {
        repository: {
          select: {
            id: true,
            name: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    }),
    prisma.notification.count({ where }),
  ])

  return {
    notifications,
    total,
    hasMore: offset + limit < total,
  }
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string, userId: string) {
  // Verify the notification belongs to the user
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  })

  if (!notification) {
    throw new Error('Notification not found')
  }

  return await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  })
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string) {
  return await prisma.notification.updateMany({
    where: {
      userId,
      read: false,
    },
    data: {
      read: true,
    },
  })
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string) {
  return await prisma.notification.count({
    where: {
      userId,
      read: false,
    },
  })
}

/**
 * Create notification for new vote on user's repository
 */
export async function notifyNewVote(
  ownerId: string,
  voterName: string,
  repositoryId: string,
  repositoryName: string,
  activityId?: string
) {
  return await createNotification({
    userId: ownerId,
    type: 'NEW_VOTE',
    title: 'New vote on your repository',
    message: `${voterName} upvoted ${repositoryName}`,
    repositoryId,
    activityId,
  })
}

/**
 * Create notification for new follower on user's repository
 */
export async function notifyNewFollower(
  ownerId: string,
  followerName: string,
  repositoryId: string,
  repositoryName: string,
  activityId?: string
) {
  return await createNotification({
    userId: ownerId,
    type: 'NEW_FOLLOWER',
    title: 'New follower on your repository',
    message: `${followerName} is now following ${repositoryName}`,
    repositoryId,
    activityId,
  })
}

/**
 * Create notification for new collaboration request
 */
export async function notifyNewCollaborationRequest(
  ownerId: string,
  requesterName: string,
  repositoryId: string,
  repositoryName: string,
  collaborationType: string
) {
  return await createNotification({
    userId: ownerId,
    type: 'NEW_COLLABORATION_REQUEST',
    title: 'New collaboration request',
    message: `${requesterName} wants to collaborate on ${repositoryName} (${collaborationType})`,
    repositoryId,
  })
}

/**
 * Create notification for collaboration status change
 */
export async function notifyCollaborationStatusChange(
  requesterId: string,
  ownerName: string,
  repositoryName: string,
  status: string,
  repositoryId: string
) {
  const statusText = status === 'ACCEPTED' ? 'accepted' : status === 'DECLINED' ? 'declined' : 'updated'

  return await createNotification({
    userId: requesterId,
    type: 'COLLABORATION_STATUS_CHANGE',
    title: 'Collaboration request updated',
    message: `${ownerName} ${statusText} your collaboration request for ${repositoryName}`,
    repositoryId,
  })
}

/**
 * Create notification for new suggestion on user's repository
 */
export async function notifyNewSuggestion(
  ownerId: string,
  suggesterName: string,
  repositoryId: string,
  repositoryName: string,
  suggestionTitle: string
) {
  return await createNotification({
    userId: ownerId,
    type: 'NEW_SUGGESTION',
    title: 'New suggestion on your repository',
    message: `${suggesterName} suggested: ${suggestionTitle} on ${repositoryName}`,
    repositoryId,
  })
}

/**
 * Create notification for completed analysis
 */
export async function notifyAnalysisComplete(
  ownerId: string,
  repositoryId: string,
  repositoryName: string,
  completenessScore?: number
) {
  const scoreText = completenessScore !== undefined ? ` (Score: ${completenessScore}/100)` : ''

  return await createNotification({
    userId: ownerId,
    type: 'NEW_ANALYSIS_COMPLETE',
    title: 'Repository analysis complete',
    message: `Analysis for ${repositoryName} is complete${scoreText}`,
    repositoryId,
  })
}

/**
 * Create notification for new comment on user's repository
 */
export async function notifyNewComment(
  ownerId: string,
  commenterName: string,
  repositoryId: string,
  repositoryName: string
) {
  return await createNotification({
    userId: ownerId,
    type: 'NEW_COMMENT',
    title: 'New comment on your repository',
    message: `${commenterName} commented on ${repositoryName}`,
    repositoryId,
  })
}

/**
 * Create notification for reply to user's comment
 */
export async function notifyCommentReply(
  commentAuthorId: string,
  replierName: string,
  repositoryId: string,
  repositoryName: string
) {
  return await createNotification({
    userId: commentAuthorId,
    type: 'COMMENT_REPLY',
    title: 'New reply to your comment',
    message: `${replierName} replied to your comment on ${repositoryName}`,
    repositoryId,
  })
}

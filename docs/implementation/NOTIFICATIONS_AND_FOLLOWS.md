# Repository Following & Notifications System

Implementation completed on 2025-12-26

## Overview

This document describes the Repository Following & Notifications system implemented for Vibeyard, which allows users to follow repositories they're interested in and receive real-time notifications about activities on their repositories.

## Database Schema

### Notification Model
Added to `/prisma/schema.prisma`:
- **id**: Unique identifier
- **userId**: User receiving the notification
- **type**: NotificationType enum (NEW_VOTE, NEW_FOLLOWER, NEW_COLLABORATION_REQUEST, COLLABORATION_STATUS_CHANGE, NEW_SUGGESTION, NEW_ANALYSIS_COMPLETE)
- **title**: Notification title
- **message**: Notification message
- **repositoryId**: Optional reference to repository
- **activityId**: Optional reference to activity
- **read**: Boolean flag for read status
- **createdAt**: Timestamp

### NotificationType Enum
- `NEW_VOTE` - When someone upvotes your repository
- `NEW_FOLLOWER` - When someone follows your repository
- `NEW_COLLABORATION_REQUEST` - When someone requests collaboration
- `COLLABORATION_STATUS_CHANGE` - When collaboration request status changes
- `NEW_SUGGESTION` - When someone suggests an improvement
- `NEW_ANALYSIS_COMPLETE` - When repository analysis completes

## Backend Services

### Notification Service (`/services/notifications/notification-service.ts`)

Core functions:
- `createNotification()` - Create a new notification
- `getNotifications()` - Get notifications with pagination and filtering
- `markAsRead()` - Mark single notification as read
- `markAllAsRead()` - Mark all user notifications as read
- `getUnreadCount()` - Get count of unread notifications

Helper functions for specific notification types:
- `notifyNewVote()` - Notify owner of new vote
- `notifyNewFollower()` - Notify owner of new follower
- `notifyNewCollaborationRequest()` - Notify owner of collaboration request
- `notifyCollaborationStatusChange()` - Notify requester of status change
- `notifyNewSuggestion()` - Notify owner of new suggestion
- `notifyAnalysisComplete()` - Notify owner of completed analysis

## API Endpoints

### Follow Endpoints

#### `POST /api/repositories/[id]/follow`
Toggle follow status for a repository
- **Auth**: Required
- **Returns**: `{ following: boolean, followersCount: number }`
- **Side effects**: Creates activity, sends notification to owner

#### `GET /api/user/follows`
Get all repositories the current user is following
- **Auth**: Required
- **Returns**: Array of follows with repository details and latest activity
- **Includes**: Repository analysis, vote counts, follower counts

### Notification Endpoints

#### `GET /api/notifications`
List notifications with pagination
- **Auth**: Required
- **Query params**: `unreadOnly`, `limit`, `offset`
- **Returns**: `{ notifications: [], total: number, hasMore: boolean }`

#### `POST /api/notifications/[id]/read`
Mark a single notification as read
- **Auth**: Required
- **Security**: Verifies notification belongs to user

#### `POST /api/notifications/read-all`
Mark all notifications as read for current user
- **Auth**: Required
- **Returns**: `{ success: true, count: number }`

#### `GET /api/notifications/count`
Get unread notification count
- **Auth**: Required
- **Returns**: `{ count: number }`

## UI Components

### FollowButton (`/app/components/ui/FollowButton.tsx`)
- Client-side component for following/unfollowing repositories
- Optimistic updates for instant feedback
- Shows follower count
- Handles loading states
- Redirects to signin if not authenticated

### NotificationBell (`/app/components/ui/NotificationBell.tsx`)
- Displays in header for authenticated users
- Shows unread count badge
- Dropdown with recent 10 notifications
- Auto-refreshes count every 30 seconds
- "Mark all as read" functionality
- Link to full notifications page

### NotificationItem (`/app/components/ui/NotificationItem.tsx`)
- Single notification display component
- Icon based on notification type
- Relative timestamp
- Click to mark as read
- Links to repository if applicable

### Notifications Page (`/app/notifications/page.tsx`)
- Full-page notification list
- Filter by all/unread
- Pagination (50 per page)
- Mark all as read
- Loading states

## Integration Points

### Updated Vote Endpoint
`/app/api/repositories/[id]/vote/route.ts`
- Sends notification to repository owner when someone votes
- Skips notification if user votes on own repo

### Updated Collaboration Request Creation
`/app/api/collaboration-requests/route.ts`
- Sends notification to repository owner when collaboration request is created

### Updated Collaboration Request Status
`/app/api/collaboration-requests/[id]/route.ts`
- Sends notification to requester when owner accepts/declines request

### Updated Suggestions
`/app/api/suggestions/route.ts`
- Sends notification to repository owner when new suggestion is created
- Skips notification if user suggests on own repo

### Updated Layout
`/app/layout.tsx` and `/app/components/YardHeader.tsx`
- Added NotificationBell to header for authenticated users

### Updated Repository Detail Page
`/app/repo/[id]/page.tsx`
- Added FollowButton component
- Checks current user's follow status
- Hidden for repository owners

### Updated RepoItem Component
`/app/components/RepoItem.tsx`
- Added `followersCount` prop
- Displays follower count in metadata

### Updated Home Page
`/app/page.tsx`
- Passes `followersCount` to RepoItem components

## Design Considerations

### UI/UX
- Matches junkyard aesthetic with minimal, clean design
- Notification bell positioned in top right of header
- Dropdown slides down on click
- Unread notifications highlighted with orange background
- Badge on bell shows unread count (9+ for >9 notifications)
- Icons for different notification types (▲ for votes, 👁 for follows, etc.)

### Performance
- Notification count auto-refreshes every 30 seconds
- Optimistic updates for follow/unfollow actions
- Pagination for notification list
- Indexed database queries for fast lookups

### Security
- All endpoints require authentication
- Notifications verified to belong to user
- Follow operations properly check repository existence
- No notification spam (skips self-notifications)

### Data Integrity
- Follower counts maintained accurately
- Activities created for trackable actions
- Cascade deletes configured properly
- NULL on delete for optional references

## Testing

### Build Status
- ✅ TypeScript compilation successful
- ✅ Next.js build successful
- ✅ All new routes registered correctly
- ✅ No breaking changes to existing functionality

### Manual Testing Checklist
- [ ] Follow/unfollow repository
- [ ] Verify follower count updates
- [ ] Receive notification for new vote
- [ ] Receive notification for new follower
- [ ] Receive notification for collaboration request
- [ ] Receive notification for suggestion
- [ ] Mark single notification as read
- [ ] Mark all notifications as read
- [ ] Filter notifications by unread
- [ ] Pagination on notifications page
- [ ] Notification bell badge count
- [ ] Follow button on repo detail page
- [ ] Follower count on repo list

## Future Enhancements

Potential improvements:
1. Email notifications for important events
2. Push notifications (browser/mobile)
3. Notification preferences/settings
4. Notification grouping (e.g., "3 people voted on your repo")
5. Real-time updates via WebSockets
6. Activity feed on user profile
7. Following users (not just repositories)
8. Mute notifications for specific repositories

## Files Created/Modified

### Created Files
- `/services/notifications/notification-service.ts`
- `/app/api/repositories/[id]/follow/route.ts`
- `/app/api/user/follows/route.ts`
- `/app/api/notifications/route.ts`
- `/app/api/notifications/[id]/read/route.ts`
- `/app/api/notifications/read-all/route.ts`
- `/app/api/notifications/count/route.ts`
- `/app/components/ui/FollowButton.tsx`
- `/app/components/ui/NotificationBell.tsx`
- `/app/components/ui/NotificationItem.tsx`
- `/app/notifications/page.tsx`

### Modified Files
- `/prisma/schema.prisma` - Added Notification model and enum
- `/app/api/repositories/[id]/vote/route.ts` - Added notification
- `/app/api/collaboration-requests/route.ts` - Added notification
- `/app/api/collaboration-requests/[id]/route.ts` - Added notification
- `/app/api/suggestions/route.ts` - Added notification
- `/app/components/YardHeader.tsx` - Added NotificationBell
- `/app/repo/[id]/page.tsx` - Added FollowButton
- `/app/components/RepoItem.tsx` - Added follower count
- `/app/page.tsx` - Pass follower count to RepoItem

## Database Migration

Run the following to apply schema changes:
```bash
npx prisma db push
```

The migration adds:
- `notifications` table with indexes
- `NotificationType` enum
- Relations to User, Repository, and Activity models

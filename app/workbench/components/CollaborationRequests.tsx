'use client'

import Image from 'next/image'
import Link from 'next/link'
import { CollaborationRequest, User, Repository } from '@prisma/client'

type RequestWithRelations = CollaborationRequest & {
  requestor: Pick<User, 'id' | 'name' | 'image' | 'githubUsername'>
  targetRepo: Pick<Repository, 'id' | 'name' | 'fullName'>
}

interface Props {
  requests: RequestWithRelations[]
}

export function CollaborationRequests({ requests }: Props) {
  return (
    <div className="border border-[--yard-border]">
      <div className="p-4 border-b border-[--yard-border] flex items-center justify-between">
        <h2 className="text-lg font-bold mono">pending requests</h2>
        {requests.length > 5 && (
          <Link
            href="/workbench/requests"
            className="text-xs yard-meta hover:text-[--yard-orange] hover:underline"
          >
            view all →
          </Link>
        )}
      </div>

      {requests.length === 0 ? (
        <div className="p-4 yard-meta text-sm">
          No pending collaboration requests.
        </div>
      ) : (
        <div className="divide-y divide-[--yard-border]">
          {requests.map((request) => (
            <div key={request.id} className="p-4">
              <div className="flex items-start gap-3">
                {request.requestor.image && (
                  <Image
                    src={request.requestor.image}
                    alt={request.requestor.name || 'User'}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">
                      {request.requestor.name || request.requestor.githubUsername}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-[--yard-light-gray]">
                      {request.collaborationType.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  </div>
                  <p className="text-sm yard-meta mb-2">
                    wants to collaborate on{' '}
                    <Link
                      href={`/repo/${request.targetRepo.id}`}
                      className="hover:text-[--yard-orange] hover:underline"
                    >
                      {request.targetRepo.name}
                    </Link>
                  </p>
                  <p className="text-xs line-clamp-2">{request.message}</p>
                  <div className="yard-meta text-xs mt-2">
                    {formatDistanceToNow(new Date(request.createdAt))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Simple time ago formatter
function formatDistanceToNow(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`
  return `${Math.floor(seconds / 604800)} weeks ago`
}

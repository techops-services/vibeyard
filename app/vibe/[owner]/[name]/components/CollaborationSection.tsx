'use client'

import Image from 'next/image'
import { CollaborationType } from '@prisma/client'
import { useState } from 'react'
import { RequestCollaborationForm } from './RequestCollaborationForm'

interface Collaborator {
  id: string
  name: string | null
  image: string | null
  githubUsername: string | null
  role: string
}

interface CollaborationSectionProps {
  repositoryId: string
  repositoryName: string
  ownerId: string
  isOwner: boolean
  isLoggedIn: boolean
  currentUserId?: string
  isSeeker: boolean
  collaborationTypes: CollaborationType[]
  collaborationDetails: string | null
  isAcceptingCollaborators: boolean
  activeCollaborators: Collaborator[]
}

export function CollaborationSection({
  repositoryId,
  repositoryName,
  ownerId,
  isOwner,
  isLoggedIn,
  currentUserId: _currentUserId,
  isSeeker,
  collaborationTypes,
  collaborationDetails,
  isAcceptingCollaborators,
  activeCollaborators,
}: CollaborationSectionProps) {
  const [showRequestForm, setShowRequestForm] = useState(false)

  // Don't show section if no collaboration is set up
  if (!isSeeker && !isAcceptingCollaborators) {
    return null
  }

  return (
    <div className="border border-[--yard-border] bg-white">
      <div className="p-4 border-b border-[--yard-border]">
        <h2 className="text-sm font-semibold mono">collaboration</h2>
      </div>

      <div className="p-4 space-y-4">
        {/* Seeker Badge */}
        {isSeeker && (
          <div className="flex items-center gap-3">
            <span className="text-xs yard-meta">role:</span>
            <span className="px-2 py-1 bg-[--yard-orange] text-white text-xs font-medium">
              seeker
            </span>
            <span className={`text-xs ${isAcceptingCollaborators ? 'text-green-600' : 'yard-meta'}`}>
              {isAcceptingCollaborators ? '● accepting requests' : '○ not accepting'}
            </span>
          </div>
        )}

        {/* Collaboration Types */}
        {collaborationTypes.length > 0 && (
          <div>
            <div className="text-xs yard-meta mb-2">looking for:</div>
            <div className="flex flex-wrap gap-1">
              {collaborationTypes.map((type) => (
                <span
                  key={type}
                  className="px-2 py-0.5 bg-[--yard-light-gray] text-[--yard-gray] text-xs mono"
                >
                  {formatCollaborationType(type)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Collaboration Details */}
        {collaborationDetails && (
          <div>
            <div className="text-xs yard-meta mb-1">details:</div>
            <p className="text-xs leading-relaxed">{collaborationDetails}</p>
          </div>
        )}

        {/* Active Collaborators */}
        {activeCollaborators.length > 0 && (
          <div>
            <div className="text-xs yard-meta mb-2">
              active collaborators ({activeCollaborators.length})
            </div>
            <div className="space-y-2">
              {activeCollaborators.map((collaborator) => (
                <div key={collaborator.id} className="flex items-center gap-2">
                  {collaborator.image && (
                    <Image
                      src={collaborator.image}
                      alt={collaborator.name || 'User'}
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <span className="text-xs">
                    {collaborator.name || collaborator.githubUsername}
                  </span>
                  <span className="text-xs yard-meta">
                    ({collaborator.role})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Request Collaboration Button */}
        {!isOwner && isLoggedIn && isAcceptingCollaborators && !showRequestForm && (
          <button
            onClick={() => setShowRequestForm(true)}
            className="yard-button w-full"
          >
            request collaboration
          </button>
        )}

        {/* Request Form */}
        {showRequestForm && (
          <RequestCollaborationForm
            repositoryId={repositoryId}
            repositoryName={repositoryName}
            targetOwnerId={ownerId}
            availableTypes={collaborationTypes}
            onClose={() => setShowRequestForm(false)}
            onSuccess={() => setShowRequestForm(false)}
          />
        )}

        {/* Message for non-logged-in users */}
        {!isOwner && !isLoggedIn && isAcceptingCollaborators && (
          <div className="text-xs yard-meta text-center py-2">
            Sign in to request collaboration
          </div>
        )}

        {/* Message when not accepting */}
        {!isOwner && !isAcceptingCollaborators && isSeeker && (
          <div className="text-xs yard-meta text-center py-2">
            Not currently accepting collaboration requests
          </div>
        )}
      </div>
    </div>
  )
}

function formatCollaborationType(type: CollaborationType): string {
  return type
    .toLowerCase()
    .replace(/_/g, ' ')
}

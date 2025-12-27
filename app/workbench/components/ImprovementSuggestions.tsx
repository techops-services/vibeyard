'use client'

import Link from 'next/link'
import { ImprovementSuggestion, User, Repository } from '@prisma/client'

type SuggestionWithRelations = ImprovementSuggestion & {
  repository: Pick<Repository, 'id' | 'name' | 'owner'>
  suggestedBy: Pick<User, 'id' | 'name' | 'githubUsername'>
}

interface Props {
  suggestions: SuggestionWithRelations[]
}

export function ImprovementSuggestions({ suggestions }: Props) {
  return (
    <div className="border border-[--yard-border]">
      <div className="p-4 border-b border-[--yard-border] flex items-center justify-between">
        <h2 className="text-lg font-bold mono">community suggestions</h2>
        {suggestions.length > 5 && (
          <Link
            href="/workbench/suggestions"
            className="text-xs yard-meta hover:text-[--yard-orange] hover:underline"
          >
            view all →
          </Link>
        )}
      </div>

      {suggestions.length === 0 ? (
        <div className="p-4 yard-meta text-sm">
          No active improvement suggestions.
        </div>
      ) : (
        <div className="divide-y divide-[--yard-border]">
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <Link
                  href={`/vibe/${suggestion.repository.owner}/${suggestion.repository.name}`}
                  className="font-medium hover:text-[--yard-orange] hover:underline flex-1"
                >
                  {suggestion.title}
                </Link>
                <span className="text-xs px-2 py-0.5 bg-[--yard-light-gray] whitespace-nowrap">
                  {suggestion.category}
                </span>
              </div>
              <p className="text-sm yard-meta mb-2">
                for {suggestion.repository.name}
              </p>
              <p className="text-xs line-clamp-2 mb-2">{suggestion.description}</p>
              <div className="flex items-center gap-3 yard-meta text-xs">
                <span>by {suggestion.suggestedBy.name || suggestion.suggestedBy.githubUsername}</span>
                <span>•</span>
                <span>{suggestion.upvotesCount} upvotes</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { StarRating } from '@/app/components/ui/StarRating'
import { CompletenessBreakdown } from '@/app/components/ui/CompletenessBreakdown'
import { AnalysisStatus } from '@/app/components/ui/AnalysisStatus'

interface AnalysisSectionProps {
  repositoryId: string
  completenessScore: number | null
  analysisStatus: string
  aiDetected?: boolean
  aiProvider?: string | null
  aiConfidence?: number | null
  isOwner?: boolean
}

export function AnalysisSection({
  repositoryId,
  completenessScore,
  analysisStatus,
  aiDetected = false,
  aiProvider = null,
  aiConfidence = null,
  isOwner = false,
}: AnalysisSectionProps) {
  const [showBreakdown, setShowBreakdown] = useState(false)

  const handleStarClick = () => {
    if (completenessScore !== null) {
      setShowBreakdown(true)
    }
  }

  return (
    <>
      <div className="mt-6">
        <h2 className="text-sm font-semibold mb-3 mono">Repository Analysis</h2>

        {/* Completeness Score */}
        <div className="mb-3">
          <div className="text-xs yard-meta mb-1">Completeness Score:</div>
          {completenessScore !== null ? (
            <div className="flex items-center gap-2">
              <StarRating
                score={completenessScore}
                size="md"
                onClick={handleStarClick}
              />
              <button
                onClick={handleStarClick}
                className="text-xs hover:text-[--yard-orange] hover:underline yard-meta"
              >
                view breakdown
              </button>
            </div>
          ) : isOwner ? (
            <AnalysisStatus
              repositoryId={repositoryId}
              initialStatus={analysisStatus}
              size="md"
              onAnalysisComplete={() => window.location.reload()}
            />
          ) : (
            <span className="text-xs yard-meta">Not yet analyzed</span>
          )}
        </div>

        {/* AI Detection */}
        {aiDetected && (
          <div className="text-xs yard-meta">
            <p className="mb-1">
              AI detected: {aiProvider || 'unknown'}
            </p>
            {aiConfidence !== null && (
              <p>
                Confidence: {(aiConfidence * 100).toFixed(0)}%
              </p>
            )}
          </div>
        )}

        {!aiDetected && completenessScore !== null && (
          <div className="text-xs yard-meta">
            <p>No AI assistance detected</p>
          </div>
        )}
      </div>

      {/* Completeness Breakdown Modal */}
      {completenessScore !== null && (
        <CompletenessBreakdown
          repositoryId={repositoryId}
          completenessScore={completenessScore}
          isOpen={showBreakdown}
          onClose={() => setShowBreakdown(false)}
        />
      )}
    </>
  )
}

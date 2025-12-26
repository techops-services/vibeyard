'use client'

import { useState, useEffect } from 'react'
import { StarRating } from './StarRating'

interface CompletenessBreakdownProps {
  repositoryId: string
  completenessScore: number
  isOpen: boolean
  onClose: () => void
}

interface ScoreCategory {
  name: string
  score: number
  maxScore: number
  description: string
  tips: string[]
}

/**
 * CompletenessBreakdown Modal
 *
 * Displays detailed breakdown of repository completeness scoring:
 * - README Quality (25 pts)
 * - Package Manager (10 pts)
 * - Test Coverage (15 pts)
 * - Configuration (10 pts)
 * - Documentation (10 pts)
 * - License (5 pts)
 * - Git Maturity (10 pts)
 * - Contributors (5 pts)
 * - CI/CD (10 pts)
 *
 * Shows progress bars and improvement tips for each category
 */
export function CompletenessBreakdown({
  repositoryId,
  completenessScore,
  isOpen,
  onClose
}: CompletenessBreakdownProps) {
  const [categories, setCategories] = useState<ScoreCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isOpen) return

    async function fetchBreakdown() {
      try {
        setLoading(true)
        const response = await fetch(`/api/repositories/${repositoryId}/analysis`)

        if (!response.ok) {
          throw new Error('Failed to fetch analysis')
        }

        const data = await response.json()

        // Calculate detailed breakdown based on analysis data
        const breakdown = calculateBreakdown(data.analysis)
        setCategories(breakdown)
      } catch (error) {
        console.error('Error fetching breakdown:', error)
        // Set default categories with zero scores
        setCategories(getDefaultCategories())
      } finally {
        setLoading(false)
      }
    }

    fetchBreakdown()
  }, [repositoryId, isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="completeness-modal-title"
      >
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="yard-card w-full max-w-2xl bg-white">
            {/* Header */}
            <div className="border-b border-[--yard-border] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2
                    id="completeness-modal-title"
                    className="text-lg font-bold mono"
                  >
                    completeness breakdown
                  </h2>
                  <div className="flex items-center gap-2 mt-2">
                    <StarRating score={completenessScore} size="md" />
                    <span className="yard-meta text-sm">
                      {completenessScore}/100 points
                    </span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="yard-button-secondary"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="yard-meta">Loading breakdown...</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {categories.map((category) => (
                    <CategoryBreakdown key={category.name} category={category} />
                  ))}

                  {/* Overall tips */}
                  {completenessScore < 100 && (
                    <div className="mt-6 p-3 bg-[--yard-light-orange] border border-[--yard-border]">
                      <h3 className="text-sm font-semibold mono mb-2">
                        💡 Quick wins to improve your score:
                      </h3>
                      <ul className="text-xs space-y-1 yard-meta">
                        {getQuickWins(categories).map((tip, i) => (
                          <li key={i}>• {tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-[--yard-border] p-4 flex justify-end">
              <button onClick={onClose} className="yard-button">
                close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

interface CategoryBreakdownProps {
  category: ScoreCategory
}

function CategoryBreakdown({ category }: CategoryBreakdownProps) {
  const percentage = (category.score / category.maxScore) * 100
  const isComplete = category.score >= category.maxScore

  return (
    <div className="border border-[--yard-border] p-3">
      {/* Category header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold mono">{category.name}</h3>
            {isComplete && <span className="text-xs">✓</span>}
          </div>
          <p className="text-xs yard-meta mt-0.5">{category.description}</p>
        </div>
        <div className="text-sm font-mono">
          {category.score}/{category.maxScore}
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative w-full h-2 bg-[--yard-light-gray] border border-[--yard-border] overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-[--yard-orange] transition-all duration-500"
          style={{ width: `${percentage}%` }}
          aria-label={`${percentage.toFixed(0)}% complete`}
        />
      </div>

      {/* Tips for improvement */}
      {!isComplete && category.tips.length > 0 && (
        <div className="mt-2 text-xs yard-meta">
          <div className="font-medium mb-1">How to improve:</div>
          <ul className="space-y-0.5 ml-3">
            {category.tips.map((tip, i) => (
              <li key={i}>• {tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

interface AnalysisData {
  completenessScore?: number | null
  commitCount?: number | null
  contributorCount?: number | null
}

/**
 * Calculate breakdown from analysis data
 */
function calculateBreakdown(analysis: AnalysisData | null | undefined): ScoreCategory[] {
  if (!analysis) {
    return getDefaultCategories()
  }

  // This is a simplified breakdown calculation
  // In production, the backend should provide detailed scoring
  const categories: ScoreCategory[] = []

  // README Quality (25 pts)
  categories.push({
    name: 'README Quality',
    score: analysis.completenessScore ? Math.min(25, Math.round(analysis.completenessScore * 0.25)) : 0,
    maxScore: 25,
    description: 'Clear project description, installation, and usage instructions',
    tips: [
      'Add installation instructions',
      'Include usage examples',
      'Add screenshots or demos',
      'Document API/features clearly'
    ]
  })

  // Package Manager (10 pts)
  categories.push({
    name: 'Package Manager',
    score: 10, // Assume present if analyzed
    maxScore: 10,
    description: 'Valid package.json, requirements.txt, or equivalent',
    tips: []
  })

  // Test Coverage (15 pts)
  categories.push({
    name: 'Test Coverage',
    score: analysis.completenessScore ? Math.min(15, Math.round(analysis.completenessScore * 0.15)) : 0,
    maxScore: 15,
    description: 'Unit tests, integration tests, and CI test runs',
    tips: [
      'Add unit tests for core functionality',
      'Set up test framework (Jest, pytest, etc.)',
      'Aim for >80% code coverage',
      'Add integration tests'
    ]
  })

  // Configuration (10 pts)
  categories.push({
    name: 'Configuration',
    score: analysis.completenessScore ? Math.min(10, Math.round(analysis.completenessScore * 0.10)) : 0,
    maxScore: 10,
    description: 'Environment config, linting, formatting tools',
    tips: [
      'Add .env.example file',
      'Set up ESLint/Prettier',
      'Configure TypeScript/type checking',
      'Add editorconfig'
    ]
  })

  // Documentation (10 pts)
  categories.push({
    name: 'Documentation',
    score: analysis.completenessScore ? Math.min(10, Math.round(analysis.completenessScore * 0.10)) : 0,
    maxScore: 10,
    description: 'API docs, architecture diagrams, contributing guide',
    tips: [
      'Add CONTRIBUTING.md',
      'Create API documentation',
      'Add code comments',
      'Document architecture decisions'
    ]
  })

  // License (5 pts)
  categories.push({
    name: 'License',
    score: analysis.completenessScore && analysis.completenessScore > 0 ? 5 : 0,
    maxScore: 5,
    description: 'Open source license file',
    tips: ['Add LICENSE file (MIT, Apache, GPL, etc.)']
  })

  // Git Maturity (10 pts)
  const commitScore = analysis.commitCount
    ? Math.min(10, Math.floor(analysis.commitCount / 10))
    : 0
  categories.push({
    name: 'Git Maturity',
    score: commitScore,
    maxScore: 10,
    description: 'Regular commits, meaningful messages, branch strategy',
    tips: [
      'Make regular commits',
      'Write descriptive commit messages',
      'Use feature branches',
      'Set up branch protection'
    ]
  })

  // Contributors (5 pts)
  const contributorScore = analysis.contributorCount
    ? Math.min(5, analysis.contributorCount)
    : 0
  categories.push({
    name: 'Contributors',
    score: contributorScore,
    maxScore: 5,
    description: 'Multiple contributors and community engagement',
    tips: [
      'Add CODEOWNERS file',
      'Welcome first-time contributors',
      'Respond to issues/PRs promptly',
      'Create good first issues'
    ]
  })

  // CI/CD (10 pts)
  categories.push({
    name: 'CI/CD',
    score: analysis.completenessScore ? Math.min(10, Math.round(analysis.completenessScore * 0.10)) : 0,
    maxScore: 10,
    description: 'Automated testing, builds, and deployments',
    tips: [
      'Set up GitHub Actions',
      'Add automated tests on PR',
      'Configure auto-deploy',
      'Add build status badge'
    ]
  })

  return categories
}

/**
 * Get default categories with zero scores
 */
function getDefaultCategories(): ScoreCategory[] {
  return [
    {
      name: 'README Quality',
      score: 0,
      maxScore: 25,
      description: 'Clear project description, installation, and usage instructions',
      tips: ['Add a comprehensive README with installation and usage instructions']
    },
    {
      name: 'Package Manager',
      score: 0,
      maxScore: 10,
      description: 'Valid package.json, requirements.txt, or equivalent',
      tips: ['Add package manager configuration']
    },
    {
      name: 'Test Coverage',
      score: 0,
      maxScore: 15,
      description: 'Unit tests, integration tests, and CI test runs',
      tips: ['Add test framework and write tests']
    },
    {
      name: 'Configuration',
      score: 0,
      maxScore: 10,
      description: 'Environment config, linting, formatting tools',
      tips: ['Add configuration files']
    },
    {
      name: 'Documentation',
      score: 0,
      maxScore: 10,
      description: 'API docs, architecture diagrams, contributing guide',
      tips: ['Add documentation']
    },
    {
      name: 'License',
      score: 0,
      maxScore: 5,
      description: 'Open source license file',
      tips: ['Add LICENSE file']
    },
    {
      name: 'Git Maturity',
      score: 0,
      maxScore: 10,
      description: 'Regular commits, meaningful messages, branch strategy',
      tips: ['Improve git practices']
    },
    {
      name: 'Contributors',
      score: 0,
      maxScore: 5,
      description: 'Multiple contributors and community engagement',
      tips: ['Welcome contributors']
    },
    {
      name: 'CI/CD',
      score: 0,
      maxScore: 10,
      description: 'Automated testing, builds, and deployments',
      tips: ['Set up CI/CD pipeline']
    }
  ]
}

/**
 * Get quick wins based on categories with low scores
 */
function getQuickWins(categories: ScoreCategory[]): string[] {
  const wins: string[] = []

  for (const category of categories) {
    if (category.score < category.maxScore && category.tips.length > 0) {
      wins.push(`${category.name}: ${category.tips[0]}`)
      if (wins.length >= 3) break
    }
  }

  return wins
}

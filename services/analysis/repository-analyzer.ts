/**
 * Repository Analyzer
 *
 * Orchestrates the complete repository analysis process:
 * 1. AI tool detection
 * 2. Completeness scoring
 * 3. AI-powered insights generation
 * 4. Commit and contributor analysis
 * 5. Stores results in database
 */

import { prisma } from '@/lib/prisma'
import { GitHubClient } from '@/services/integrations/github-client'
import { AIDetector, createAIDetector } from './ai-detector'
import { CompletenessScorer, createCompletenessScorer } from './completeness-scorer'
import { InsightsGenerator, createInsightsGenerator } from './insights-generator'
import type { GitHubRepository } from '@/types/github'

/**
 * Analysis result
 */
export interface AnalysisResult {
  repositoryId: string
  analysisId: string
  success: boolean
  error?: string
}

/**
 * Analysis progress callback
 */
export type AnalysisProgressCallback = (progress: number, status: string) => void

/**
 * Repository Analyzer
 * Main orchestrator for repository analysis
 */
export class RepositoryAnalyzer {
  private githubClient: GitHubClient
  private aiDetector: AIDetector
  private completenessScorer: CompletenessScorer
  private insightsGenerator: InsightsGenerator

  constructor(accessToken: string) {
    this.githubClient = new GitHubClient(accessToken)
    this.aiDetector = createAIDetector(this.githubClient)
    this.completenessScorer = createCompletenessScorer(this.githubClient)
    this.insightsGenerator = createInsightsGenerator(this.githubClient)
  }

  /**
   * Analyze a repository and store results
   *
   * @param repositoryId - Repository ID in database
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param onProgress - Optional progress callback
   * @returns Analysis result
   */
  async analyzeRepository(
    repositoryId: string,
    owner: string,
    repo: string,
    onProgress?: AnalysisProgressCallback
  ): Promise<AnalysisResult> {
    try {
      console.log(`Starting analysis for ${owner}/${repo}`)

      // Update repository status to processing
      await prisma.repository.update({
        where: { id: repositoryId },
        data: { analysisStatus: 'processing' },
      })

      onProgress?.(10, 'Fetching repository metadata')

      // Fetch repository metadata
      const repository = await this.githubClient.getRepository(owner, repo)

      onProgress?.(20, 'Detecting AI tools')

      // AI Detection
      const aiDetection = await this.aiDetector.detectAIUsage(owner, repo)

      onProgress?.(40, 'Calculating completeness score')

      // Completeness Scoring
      const { score: completenessScore } =
        await this.completenessScorer.calculateScore(owner, repo)

      onProgress?.(60, 'Analyzing commits and contributors')

      // Commit and contributor analysis
      const { firstCommitAt, lastCommitAt, commitCount, contributorCount } =
        await this.analyzeCommits(owner, repo)

      onProgress?.(70, 'Generating AI insights')

      // AI-powered insights
      const insights = await this.insightsGenerator.generateInsights(
        owner,
        repo,
        repository.description
      )

      onProgress?.(90, 'Saving analysis results')

      // Determine project type and framework
      const { projectType, framework } = this.determineProjectType(
        repository,
        insights.techStack
      )

      // Save to database (upsert)
      const analysis = await prisma.repositoryAnalysis.upsert({
        where: { repositoryId },
        create: {
          repositoryId,
          // AI Detection
          aiDetected: aiDetection.detected,
          aiProvider: aiDetection.provider,
          aiConfidence: aiDetection.confidence,
          aiEvidence: {
            files: aiDetection.evidence.files,
            commits: aiDetection.evidence.commits,
            readme: aiDetection.evidence.readme,
          },
          // Analysis Results
          projectType,
          framework,
          completenessScore,
          // AI Insights
          purpose: insights.purpose,
          techStack: insights.techStack,
          features: insights.features,
          improvements: insights.improvements,
          mistakes: insights.mistakes,
          // Timeline
          firstCommitAt,
          lastCommitAt,
          commitCount,
          contributorCount,
        },
        update: {
          // AI Detection
          aiDetected: aiDetection.detected,
          aiProvider: aiDetection.provider,
          aiConfidence: aiDetection.confidence,
          aiEvidence: {
            files: aiDetection.evidence.files,
            commits: aiDetection.evidence.commits,
            readme: aiDetection.evidence.readme,
          },
          // Analysis Results
          projectType,
          framework,
          completenessScore,
          // AI Insights
          purpose: insights.purpose,
          techStack: insights.techStack,
          features: insights.features,
          improvements: insights.improvements,
          mistakes: insights.mistakes,
          // Timeline
          firstCommitAt,
          lastCommitAt,
          commitCount,
          contributorCount,
          updatedAt: new Date(),
        },
      })

      // Update repository status
      await prisma.repository.update({
        where: { id: repositoryId },
        data: {
          analysisStatus: 'completed',
          lastAnalyzedAt: new Date(),
        },
      })

      onProgress?.(100, 'Analysis complete')

      console.log(`Analysis completed for ${owner}/${repo}`)

      return {
        repositoryId,
        analysisId: analysis.id,
        success: true,
      }
    } catch (error) {
      console.error(`Analysis failed for ${owner}/${repo}:`, error)

      // Update repository status to failed
      await prisma.repository.update({
        where: { id: repositoryId },
        data: { analysisStatus: 'failed' },
      })

      return {
        repositoryId,
        analysisId: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Analyze commits to extract timeline and contributor info
   * @private
   */
  private async analyzeCommits(
    owner: string,
    repo: string
  ): Promise<{
    firstCommitAt: Date | null
    lastCommitAt: Date | null
    commitCount: number
    contributorCount: number
  }> {
    try {
      const commits = await this.githubClient.getCommitHistory(owner, repo, {
        per_page: 100,
      })

      if (commits.length === 0) {
        return {
          firstCommitAt: null,
          lastCommitAt: null,
          commitCount: 0,
          contributorCount: 0,
        }
      }

      // Extract unique contributors
      const contributors = new Set<string>()
      for (const commit of commits) {
        if (commit.commit.author.email) {
          contributors.add(commit.commit.author.email)
        }
      }

      // Get first and last commit dates
      const firstCommit = commits[commits.length - 1]
      const lastCommit = commits[0]

      return {
        firstCommitAt: new Date(firstCommit.commit.author.date),
        lastCommitAt: new Date(lastCommit.commit.author.date),
        commitCount: commits.length,
        contributorCount: contributors.size,
      }
    } catch (error) {
      console.error('Commit analysis failed:', error)
      return {
        firstCommitAt: null,
        lastCommitAt: null,
        commitCount: 0,
        contributorCount: 0,
      }
    }
  }

  /**
   * Determine project type and framework from metadata
   * @private
   */
  private determineProjectType(
    repository: GitHubRepository,
    techStack: string[]
  ): { projectType: string | null; framework: string | null } {
    const language = repository.language?.toLowerCase() || ''
    const topics = repository.topics.map((t) => t.toLowerCase())
    const techStackLower = techStack.map((t) => t.toLowerCase())

    // Determine framework
    let framework: string | null = null

    if (
      techStackLower.some((t) => t.includes('next')) ||
      topics.includes('nextjs')
    ) {
      framework = 'nextjs'
    } else if (
      techStackLower.some((t) => t.includes('react')) ||
      topics.includes('react')
    ) {
      framework = 'react'
    } else if (
      techStackLower.some((t) => t.includes('vue')) ||
      topics.includes('vue')
    ) {
      framework = 'vue'
    } else if (
      techStackLower.some((t) => t.includes('angular')) ||
      topics.includes('angular')
    ) {
      framework = 'angular'
    } else if (
      techStackLower.some((t) => t.includes('svelte')) ||
      topics.includes('svelte')
    ) {
      framework = 'svelte'
    } else if (
      techStackLower.some((t) => t.includes('express')) ||
      topics.includes('express')
    ) {
      framework = 'express'
    } else if (
      techStackLower.some((t) => t.includes('fastapi')) ||
      topics.includes('fastapi')
    ) {
      framework = 'fastapi'
    } else if (
      techStackLower.some((t) => t.includes('django')) ||
      topics.includes('django')
    ) {
      framework = 'django'
    } else if (
      techStackLower.some((t) => t.includes('flask')) ||
      topics.includes('flask')
    ) {
      framework = 'flask'
    } else if (
      techStackLower.some((t) => t.includes('rails')) ||
      topics.includes('rails')
    ) {
      framework = 'rails'
    }

    // Determine project type
    let projectType: string | null = null

    if (topics.includes('web') || topics.includes('webapp')) {
      projectType = 'web'
    } else if (topics.includes('api') || topics.includes('rest-api')) {
      projectType = 'api'
    } else if (topics.includes('cli') || topics.includes('command-line')) {
      projectType = 'cli'
    } else if (topics.includes('library')) {
      projectType = 'library'
    } else if (topics.includes('mobile') || topics.includes('ios') || topics.includes('android')) {
      projectType = 'mobile'
    } else if (language === 'typescript' || language === 'javascript') {
      projectType = framework ? 'web' : 'library'
    } else if (language === 'python') {
      projectType = framework ? 'api' : 'library'
    }

    return { projectType, framework }
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    // Clean up any resources if needed
    console.log('Repository analyzer closed')
  }
}

/**
 * Create repository analyzer instance
 *
 * @param accessToken - GitHub access token
 * @returns RepositoryAnalyzer instance
 */
export function createRepositoryAnalyzer(accessToken: string): RepositoryAnalyzer {
  return new RepositoryAnalyzer(accessToken)
}

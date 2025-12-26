/**
 * AI Tool Detection Service
 *
 * Detects AI tool usage in repositories by analyzing:
 * - File names and patterns (.cursor, .aider, CLAUDE.md, etc.)
 * - Commit messages for AI tool signatures
 * - README content for AI tool mentions
 *
 * Supports detection of: Claude, GPT/ChatGPT, GitHub Copilot, Cursor, Aider, Windsurf
 */

import { GitHubClient } from '@/services/integrations/github-client'

/**
 * AI provider types
 */
export type AIProvider =
  | 'claude'
  | 'gpt'
  | 'copilot'
  | 'cursor'
  | 'aider'
  | 'windsurf'
  | 'unknown'

/**
 * AI detection evidence
 */
export interface AIEvidence {
  files: string[]
  commits: string[]
  readme: string[]
}

/**
 * AI detection result
 */
export interface AIDetectionResult {
  detected: boolean
  provider: AIProvider | null
  confidence: number // 0.0 to 1.0
  evidence: AIEvidence
}

/**
 * AI tool detection patterns
 */
const AI_PATTERNS = {
  claude: {
    files: [
      'claude.md',
      'CLAUDE.md',
      '.claude',
      'claude-config.json',
      '.anthropic',
    ],
    keywords: ['claude', 'anthropic', 'claude-3', 'claude 3', 'sonnet', 'opus'],
    commitPatterns: [
      /claude/i,
      /anthropic/i,
      /claude\s*(3|sonnet|opus|haiku)/i,
    ],
  },
  gpt: {
    files: [
      '.openai',
      'chatgpt-config.json',
      '.gpt',
      'openai-config.json',
    ],
    keywords: [
      'openai',
      'gpt-4',
      'gpt-3',
      'chatgpt',
      'gpt',
      'chat gpt',
      'dalle',
      'dall-e',
    ],
    commitPatterns: [
      /gpt-?[0-9]/i,
      /chatgpt/i,
      /openai/i,
      /chat\s*gpt/i,
    ],
  },
  copilot: {
    files: ['.copilot', 'copilot-config.json'],
    keywords: ['copilot', 'github copilot', 'gh copilot'],
    commitPatterns: [/copilot/i, /github\s*copilot/i],
  },
  cursor: {
    files: [
      '.cursor',
      '.cursorrc',
      'cursor.ai',
      '.cursor.json',
      '.cursorrules',
    ],
    keywords: ['cursor', 'cursor.ai', 'cursor ai', 'cursor ide'],
    commitPatterns: [/cursor/i, /cursor\.ai/i, /cursor\s*ai/i],
  },
  aider: {
    files: [
      '.aider',
      '.aider.conf',
      'aider.conf.yml',
      '.aider.conf.yml',
      '.aider-conventions.md',
    ],
    keywords: ['aider', 'aider.chat', 'aider ai', 'aider-chat'],
    commitPatterns: [/aider/i, /aider\.chat/i, /aider\s*ai/i],
  },
  windsurf: {
    files: [
      '.windsurf',
      'windsurf.config.json',
      '.windsurf.json',
      '.windsurfrules',
    ],
    keywords: ['windsurf', 'windsurf ai', 'windsurf ide'],
    commitPatterns: [/windsurf/i, /windsurf\s*ai/i],
  },
} as const

/**
 * AI Tool Detector
 */
export class AIDetector {
  constructor(private githubClient: GitHubClient) {}

  /**
   * Detect AI tool usage in a repository
   *
   * @param owner - Repository owner
   * @param repo - Repository name
   * @returns Detection result with provider, confidence, and evidence
   */
  async detectAIUsage(owner: string, repo: string): Promise<AIDetectionResult> {
    try {
      // Gather evidence from multiple sources
      const [fileEvidence, commitEvidence, readmeEvidence] = await Promise.all([
        this.detectFromFiles(owner, repo),
        this.detectFromCommits(owner, repo),
        this.detectFromReadme(owner, repo),
      ])

      // Combine evidence
      const evidence: AIEvidence = {
        files: fileEvidence.files,
        commits: commitEvidence.commits,
        readme: readmeEvidence.mentions,
      }

      // Determine provider and confidence
      const provider = this.determineProvider(evidence)
      const confidence = this.calculateConfidence(evidence, provider)

      return {
        detected: confidence > 0.3, // 30% threshold for detection
        provider: confidence > 0.3 ? provider : null,
        confidence,
        evidence,
      }
    } catch (error) {
      console.error('AI detection failed:', error)
      // Return negative result on error
      return {
        detected: false,
        provider: null,
        confidence: 0,
        evidence: { files: [], commits: [], readme: [] },
      }
    }
  }

  /**
   * Detect AI usage from repository files
   * @private
   */
  private async detectFromFiles(
    owner: string,
    repo: string
  ): Promise<{ files: string[] }> {
    try {
      const tree = await this.githubClient.getRepositoryTree(owner, repo)
      const files: string[] = []

      // Check each file path against AI patterns
      for (const item of tree.tree) {
        const path = item.path.toLowerCase()

        // Check against all AI tool patterns
        for (const [provider, patterns] of Object.entries(AI_PATTERNS)) {
          if (patterns.files.some((pattern) => path.includes(pattern.toLowerCase()))) {
            files.push(`${item.path} (${provider})`)
          }
        }
      }

      return { files }
    } catch (error) {
      console.error('File detection failed:', error)
      return { files: [] }
    }
  }

  /**
   * Detect AI usage from commit messages
   * @private
   */
  private async detectFromCommits(
    owner: string,
    repo: string
  ): Promise<{ commits: string[] }> {
    try {
      // Fetch recent commits (last 100)
      const commits = await this.githubClient.getCommitHistory(owner, repo, {
        per_page: 100,
      })

      const aiCommits: string[] = []

      // Check commit messages against patterns
      for (const commit of commits) {
        const message = commit.commit.message.toLowerCase()

        // Check against all AI tool patterns
        for (const [provider, patterns] of Object.entries(AI_PATTERNS)) {
          if (patterns.commitPatterns.some((pattern) => pattern.test(message))) {
            aiCommits.push(
              `${commit.sha.substring(0, 7)}: ${commit.commit.message.substring(0, 60)} (${provider})`
            )
            break // Only count once per commit
          }
        }
      }

      return { commits: aiCommits }
    } catch (error) {
      console.error('Commit detection failed:', error)
      return { commits: [] }
    }
  }

  /**
   * Detect AI usage from README content
   * @private
   */
  private async detectFromReadme(
    owner: string,
    repo: string
  ): Promise<{ mentions: string[] }> {
    try {
      let readmeContent = ''

      // Try to fetch README (try multiple common names)
      const readmeFiles = ['README.md', 'readme.md', 'README', 'readme']

      for (const filename of readmeFiles) {
        try {
          readmeContent = await this.githubClient.getFileContent(owner, repo, filename)
          break
        } catch {
          continue
        }
      }

      if (!readmeContent) {
        return { mentions: [] }
      }

      const mentions: string[] = []
      const lowerContent = readmeContent.toLowerCase()

      // Check against all AI tool keywords
      for (const [provider, patterns] of Object.entries(AI_PATTERNS)) {
        for (const keyword of patterns.keywords) {
          if (lowerContent.includes(keyword.toLowerCase())) {
            mentions.push(`${keyword} (${provider})`)
          }
        }
      }

      return { mentions }
    } catch (error) {
      console.error('README detection failed:', error)
      return { mentions: [] }
    }
  }

  /**
   * Determine the most likely AI provider from evidence
   * @private
   */
  private determineProvider(evidence: AIEvidence): AIProvider {
    const scores: Record<AIProvider | 'unknown', number> = {
      claude: 0,
      gpt: 0,
      copilot: 0,
      cursor: 0,
      aider: 0,
      windsurf: 0,
      unknown: 0,
    }

    // Score based on evidence
    const allEvidence = [
      ...evidence.files,
      ...evidence.commits,
      ...evidence.readme,
    ]

    for (const item of allEvidence) {
      const lowerItem = item.toLowerCase()

      if (lowerItem.includes('claude') || lowerItem.includes('anthropic')) {
        scores.claude += 1
      }
      if (
        lowerItem.includes('gpt') ||
        lowerItem.includes('openai') ||
        lowerItem.includes('chatgpt')
      ) {
        scores.gpt += 1
      }
      if (lowerItem.includes('copilot')) {
        scores.copilot += 1
      }
      if (lowerItem.includes('cursor')) {
        scores.cursor += 1
      }
      if (lowerItem.includes('aider')) {
        scores.aider += 1
      }
      if (lowerItem.includes('windsurf')) {
        scores.windsurf += 1
      }
    }

    // Find provider with highest score
    let maxScore = 0
    let provider: AIProvider = 'unknown'

    for (const [key, score] of Object.entries(scores)) {
      if (score > maxScore && key !== 'unknown') {
        maxScore = score
        provider = key as AIProvider
      }
    }

    return provider
  }

  /**
   * Calculate confidence score (0.0 to 1.0)
   * @private
   */
  private calculateConfidence(
    evidence: AIEvidence,
    _provider: AIProvider
  ): number {
    let score = 0

    // File evidence is strongest (0.5 per file, max 1.0)
    score += Math.min(evidence.files.length * 0.5, 1.0)

    // Commit evidence is medium (0.1 per commit, max 0.5)
    score += Math.min(evidence.commits.length * 0.1, 0.5)

    // README evidence is weakest (0.05 per mention, max 0.3)
    score += Math.min(evidence.readme.length * 0.05, 0.3)

    // Normalize to 0-1 range
    return Math.min(score / 1.8, 1.0)
  }
}

/**
 * Create AI detector instance
 *
 * @param githubClient - GitHub client instance
 * @returns AIDetector instance
 */
export function createAIDetector(githubClient: GitHubClient): AIDetector {
  return new AIDetector(githubClient)
}

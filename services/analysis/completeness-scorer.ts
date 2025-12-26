/**
 * Repository Completeness Scorer
 *
 * Calculates a completeness score (0-100) for repositories based on:
 * - README presence and quality
 * - Package manager files
 * - Test presence
 * - Configuration files
 * - Documentation
 * - License
 * - Git maturity
 * - Contributor diversity
 * - CI/CD setup
 */

import { GitHubClient } from '@/services/integrations/github-client'
import type { GitHubRepository, GitHubCommit } from '@/types/github'

/**
 * Completeness score breakdown
 */
export interface CompletenessBreakdown {
  readme: number // 0-25 points (15 for presence, 10 for quality)
  packageManager: number // 0-10 points
  tests: number // 0-15 points
  config: number // 0-10 points
  documentation: number // 0-10 points
  license: number // 0-5 points
  gitMaturity: number // 0-10 points
  contributors: number // 0-5 points
  cicd: number // 0-10 points
  total: number // 0-100 points
}

/**
 * Repository Completeness Scorer
 */
export class CompletenessScorer {
  constructor(private githubClient: GitHubClient) {}

  /**
   * Calculate completeness score for a repository
   *
   * @param owner - Repository owner
   * @param repo - Repository name
   * @returns Completeness score (0-100) with breakdown
   */
  async calculateScore(
    owner: string,
    repo: string
  ): Promise<{ score: number; breakdown: CompletenessBreakdown }> {
    try {
      // Fetch repository data in parallel
      const [repository, tree, commits] = await Promise.all([
        this.githubClient.getRepository(owner, repo),
        this.githubClient.getRepositoryTree(owner, repo).catch(() => null),
        this.githubClient
          .getCommitHistory(owner, repo, { per_page: 100 })
          .catch(() => []),
      ])

      // Calculate individual scores
      const breakdown: CompletenessBreakdown = {
        readme: await this.scoreReadme(owner, repo, tree),
        packageManager: this.scorePackageManager(tree),
        tests: this.scoreTests(tree),
        config: this.scoreConfig(tree),
        documentation: this.scoreDocumentation(tree),
        license: this.scoreLicense(repository),
        gitMaturity: this.scoreGitMaturity(commits),
        contributors: await this.scoreContributors(commits),
        cicd: this.scoreCICD(tree),
        total: 0, // Will be calculated below
      }

      // Calculate total score
      breakdown.total = Math.round(
        breakdown.readme +
          breakdown.packageManager +
          breakdown.tests +
          breakdown.config +
          breakdown.documentation +
          breakdown.license +
          breakdown.gitMaturity +
          breakdown.contributors +
          breakdown.cicd
      )

      return {
        score: breakdown.total,
        breakdown,
      }
    } catch (error) {
      console.error('Completeness scoring failed:', error)
      // Return minimum score on error
      const emptyBreakdown: CompletenessBreakdown = {
        readme: 0,
        packageManager: 0,
        tests: 0,
        config: 0,
        documentation: 0,
        license: 0,
        gitMaturity: 0,
        contributors: 0,
        cicd: 0,
        total: 0,
      }
      return { score: 0, breakdown: emptyBreakdown }
    }
  }

  /**
   * Score README presence and quality (0-25 points)
   * - 15 points for presence
   * - 0-10 points for quality based on word count
   * @private
   */
  private async scoreReadme(
    owner: string,
    repo: string,
    _tree: any
  ): Promise<number> {
    let score = 0

    try {
      // Check if README exists
      const readmeFiles = ['README.md', 'readme.md', 'README', 'readme']
      let readmeContent = ''

      for (const filename of readmeFiles) {
        try {
          readmeContent = await this.githubClient.getFileContent(owner, repo, filename)
          score += 15 // README exists
          break
        } catch {
          continue
        }
      }

      if (!readmeContent) {
        return 0
      }

      // Score quality based on word count
      const wordCount = readmeContent.split(/\s+/).length

      if (wordCount >= 500) {
        score += 10 // Comprehensive README
      } else if (wordCount >= 200) {
        score += 7 // Good README
      } else if (wordCount >= 100) {
        score += 5 // Basic README
      } else if (wordCount >= 50) {
        score += 3 // Minimal README
      } else {
        score += 1 // Very minimal README
      }

      return score
    } catch (error) {
      return 0
    }
  }

  /**
   * Score package manager files (0-10 points)
   * @private
   */
  private scorePackageManager(tree: any): number {
    if (!tree) return 0

    const packageFiles = [
      'package.json', // Node.js
      'requirements.txt', // Python
      'Pipfile', // Python
      'pyproject.toml', // Python
      'Gemfile', // Ruby
      'Cargo.toml', // Rust
      'go.mod', // Go
      'composer.json', // PHP
      'pom.xml', // Java/Maven
      'build.gradle', // Java/Gradle
      'Package.swift', // Swift
      'pubspec.yaml', // Dart/Flutter
    ]

    const hasPackageFile = tree.tree.some((item: any) =>
      packageFiles.some((file) => item.path.toLowerCase() === file.toLowerCase())
    )

    return hasPackageFile ? 10 : 0
  }

  /**
   * Score test presence (0-15 points)
   * @private
   */
  private scoreTests(tree: any): number {
    if (!tree) return 0

    const testPatterns = [
      /^tests?\//i,
      /^__tests__\//i,
      /^spec\//i,
      /\.test\.(ts|js|tsx|jsx|py|rb|go)$/i,
      /\.spec\.(ts|js|tsx|jsx|py|rb|go)$/i,
      /_test\.go$/i,
      /test_.*\.py$/i,
    ]

    const hasTests = tree.tree.some((item: any) =>
      testPatterns.some((pattern) => pattern.test(item.path))
    )

    if (!hasTests) return 0

    // Count test files
    const testFileCount = tree.tree.filter((item: any) =>
      testPatterns.some((pattern) => pattern.test(item.path))
    ).length

    if (testFileCount >= 10) return 15
    if (testFileCount >= 5) return 12
    if (testFileCount >= 2) return 10
    return 7 // At least one test file
  }

  /**
   * Score configuration files (0-10 points)
   * @private
   */
  private scoreConfig(tree: any): number {
    if (!tree) return 0

    let score = 0

    const configFiles = [
      '.env.example',
      '.env.sample',
      'env.example',
      'docker-compose.yml',
      'docker-compose.yaml',
      'Dockerfile',
      '.dockerignore',
      'Makefile',
      '.editorconfig',
      'tsconfig.json',
      'jsconfig.json',
      '.eslintrc',
      '.prettierrc',
      'pyproject.toml',
      'setup.py',
      'Cargo.toml',
      'go.mod',
    ]

    const foundConfigs = tree.tree.filter((item: any) =>
      configFiles.some((file) => item.path.toLowerCase().endsWith(file.toLowerCase()))
    )

    // Score based on number of config files
    if (foundConfigs.length >= 5) score = 10
    else if (foundConfigs.length >= 3) score = 7
    else if (foundConfigs.length >= 1) score = 5

    return score
  }

  /**
   * Score documentation folder (0-10 points)
   * @private
   */
  private scoreDocumentation(tree: any): number {
    if (!tree) return 0

    const docPatterns = [
      /^docs?\//i,
      /^documentation\//i,
      /^wiki\//i,
      /\.md$/i, // Markdown files
    ]

    const docFiles = tree.tree.filter((item: any) =>
      docPatterns.some((pattern) => pattern.test(item.path))
    )

    if (docFiles.length === 0) return 0
    if (docFiles.length >= 10) return 10
    if (docFiles.length >= 5) return 7
    return 5
  }

  /**
   * Score license file (0-5 points)
   * @private
   */
  private scoreLicense(repository: GitHubRepository): number {
    return repository.license ? 5 : 0
  }

  /**
   * Score git maturity (0-10 points)
   * Based on commit count
   * @private
   */
  private scoreGitMaturity(commits: GitHubCommit[]): number {
    const commitCount = commits.length

    if (commitCount >= 100) return 10
    if (commitCount >= 50) return 8
    if (commitCount >= 20) return 6
    if (commitCount >= 10) return 5
    if (commitCount >= 5) return 3
    return 1
  }

  /**
   * Score contributor diversity (0-5 points)
   * @private
   */
  private async scoreContributors(commits: GitHubCommit[]): Promise<number> {
    const uniqueAuthors = new Set<string>()

    for (const commit of commits) {
      if (commit.commit.author.email) {
        uniqueAuthors.add(commit.commit.author.email)
      }
    }

    const contributorCount = uniqueAuthors.size

    if (contributorCount >= 10) return 5
    if (contributorCount >= 5) return 4
    if (contributorCount >= 3) return 3
    if (contributorCount >= 2) return 2
    return 0 // Single contributor
  }

  /**
   * Score CI/CD setup (0-10 points)
   * @private
   */
  private scoreCICD(tree: any): number {
    if (!tree) return 0

    const cicdPatterns = [
      /^\.github\/workflows\//i, // GitHub Actions
      /^\.gitlab-ci\.yml$/i, // GitLab CI
      /^\.circleci\//i, // CircleCI
      /^\.travis\.yml$/i, // Travis CI
      /^jenkins/i, // Jenkins
      /^azure-pipelines\.yml$/i, // Azure Pipelines
      /^bitbucket-pipelines\.yml$/i, // Bitbucket Pipelines
      /^\.drone\.yml$/i, // Drone CI
    ]

    const hasCICD = tree.tree.some((item: any) =>
      cicdPatterns.some((pattern) => pattern.test(item.path))
    )

    return hasCICD ? 10 : 0
  }
}

/**
 * Create completeness scorer instance
 *
 * @param githubClient - GitHub client instance
 * @returns CompletenessScorer instance
 */
export function createCompletenessScorer(
  githubClient: GitHubClient
): CompletenessScorer {
  return new CompletenessScorer(githubClient)
}

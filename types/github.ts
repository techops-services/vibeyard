/**
 * GitHub API Type Definitions
 *
 * Type definitions for GitHub API responses used throughout the application.
 * Based on Octokit REST API types.
 */

/**
 * GitHub Repository
 * Represents a GitHub repository with all relevant metadata
 */
export interface GitHubRepository {
  id: number
  node_id: string
  name: string
  full_name: string
  owner: GitHubUser
  private: boolean
  html_url: string
  description: string | null
  fork: boolean
  url: string
  created_at: string
  updated_at: string
  pushed_at: string
  git_url: string
  ssh_url: string
  clone_url: string
  svn_url: string
  homepage: string | null
  size: number
  stargazers_count: number
  watchers_count: number
  language: string | null
  has_issues: boolean
  has_projects: boolean
  has_downloads: boolean
  has_wiki: boolean
  has_pages: boolean
  has_discussions: boolean
  forks_count: number
  mirror_url: string | null
  archived: boolean
  disabled: boolean
  open_issues_count: number
  license: GitHubLicense | null
  allow_forking: boolean
  is_template: boolean
  web_commit_signoff_required: boolean
  topics: string[]
  visibility: 'public' | 'private' | 'internal'
  forks: number
  open_issues: number
  watchers: number
  default_branch: string
  permissions?: {
    admin: boolean
    maintain: boolean
    push: boolean
    triage: boolean
    pull: boolean
  }
}

/**
 * GitHub User
 * Represents a GitHub user or organization
 */
export interface GitHubUser {
  login: string
  id: number
  node_id: string
  avatar_url: string
  gravatar_id: string | null
  url: string
  html_url: string
  followers_url: string
  following_url: string
  gists_url: string
  starred_url: string
  subscriptions_url: string
  organizations_url: string
  repos_url: string
  events_url: string
  received_events_url: string
  type: 'User' | 'Organization'
  site_admin: boolean
  name?: string | null
  company?: string | null
  blog?: string | null
  location?: string | null
  email?: string | null
  hireable?: boolean | null
  bio?: string | null
  twitter_username?: string | null
  public_repos?: number
  public_gists?: number
  followers?: number
  following?: number
  created_at?: string
  updated_at?: string
}

/**
 * GitHub License
 * Represents a repository license
 */
export interface GitHubLicense {
  key: string
  name: string
  spdx_id: string | null
  url: string | null
  node_id: string
}

/**
 * GitHub Commit
 * Represents a Git commit
 */
export interface GitHubCommit {
  sha: string
  node_id: string
  commit: {
    author: {
      name: string
      email: string
      date: string
    }
    committer: {
      name: string
      email: string
      date: string
    }
    message: string
    tree: {
      sha: string
      url: string
    }
    url: string
    comment_count: number
    verification: {
      verified: boolean
      reason: string
      signature: string | null
      payload: string | null
    }
  }
  url: string
  html_url: string
  comments_url: string
  author: GitHubUser | null
  committer: GitHubUser | null
  parents: Array<{
    sha: string
    url: string
    html_url: string
  }>
}

/**
 * GitHub Content
 * Represents repository content (file, directory, symlink, submodule)
 */
export interface GitHubContent {
  type: 'file' | 'dir' | 'symlink' | 'submodule'
  encoding?: 'base64' | 'utf-8'
  size: number
  name: string
  path: string
  content?: string
  sha: string
  url: string
  git_url: string | null
  html_url: string | null
  download_url: string | null
  _links: {
    git: string | null
    self: string
    html: string | null
  }
}

/**
 * GitHub Tree
 * Represents a Git tree (file structure)
 */
export interface GitHubTree {
  sha: string
  url: string
  tree: Array<{
    path: string
    mode: string
    type: 'blob' | 'tree' | 'commit'
    sha: string
    size?: number
    url: string
  }>
  truncated: boolean
}

/**
 * GitHub Rate Limit
 * Represents GitHub API rate limit status
 */
export interface GitHubRateLimit {
  limit: number
  remaining: number
  reset: number
  used: number
  resource: string
}

/**
 * GitHub Rate Limit Response
 * Full rate limit response from GitHub API
 */
export interface GitHubRateLimitResponse {
  resources: {
    core: GitHubRateLimit
    search: GitHubRateLimit
    graphql: GitHubRateLimit
    integration_manifest: GitHubRateLimit
    source_import: GitHubRateLimit
    code_scanning_upload: GitHubRateLimit
    actions_runner_registration: GitHubRateLimit
    scim: GitHubRateLimit
    dependency_snapshots: GitHubRateLimit
  }
  rate: GitHubRateLimit
}

/**
 * Commit Options
 * Options for fetching commit history
 */
export interface CommitOptions {
  sha?: string
  path?: string
  author?: string
  since?: string
  until?: string
  per_page?: number
  page?: number
}

/**
 * Repository List Options
 * Options for listing user repositories
 */
export interface RepositoryListOptions {
  visibility?: 'all' | 'public' | 'private'
  affiliation?: 'owner' | 'collaborator' | 'organization_member'
  type?: 'all' | 'owner' | 'public' | 'private' | 'member'
  sort?: 'created' | 'updated' | 'pushed' | 'full_name'
  direction?: 'asc' | 'desc'
  per_page?: number
  page?: number
  since?: string
  before?: string
}

/**
 * Language Breakdown
 * Repository language statistics
 */
export type LanguageBreakdown = Record<string, number>

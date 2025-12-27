import { YardHeader } from '../components/YardHeader'
import { YardFooter } from '../components/YardFooter'

export default function VibeCodPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <YardHeader />

      <main className="flex-1 max-w-4xl w-full mx-auto p-6">
        <h1 className="text-2xl font-bold mono mb-6">vibecoding guide</h1>

        {/* What is Vibecoding? */}
        <section className="yard-card p-4 mb-6">
          <h2 className="text-lg font-bold mono mb-3">
            What is Vibecoding?
          </h2>
          <p className="text-sm mb-2">
            Vibecoding is AI-assisted development where you work alongside
            powerful AI agents to build software faster and smarter. Instead of
            writing every line of code yourself, you orchestrate AI tools to
            handle boilerplate, exploration, testing, and implementation while
            you focus on architecture and product decisions.
          </p>
          <p className="text-sm yard-meta">
            The best vibecoding happens when you understand how to effectively
            use agents, skills, and MCP servers together.
          </p>
        </section>

        {/* Best Practices with Claude Code */}
        <h2 className="text-xl font-bold mono mb-4 mt-8">
          Best Practices with Claude Code
        </h2>

        {/* Using Agents */}
        <section className="yard-card p-4 mb-6">
          <h3 className="text-base font-bold mono mb-3">Using Agents</h3>

          <p className="text-sm mb-3">
            Agents are specialized AI workers that you can spawn for specific
            tasks. They use the <code className="yard-meta">Task</code> tool
            with different <code className="yard-meta">subagent_type</code>{' '}
            values.
          </p>

          <div className="mb-4">
            <p className="text-sm font-bold mb-2">Common Agent Types:</p>
            <ul className="text-sm list-disc list-inside ml-2 space-y-1">
              <li>
                <code className="yard-meta">Explore</code> - Navigate and
                understand codebases
              </li>
              <li>
                <code className="yard-meta">Plan</code> - Create
                implementation plans and architecture
              </li>
              <li>
                <code className="yard-meta">developer</code> - Write production
                code
              </li>
              <li>
                <code className="yard-meta">tester</code> - Write and run tests
              </li>
              <li>
                <code className="yard-meta">reviewer</code> - Code review and
                quality checks
              </li>
              <li>
                <code className="yard-meta">designer</code> - UI/UX and design
                work
              </li>
              <li>
                <code className="yard-meta">writer</code> - Documentation and
                content
              </li>
            </ul>
          </div>

          <div className="bg-[--yard-light-gray] p-3 mb-3">
            <p className="text-xs mono font-bold mb-2">Example usage:</p>
            <pre className="text-xs mono whitespace-pre-wrap">
              {`"Spawn an Explore agent to map out the authentication flow"

"Use a Plan agent to design the API structure for user management"

"Have a developer agent implement the GitHub OAuth integration"

"Ask a tester agent to write integration tests for the new API"`}
            </pre>
          </div>

          <p className="text-sm yard-meta">
            <strong>When to use agents:</strong> Complex tasks that need
            focused attention, parallel work on different parts of the codebase,
            or specialized expertise (testing, design, etc.)
          </p>
        </section>

        {/* Using Skills */}
        <section className="yard-card p-4 mb-6">
          <h3 className="text-base font-bold mono mb-3">Using Skills</h3>

          <p className="text-sm mb-3">
            Skills are reusable workflows triggered by slash commands. They
            encapsulate common development patterns and best practices.
          </p>

          <div className="mb-4">
            <p className="text-sm font-bold mb-2">Built-in Skills:</p>
            <ul className="text-sm list-disc list-inside ml-2 space-y-1">
              <li>
                <code className="yard-meta">/commit</code> - Create well-formed
                git commits
              </li>
              <li>
                <code className="yard-meta">/review-pr</code> - Review pull
                requests
              </li>
              <li>
                <code className="yard-meta">/feature-spec</code> - Create
                feature specifications
              </li>
              <li>
                <code className="yard-meta">/doc-coauthoring</code> - Write
                documentation
              </li>
            </ul>
          </div>

          <div className="bg-[--yard-light-gray] p-3 mb-3">
            <p className="text-xs mono font-bold mb-2">
              Creating custom skills:
            </p>
            <pre className="text-xs mono whitespace-pre-wrap">
              {`# In .claude/skills/my-skill.md

# Skill: deploy-check
Pre-deployment validation workflow

## Steps
1. Run all tests
2. Check for linting errors
3. Verify environment variables
4. Build production bundle
5. Generate deployment summary`}
            </pre>
          </div>

          <p className="text-sm yard-meta">
            <strong>When to use skills:</strong> Repetitive workflows,
            standardized processes, or multi-step operations you do frequently.
          </p>
        </section>

        {/* Using MCP Servers */}
        <section className="yard-card p-4 mb-6">
          <h3 className="text-base font-bold mono mb-3">Using MCP Servers</h3>

          <p className="text-sm mb-3">
            MCP (Model Context Protocol) servers extend Claude Code with
            external integrations and persistent memory. They provide tools and
            resources that Claude can access during conversations.
          </p>

          <div className="mb-4">
            <p className="text-sm font-bold mb-2">Common MCP Servers:</p>
            <ul className="text-sm list-disc list-inside ml-2 space-y-1">
              <li>
                <code className="yard-meta">memory</code> - Persistent knowledge
                graph for storing context
              </li>
              <li>
                <code className="yard-meta">atlassian</code> - Jira and
                Confluence integration
              </li>
              <li>
                <code className="yard-meta">chrome-devtools</code> - Browser
                automation and testing
              </li>
              <li>
                <code className="yard-meta">github</code> - GitHub API access
              </li>
              <li>
                <code className="yard-meta">slack</code> - Slack integration
              </li>
            </ul>
          </div>

          <div className="bg-[--yard-light-gray] p-3 mb-3">
            <p className="text-xs mono font-bold mb-2">
              Example MCP configuration:
            </p>
            <pre className="text-xs mono whitespace-pre-wrap">
              {`// In Claude Code settings
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "atlassian": {
      "command": "npx",
      "args": ["-y", "@atlassian/mcp-server-atlassian"]
    }
  }
}`}
            </pre>
          </div>

          <p className="text-sm yard-meta">
            <strong>When to use MCP servers:</strong> When you need persistent
            memory across sessions, integration with external tools, or
            specialized capabilities not built into Claude Code.
          </p>
        </section>

        {/* Feature Development Workflows */}
        <section className="yard-card p-4 mb-6">
          <h3 className="text-base font-bold mono mb-3">
            Feature Development Workflows
          </h3>

          <p className="text-sm mb-3">
            Effective vibecoding combines agents, skills, and MCPs into
            cohesive workflows.
          </p>

          <div className="bg-[--yard-light-gray] p-3 mb-3">
            <p className="text-xs mono font-bold mb-2">
              Example: Building a new feature
            </p>
            <pre className="text-xs mono whitespace-pre-wrap">
              {`1. Use /feature-spec to create specification in Confluence
   - Pulls requirements from Jira ticket
   - Generates technical design doc
   - Saves to Confluence for team review

2. Spawn Plan agent to design architecture
   - Reviews existing codebase patterns
   - Creates implementation plan
   - Identifies files to modify

3. Spawn developer agent to implement
   - Follows established conventions
   - Handles multi-file changes
   - Writes tests alongside code

4. Use memory MCP to store decisions
   - "Remember that we chose PostgreSQL for this feature"
   - Context persists across sessions

5. Use /commit to create PR-ready commits
   - Links to Jira ticket automatically
   - Follows commit message conventions

6. Use /review-pr for self-review
   - Catches common issues
   - Suggests improvements`}
            </pre>
          </div>

          <p className="text-sm yard-meta">
            This workflow ensures specifications are documented, decisions are
            tracked, and code follows team standards - all with minimal manual
            effort.
          </p>
        </section>

        {/* Context Window Management */}
        <section className="yard-card p-4 mb-6">
          <h3 className="text-base font-bold mono mb-3">
            Context Window Management
          </h3>

          <p className="text-sm mb-3">
            Long conversations can fill up Claude&apos;s context window. Use these
            strategies to stay efficient:
          </p>

          <ul className="text-sm list-disc list-inside ml-2 space-y-2 mb-3">
            <li>
              <strong>Use TodoWrite:</strong> Track tasks in a structured list
              instead of cluttering conversation
            </li>
            <li>
              <strong>Spawn agents:</strong> Offload specialized work to fresh
              context windows
            </li>
            <li>
              <strong>Summarize periodically:</strong> &quot;Summarize our progress
              and key decisions&quot;
            </li>
            <li>
              <strong>Save to memory:</strong> Store important context in MCP
              memory server
            </li>
            <li>
              <strong>Document in CLAUDE.md:</strong> Write down patterns and
              decisions for future sessions
            </li>
          </ul>

          <div className="bg-[--yard-light-gray] p-3">
            <p className="text-xs mono font-bold mb-2">
              Example TodoWrite usage:
            </p>
            <pre className="text-xs mono whitespace-pre-wrap">
              {`"Create a todo list for this feature:
1. Implement user authentication API
2. Add database migrations
3. Write integration tests
4. Update documentation
5. Create PR and link to JIRA-123"`}
            </pre>
          </div>
        </section>

        {/* Saving Implementation Decisions */}
        <section className="yard-card p-4 mb-6">
          <h3 className="text-base font-bold mono mb-3">
            Saving Implementation Decisions
          </h3>

          <p className="text-sm mb-3">
            Document your development patterns and decisions so Claude Code (and
            other developers) can reference them later.
          </p>

          <div className="mb-4">
            <p className="text-sm font-bold mb-2">AGENTS.md / CLAUDE.md:</p>
            <p className="text-sm mb-2">
              Create a file at the root of your project with:
            </p>
            <ul className="text-sm list-disc list-inside ml-2 space-y-1">
              <li>Coding conventions and patterns</li>
              <li>Architecture decisions</li>
              <li>Common workflows and commands</li>
              <li>Integration details (APIs, MCP servers, etc.)</li>
              <li>Testing strategies</li>
            </ul>
          </div>

          <div className="bg-[--yard-light-gray] p-3 mb-4">
            <p className="text-xs mono font-bold mb-2">
              Example CLAUDE.md structure:
            </p>
            <pre className="text-xs mono whitespace-pre-wrap">
              {`# Project Guidelines

## Architecture
- Next.js 14 App Router
- PostgreSQL with Prisma ORM
- tRPC for type-safe APIs

## Conventions
- Use server components by default
- Prefix client components with 'use client'
- Keep API routes in /app/api

## Testing
- Vitest for unit tests
- Playwright for E2E
- Aim for 80% coverage

## MCP Servers
- atlassian: JIRA and Confluence
- memory: Store feature decisions

## Common Tasks
- /feature-spec: Create specs in Confluence
- /commit: Commit with JIRA linking`}
            </pre>
          </div>

          <div className="mb-4">
            <p className="text-sm font-bold mb-2">Using Memory MCP:</p>
            <p className="text-sm mb-2">
              Store decisions directly in the knowledge graph:
            </p>
            <div className="bg-[--yard-light-gray] p-3">
              <pre className="text-xs mono whitespace-pre-wrap">
                {`"Store in memory: We chose to use React Server Components
for all data fetching to reduce client bundle size"

"Remember that the authentication flow uses NextAuth with
GitHub OAuth and stores sessions in PostgreSQL"

"Save this decision: Error handling uses a global error
boundary with structured logging to DataDog"`}
              </pre>
            </div>
          </div>

          <p className="text-sm yard-meta">
            These patterns ensure knowledge persists across sessions and team
            members can understand your vibecoding setup.
          </p>
        </section>

        {/* Final Tips */}
        <section className="yard-card p-4 mb-6">
          <h3 className="text-base font-bold mono mb-3">Final Tips</h3>

          <ul className="text-sm list-disc list-inside ml-2 space-y-2">
            <li>
              <strong>Be specific:</strong> &quot;Create a React component with
              TypeScript&quot; beats &quot;make a component&quot;
            </li>
            <li>
              <strong>Reference existing patterns:</strong> &quot;Follow the same
              error handling as RepoItem.tsx&quot;
            </li>
            <li>
              <strong>Iterate in public:</strong> Share your vibecode projects
              on vibeyard for feedback
            </li>
            <li>
              <strong>Document as you go:</strong> Update CLAUDE.md when you
              establish new patterns
            </li>
            <li>
              <strong>Use the right tool:</strong> Agents for complex work,
              skills for repetitive tasks, MCPs for integrations
            </li>
            <li>
              <strong>Start simple:</strong> Master basic prompting before
              diving into advanced workflows
            </li>
          </ul>
        </section>
      </main>

      <YardFooter />
    </div>
  )
}

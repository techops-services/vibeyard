import { YardHeader } from '../components/YardHeader'
import { YardFooter } from '../components/YardFooter'

export default function WTFPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <YardHeader />

      <main className="flex-1 max-w-4xl w-full mx-auto p-6">
        <h1 className="text-2xl font-bold mono mb-6">vibeyard faq</h1>

        <div className="space-y-6">
          {/* What is vibeyard? */}
          <section className="yard-card p-4">
            <h2 className="text-base font-bold mono mb-2">
              What is vibeyard?
            </h2>
            <p className="text-sm mb-2">
              vibeyard is a platform for discovering and showcasing repositories
              built with AI-assisted development (vibecoding). It&apos;s a junkyard
              for code with potential - where developers share their AI-powered
              projects and collaborate with others.
            </p>
            <p className="text-sm yard-meta">
              Think HackerNews meets GitHub, but specifically for the vibecode
              community.
            </p>
          </section>

          {/* What is a "lot" in the yard lot? */}
          <section className="yard-card p-4">
            <h2 className="text-base font-bold mono mb-2">
              What is a &quot;lot&quot; in the yard lot?
            </h2>
            <p className="text-sm mb-2">
              The &quot;yard lot&quot; is the main feed - a collection of vibes
              submitted by the community. Each vibe is like a &quot;lot&quot; in a
              junkyard, waiting to be discovered and appreciated for its
              potential.
            </p>
            <p className="text-sm yard-meta">
              Vibes are ranked by votes, with the most interesting
              projects rising to the top.
            </p>
          </section>

          {/* What is the workbench? */}
          <section className="yard-card p-4">
            <h2 className="text-base font-bold mono mb-2">
              What is the workbench?
            </h2>
            <p className="text-sm mb-2">
              Your workbench is your personal dashboard. It shows:
            </p>
            <ul className="text-sm list-disc list-inside ml-2 space-y-1 mb-2">
              <li>Repositories you&apos;ve added to vibeyard</li>
              <li>Repositories you follow</li>
              <li>Collaboration requests you&apos;ve received or sent</li>
              <li>Notifications and activity</li>
            </ul>
            <p className="text-sm yard-meta">
              It&apos;s your command center for managing your vibeyard presence.
            </p>
          </section>

          {/* How do I add my repository? */}
          <section className="yard-card p-4">
            <h2 className="text-base font-bold mono mb-2">
              How do I add my repository?
            </h2>
            <p className="text-sm mb-2">
              Login with your GitHub account, then use the &quot;+ add vibe&quot; button
              in the top-right corner. Enter your GitHub repository URL and
              it will be automatically fetched and added to the yard lot.
            </p>
            <p className="text-sm yard-meta">
              Only public GitHub repositories are currently supported.
            </p>
          </section>

          {/* What is the completeness rating? */}
          <section className="yard-card p-4">
            <h2 className="text-base font-bold mono mb-2">
              What is the completeness rating?
            </h2>
            <p className="text-sm mb-2">
              The completeness rating is an automated analysis of your
              repository&apos;s quality and readiness. It checks for:
            </p>
            <ul className="text-sm list-disc list-inside ml-2 space-y-1 mb-2">
              <li>README quality and documentation</li>
              <li>Test coverage and CI/CD setup</li>
              <li>Code structure and organization</li>
              <li>Dependencies and security</li>
              <li>License and contribution guidelines</li>
            </ul>
            <p className="text-sm yard-meta">
              Scores range from 0-100. Higher scores indicate more polished,
              production-ready projects.
            </p>
          </section>

          {/* How does AI detection work? */}
          <section className="yard-card p-4">
            <h2 className="text-base font-bold mono mb-2">
              How does AI detection work?
            </h2>
            <p className="text-sm mb-2">
              vibeyard analyzes repositories for signs of AI-assisted
              development by checking:
            </p>
            <ul className="text-sm list-disc list-inside ml-2 space-y-1 mb-2">
              <li>Presence of CLAUDE.md, AGENTS.md, or .cursorrules files</li>
              <li>MCP server configurations</li>
              <li>Cursor AI or Windsurf AI project markers</li>
              <li>Commit messages mentioning AI tools</li>
              <li>Claude Code skill definitions</li>
            </ul>
            <p className="text-sm yard-meta">
              This helps identify genuine vibecode projects built with AI
              assistance.
            </p>
          </section>

          {/* What are collaboration requests? */}
          <section className="yard-card p-4">
            <h2 className="text-base font-bold mono mb-2">
              What are collaboration requests?
            </h2>
            <p className="text-sm mb-2">
              Collaboration requests let you ask repository owners if you can
              contribute to their project. When you find an interesting
              repository, you can:
            </p>
            <ul className="text-sm list-disc list-inside ml-2 space-y-1 mb-2">
              <li>Send a collaboration request with your pitch</li>
              <li>Specify what you want to work on</li>
              <li>Wait for the owner to approve or decline</li>
            </ul>
            <p className="text-sm yard-meta">
              Approved collaborators get added to the repository&apos;s GitHub
              access (depending on owner settings).
            </p>
          </section>

          {/* What does "seeker" mean? */}
          <section className="yard-card p-4">
            <h2 className="text-base font-bold mono mb-2">
              What does &quot;seeker&quot; mean?
            </h2>
            <p className="text-sm mb-2">
              &quot;seeker&quot; is a collaboration role that indicates a repository is
              actively looking for contributors. Repository owners can mark
              their projects as:
            </p>
            <ul className="text-sm list-disc list-inside ml-2 space-y-1 mb-2">
              <li>
                <code className="yard-meta">seeker</code> - actively seeking
                collaborators
              </li>
              <li>
                <code className="yard-meta">maybe</code> - open to collaboration
                but not actively recruiting
              </li>
              <li>
                <code className="yard-meta">solo</code> - not accepting
                collaborators
              </li>
            </ul>
            <p className="text-sm yard-meta">
              This helps you find projects that want your help.
            </p>
          </section>

          {/* How do I follow repositories? */}
          <section className="yard-card p-4">
            <h2 className="text-base font-bold mono mb-2">
              How do I follow repositories?
            </h2>
            <p className="text-sm mb-2">
              Click the &quot;follow&quot; link next to any repository in the yard lot.
              Followed repositories appear in your workbench, and you&apos;ll receive
              notifications about:
            </p>
            <ul className="text-sm list-disc list-inside ml-2 space-y-1 mb-2">
              <li>Major updates and releases</li>
              <li>Collaboration opportunities</li>
              <li>Community activity</li>
            </ul>
            <p className="text-sm yard-meta">
              Following helps you keep track of interesting projects.
            </p>
          </section>

          {/* Is vibeyard free? */}
          <section className="yard-card p-4">
            <h2 className="text-base font-bold mono mb-2">
              Is vibeyard free?
            </h2>
            <p className="text-sm mb-2">
              Yes! vibeyard is completely free and open source. You can:
            </p>
            <ul className="text-sm list-disc list-inside ml-2 space-y-1 mb-2">
              <li>Add unlimited repositories</li>
              <li>Follow unlimited projects</li>
              <li>Send collaboration requests</li>
              <li>Vote and engage with the community</li>
            </ul>
            <p className="text-sm yard-meta">
              All you need is a GitHub account to get started.
            </p>
          </section>
        </div>
      </main>

      <YardFooter />
    </div>
  )
}

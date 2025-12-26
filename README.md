# 🏗️ vibeyard

*A junkyard for vibecode with potential*

Vibeyard is a community-driven platform where developers can showcase, discover, and collaborate on AI-assisted code projects (vibecode). Think of it as a junkyard where raw materials meet potential—a place to find diamonds in the rough, connect with collaborators, and transform experimental AI-generated code into production-ready applications.

---

## 📖 Overview

In the rapidly evolving landscape of AI-assisted development, countless promising projects are created daily using tools like Claude, GPT, and other AI coding assistants. However, many of these projects remain isolated, incomplete, or abandoned. Vibeyard solves this problem by providing a centralized platform where:

- **Creators** can showcase their AI-generated projects and seek help, feedback, or collaborators
- **Contributors** can discover interesting projects that need expertise, mentorship, or development resources
- **Teams** can form around promising ideas and transform rough prototypes into polished applications

The platform embraces the "junkyard" theme—celebrating the raw, experimental nature of AI-assisted development while recognizing that every piece of scrap has potential value in the right hands.

---

## 🚀 Getting Started

Ready to run vibeyard locally? Check out our **[Quick Start Guide](./docs/QUICKSTART.md)** for step-by-step instructions.

**Prerequisites:**
- Node.js 20+
- Docker & Docker Compose
- GitHub account (for OAuth)

**Quick Setup:**
```bash
# Install dependencies
npm install

# Start Docker services (PostgreSQL + Redis)
docker-compose up -d

# Set up environment variables
cp .env.example .env
# Add your GitHub OAuth credentials

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Visit http://localhost:3000 to see your local vibeyard!

For detailed instructions, see **[docs/SETUP.md](./docs/SETUP.md)**.

---

## ✨ Key Features

### 🔗 Deep GitHub Integration
- **Seamless Authentication**: Sign in with your GitHub account
- **Repository Connection**: Link your vibecode repositories with one click
- **Automatic Analysis**: Upon connection, Vibeyard analyzes your repository to extract:
  - Project description and purpose
  - AI provider and model used for development (Claude, GPT, etc.)
  - Agent configurations and workflows
  - Development progress and milestones
  - Commit history and evolution
  - Common mistakes and lessons learned

### 🏪 The Yard Lot (Public Marketplace)
- **Project Discovery**: Browse all connected repositories displayed as "lots" on the landing page
- **Detailed Lot Pages**: Click any lot to view comprehensive project information:
  - Project description and current status
  - AI-assisted development analysis
  - Technology stack and dependencies
  - Links back to GitHub repository
  - Development journey and progress indicators
- **Community Engagement**:
  - Upvote promising projects
  - Follow projects to track their evolution
  - Comment and provide feedback
  - Connect with project creators

### 🔧 The Workbench (Private Dashboard)
Your personal workspace for managing your vibecode projects:
- View all your connected repositories
- Monitor project analytics and engagement
- Manage collaboration requests
- Track improvement suggestions from the community

### 🤝 Collaboration Features
- **Seekers**: Developers looking for help, code reviews, bug fixes, or team members

**Collaboration Options:**
- Request human code reviews
- Seek help fixing specific issues
- Form development teams around promising projects
- Offer expertise to projects that align with your skills
- Follow repositories for any updates

### 📄 License Compliance
- Automatic license detection for each connected repository
- Prompt users to add appropriate licenses if missing
- Ensure all projects meet open-source compliance standards

---

## 🚀 Roadmap

### Phase 1: Core Platform (Current Focus)
- [x] Platform concept and architecture design
- [x] GitHub OAuth integration
- [x] Repository connection
- [x] Repository Analysis engine backend
- [x] Show Completeness Rating on the frontend: Assign a quality score (1-5 stars) based on:
  - Code completeness and functionality
  - Documentation quality
  - Test coverage
  - Deployment readiness
- [x] Yard Lot (public listing) interface
- [x] Workbench (user dashboard) interface
- [x] Basic upvoting functionality
- [x] Basic repository/lot following/subscribe functionality with user notifications (in app only for now)
- [x] RSS feed for new repositories added to Yard Lot
- [x] Add WTF menu item and page to the top nav with FAQ like content explaining vibeyard platform
- [x] Add "vibecode" menu item and informational page to the top nav explaining vibecoding and how to do it correctly:
- For example with Claude Code:
 - Use of Agents with examples
 - Use of Skills with examples
 - Use of MCP servers with examples
 - Skills that combine skills, agents, MCPs to create Feature development Workflows eg. feature-dev skill
 - Context Window management
 - Direct Agents/Skills to save implementation decisions/tasks to file for future course correction

### Phase 2: Community & Collaboration
- [x] Commenting system with notifications (in app only for now)
  1. Nested indentation - Replies are visually indented to show parent-child relationships, creating a tree structure
  2. Minimalist/text-first design - No avatars, no rich media, monospace-adjacent typography on a muted background
  3. Flat metadata header - Username, relative timestamp, and navigation links (parent | root | prev | next) inline
  4. Collapse controls - The [-] toggle to collapse entire sub-threads
  5. Upvote-only voting - Single triangle, no downvote visible to most users
  6. Simple "reply" action - Unobtrusive link at comment bottom

### Phase 2.1: Deploy
- [x] Package the main and analysis worker as Dockerfiles for deployment with Helm to K8s
- [ ] Add these Docker services to the local docker compose for development and testing
- [ ] Create Github template repo with only the local Claude featureset and add link to vibecode page. This will help users getting started with vibecoding

### Phase 3: DevOps & Quality Features
- [ ] **Automated Build & Deploy**: Attempt to build and deploy connected projects
- [ ] **Live Previews**: Screenshots and live demos of successfully deployed applications
- [ ] **Log Monitoring**: Display build logs, deployment logs, and runtime insights

### Phase 4: Hosting & Monetization
- [ ] **Lot Hosting**: Optional paid hosting for projects on generated `.vibeyard.ai` URLs
- [ ] **Custom Domains**: Support for custom domain mapping
- [ ] **Project Marketplace**: Allow creators to list projects for sale or licensing
- [ ] **Premium Features**: Advanced analytics, priority support, enhanced collaboration tools

### Phase 5: Advanced Features
- [ ] AI-assisted project improvement suggestions
- [ ] Automated refactoring recommendations
- [ ] Integration with CI/CD pipelines
- [ ] Project forking and derivative tracking
- [ ] Grant/funding connection platform for promising projects

---

## 🎨 Design Philosophy

### Junkyard Aesthetic
Vibeyard embraces a **simple, functional design** inspired by classic developer communities like Hacker News:
- Minimalist interface prioritizing content over chrome
- Fast, responsive, and accessible
- Focus on information density and usability
- The "junkyard" naming convention permeates the platform:
  - **Yard Lot**: Public marketplace of projects
  - **Workbench**: Private development dashboard
  - **Scrap Tags**: Project categorization
  - **Salvage Score**: Quality/completeness rating
  - **Forge**: Collaboration and team-building area

### Community-First Approach
- Transparency in AI-assisted development processes
- Recognition that experimental code has inherent value
- Celebrating both successful projects and instructive failures
- Building connections between creators and collaborators

---

## 🛠️ Technology Stack

**Current Stack:**
- **Frontend**: Next.js 14 with App Router, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL 15 with Prisma ORM
- **Caching**: Redis with BullMQ job queue
- **Authentication**: NextAuth.js v5 with GitHub OAuth
- **Repository Analysis**: GitHub API (Octokit) + OpenAI GPT-4
- **Deployment**: Kubernetes + Helm + GitHub Actions
- **Testing**: Vitest (unit) + Playwright (E2E)

---

## 📚 Documentation

- **[Quick Start Guide](./docs/QUICKSTART.md)** - Get up and running quickly
- **[Setup Instructions](./docs/SETUP.md)** - Detailed local development setup
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - K8s deployment with Helm
- **[Task Breakdown](./docs/TASKS.md)** - All 64 development tasks
- **[Phase 1 Summary](./docs/PHASE1_SUMMARY.md)** - Implementation overview
- **[Setup Checklist](./docs/CHECKLIST.md)** - Verification checklist
- **[Implementation Summary](./docs/IMPLEMENTATION_SUMMARY.md)** - Complete technical details

**External Documentation:**
- [Technical Specification (Confluence)](https://techopsservices.atlassian.net/wiki/spaces/VIBE/pages/1769492)
- [Implementation Plan (Confluence)](https://techopsservices.atlassian.net/wiki/spaces/VIBE/pages/1441811)
- [JIRA Project](https://techopsservices.atlassian.net/jira/software/projects/VIBE)

---

## 🤝 Contributing

Vibeyard itself is a vibecode project! We welcome contributions from the community:

- **Feedback**: Share your thoughts on features and functionality
- **Code Contributions**: Submit PRs for bug fixes or new features
- **Documentation**: Help improve our docs and guides
- **Community**: Join discussions about AI-assisted development

*(Contribution guidelines to be added)*

---

## 📝 License

*(License to be determined)*

---

## 🌟 Vision

Our vision is to create a thriving ecosystem where AI-assisted development is celebrated, collaborative, and productive. By providing infrastructure for discovery, collaboration, and deployment, Vibeyard aims to:

- Reduce abandonment of promising AI-generated projects
- Accelerate the journey from prototype to production
- Foster a community that learns from both successes and failures
- Make AI-assisted development more accessible and collaborative
- Demonstrate that "vibecode" can evolve into robust, valuable software

---

## 📬 Contact

*(Contact information to be added)*

---

**Built with AI assistance | Powered by community collaboration | Celebrating the potential in every line of code**

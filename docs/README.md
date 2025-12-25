# Vibeyard Documentation

Welcome to the vibeyard documentation! This directory contains all the technical documentation for setting up, developing, and deploying vibeyard.

---

## 📚 Documentation Index

### Getting Started
- **[QUICKSTART.md](./QUICKSTART.md)** - Quick reference guide to get vibeyard running locally
- **[SETUP.md](./SETUP.md)** - Comprehensive local development setup guide with troubleshooting
- **[CHECKLIST.md](./CHECKLIST.md)** - Step-by-step verification checklist for setup

### Development
- **[TASKS.md](./TASKS.md)** - Complete breakdown of all 64 Phase 1 tasks with effort estimates
- **[PHASE1_SUMMARY.md](./PHASE1_SUMMARY.md)** - High-level overview of Phase 1 implementation
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Detailed technical implementation notes
- **[AGENTS.md](./AGENTS.md)** - Information about Claude Code agents and their usage

### Deployment
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete guide for deploying to Kubernetes with Helm and GitHub Actions

---

## 🔗 External Documentation

- **[Technical Specification (Confluence)](https://techopsservices.atlassian.net/wiki/spaces/VIBE/pages/1769492)** - Complete technical architecture and design
- **[Implementation Plan (Confluence)](https://techopsservices.atlassian.net/wiki/spaces/VIBE/pages/1441811)** - Detailed implementation plan with 11 epics
- **[JIRA Project](https://techopsservices.atlassian.net/jira/software/projects/VIBE)** - Task tracking and project management

---

## 📖 Document Purposes

### QUICKSTART.md
**When to use:** You want to get vibeyard running as quickly as possible.

Contains:
- Prerequisites checklist
- 7-step quick setup process
- Current project status
- Next development tasks

### SETUP.md
**When to use:** You need detailed setup instructions with troubleshooting.

Contains:
- Complete installation guide
- Docker setup instructions
- GitHub OAuth configuration
- Environment variable setup
- Prisma database setup
- Troubleshooting common issues
- All development commands

### DEPLOYMENT.md
**When to use:** You're ready to deploy to production or staging.

Contains:
- Kubernetes deployment strategy
- Helm chart structure
- GitHub Actions CI/CD workflows
- Dockerfile configuration
- Monitoring and scaling strategies
- Security considerations
- Rollback procedures

### TASKS.md
**When to use:** You want to see all development tasks and their details.

Contains:
- 64 tasks organized into 11 epics
- Effort estimates for each task
- Task dependencies
- Sprint organization
- Critical path

### PHASE1_SUMMARY.md
**When to use:** You want a high-level overview of Phase 1.

Contains:
- Architecture summary
- Key features overview
- Timeline and effort estimates
- Success criteria
- Risk mitigation strategies
- Links to detailed documentation

### IMPLEMENTATION_SUMMARY.md
**When to use:** You need detailed technical notes about what was implemented.

Contains:
- Complete list of files created
- Implementation decisions
- Configuration details
- Testing setup
- Known issues and TODOs

### CHECKLIST.md
**When to use:** You're setting up vibeyard and want to verify each step.

Contains:
- Prerequisites verification
- Step-by-step setup checklist
- Service health checks
- Common issues and solutions
- Final verification summary

### AGENTS.md
**When to use:** You want to understand or use Claude Code agents.

Contains:
- Available agent types
- Agent capabilities
- Usage examples
- Best practices

---

## 🎯 Quick Navigation

**Just starting?** → [QUICKSTART.md](./QUICKSTART.md)

**Need detailed setup help?** → [SETUP.md](./SETUP.md)

**Want to see all tasks?** → [TASKS.md](./TASKS.md)

**Ready to deploy?** → [DEPLOYMENT.md](./DEPLOYMENT.md)

**Troubleshooting setup?** → [CHECKLIST.md](./CHECKLIST.md)

---

## 🤝 Contributing to Documentation

Found an issue or want to improve the docs?

1. Documentation follows Markdown format
2. Keep examples clear and concise
3. Include code snippets where helpful
4. Test all commands before documenting
5. Update the index when adding new docs

---

**Last Updated:** 2025-12-25

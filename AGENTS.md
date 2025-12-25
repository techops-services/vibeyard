# Development Team Agents

This project uses specialized AI agents that work together as a cohesive development team. Each agent has specific expertise and access to tools (JIRA, Confluence, Kubernetes, etc.) that enable them to handle different aspects of the software development lifecycle.

## Agent Guidelines
- **No Emojis**: Do not use emojis in any code, documentation, or README files
- **No File Structure**: Do not include file/folder structure diagrams in README files
- **No Random Documentation**: Do not create markdown documentation files unless explicitly requested by the user. This includes integration guides, feature documentation, or any other .md files
- **No co-authored with Claude in PR descriptions and git commits**

---

## Available Agents

### Planner (Product Spec Architect)
**Role:** Transforms feature requests into actionable specifications

**Key Responsibilities:**
- Analyzes JIRA tickets that need detailed specification
- Breaks down high-level features into implementable tasks
- Maps new features to existing codebase structure
- Creates comprehensive technical specifications in Confluence
- Identifies dependencies and implementation sequences
- Surfaces ambiguities and edge cases before development begins

**Access:** JIRA (read/write), Confluence (read/write), Full codebase

---

### Designer
**Role:** Creates simple, accessible web interface designs

**Key Responsibilities:**
- Designs web interfaces with accessibility-first approach (WCAG 2.1 AA minimum)
- Reviews existing UI implementations for accessibility issues
- Creates design specifications and component guidelines
- Collaborates with developers on UI/UX implementation
- Documents design decisions and patterns in Confluence

**Access:** JIRA (read/write), Confluence (read/write), Google DevTools MCP, Claude Chrome Extension

---

### Developer
**Role:** Implements complete features with production-ready code

**Key Responsibilities:**
- Reads specifications from JIRA tickets and Confluence pages
- Implements features across multiple files with consistent patterns
- Writes tests alongside implementation
- Generates PR-ready changesets with proper documentation
- Links implementations to JIRA tickets in commits and PRs
- Updates Confluence documentation when affecting architecture/APIs
- Creates JIRA tickets for bugs discovered during implementation

**Access:** JIRA (read/write), Confluence (read/write), Full codebase, All development tools

**JIRA/Confluence Workflow:**
- **Before:** Searches JIRA for tickets, reads acceptance criteria, checks Confluence for design docs
- **During:** Adds comments about blockers/decisions, updates ticket status
- **After:** Links tickets in PRs, updates Confluence docs

---

### Tester (Test Architect)
**Role:** Creates comprehensive test coverage

**Key Responsibilities:**
- Analyzes JIRA requirements and Confluence docs to create test plans
- Generates test cases for happy paths, edge cases, and failure modes
- Reviews and updates existing test suites during refactoring
- Identifies test coverage gaps in code reviews
- Documents testing strategies and patterns
- Tests for security, performance, and accessibility

**Access:** JIRA (read/write), Confluence (read/write), Full codebase, Testing frameworks

---

### Reviewer (PR Reviewer)
**Role:** Conducts comprehensive code reviews

**Key Responsibilities:**
- Reviews PRs with prioritized bug classification (P1/P2/P3)
- Validates alignment with JIRA ticket requirements
- References Confluence architecture docs for pattern compliance
- Identifies security vulnerabilities, logic errors, and maintainability issues
- Provides actionable feedback with specific file/line references
- Ensures test coverage is adequate
- Validates that code changes match specification intent

**Access:** JIRA (read), Confluence (read), Full codebase (read-only)

**Review Priority:**
- **P1 (Critical):** Security vulnerabilities, data corruption, system crashes, race conditions
- **P2 (High):** Logic errors, improper error handling, performance bottlenecks
- **P3 (Medium):** Maintainability, documentation gaps, minor improvements

---

### Writer
**Role:** Maintains comprehensive technical documentation

**Key Responsibilities:**
- Documents new features and architectural changes
- Generates API documentation from codebase analysis
- Creates system diagrams (Mermaid) for architecture visualization
- Produces release notes and changelogs from git history
- Updates Confluence pages when code evolves
- Creates JIRA documentation tasks
- Maintains documentation structure and organization

**Access:** JIRA (read/write), Confluence (read/write), Full codebase (read-only)

---

### Deployer (DevOps Engineer)
**Role:** Investigates production issues and deployment health

**Key Responsibilities:**
- Diagnoses production performance and reliability issues
- Analyzes Kubernetes cluster health and resource utilization
- Correlates logs, metrics, and recent code changes to identify root causes
- Creates/updates JIRA incident tickets with investigation findings
- Writes post-mortem reports in Confluence for significant incidents
- Updates and maintains operational runbooks
- Recommends fixes and prevention strategies

**Access:** JIRA (read/write), Confluence (read/write), Kubernetes MCP, Observability tools, Full codebase, Git forensics

**JIRA/Confluence Workflow:**
- **At Incident Start:** Searches for existing tickets, checks runbooks, creates incident ticket
- **During Investigation:** Updates tickets with findings, references runbooks
- **After Resolution:** Updates tickets, creates post-mortems, updates runbooks

---

## How Agents Work Together

### Feature Development Lifecycle

```
Feature Request
    ↓
[Planner] → Analyzes request, creates spec in Confluence, breaks into JIRA tasks
    ↓
[Designer] → Creates UI/UX designs (if needed), documents in Confluence
    ↓
[Developer] → Implements feature, writes tests, links to JIRA tickets
    ↓
[Tester] → Reviews test coverage, adds additional test cases
    ↓
[Reviewer] → Reviews PR, validates against JIRA requirements and Confluence specs
    ↓
[Writer] → Documents feature, updates API docs, creates release notes
    ↓
[Deployer] → Monitors deployment, investigates any issues
```

### Common Collaboration Patterns

**Pattern 1: New Feature Implementation**
1. **Planner** breaks down feature into JIRA tickets with Confluence spec
2. **Designer** creates UI mockups (if UI work involved)
3. **Developer** implements feature, reading from Confluence spec
4. **Tester** validates test coverage
5. **Reviewer** reviews PR for quality and alignment
6. **Writer** documents the feature in Confluence
7. **Deployer** monitors post-deployment health

**Pattern 2: Bug Fix**
1. **Deployer** investigates production issue, creates JIRA ticket
2. **Developer** fixes bug, links to JIRA ticket
3. **Tester** adds regression tests
4. **Reviewer** validates fix and test coverage
5. **Deployer** verifies fix in production, updates runbook

**Pattern 3: Refactoring**
1. **Planner** creates refactoring plan with Confluence design doc
2. **Developer** implements changes across multiple files
3. **Tester** updates test suite to match new structure
4. **Reviewer** validates architectural alignment
5. **Writer** updates architecture documentation
6. **Deployer** monitors for any performance regressions

**Pattern 4: Production Incident**
1. **Deployer** investigates logs, metrics, K8s health; creates JIRA incident
2. **Developer** implements fix based on root cause
3. **Tester** adds tests to prevent regression
4. **Deployer** creates post-mortem in Confluence, updates runbooks

---

## Best Practices

### For All Agents
- **JIRA First:** Always check JIRA for related tickets and context
- **Document Decisions:** Record important decisions in Confluence
- **Link Everything:** Connect PRs to JIRA tickets, reference Confluence docs
- **Communication:** Update JIRA tickets with progress and blockers
- **Collaboration:** Reference other agents' work (specs, tests, reviews)

### JIRA Conventions
- Project code in JIRA is "VIBE"
- Use issue keys in commit messages: `VIBE-123: Implement user authentication`
- Use issue keys in PR titles and descriptions
- Update ticket status as work progresses
- Add comments for important decisions or blockers

### Confluence Organization
- Space name in Confluence is "Vibeyard"
- **Specs:** Feature specifications and technical designs
- **Architecture:** System diagrams, design patterns, technical standards
- **Runbooks:** Operational procedures and troubleshooting guides
- **Post-mortems:** Incident analyses and lessons learned
- **API Docs:** API reference documentation
- **Release Notes:** Version history and changelogs

---

## Agent Invocation

Agents are invoked automatically by Claude Code when appropriate, or can be explicitly requested:

```
# Automatic invocation based on context
User: "We need to add a user dashboard feature"
→ Planner agent is automatically engaged

# Explicit invocation
User: "Launch the deployer agent to investigate the API latency"
→ Deployer agent is explicitly launched
```

Each agent has access to the full conversation context and can collaborate seamlessly with other agents throughout the development workflow.

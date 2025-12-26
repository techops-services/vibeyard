# Overview

This skill provides a comprehensive workflow for implementing JIRA issues with professional software engineering practices. It automates the entire development lifecycle from issue analysis through PR creation, ensuring quality through test-driven development, parallel code reviews, and systematic validation.

## When to Use This Skill

Use this skill when:
- User provides a JIRA issue ID (format: `TRA-9`, `DEV-123`, etc.)
- User requests implementation of a JIRA issue
<!-- - User wants a structured TDD approach with code review -->
<!-- - User needs automated workflow from issue to PR -->

Examples:
- "Implement TRA-142"
- "Help me build the feature in DEV-89"
- "Work on JIRA issue ABC-456"

# Core Workflow

The skill follows a 11-step process:

1. **Fetch JIRA Issue** - Retrieve complete issue details via JIRA MCP
2. **Gather Additional Context** - Invoke feature-spec skill
3. **Move to In Progress** - Update issue status to indicate active work
4. **Analyze & Plan** - Break down requirements and create implementation plan using planner agent
5. **Save to Memory** - Store plan in memory graph for tracking using memory MCP
6. **Review Plan** - Present plan for user confirmation
7. **TDD Implementation** - Invoke tester and developer agents for test-driven development. If frontend dev is required invoke frontend-design skill. Use Chrome devtools MCP as needed
8. **Parallel Code Reviews** - Invoke reviewer agent for comprehensive analysis
9. **Address Feedback** - Invoke developer agent to systematically fix issues
10. **Validation** - Ensure all tests and linters pass
11. **Document the new features** - Invoke writer agent to document and add the new feature in the already available documentation structure

<!-- BELOW IS NOT USED -->
<!-- 14. **Final Verification** - Confirm CI/CD pipeline and JIRA integration ask user to confirm -->
<!-- 14. **Create PR** - Generate comprehensive pull request with JIRA linking ask user to confirm -->
<!-- 13. **Logical Commits** - Create meaningful commit history
4. **Create Feature Branch** - Use JIRA's suggested git branch naming -->

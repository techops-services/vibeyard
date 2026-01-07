# Vibecode Template

A production-ready template for AI-assisted development using Claude Code with specialized agents, skills, and MCP server integrations.

## What's Included

This template provides everything you need to start vibecoding with Claude Code:

- **7 Specialized Agents**: Planner, Designer, Developer, Tester, Reviewer, Writer, and Deployer agents that work together as a cohesive development team
- **Production Workflows**: Pre-configured skills for feature development, specification writing, code review, and documentation
- **MCP Server Integration**: Example configurations for Memory, Atlassian (JIRA/Confluence), and Chrome DevTools servers
- **Best Practices**: Agent guidelines and collaboration patterns for effective AI-assisted development

## Quick Start

### 1. Use This Template

Click the "Use this template" button on GitHub to create a new repository from this template.

### 2. Copy Template Files to Your Project

Copy the `.claude` directory to the root of your project:

```bash
cp -r .claude /path/to/your/project/
cp CLAUDE.md /path/to/your/project/
```

### 3. Customize CLAUDE.md

Edit `CLAUDE.md` to match your project:

- Add your technology stack (framework, database, deployment platform)
- Define your coding conventions and style preferences
- Set your testing standards and coverage requirements
- Update JIRA project code (replace `[YOUR-PROJECT-CODE]`)
- Update Confluence space name (replace `[Your Space Name]`)

### 4. Configure MCP Servers (Optional)

If you want to use MCP servers for integrations:

1. Copy the example settings file:
   ```bash
   cp .claude/settings.example.json .claude/settings.local.json
   ```

2. Configure your MCP servers in `.claude/settings.local.json`

3. For Atlassian integration, you'll need to authenticate:
   ```bash
   npx @atlassian/mcp-server-atlassian
   ```
   Follow the prompts to connect your Atlassian account.

## Available Agents

The template includes 7 specialized agents:

- **Planner**: Transforms feature requests into actionable specifications
- **Designer**: Creates accessible web interface designs
- **Developer**: Implements production-ready features with tests
- **Tester**: Creates comprehensive test coverage
- **Reviewer**: Conducts thorough code reviews
- **Writer**: Maintains technical documentation
- **Deployer**: Investigates production issues and deployment health

Agents automatically collaborate based on your requests. See `CLAUDE.md` for detailed agent capabilities and workflows.

## Available Skills

Pre-configured skills for common development tasks:

- **/feature-spec**: Create feature specifications in Confluence
- **/feature-dev**: Implement JIRA issues with TDD workflow
- **/doc-coauthoring**: Structured documentation creation
- **/frontend-design**: Create production-grade frontend interfaces
- **/interview**: Conduct feature requirement interviews
- **/skill-creator**: Guide for creating custom skills

## MCP Servers

Example configurations for:

- **Memory**: Persistent knowledge graph for storing context across sessions
- **Atlassian**: JIRA and Confluence integration for issue tracking and documentation
- **Chrome DevTools**: Browser automation and testing capabilities

Configure these in `.claude/settings.local.json` based on your needs.

## How It Works

1. **Feature Request**: Start with a JIRA ticket or natural language request
2. **Planning**: Planner agent creates specifications and breaks down tasks
3. **Design** (if needed): Designer agent creates UI/UX mockups
4. **Development**: Developer agent implements with tests
5. **Review**: Reviewer agent validates code quality
6. **Documentation**: Writer agent updates docs
7. **Deployment**: Deployer agent monitors production health

All agents work together seamlessly, reading from JIRA/Confluence and maintaining project conventions defined in `CLAUDE.md`.

## Best Practices

- Update `CLAUDE.md` as you establish new patterns and conventions
- Use JIRA ticket keys in commit messages for traceability
- Document architectural decisions in Confluence
- Let agents collaborate naturally based on task complexity
- Store important context in the Memory MCP server for persistence

## Learn More

Visit [vibeyard.com/vibecode](https://vibeyard.com/vibecode) for comprehensive vibecoding guides and best practices.

## License

This template is provided as-is for use with Claude Code. Customize freely for your projects.

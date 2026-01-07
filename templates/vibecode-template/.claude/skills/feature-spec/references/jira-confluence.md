# JIRA and Confluence Integration Guide

This guide explains how to save feature specifications to JIRA tickets and Confluence pages.

## Determining Where to Save

Always ask the user where they want the spec saved:
1. **JIRA ticket only**: Creates a JIRA ticket with the full spec in description
2. **Confluence page only**: Creates a Confluence page with the full spec
3. **Both**: Creates Confluence page with full spec + JIRA ticket with summary and link

**Recommendation:** For substantial specs (>2 pages), suggest option 3 (both). JIRA tickets should reference the Confluence page, which contains the full spec.

## Required Information

Before saving, collect:
- **Cloud ID**: The Atlassian instance identifier
- **Project key** (JIRA): Which project the ticket belongs to
- **Space ID** (Confluence): Which space the page belongs to
- **Issue type** (JIRA): Epic, Story, Task, etc.

If user doesn't know these details, help them find them:
- Use `mcp__atlassian__getAccessibleAtlassianResources` to get Cloud ID
- Use `mcp__atlassian__getVisibleJiraProjects` to list projects
- Use `mcp__atlassian__getConfluenceSpaces` to list spaces

## Creating a JIRA Ticket

### Step 1: Prepare Content

**For full spec in JIRA (option 1):**
Convert the spec markdown to Atlassian Document Format (ADF) by setting contentFormat to "markdown".

**For summary with link (option 3):**
Create a concise ticket description:
- 2-3 sentence summary of the feature
- Link to the Confluence page with full spec
- Key acceptance criteria or requirements

Example:
```markdown
Feature to enable CSV/Excel/PDF export from data tables.

Full specification: [Feature Spec: Data Export](https://yoursite.atlassian.net/wiki/...)

**Key Requirements:**
- Support CSV, Excel, and PDF formats
- Respect user permissions
- Export completes within 5 seconds for up to 1000 rows
```

### Step 2: Get Project Metadata

Use `mcp__atlassian__getVisibleJiraProjects` to:
- Verify the project exists
- Get available issue types for the project

Use `mcp__atlassian__getJiraProjectIssueTypesMetadata` if you need detailed metadata about issue types.

### Step 3: Create the Ticket

Use `mcp__atlassian__createJiraIssue`:

```
{
  cloudId: "...",
  projectKey: "PROJ",
  issueTypeName: "Story",
  summary: "Add data export feature",
  description: "[markdown content]",
  contentFormat: "markdown"
}
```

**Important:** The summary should be concise (one line). Put the full spec in the description.

### Step 4: Return the Link

After creating, provide the JIRA ticket URL to the user:
```
Created JIRA ticket: PROJ-123
https://yoursite.atlassian.net/browse/PROJ-123
```

## Creating a Confluence Page

### Step 1: Prepare Content

Convert the spec to Markdown format. Confluence supports markdown via the contentFormat parameter.

**Structure recommendations:**
- Use clear heading hierarchy (# for title, ## for sections)
- Include a table of contents if spec is long (>5 sections)
- Add metadata at the top (author, date, related JIRA tickets)
- Use code blocks for technical details
- Add a "Change Log" section at the bottom for tracking updates

Example structure:
```markdown
# Feature Spec: Data Export

**Author:** [name]
**Date:** 2024-01-15
**Status:** Draft
**JIRA:** [PROJ-123](link)

## Table of Contents
1. Problem Statement & User Needs
2. Requirements & Acceptance Criteria
3. Technical Approach & Architecture
4. UI/UX Design Considerations

[... sections ...]

## Change Log
- 2024-01-15: Initial draft
```

### Step 2: Get Space Information

Use `mcp__atlassian__getConfluenceSpaces` to:
- List available spaces
- Get the space ID for where the page will be created

If user provides a space key (e.g., "TECH"), you'll need to convert it to a numerical space ID using this tool.

### Step 3: Create the Page

Use `mcp__atlassian__createConfluencePage`:

```
{
  cloudId: "...",
  spaceId: "12345",
  title: "Feature Spec: Data Export",
  body: "[markdown content]",
  contentFormat: "markdown"
}
```

**Optional parameters:**
- `parentId`: If creating as a child page (useful for organizing specs)
- `isPrivate`: If the spec should be private initially

### Step 4: Return the Link

After creating, provide the Confluence page URL to the user:
```
Created Confluence page: Feature Spec: Data Export
https://yoursite.atlassian.net/wiki/spaces/TECH/pages/123456789/...
```

## Creating Both (Recommended for Full Specs)

When creating both a JIRA ticket and Confluence page:

### Step 1: Create Confluence Page First

Create the full spec as a Confluence page following the steps above.

### Step 2: Create JIRA Ticket with Link

Create the JIRA ticket with:
- Concise summary in the title
- Brief description (2-3 sentences) in the body
- Link to the Confluence page
- Key acceptance criteria or requirements

Example description:
```markdown
Feature to enable CSV/Excel/PDF export from data tables.

**Full Specification:** [Feature Spec: Data Export](https://yoursite.atlassian.net/wiki/spaces/TECH/pages/123456789)

**Key Requirements:**
- Support CSV, Excel, and PDF formats
- Respect user permissions and data access rules
- Export generation completes within 5 seconds for up to 1000 rows
- Secure file storage with 24-hour TTL
```

### Step 3: Update Confluence Page with JIRA Link

Use `mcp__atlassian__updateConfluencePage` to add the JIRA ticket link to the Confluence page metadata:

Update the top of the page to include:
```markdown
**JIRA Ticket:** [PROJ-123](https://yoursite.atlassian.net/browse/PROJ-123)
```

### Step 4: Return Both Links

Provide both links to the user:
```
Created feature specification:

📄 Confluence Page: Feature Spec: Data Export
   https://yoursite.atlassian.net/wiki/spaces/TECH/pages/123456789/...

🎫 JIRA Ticket: PROJ-123
   https://yoursite.atlassian.net/browse/PROJ-123
```

## Updating Existing Items

### Updating a JIRA Ticket

If the user wants to update an existing ticket:

Use `mcp__atlassian__editJiraIssue`:

```
{
  cloudId: "...",
  issueIdOrKey: "PROJ-123",
  fields: {
    description: "[updated markdown content]"
  }
}
```

**Note:** This replaces the description. If you want to add to the description, first read the existing ticket with `mcp__atlassian__getJiraIssue`, then append/modify as needed.

### Updating a Confluence Page

If the user wants to update an existing page:

Use `mcp__atlassian__updateConfluencePage`:

```
{
  cloudId: "...",
  pageId: "123456789",
  body: "[updated markdown content]",
  contentFormat: "markdown",
  versionMessage: "Updated technical approach section"
}
```

**Important:** Include a `versionMessage` explaining what changed. This creates a clear change history.

## Error Handling

**Common errors and solutions:**

1. **"Project not found"**: Verify project key is correct using `getVisibleJiraProjects`
2. **"Space not found"**: Verify space ID is correct using `getConfluenceSpaces`
3. **"Issue type not available"**: Check available issue types with `getJiraProjectIssueTypesMetadata`
4. **"Permission denied"**: User may not have create permissions for that project/space
5. **"Invalid markdown"**: Check for syntax errors in the content

**When errors occur:**
- Explain the error clearly to the user
- Suggest how to fix it
- Offer to try again with corrected information

## Tips for Effective Spec Storage

### JIRA Ticket Best Practices

- Use clear, descriptive titles that include the feature name
- Set appropriate labels (e.g., "feature-spec", "needs-review")
- Link related tickets (dependencies, related work)
- Assign to appropriate team or person
- Set priority based on user input

### Confluence Page Best Practices

- Choose a descriptive title that's easy to search
- Place in the appropriate space (usually "Engineering" or "Product")
- Consider creating as a child page of a "Feature Specs" parent page
- Add labels for discoverability (e.g., "specification", "engineering", "Q1-2024")
- Use the "Page Properties" macro for structured metadata (if needed)

### Keeping Them in Sync

When creating both:
- Make the Confluence page the source of truth for the full spec
- Use the JIRA ticket for tracking work, comments, and status
- Update the Confluence page when the spec changes significantly
- Add a "Last Updated" date to the Confluence page
- Consider adding a link to the JIRA ticket in Confluence comments: "Track implementation progress in PROJ-123"

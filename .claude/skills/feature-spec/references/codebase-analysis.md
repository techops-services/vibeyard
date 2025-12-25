# Codebase Analysis Guide

This guide explains what to look for when exploring the codebase to inform a feature specification.

## Purpose

Before proposing a technical approach, understand:
- Existing architecture and patterns
- Similar features to learn from
- Integration points and dependencies
- Technical constraints and opportunities

## What to Explore

### 1. Project Structure & Architecture

**Identify the overall architecture:**
- Monorepo or separate repositories?
- Frontend/backend separation?
- Microservices or monolithic?
- Key directories and their purposes

**Look for:**
- Package.json / requirements.txt / build files (tech stack)
- README files (architecture overview)
- docs/ or documentation folders
- Config files (database, API, deployment)

**Example findings to report:**
```
The project is a React frontend (src/frontend/) with a Node.js backend (src/backend/).
Tech stack: React, TypeScript, Express, PostgreSQL.
Uses REST API for frontend-backend communication.
```

### 2. Similar Existing Features

**Search for features similar to what's being spec'd:**

If building an export feature, look for:
- Existing export functionality
- Download/file generation features
- Data transformation utilities

If building authentication, look for:
- Authorization/session management
- User profile features
- Security middleware

**Methods:**
- Use Grep to search for relevant keywords
- Use Glob to find related files by name patterns
- Use Task tool with Explore agent for thorough investigation

**Report findings:**
- Where similar features live
- Patterns they follow
- Utilities/services they use
- Any lessons learned (comments about limitations, TODOs)

### 3. Integration Points

**Identify where the new feature will connect:**

For each integration point, understand:
- **APIs**: What endpoints exist? REST, GraphQL, gRPC?
- **Services**: What backend services/modules are relevant?
- **Database**: What tables/collections are relevant? Schema?
- **Frontend components**: Where will UI integrate?
- **State management**: Redux, Context, other?
- **Authentication**: How are requests authenticated?

**Example findings:**
```
The feature will integrate with:
- Frontend: Add button to DataTable component (src/components/DataTable.tsx)
- Backend: Create new ExportService (will need new directory)
- API: Add endpoint to routes/api.ts (follows existing pattern)
- Database: Uses existing data_view table (no schema changes needed)
- Auth: Uses existing JWT middleware from middleware/auth.ts
```

### 4. Existing Patterns & Conventions

**Understand how the team builds features:**

Look for patterns in:
- **API design**: URL structure, request/response formats, error handling
- **Component structure**: How components are organized, naming conventions
- **Service layer**: How business logic is structured
- **Data access**: ORMs, query builders, direct SQL?
- **Error handling**: How errors are thrown and caught
- **Testing**: Where tests live, testing frameworks used
- **Type definitions**: TypeScript interfaces, schemas

**Example findings:**
```
Team conventions:
- API endpoints follow /api/v1/{resource}/{action} pattern
- Services in src/services/{name}.service.ts
- Each service has corresponding tests in __tests__/
- TypeScript interfaces defined in types/ directory
- Error handling uses custom AppError class
- All APIs return { success, data, error } format
```

### 5. Technical Constraints & Opportunities

**Identify constraints that will affect the design:**

- **Dependencies**: What libraries are already in use?
- **Performance**: Any known bottlenecks or requirements?
- **Security**: Authentication, authorization patterns?
- **Scalability**: How is the system scaled?
- **Deployment**: How is code deployed? CI/CD?

**Look for opportunities:**
- Underutilized libraries that could help
- Reusable components or utilities
- Patterns that could be improved or extended

**Example findings:**
```
Constraints:
- Must use existing PostgreSQL database (can't add new DB)
- Frontend must support IE11 (limits some ES6 features)
- API rate limiting: 100 requests/minute per user

Opportunities:
- Can leverage existing file-storage service for exports
- React-Query already handles data fetching patterns
- Existing worker queue for background jobs
```

### 6. Dependencies & Prerequisites

**Identify what must exist or be completed first:**

- Required libraries or services
- Database migrations needed
- Infrastructure changes
- Other features this depends on
- Features that depend on this

**Example findings:**
```
Prerequisites:
- Requires file-storage service to be deployed (currently in staging)
- Need to add export_logs table for audit trail
- Depends on data-permissions feature (completed last sprint)
```

## Exploration Workflow

### Use Task Tool with Explore Agent

For comprehensive exploration, use the Task tool with subagent_type=Explore:

```
Use Task tool: "Explore the codebase to understand [specific aspect].
I'm speccing a [feature description] and need to understand [what to find]."
```

**Example:**
```
Use Task tool: "Explore the codebase to understand existing data export and download
features. I'm speccing a CSV export feature and need to understand what patterns
already exist for file generation and delivery."
```

### Targeted Searches

For specific findings, use direct tools:

**Find files by pattern:**
- Use Glob: `**/*export*.ts` to find export-related files
- Use Glob: `**/services/*.service.ts` to find all services

**Search for keywords:**
- Use Grep: `"download"` with `-i` (case insensitive)
- Use Grep: `"export.*data"` to find export-related code

### Read Key Files

Once you've identified relevant files:
- Read architecture documentation
- Read similar feature implementations
- Read API route definitions
- Read key service files
- Read type definitions

## Reporting Findings

When reporting codebase findings to the user, structure as:

**1. Architecture Summary** (2-3 sentences)
Brief overview of how the system is structured

**2. Similar Features** (if found)
Where they live and how they work

**3. Integration Points** (bulleted list)
Where the new feature will connect

**4. Existing Patterns** (bulleted list)
Conventions to follow

**5. Technical Considerations**
Constraints and opportunities

**6. Questions** (if any)
Clarifications needed before proposing approach

Keep it concise but comprehensive. Focus on what's most relevant to the feature being spec'd.

## Example Report

```
## Codebase Analysis: CSV Export Feature

**Architecture:**
The app is a React/TypeScript frontend (src/client/) with Node.js/Express backend
(src/server/). Data stored in PostgreSQL. RESTful API for communication.

**Similar Features:**
Found an existing PDF report generator (src/server/services/report.service.ts) that:
- Generates files in background job queue
- Stores files in S3 via storage.service.ts
- Returns download URL with 24hr expiry
- Logs activity to audit_logs table

**Integration Points:**
- Frontend: Add export button to DataGrid component (src/client/components/DataGrid.tsx)
- Backend: Create ExportService (follow pattern from report.service.ts)
- API: Add POST /api/v1/data/export endpoint (src/server/routes/api/data.ts)
- Queue: Use existing Bull queue (src/server/queue/index.ts)
- Storage: Use existing storage.service.ts for S3 upload

**Patterns to Follow:**
- Services use dependency injection pattern
- All services have corresponding interfaces in src/server/types/
- API responses use ApiResponse<T> wrapper type
- Background jobs registered in src/server/queue/workers/
- Tests colocated in __tests__/ directories

**Technical Considerations:**
- Can leverage existing S3 storage (no new infrastructure)
- Queue handles up to 50 concurrent jobs
- Must respect existing data permissions (use PermissionService)
- CSV library already in dependencies (papaparse)

This gives us a clear path: follow the report generation pattern but adapt for CSV format.
```

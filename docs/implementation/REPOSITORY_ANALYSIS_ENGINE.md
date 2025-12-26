# Repository Analysis Engine

Complete implementation of the automated repository analysis system for Vibeyard.

## Overview

The Repository Analysis Engine is a sophisticated background job processing system that analyzes GitHub repositories and generates comprehensive insights including:

- **AI Tool Detection**: Identifies AI coding assistants used (Claude, GPT, Copilot, Cursor, Aider, Windsurf)
- **Completeness Score**: Calculates a 0-100 score based on documentation, tests, config, CI/CD, etc.
- **AI-Powered Insights**: Uses GPT-4 to analyze README and extract purpose, tech stack, features, improvements, and mistakes
- **Timeline Analysis**: Tracks first/last commits, total commits, and contributor count

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Request                          │
│         POST /api/repositories/[id]/analyze                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Analysis Queue (BullMQ)                    │
│                    Redis-backed Queue                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Analysis Worker                            │
│              Processes Jobs Concurrently                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               Repository Analyzer                            │
│              Orchestrates All Analysis                       │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
   ┌─────────┐   ┌─────────────┐  ┌──────────────┐
   │   AI    │   │ Completeness│  │   Insights   │
   │Detector │   │   Scorer    │  │  Generator   │
   └─────────┘   └─────────────┘  └──────────────┘
         │               │               │
         └───────────────┼───────────────┘
                         ▼
               ┌──────────────────┐
               │  Prisma Database │
               │ RepositoryAnalysis│
               └──────────────────┘
```

## Components

### 1. Queue Infrastructure

**Location**: `/services/queue/`

#### `queue-config.ts`
- Centralized BullMQ configuration
- Redis connection settings
- Default queue and worker options
- Job retry strategies and backoff
- Queue naming constants

```typescript
export const QUEUE_NAMES = {
  REPOSITORY_ANALYSIS: 'repository-analysis',
}

export const JOB_PRIORITIES = {
  LOW: 1,
  NORMAL: 5,
  HIGH: 10,
  URGENT: 20,
}
```

#### `analysis-queue.ts`
- Queue management for repository analysis jobs
- Job creation and tracking
- Status monitoring
- Queue metrics and cleanup

**Key Methods**:
- `addAnalysisJob(data, priority)` - Queue a new analysis job
- `getLatestRepositoryJob(repositoryId)` - Get latest job for a repo
- `getJobStatus(jobId)` - Get current job status
- `getQueueMetrics()` - Get queue statistics

### 2. Analysis Services

**Location**: `/services/analysis/`

#### `ai-detector.ts`
Detects AI coding tool usage by analyzing:
- File patterns (`.cursor`, `.aider`, `CLAUDE.md`, etc.)
- Commit messages for AI tool signatures
- README mentions of AI tools

**Detection Patterns**:
```typescript
{
  claude: ['claude.md', 'CLAUDE.md', '.anthropic'],
  gpt: ['.openai', 'chatgpt-config.json'],
  copilot: ['.copilot'],
  cursor: ['.cursor', '.cursorrules'],
  aider: ['.aider', '.aider.conf'],
  windsurf: ['.windsurf']
}
```

**Output**:
```typescript
{
  detected: boolean,
  provider: 'claude' | 'gpt' | 'copilot' | ...,
  confidence: 0.0 - 1.0,
  evidence: {
    files: string[],
    commits: string[],
    readme: string[]
  }
}
```

#### `completeness-scorer.ts`
Calculates a comprehensive 0-100 completeness score:

| Category | Points | Criteria |
|----------|--------|----------|
| README | 25 | Presence (15) + Quality by word count (10) |
| Package Manager | 10 | package.json, requirements.txt, etc. |
| Tests | 15 | Test files and directories |
| Config | 10 | .env.example, docker files, tsconfig, etc. |
| Documentation | 10 | docs/ folder and .md files |
| License | 5 | License file presence |
| Git Maturity | 10 | Commit count (10+ commits = full points) |
| Contributors | 5 | Multiple contributors |
| CI/CD | 10 | GitHub Actions, CircleCI, etc. |

**Output**:
```typescript
{
  score: 85, // 0-100
  breakdown: {
    readme: 25,
    packageManager: 10,
    tests: 15,
    config: 10,
    documentation: 10,
    license: 5,
    gitMaturity: 10,
    contributors: 5,
    cicd: 10
  }
}
```

#### `insights-generator.ts`
Uses OpenAI GPT-4o-mini to analyze README and generate:

```typescript
{
  purpose: "A Next.js web application for...",
  techStack: ["Next.js 14", "TypeScript", "Prisma", "Redis"],
  features: [
    "Real-time collaboration",
    "GitHub OAuth integration",
    "AI-powered analysis"
  ],
  improvements: [
    "Add end-to-end tests",
    "Implement rate limiting",
    "Add API documentation"
  ],
  mistakes: [
    "Missing error boundaries",
    "No input validation on API routes"
  ]
}
```

**OpenAI Configuration**:
- Model: `gpt-4o-mini` (cost-efficient)
- Temperature: 0.7 (balanced creativity)
- Max Tokens: 2000
- Response Format: JSON

#### `repository-analyzer.ts`
Main orchestrator that:
1. Fetches repository metadata
2. Runs all analysis services in parallel
3. Determines project type and framework
4. Stores results in database

**Progress Tracking**:
```typescript
10% - Fetching repository metadata
20% - Detecting AI tools
40% - Calculating completeness score
60% - Analyzing commits and contributors
70% - Generating AI insights
90% - Saving analysis results
100% - Analysis complete
```

### 3. Worker

**Location**: `/services/workers/analysis-worker.ts`

Background worker that:
- Processes jobs from the queue (3 concurrent)
- Handles retries and failures
- Updates job progress
- Logs job execution
- Graceful shutdown on SIGINT/SIGTERM

**Event Handling**:
- `completed` - Log success
- `failed` - Log error and mark repo as failed
- `stalled` - Log warning
- `active` - Log job start

### 4. API Endpoints

#### POST `/api/repositories/[id]/analyze`

Trigger repository analysis.

**Authentication**: Required (NextAuth session)

**Request**:
```json
{
  "priority": 10  // Optional: 1-20 (default: 5)
}
```

**Response** (202 Accepted):
```json
{
  "message": "Analysis job queued successfully",
  "jobId": "analysis-abc123-1234567890",
  "repositoryId": "abc123",
  "status": "queued"
}
```

**Error Responses**:
- `401` - Unauthorized (no session)
- `403` - Forbidden (not repository owner)
- `404` - Repository not found

#### GET `/api/repositories/[id]/analysis`

Retrieve analysis results and status.

**Authentication**: Not required (public)

**Response** (Analysis Complete):
```json
{
  "status": "completed",
  "lastAnalyzedAt": "2024-01-15T10:30:00Z",
  "analysis": {
    "id": "analysis_123",
    "aiDetected": true,
    "aiProvider": "claude",
    "aiConfidence": 0.85,
    "aiEvidence": {...},
    "projectType": "web",
    "framework": "nextjs",
    "completenessScore": 78,
    "purpose": "A platform for...",
    "techStack": ["Next.js", "TypeScript"],
    "features": [...],
    "improvements": [...],
    "mistakes": [...],
    "commitCount": 145,
    "contributorCount": 3,
    ...
  }
}
```

**Response** (Analysis In Progress):
```json
{
  "status": "processing",
  "job": {
    "id": "job_123",
    "state": "active",
    "progress": 60,
    "attemptsMade": 1
  },
  "message": "Analysis in progress"
}
```

## Database Schema

The analysis results are stored in the `RepositoryAnalysis` model:

```prisma
model RepositoryAnalysis {
  id             String   @id @default(cuid())
  repositoryId   String   @unique
  repository     Repository @relation(fields: [repositoryId], references: [id])

  // AI Detection
  aiDetected     Boolean  @default(false)
  aiProvider     String?  // "claude", "gpt", "copilot", etc.
  aiConfidence   Float?   // 0.0 to 1.0
  aiEvidence     Json?    // {files: [], commits: [], readme: []}

  // Analysis Results
  projectType    String?  // "web", "api", "cli", "library"
  framework      String?  // "nextjs", "react", "django", etc.
  completenessScore Int?  // 0 to 100

  // AI-powered insights
  purpose        String?
  techStack      String[] // Array of technologies
  features       String[] // Array of features
  improvements   String[] // Array of suggestions
  mistakes       String[] // Array of mistakes

  // Timeline
  firstCommitAt  DateTime?
  lastCommitAt   DateTime?
  commitCount    Int?
  contributorCount Int?

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

## Usage

### Starting the Worker

The worker should run as a separate process:

```bash
# Development
node --loader ts-node/esm services/workers/analysis-worker.ts

# Production
npm run worker:analysis
```

Or use a process manager like PM2:

```json
{
  "apps": [{
    "name": "vibeyard-worker",
    "script": "services/workers/analysis-worker.ts",
    "interpreter": "node",
    "interpreter_args": "--loader ts-node/esm",
    "instances": 1,
    "autorestart": true
  }]
}
```

### Triggering Analysis

**From API**:
```typescript
const response = await fetch(`/api/repositories/${repoId}/analyze`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ priority: 10 })
})

const { jobId } = await response.json()
```

**Programmatically**:
```typescript
import { addAnalysisJob } from '@/services/queue/analysis-queue'

const job = await addAnalysisJob({
  repositoryId: 'repo_123',
  owner: 'username',
  repo: 'repository-name',
  userId: 'user_123'
}, JOB_PRIORITIES.HIGH)
```

### Checking Status

```typescript
// Via API
const response = await fetch(`/api/repositories/${repoId}/analysis`)
const { status, analysis } = await response.json()

// Programmatically
import { getAnalysisJobStatus } from '@/services/queue/analysis-queue'

const status = await getAnalysisJobStatus(jobId)
```

## Configuration

### Environment Variables

Required:
```env
# Redis (for BullMQ)
REDIS_URL="redis://localhost:6379"

# OpenAI (for insights generation)
OPENAI_API_KEY="sk-..."

# Database
DATABASE_URL="postgresql://..."
```

### Queue Settings

Edit `/services/queue/queue-config.ts`:

```typescript
export const defaultWorkerOptions = {
  concurrency: 3,  // Number of concurrent jobs
  limiter: {
    max: 10,       // Max jobs
    duration: 60000 // per 60 seconds
  }
}

export const analysisJobOptions = {
  attempts: 5,     // Retry attempts
  backoff: {
    type: 'exponential',
    delay: 5000    // Base delay in ms
  }
}
```

## Error Handling

The system includes comprehensive error handling:

1. **Job Retries**: Failed jobs retry up to 5 times with exponential backoff
2. **Graceful Degradation**: If one analysis component fails, others continue
3. **Fallback Responses**: Returns minimal insights if OpenAI fails
4. **Database Transactions**: Ensures data consistency
5. **Worker Recovery**: Automatically restarts on crashes

## Monitoring

### Queue Metrics

```typescript
import { analysisQueue } from '@/services/queue/analysis-queue'

const metrics = await analysisQueue.getQueueMetrics()
// {
//   waiting: 5,
//   active: 3,
//   completed: 150,
//   failed: 2,
//   delayed: 0
// }
```

### Job Logs

All job execution is logged with:
- Job start/completion
- Progress updates
- Error details
- Attempt counts

Check console output or integrate with logging service (Sentry, DataDog, etc.)

## Testing

### Unit Tests

```bash
npm test services/analysis/
```

### Integration Tests

```bash
# Start dependencies
docker-compose up -d redis postgres

# Run integration tests
npm test -- --testPathPattern=integration
```

### Manual Testing

1. Start Redis and PostgreSQL
2. Start the worker: `npm run worker:analysis`
3. Trigger analysis via API or UI
4. Monitor logs and database

## Performance

- **Analysis Time**: 30-90 seconds per repository (depends on size)
- **Concurrent Jobs**: 3 (configurable)
- **Rate Limits**: 10 jobs per minute (configurable)
- **Cache**: GitHub API responses cached for 1 hour
- **Cost**: ~$0.01-0.03 per analysis (OpenAI API)

## Troubleshooting

### Worker Not Processing Jobs

1. Check Redis connection
2. Verify worker is running: `pm2 list`
3. Check queue: `analysisQueue.getQueueMetrics()`
4. Review logs for errors

### Analysis Failing

1. Check GitHub token validity
2. Verify OpenAI API key
3. Check rate limits (GitHub, OpenAI)
4. Review job logs: `analysisQueue.getJob(jobId)`

### High Queue Backlog

1. Increase worker concurrency
2. Add more worker instances
3. Increase rate limits
4. Check for stuck jobs

## Future Enhancements

- [ ] Add code quality metrics (ESLint, Prettier configs)
- [ ] Security vulnerability scanning
- [ ] Performance benchmarking
- [ ] Dependency analysis and update suggestions
- [ ] Community engagement metrics
- [ ] Custom analysis rules per project type
- [ ] Scheduled re-analysis for active repositories
- [ ] WebSocket notifications for real-time progress

## References

- [BullMQ Documentation](https://docs.bullmq.io/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [GitHub REST API](https://docs.github.com/en/rest)
- [Prisma Documentation](https://www.prisma.io/docs)

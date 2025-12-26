# Repository Analysis Engine - Quick Start

Get the repository analysis engine up and running in 5 minutes.

## Prerequisites

- Node.js 20+
- Redis running (via Docker or local)
- PostgreSQL running
- OpenAI API key

## Step 1: Environment Setup

Add to your `.env` file:

```env
# OpenAI API (Required for insights generation)
OPENAI_API_KEY="sk-your-key-here"

# Redis (Required for BullMQ)
REDIS_URL="redis://localhost:6379"

# Database (Required)
DATABASE_URL="postgresql://vibeyard:password@localhost:5432/vibeyard"
```

## Step 2: Start Dependencies

```bash
# Start Redis and PostgreSQL with Docker
docker-compose up -d redis postgres

# Or start them individually
docker run -d -p 6379:6379 redis:7-alpine
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15
```

## Step 3: Run Database Migrations

```bash
npm run prisma:migrate
```

## Step 4: Start the Worker

The worker processes analysis jobs in the background.

**Option A: Development Mode**
```bash
# In a separate terminal
ts-node services/workers/analysis-worker.ts
```

**Option B: With PM2 (Production)**
```bash
pm2 start services/workers/analysis-worker.ts --name vibeyard-worker --interpreter ts-node
pm2 logs vibeyard-worker
```

## Step 5: Start the Next.js App

```bash
npm run dev
```

## Step 6: Test the Analysis

### Via API (cURL)

```bash
# Get your repository ID from the database or API
REPO_ID="your-repository-id"

# Trigger analysis
curl -X POST http://localhost:3000/api/repositories/$REPO_ID/analyze \
  -H "Cookie: your-session-cookie" \
  -H "Content-Type: application/json" \
  -d '{"priority": 10}'

# Check status
curl http://localhost:3000/api/repositories/$REPO_ID/analysis
```

### Via Frontend

1. Sign in with GitHub
2. Connect a repository
3. Click "Analyze Repository" button
4. Watch the progress bar
5. View results when complete

## Architecture Overview

```
Next.js App → Analysis Queue (Redis) → Worker → Services → Database
                                          ↓
                              ┌───────────┼───────────┐
                              ↓           ↓           ↓
                         AI Detector  Completeness  Insights
                                      Scorer        (OpenAI)
```

## Key Files

| File | Purpose |
|------|---------|
| `/services/queue/analysis-queue.ts` | Queue management |
| `/services/workers/analysis-worker.ts` | Background worker |
| `/services/analysis/repository-analyzer.ts` | Main orchestrator |
| `/app/api/repositories/[id]/analyze/route.ts` | Trigger endpoint |
| `/app/api/repositories/[id]/analysis/route.ts` | Status endpoint |

## Common Issues

### "Cannot connect to Redis"

```bash
# Check if Redis is running
docker ps | grep redis

# Start Redis
docker-compose up -d redis

# Test connection
redis-cli ping
# Should return: PONG
```

### "OpenAI API key invalid"

```bash
# Verify your API key
echo $OPENAI_API_KEY

# Test it
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### "Worker not processing jobs"

```bash
# Check worker logs
pm2 logs vibeyard-worker

# Restart worker
pm2 restart vibeyard-worker

# Check queue status
# In Node.js REPL or script:
# const { analysisQueue } = require('./services/queue/analysis-queue')
# await analysisQueue.getQueueMetrics()
```

### "Analysis stuck at 0%"

- Check worker is running: `pm2 list`
- Check Redis connection
- Check GitHub access token is valid
- Review worker logs for errors

## Development Tips

### Monitor Queue in Real-Time

```typescript
// In a script or REPL
import { analysisQueue } from '@/services/queue/analysis-queue'

setInterval(async () => {
  const metrics = await analysisQueue.getQueueMetrics()
  console.log('Queue Status:', metrics)
}, 5000)
```

### Test Individual Components

```typescript
// Test AI Detector
import { createAIDetector } from '@/services/analysis/ai-detector'
import { GitHubClient } from '@/services/integrations/github-client'

const client = new GitHubClient('your-github-token')
const detector = createAIDetector(client)
const result = await detector.detectAIUsage('owner', 'repo')
console.log(result)

// Test Completeness Scorer
import { createCompletenessScorer } from '@/services/analysis/completeness-scorer'

const scorer = createCompletenessScorer(client)
const { score, breakdown } = await scorer.calculateScore('owner', 'repo')
console.log(`Score: ${score}/100`, breakdown)

// Test Insights Generator
import { createInsightsGenerator } from '@/services/analysis/insights-generator'

const generator = createInsightsGenerator(client)
const insights = await generator.generateInsights('owner', 'repo', 'description')
console.log(insights)
```

### Clean Up Old Jobs

```typescript
import { analysisQueue } from '@/services/queue/analysis-queue'

// Remove completed jobs older than 7 days
await analysisQueue.cleanOldJobs(7 * 24 * 60 * 60 * 1000)
```

## Production Deployment

### 1. Environment Variables

Set in your hosting platform:
```env
OPENAI_API_KEY=sk-prod-key
REDIS_URL=redis://your-redis-host:6379
DATABASE_URL=postgresql://...
NODE_ENV=production
```

### 2. Worker Deployment

**Option A: Separate Dyno/Container (Recommended)**
```dockerfile
# worker.Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
CMD ["node", "--loader", "ts-node/esm", "services/workers/analysis-worker.ts"]
```

**Option B: Same Container with PM2**
```json
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'web',
      script: 'npm',
      args: 'start',
      instances: 1
    },
    {
      name: 'worker',
      script: 'services/workers/analysis-worker.ts',
      interpreter: 'node',
      interpreter_args: '--loader ts-node/esm',
      instances: 1
    }
  ]
}
```

### 3. Scaling

- **Horizontal**: Run multiple worker instances
- **Vertical**: Increase worker concurrency in `queue-config.ts`
- **Rate Limits**: Adjust in `queue-config.ts`

### 4. Monitoring

Integrate with:
- **Sentry** for error tracking
- **DataDog** or **New Relic** for performance monitoring
- **BullBoard** for queue visualization

## Next Steps

1. **Customize Analysis**: Modify scoring algorithms in `completeness-scorer.ts`
2. **Add Metrics**: Track analysis performance and costs
3. **Optimize**: Implement caching for frequently analyzed repos
4. **Extend**: Add new analysis types (security, performance, etc.)
5. **UI**: Build analysis results dashboard

## Resources

- [Full Documentation](./REPOSITORY_ANALYSIS_ENGINE.md)
- [API Reference](../04-API-REFERENCE.md)
- [BullMQ Docs](https://docs.bullmq.io/)
- [OpenAI API Docs](https://platform.openai.com/docs)

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review worker logs: `pm2 logs vibeyard-worker`
3. Check queue metrics: `analysisQueue.getQueueMetrics()`
4. Verify all environment variables are set
5. Test individual components in isolation

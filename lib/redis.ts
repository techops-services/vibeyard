import Redis from 'ioredis'

// Use placeholder for build time - real value provided at runtime via K8s secrets
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

export const redis =
  globalForRedis.redis ??
  new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000)
      return delay
    },
    reconnectOnError(err) {
      const targetErrors = ['READONLY', 'ECONNREFUSED', 'ETIMEDOUT']
      return targetErrors.some((targetError) =>
        err.message.includes(targetError)
      )
    },
  })

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis
}

// Only connect at runtime, not during build
if (typeof window === 'undefined' && process.env.REDIS_URL) {
  redis
    .connect()
    .then(() => {
      console.log('✓ Redis connected successfully')
    })
    .catch((error) => {
      console.error('✗ Redis connection error:', error)
    })
}

// Handle connection events
redis.on('error', (error) => {
  console.error('Redis error:', error)
})

redis.on('connect', () => {
  console.log('Redis connecting...')
})

redis.on('ready', () => {
  console.log('Redis ready')
})

redis.on('close', () => {
  console.log('Redis connection closed')
})

redis.on('reconnecting', () => {
  console.log('Redis reconnecting...')
})

// Graceful shutdown
process.on('SIGINT', async () => {
  await redis.quit()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await redis.quit()
  process.exit(0)
})

export default redis

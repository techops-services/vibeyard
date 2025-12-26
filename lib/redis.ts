import Redis from 'ioredis'

// Get Redis URL at runtime, not build time
function getRedisUrl(): string {
  const url = process.env.REDIS_URL
  if (!url) {
    console.warn('REDIS_URL not set, using localhost fallback')
    return 'redis://localhost:6379'
  }
  return url
}

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

function createRedisClient(): Redis {
  if (globalForRedis.redis) {
    return globalForRedis.redis
  }

  const client = new Redis(getRedisUrl(), {
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
    globalForRedis.redis = client
  }

  return client
}

export const redis = createRedisClient()

// Only connect at runtime when REDIS_URL is set
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

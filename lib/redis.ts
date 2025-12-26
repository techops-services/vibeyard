import Redis from 'ioredis'

let redisClient: Redis | null = null

export function getRedis(): Redis {
  if (redisClient) {
    return redisClient
  }

  // Force runtime evaluation
  const redisUrl = (global as any).process?.env?.REDIS_URL || process.env.REDIS_URL

  if (redisUrl) {
    console.log('Redis connecting to:', redisUrl.replace(/\/\/.*@/, '//***@'))
  } else {
    console.warn('REDIS_URL not set, using localhost (build time only)')
  }

  redisClient = new Redis(redisUrl || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: !redisUrl, // Only lazy connect if no URL (build time)
    retryStrategy(times) {
      if (!redisUrl) return null // Don't retry at build time
      if (times > 10) return null
      return Math.min(times * 500, 5000)
    },
  })

  redisClient.on('error', (error) => {
    console.error('Redis error:', error.message)
  })

  redisClient.on('ready', () => {
    console.log('✓ Redis connected')
  })

  return redisClient
}

// Lazy proxy - only initialize when actually used
export const redis = new Proxy({} as Redis, {
  get(_, prop) {
    const client = getRedis()
    const value = (client as any)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})

export default redis

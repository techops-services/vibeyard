import Redis from 'ioredis'

let redisClient: Redis | null = null

export function getRedis(): Redis {
  if (redisClient) {
    return redisClient
  }

  // Force runtime evaluation by going through global
  const envVars = (global as any).process?.env || process.env
  const redisUrl = envVars.REDIS_URL

  console.log('=== Redis Init ===')
  console.log('REDIS_URL from env:', redisUrl ? redisUrl.substring(0, 20) + '...' : 'NOT SET')

  if (!redisUrl) {
    console.error('FATAL: REDIS_URL is not set!')
    throw new Error('REDIS_URL environment variable is required')
  }

  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy(times) {
      if (times > 10) {
        console.error('Redis max retries reached')
        return null
      }
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

// For backwards compatibility - lazy getter
export const redis = new Proxy({} as Redis, {
  get(_, prop) {
    return (getRedis() as any)[prop]
  },
})

export default redis

import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

// Lazy singleton - only create Redis client when first accessed
function getRedisClient(): Redis {
  if (globalForRedis.redis) {
    return globalForRedis.redis
  }

  // Use bracket notation to prevent Next.js from inlining at build time
  const redisUrl = process.env['REDIS_URL']

  console.log('Creating Redis client, REDIS_URL exists:', !!redisUrl)

  if (!redisUrl) {
    console.error('REDIS_URL environment variable is not set!')
  }

  const client = new Redis(redisUrl || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
    retryStrategy(times) {
      if (times > 10) {
        console.error('Redis max retries reached, stopping reconnection')
        return null // Stop retrying
      }
      const delay = Math.min(times * 500, 5000)
      return delay
    },
    reconnectOnError(err) {
      const targetErrors = ['READONLY', 'ECONNREFUSED', 'ETIMEDOUT']
      return targetErrors.some((targetError) =>
        err.message.includes(targetError)
      )
    },
  })

  // Handle connection events
  client.on('error', (error) => {
    console.error('Redis error:', error.message)
  })

  client.on('connect', () => {
    console.log('Redis connecting...')
  })

  client.on('ready', () => {
    console.log('✓ Redis ready')
  })

  client.on('close', () => {
    console.log('Redis connection closed')
  })

  globalForRedis.redis = client

  // Connect immediately if URL is available
  if (redisUrl) {
    client.connect().catch((error) => {
      console.error('Redis initial connection error:', error.message)
    })
  }

  return client
}

// Export a getter that creates client on first use
export const redis = getRedisClient()

export default redis

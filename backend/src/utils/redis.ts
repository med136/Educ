// Use require to avoid missing type defs if ioredis is not yet installed
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Redis = require('ioredis')
import logger from './logger'

const url = process.env.REDIS_URL?.trim()

let redis: any = null

if (url) {
  redis = new Redis(url, {
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    retryStrategy: (times: number) => {
      if (times > 5) {
        logger.error('Redis unavailable after multiple retries, cache disabled')
        return null
      }
      return Math.min(times * 500, 3000)
    },
  })

  redis.on('connect', () => logger.info('Redis connected'))
  redis.on('error', (err: unknown) => logger.error('Redis error:', { error: err }))
} else {
  logger.warn('REDIS_URL is not set, Redis cache disabled')
}

export default redis

// Use require to avoid missing type defs if ioredis is not yet installed
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Redis = require('ioredis')
import logger from './logger'

const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379'

const redis = new Redis(url)

redis.on('connect', () => logger.info('Redis connecté'))
redis.on('error', (err: unknown) => logger.error('Erreur Redis:', { error: err }))

export default redis

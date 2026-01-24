import { PrismaClient } from '@prisma/client'
import logger from './logger'

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
})

// Log queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    logger.debug(`Query: ${e.query}`)
    logger.debug(`Duration: ${e.duration}ms`)
  })
}

prisma.$on('error', (e) => {
  logger.error(`Database error: ${e.message}`)
})

export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect()
    logger.info('✅ Connexion à la base de données établie')
  } catch (error) {
    logger.error('❌ Échec de connexion à la base de données:', error)
    throw error
  }
}

export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect()
  logger.info('Base de données déconnectée')
}

export { prisma }
export default prisma

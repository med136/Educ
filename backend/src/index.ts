import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import path from 'path'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { connectDatabase } from './utils/database'
import { errorHandler } from './middleware/errorHandler'
import { requestLogger } from './middleware/logger'
import authRoutes from './routes/auth.routes'
import userRoutes from './routes/user.routes'
import documentRoutes from './routes/document.routes'
import classroomRoutes from './routes/classroom.routes'
import adminRoutes from './routes/admin.routes'
import notificationRoutes from './routes/notification.routes'
import { setupSwagger } from './utils/swagger'
import { setupSocket } from './services/socket.service'
import articleRoutes from './routes/article.routes'
import articleMetaRoutes from './routes/articleMeta.routes'
import articleCommentRoutes from './routes/articleComment.routes'
import mediaRoutes from './routes/media.routes'
import statsRoutes from './routes/stats.routes'
import settingsRoutes from './routes/settings.routes'
import menuRoutes from './routes/menu.routes'
import logger from './utils/logger'
import { register, metricsEnabled } from './utils/metrics'

// Charger les variables d'environnement
dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})

// Configuration
const PORT = process.env.PORT || 3000
const NODE_ENV = process.env.NODE_ENV || 'development'

// Middleware de base
app.use(helmet({
  contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false,
}))
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Static uploads (public)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// CORS config
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX) : 100,
  message: 'Trop de requÃªtes depuis cette IP, veuillez rÃ©essayer plus tard.',
})
app.use('/api/', limiter)

// Logging
app.use(requestLogger)

// Routes de santÃ©
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  })
})

// Endpoint de mÃ©triques Prometheus (optionnel)
if (metricsEnabled) {
  app.get('/metrics', async (_req, res) => {
    try {
      res.set('Content-Type', register.contentType)
      const metrics = await register.metrics()
      res.send(metrics)
    } catch (error) {
      logger.error('Erreur lors de la gÃ©nÃ©ration des mÃ©triques', { error })
      res.status(500).send('Erreur lors de la gÃ©nÃ©ration des mÃ©triques')
    }
  })
}

// Setup Swagger
setupSwagger(app)

// Routes API
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/users', userRoutes)
app.use('/api/v1/documents', documentRoutes)
app.use('/api/v1/classrooms', classroomRoutes)
app.use('/api/v1/admin', adminRoutes)
app.use('/api/v1/articles', articleRoutes)
app.use('/api/v1/article-meta', articleMetaRoutes)
app.use('/api/v1/article-comments', articleCommentRoutes)
app.use('/api/v1/media', mediaRoutes)
app.use('/api/v1/stats', statsRoutes)
app.use('/api/v1/settings', settingsRoutes)
app.use('/api/v1/notifications', notificationRoutes)
app.use('/api/v1/menus', menuRoutes)

// Setup Socket.io
setupSocket(io)

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvÃ©e',
    path: req.originalUrl,
  })
})

// Error handler (doit Ãªtre le dernier middleware)
app.use(errorHandler)

// DÃ©marrer le serveur
const startServer = async () => {
  try {
    // VÃ©rifier la configuration de sÃ©curitÃ© critique en production
    if (NODE_ENV === 'production') {
      const accessSecret = process.env.JWT_SECRET
      const refreshSecret = process.env.JWT_REFRESH_SECRET

      if (!accessSecret || accessSecret === 'default_secret') {
        logger.error('JWT_SECRET doit Ãªtre configurÃ© en production')
        process.exit(1)
      }

      if (!refreshSecret || refreshSecret === 'default_refresh_secret') {
        logger.error('JWT_REFRESH_SECRET doit Ãªtre configurÃ© en production')
        process.exit(1)
      }
    }

    // Connecter Ã  la base de donnÃ©es
    await connectDatabase()
    
    httpServer.listen(PORT, () => {
      logger.info(`ðŸš€ Serveur dÃ©marrÃ© sur le port ${PORT}`)
      logger.info(`ðŸ“š Documentation API: http://localhost:${PORT}/api-docs`)
      logger.info(`ðŸŒ Environnement: ${NODE_ENV}`)
      logger.info(`ðŸŽ¯ Frontend: ${process.env.FRONTEND_URL}`)
    })
  } catch (error) {
    logger.error('Ã‰chec du dÃ©marrage du serveur:', error)
    process.exit(1)
  }
}

// Gestion des signaux d'arrÃªt
process.on('SIGTERM', () => {
  logger.info('SIGTERM reÃ§u, arrÃªt du serveur...')
  httpServer.close(() => {
    logger.info('Serveur arrÃªtÃ©')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.info('SIGINT reÃ§u, arrÃªt du serveur...')
  httpServer.close(() => {
    logger.info('Serveur arrÃªtÃ©')
    process.exit(0)
  })
})

// DÃ©marrer l'application
if (require.main === module) {
  startServer()
}

export { app, io }

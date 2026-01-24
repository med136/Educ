import { Request, Response, NextFunction } from 'express'
import logger from '../utils/logger'
import { httpRequestDurationSeconds, metricsEnabled } from '../utils/metrics'
import { randomUUID } from 'crypto'

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = process.hrtime.bigint()

  // Ajoute un identifiant de corrélation basique pour suivre la requête
  const requestId = (req.headers['x-request-id'] as string) || randomUUID()
  res.setHeader('X-Request-Id', requestId)

  // Log request
  logger.info(`→ ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    requestId,
  })

  // Log response on finish
  res.on('finish', () => {
    const end = process.hrtime.bigint()
    const durationMs = Number(end - start) / 1_000_000
    const { statusCode } = res

    const logLevel = statusCode >= 400 ? 'warn' : 'info'

    logger[logLevel](`← ${req.method} ${req.originalUrl} ${statusCode} - ${durationMs.toFixed(2)}ms`, {
      requestId,
    })

    if (metricsEnabled) {
      const route = req.route?.path || req.originalUrl.split('?')[0] || 'unknown'
      httpRequestDurationSeconds
        .labels(req.method, route, String(statusCode))
        .observe(durationMs / 1000)
    }
  })

  next()
}

export default requestLogger

import { Request, Response, NextFunction } from 'express'
import logger from '../utils/logger'

export interface AppError extends Error {
  statusCode?: number
  isOperational?: boolean
  errors?: unknown
}

export class ApiError extends Error implements AppError {
  statusCode: number
  isOperational: boolean

  errors?: unknown

  constructor(message: string, statusCode: number = 500, errors?: unknown) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true
    this.errors = errors
    Error.captureStackTrace(this, this.constructor)
  }
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Erreur interne du serveur'

  // Log error
  logger.error(`[${statusCode}] ${message}`, {
    stack: err.stack,
    isOperational: err.isOperational,
  })

  // Build base payload
  const payload: Record<string, unknown> = {
    success: false,
    message,
  }

  if (err.errors) {
    payload.errors = err.errors
  }

  if (process.env.NODE_ENV === 'development') {
    payload.stack = err.stack
  }

  res.status(statusCode).json(payload)
}

export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    message: `Route non trouvée: ${req.method} ${req.originalUrl}`,
  })
}

// Async handler wrapper
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

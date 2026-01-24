import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { ApiError } from './errorHandler'
import prisma from '../utils/database'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
  }
}

export const maybeAuthenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Pas de token fourni : on continue sans renseigner req.user
    next()
    return
  }

  try {
    const token = authHeader.split(' ')[1]
    const secret = process.env.JWT_SECRET || 'default_secret'

    const decoded = jwt.verify(token, secret) as {
      userId: string
      email: string
      role: string
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true },
    })

    if (user && user.isActive) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      }
    }

    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError('Token invalide', 401))
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new ApiError('Token expiré', 401))
    } else {
      next(error)
    }
  }
}

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError('Token d\'authentification manquant', 401)
    }

    const token = authHeader.split(' ')[1]
    const secret = process.env.JWT_SECRET || 'default_secret'

    const decoded = jwt.verify(token, secret) as {
      userId: string
      email: string
      role: string
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true },
    })

    if (!user || !user.isActive) {
      throw new ApiError('Utilisateur non trouvé ou désactivé', 401)
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    }

    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError('Token invalide', 401))
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new ApiError('Token expiré', 401))
    } else {
      next(error)
    }
  }
}

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ApiError('Non authentifié', 401))
      return
    }

    if (!roles.includes(req.user.role)) {
      next(new ApiError('Accès non autorisé', 403))
      return
    }

    next()
  }
}

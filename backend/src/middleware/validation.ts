import { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'
import { ApiError } from './errorHandler'

export const validateRequest = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    // On ne renvoie pas tous les détails en prod, mais on structure l'erreur
    // On renvoie le tableau brut pour éviter les problèmes de typage
    throw new ApiError('Données invalides', 400, errors.array())
  }

  next()
}

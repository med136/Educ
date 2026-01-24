import { Router, Request, Response } from 'express'
import { body } from 'express-validator'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '../utils/database'
import { asyncHandler, ApiError } from '../middleware/errorHandler'
import { authenticate, AuthRequest } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'

const router = Router()

// POST /auth/register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Le mot de passe doit contenir au moins 8 caractères'),
    body('firstName')
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Le prénom est requis'),
    body('lastName')
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Le nom est requis'),
    body('role')
      .optional()
      .isIn(['STUDENT', 'TEACHER', 'ADMIN'])
      .withMessage('Rôle invalide'),
    body('username')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage("Nom d'utilisateur invalide"),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, firstName, lastName, role, username } = req.body

  // Check if user exists
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    throw new ApiError('Un utilisateur avec cet email existe déjà', 400)
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12)

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: role || 'STUDENT',
      username,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
    },
  })

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: user,
    })
  })
)

// POST /auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
    body('password')
      .isString()
      .notEmpty()
      .withMessage('Le mot de passe est requis'),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body

  // Find user
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    throw new ApiError('Identifiants invalides', 401)
  }

  // Check password
  const isValidPassword = await bcrypt.compare(password, user.password)
  if (!isValidPassword) {
    throw new ApiError('Identifiants invalides', 401)
  }

  // Check if user is active
  if (!user.isActive) {
    throw new ApiError('Compte désactivé', 403)
  }

  // Generate tokens
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'default_secret',
    { expiresIn: '24h' }
  )

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
    { expiresIn: '7d' }
  )

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  })

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
    })
  })
)

// POST /auth/refresh
router.post(
  '/refresh',
  [
    body('refreshToken')
      .isString()
      .notEmpty()
      .withMessage('Refresh token manquant'),
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'default_refresh_secret'
    ) as { userId: string }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  })

  if (!user || !user.isActive) {
    throw new ApiError('Utilisateur non trouvé', 401)
  }

  const newAccessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'default_secret',
    { expiresIn: '24h' }
  )

    res.json({
      success: true,
      data: { accessToken: newAccessToken },
    })
  })
)

// POST /auth/logout
router.post('/logout', authenticate, asyncHandler(async (_req: AuthRequest, res: Response) => {
  // In a real app, you'd invalidate the token here
  res.json({
    success: true,
    message: 'Déconnexion réussie',
  })
}))

// GET /auth/me
router.get('/me', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      avatar: true,
      isVerified: true,
      createdAt: true,
      lastLogin: true,
    },
  })

  res.json({
    success: true,
    data: user,
  })
}))

export default router

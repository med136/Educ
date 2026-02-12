import { Router, Response } from 'express'
import prisma from '../utils/database'
import { asyncHandler, ApiError } from '../middleware/errorHandler'
import { authenticate, authorize, AuthRequest } from '../middleware/auth'

const router = Router()

// All routes require authentication
router.use(authenticate)

/**
 * @openapi
 * /api/v1/users:
 *   get:
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     summary: Get all users (admin only)
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/', authorize('ADMIN'), asyncHandler(async (_req: AuthRequest, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      isVerified: true,
      createdAt: true,
      lastLogin: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  res.json({
    success: true,
    data: users,
  })
}))

/**
 * @openapi
 * /api/v1/users/me:
 *   get:
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     summary: Get current user profile
 *     responses:
 *       200:
 *         description: Current user
 */
router.get('/me', asyncHandler(async (req: AuthRequest, res: Response) => {
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
      _count: {
        select: {
          ownedDocuments: true,
          classrooms: true,
        },
      },
    },
  })

  res.json({
    success: true,
    data: user,
  })
}))

/**
 * @openapi
 * /api/v1/users/me:
 *   put:
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     summary: Update current user profile
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               username:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated
 */
router.put('/me', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { firstName, lastName, username, avatar } = req.body

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      firstName,
      lastName,
      username,
      avatar,
    },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      avatar: true,
    },
  })

  res.json({
    success: true,
    message: 'Profil mis à jour',
    data: user,
  })
}))

// GET /users/me - Get current user profile
router.get('/me', asyncHandler(async (req: AuthRequest, res: Response) => {
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
      _count: {
        select: {
          ownedDocuments: true,
          classrooms: true,
        },
      },
    },
  })

  res.json({
    success: true,
    data: user,
  })
}))

// PUT /users/me - Update current user profile
router.put('/me', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { firstName, lastName, username, avatar } = req.body

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      firstName,
      lastName,
      username,
      avatar,
    },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      avatar: true,
    },
  })

  res.json({
    success: true,
    message: 'Profil mis à jour',
    data: user,
  })
}))

// GET /users/:id - Get user by ID
router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      avatar: true,
      createdAt: true,
    },
  })

  if (!user) {
    throw new ApiError('Utilisateur non trouvé', 404)
  }

  res.json({
    success: true,
    data: user,
  })
}))

// DELETE /users/:id - Delete user (admin only)
router.delete('/:id', authorize('ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  await prisma.user.delete({ where: { id } })

  res.json({
    success: true,
    message: 'Utilisateur supprimé',
  })
}))

export default router

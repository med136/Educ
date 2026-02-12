import { Router, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { body } from 'express-validator'
import prisma from '../utils/database'
import { asyncHandler, ApiError } from '../middleware/errorHandler'
import { authenticate, authorize, AuthRequest } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Generate unique classroom code
const generateClassCode = (): string => {
  return uuidv4().substring(0, 8).toUpperCase()
}

/**
 * @openapi
 * /api/v1/classrooms:
 *   get:
 *     tags:
 *       - Classrooms
 *     summary: Get user's classrooms
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of classrooms
 */
// GET /classrooms - Get user's classrooms
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const classrooms = await prisma.classroom.findMany({
    where: {
      OR: [
        { creatorId: req.user!.id },
        { students: { some: { id: req.user!.id } } },
      ],
    },
    include: {
      creator: {
        select: { id: true, firstName: true, lastName: true },
      },
      _count: {
        select: { students: true, documents: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  res.json({
    success: true,
    data: classrooms,
  })
}))

// POST /classrooms - Create a new classroom (teachers only)
router.post(
  '/',
  authorize('TEACHER', 'ADMIN'),
  [
    body('name')
      .isString()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Le nom de la classe est requis'),
    body('description')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage('La description est trop longue'),
    body('subject').optional().isString().trim().isLength({ max: 100 }),
    body('gradeLevel').optional().isString().trim().isLength({ max: 50 }),
    body('maxStudents')
      .optional()
      .isInt({ min: 1, max: 500 })
      .withMessage("Le nombre maximum d'élèves doit être compris entre 1 et 500"),
  ],
  validateRequest,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, description, subject, gradeLevel, maxStudents } = req.body

    const classroom = await prisma.classroom.create({
      data: {
        name,
        description,
        code: generateClassCode(),
        subject,
        gradeLevel,
        maxStudents: maxStudents || 50,
        creatorId: req.user!.id,
      },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    })

    res.status(201).json({
      success: true,
      message: 'Classe créée avec succès',
      data: classroom,
    })
  })
)

/**
 * @openapi
 * /api/v1/classrooms/{id}:
 *   get:
 *     tags:
 *       - Classrooms
 *     summary: Get classroom by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Classroom object
 */
// GET /classrooms/:id - Get classroom by ID
router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const classroom = await prisma.classroom.findFirst({
    where: {
      id,
      OR: [
        { creatorId: req.user!.id },
        { students: { some: { id: req.user!.id } } },
      ],
    },
    include: {
      creator: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      students: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      documents: {
        include: {
          owner: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: { students: true, documents: true, messages: true },
      },
    },
  })

  if (!classroom) {
    throw new ApiError('Classe non trouvée', 404)
  }

  res.json({
    success: true,
    data: classroom,
  })
}))

/**
 * @openapi
 * /api/v1/classrooms/join:
 *   post:
 *     tags:
 *       - Classrooms
 *     summary: Join a classroom by code
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code: { type: string }
 *     responses:
 *       200:
 *         description: Joined classroom
 */
// POST /classrooms/join - Join a classroom by code
router.post(
  '/join',
  [
    body('code')
      .isString()
      .trim()
      .isLength({ min: 4, max: 20 })
      .withMessage('Code de classe invalide'),
  ],
  validateRequest,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { code } = req.body

  const classroom = await prisma.classroom.findUnique({
    where: { code },
    include: { _count: { select: { students: true } } },
  })

  if (!classroom) {
    throw new ApiError('Code de classe invalide', 404)
  }

  if (!classroom.isActive) {
    throw new ApiError('Cette classe n\'est plus active', 400)
  }

  if (classroom._count.students >= classroom.maxStudents) {
    throw new ApiError('Cette classe est complète', 400)
  }

  // Add student to classroom
  await prisma.classroom.update({
    where: { id: classroom.id },
    data: {
      students: {
        connect: { id: req.user!.id },
      },
    },
  })

    res.json({
      success: true,
      message: 'Vous avez rejoint la classe',
      data: { classroomId: classroom.id, name: classroom.name },
    })
  })
)

// PUT /classrooms/:id - Update classroom
router.put('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { name, description, subject, gradeLevel, isActive, maxStudents } = req.body

  const classroom = await prisma.classroom.findUnique({ where: { id } })

  if (!classroom) {
    throw new ApiError('Classe non trouvée', 404)
  }

  if (classroom.creatorId !== req.user!.id && req.user!.role !== 'ADMIN') {
    throw new ApiError('Non autorisé', 403)
  }

  const updated = await prisma.classroom.update({
    where: { id },
    data: { name, description, subject, gradeLevel, isActive, maxStudents },
  })

  res.json({
    success: true,
    message: 'Classe mise à jour',
    data: updated,
  })
}))

// DELETE /classrooms/:id - Delete classroom
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const classroom = await prisma.classroom.findUnique({ where: { id } })

  if (!classroom) {
    throw new ApiError('Classe non trouvée', 404)
  }

  if (classroom.creatorId !== req.user!.id && req.user!.role !== 'ADMIN') {
    throw new ApiError('Non autorisé', 403)
  }

  await prisma.classroom.delete({ where: { id } })

  res.json({
    success: true,
    message: 'Classe supprimée',
  })
}))

// POST /classrooms/:id/messages - Send message in classroom
router.post(
  '/:id/messages',
  [
    body('content')
      .isString()
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage('Le message est requis'),
  ],
  validateRequest,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    const { content } = req.body

    // Vérifier que l'utilisateur appartient à la classe
    const classroom = await prisma.classroom.findFirst({
      where: {
        id,
        OR: [
          { creatorId: req.user!.id },
          { students: { some: { id: req.user!.id } } },
        ],
      },
      select: { id: true, isActive: true },
    })

    if (!classroom) {
      throw new ApiError('Classe non trouvée', 404)
    }

    if (!classroom.isActive) {
      throw new ApiError("Cette classe n'est plus active", 400)
    }

    const message = await prisma.message.create({
      data: {
        content,
        userId: req.user!.id,
        classroomId: id,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    res.status(201).json({
      success: true,
      data: message,
    })
  })
)

// GET /classrooms/:id/messages - Get classroom messages
router.get('/:id/messages', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { page = '1', limit = '50' } = req.query

  // Vérifier que l'utilisateur appartient à la classe
  const classroom = await prisma.classroom.findFirst({
    where: {
      id,
      OR: [
        { creatorId: req.user!.id },
        { students: { some: { id: req.user!.id } } },
      ],
    },
    select: { id: true },
  })

  if (!classroom) {
    throw new ApiError('Classe non trouvée', 404)
  }

  const messages = await prisma.message.findMany({
    where: { classroomId: id },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    },
    orderBy: { createdAt: 'asc' },
    skip: (parseInt(page as string) - 1) * parseInt(limit as string),
    take: parseInt(limit as string),
  })

  res.json({
    success: true,
    data: messages,
  })
}))


export default router

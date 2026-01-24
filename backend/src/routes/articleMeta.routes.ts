import { Router, Response } from 'express'
import { body } from 'express-validator'
import prisma from '../utils/database'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticate, authorize, AuthRequest } from '../middleware/auth'
import { validateRequest } from '../middleware/validation'

const router = Router()

// Liste des catégories d'articles
router.get('/categories', asyncHandler(async (_req, res: Response) => {
  const categories = await prisma.articleCategory.findMany({
    orderBy: { name: 'asc' },
  })

  res.json({
    success: true,
    data: categories,
  })
}))

// Liste des tags d'articles
router.get('/tags', asyncHandler(async (_req, res: Response) => {
  const tags = await prisma.articleTag.findMany({
    orderBy: { name: 'asc' },
  })

  res.json({
    success: true,
    data: tags,
  })
}))

// Création simple d'une catégorie (enseignants / admins)
router.post(
  '/categories',
  authenticate,
  authorize('TEACHER', 'ADMIN'),
  [
    body('name')
      .isString()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Le nom de la catégorie est requis'),
  ],
  validateRequest,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name } = req.body as { name: string }

    const baseSlug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || 'categorie'

    let slug = baseSlug
    let counter = 1

    while (true) {
      const existing = await prisma.articleCategory.findUnique({ where: { slug } })
      if (!existing) break
      counter += 1
      slug = `${baseSlug}-${counter}`
    }

    const category = await prisma.articleCategory.create({
      data: { name, slug },
    })

    res.status(201).json({ success: true, data: category })
  })
)

// Création simple d'un tag (enseignants / admins)
router.post(
  '/tags',
  authenticate,
  authorize('TEACHER', 'ADMIN'),
  [
    body('name')
      .isString()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Le nom du tag est requis'),
  ],
  validateRequest,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name } = req.body as { name: string }

    const baseSlug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || 'tag'

    let slug = baseSlug
    let counter = 1

    while (true) {
      const existing = await prisma.articleTag.findUnique({ where: { slug } })
      if (!existing) break
      counter += 1
      slug = `${baseSlug}-${counter}`
    }

    const tag = await prisma.articleTag.create({
      data: { name, slug },
    })

    res.status(201).json({ success: true, data: tag })
  })
)

export default router

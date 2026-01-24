import { Router, Response } from 'express'
import { Prisma } from '@prisma/client'
import prisma from '../utils/database'
import { asyncHandler, ApiError } from '../middleware/errorHandler'
import { authenticate, AuthRequest, authorize } from '../middleware/auth'
import logger from '../utils/logger'
import { io } from '../index'
import { sendNotification } from '../services/socket.service'
import { getSettings } from '../utils/settings'

const router = Router()

// GET /article-comments?articleId=xxx - Get approved comments for an article (public)
router.get(
  '/',
  asyncHandler(async (req, res: Response) => {
    const { articleId, page = '1', limit = '20' } = req.query

    if (!articleId || typeof articleId !== 'string') {
      throw new ApiError('articleId requis', 400)
    }

    const settings = await getSettings()
    if (!settings.general.enableComments) {
      throw new ApiError('Les commentaires sont désactivés par l\'administrateur', 403)
    }

    const where: Prisma.ArticleCommentWhereInput = {
      articleId,
      status: 'APPROVED',
    }

    const [comments, total] = await Promise.all([
      prisma.articleComment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
        select: {
          id: true,
          content: true,
          authorName: true,
          createdAt: true,
        },
      }),
      prisma.articleComment.count({ where }),
    ])

    res.json({
      success: true,
      data: comments,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    })
  })
)

// GET /article-comments/pending - Get pending comments (admin only)
router.get(
  '/pending',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = '1', limit = '50' } = req.query

    const where: Prisma.ArticleCommentWhereInput = {
      status: 'PENDING',
    }

    const [comments, total] = await Promise.all([
      prisma.articleComment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
        include: {
          article: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      }),
      prisma.articleComment.count({ where }),
    ])

    res.json({
      success: true,
      data: comments,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    })
  })
)

// GET /article-comments/all - Get all comments with filters (admin only)
router.get(
  '/all',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = '1', limit = '20', status, search } = req.query

    const where: Prisma.ArticleCommentWhereInput = {}

    if (status && status !== 'ALL' && typeof status === 'string') {
      where.status = status as 'PENDING' | 'APPROVED' | 'REJECTED'
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { authorName: { contains: search, mode: 'insensitive' } },
        { authorEmail: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [comments, total] = await Promise.all([
      prisma.articleComment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
        include: {
          article: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      }),
      prisma.articleComment.count({ where }),
    ])

    res.json({
      success: true,
      data: comments,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    })
  })
)

// GET /article-comments/stats - Get comment statistics (admin only)
router.get(
  '/stats',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (_req: AuthRequest, res: Response) => {
    const [total, pending, approved, rejected] = await Promise.all([
      prisma.articleComment.count(),
      prisma.articleComment.count({ where: { status: 'PENDING' } }),
      prisma.articleComment.count({ where: { status: 'APPROVED' } }),
      prisma.articleComment.count({ where: { status: 'REJECTED' } }),
    ])

    res.json({
      success: true,
      data: {
        total,
        pending,
        approved,
        rejected,
      },
    })
  })
)

// POST /article-comments - Create a new comment (public, pending approval)
router.post(
  '/',
  asyncHandler(async (req, res: Response) => {
    const { articleId, content, authorName, authorEmail } = req.body

    const settings = await getSettings()
    if (!settings.general.enableComments) {
      throw new ApiError('Les commentaires sont désactivés par l\'administrateur', 403)
    }

    if (!articleId || !content || !authorName) {
      throw new ApiError('articleId, content et authorName requis', 400)
    }

    if (content.length > 1000) {
      throw new ApiError('Commentaire trop long (max 1000 caractères)', 400)
    }

    if (authorName.length > 100) {
      throw new ApiError('Nom trop long (max 100 caractères)', 400)
    }

    // Vérifier que l'article existe et est publié
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true, status: true },
    })

    if (!article || article.status !== 'PUBLISHED') {
      throw new ApiError('Article non trouvé ou non publié', 404)
    }

    // Anti-spam simple : vérifier derniers commentaires de cette IP/email
    const recentComments = await prisma.articleComment.count({
      where: {
        OR: [
          { ipAddress: req.ip },
          authorEmail ? { authorEmail } : {},
        ].filter((x) => Object.keys(x).length > 0),
        createdAt: {
          gte: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes
        },
      },
    })

    if (recentComments >= 3) {
      throw new ApiError('Trop de commentaires récents, réessayez plus tard', 429)
    }

    const comment = await prisma.articleComment.create({
      data: {
        articleId,
        content: content.trim(),
        authorName: authorName.trim(),
        authorEmail: authorEmail?.trim() || null,
        status: 'PENDING',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || null,
      },
      select: {
        id: true,
        content: true,
        authorName: true,
        status: true,
        createdAt: true,
      },
    })

    // Créer notification pour les admins
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true },
    })

    if (admins.length > 0) {
      const notificationData = {
        title: 'Nouveau commentaire en attente',
        message: `Un nouveau commentaire de "${authorName}" est en attente de modération.`,
        type: 'article_comment',
        data: { commentId: comment.id, articleId },
      }

      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          ...notificationData,
        })),
      })

      // Envoyer notification temps réel à chaque admin
      admins.forEach((admin) => {
        sendNotification(io, admin.id, notificationData)
      })
    }

    logger.info(`Nouveau commentaire créé par ${authorName} (IP: ${req.ip})`)

    res.status(201).json({
      success: true,
      message: 'Commentaire soumis avec succès. Il sera publié après modération.',
      data: comment,
    })
  })
)

// PUT /article-comments/:id/approve - Approve a comment (admin only)
router.put(
  '/:id/approve',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params

    const comment = await prisma.articleComment.findUnique({ where: { id } })

    if (!comment) {
      throw new ApiError('Commentaire non trouvé', 404)
    }

    const updated = await prisma.articleComment.update({
      where: { id },
      data: {
        status: 'APPROVED',
        moderatedById: req.user!.id,
        moderatedAt: new Date(),
      },
    })

    logger.info(`Commentaire ${id} approuvé par ${req.user!.email}`)

    res.json({
      success: true,
      message: 'Commentaire approuvé',
      data: updated,
    })
  })
)

// PUT /article-comments/:id/reject - Reject a comment (admin only)
router.put(
  '/:id/reject',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params

    const comment = await prisma.articleComment.findUnique({ where: { id } })

    if (!comment) {
      throw new ApiError('Commentaire non trouvé', 404)
    }

    const updated = await prisma.articleComment.update({
      where: { id },
      data: {
        status: 'REJECTED',
        moderatedById: req.user!.id,
        moderatedAt: new Date(),
      },
    })

    logger.info(`Commentaire ${id} rejeté par ${req.user!.email}`)

    res.json({
      success: true,
      message: 'Commentaire rejeté',
      data: updated,
    })
  })
)

// DELETE /article-comments/:id - Delete a comment (admin only)
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params

    const comment = await prisma.articleComment.findUnique({ where: { id } })

    if (!comment) {
      throw new ApiError('Commentaire non trouvé', 404)
    }

    await prisma.articleComment.delete({ where: { id } })

    logger.info(`Commentaire ${id} supprimé par ${req.user!.email}`)

    res.json({
      success: true,
      message: 'Commentaire supprimé',
    })
  })
)

export default router

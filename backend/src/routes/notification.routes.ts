import { Router, Response } from 'express'
import prisma from '../utils/database'
import { asyncHandler, ApiError } from '../middleware/errorHandler'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()

// All notification routes require authentication
router.use(authenticate)

/**
 * @openapi
 * /api/v1/notifications:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Get current user's notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 */
// GET /notifications - Get current user's notifications (optionally unread only)
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '10', unread } = req.query

  const where: { userId: string; isRead?: boolean } = {
    userId: req.user!.id,
  }

  if (unread === 'true') {
    where.isRead = false
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
    }),
    prisma.notification.count({ where }),
  ])

  res.json({
    success: true,
    data: notifications,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      pages: Math.ceil(total / parseInt(limit as string)),
    },
  })
}))

/**
 * @openapi
 * /api/v1/notifications/{id}/read:
 *   post:
 *     tags:
 *       - Notifications
 *     summary: Mark a notification as read
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Marked as read
 */
// POST /notifications/:id/read - Mark a notification as read
router.post('/:id/read', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const existing = await prisma.notification.findFirst({
    where: { id, userId: req.user!.id },
  })

  if (!existing) {
    throw new ApiError('Notification non trouvée', 404)
  }

  const notification = await prisma.notification.update({
    where: { id },
    data: { isRead: true, readAt: new Date() },
  })

  res.json({
    success: true,
    message: 'Notification marquée comme lue',
    data: notification,
  })
}))

/**
 * @openapi
 * /api/v1/notifications/mark-all-read:
 *   post:
 *     tags:
 *       - Notifications
 *     summary: Mark all notifications as read
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All marked as read
 */
// POST /notifications/mark-all-read - Mark all notifications as read for current user
router.post('/mark-all-read', asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await prisma.notification.updateMany({
    where: { userId: req.user!.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  })

  res.json({
    success: true,
    message: 'Toutes les notifications ont été marquées comme lues',
    data: { updated: result.count },
  })
}))

export default router

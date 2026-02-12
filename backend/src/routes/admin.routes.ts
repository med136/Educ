import { Router, Response } from 'express'
import { UserRole, Prisma } from '@prisma/client'
import prisma from '../utils/database'
import { asyncHandler, ApiError } from '../middleware/errorHandler'
import { authenticate, authorize, AuthRequest } from '../middleware/auth'
import { body, param } from 'express-validator'
import { validateRequest } from '../middleware/validation'
import { invalidateMenuCache } from '../utils/cache'
import { sendNotification } from '../services/socket.service'
import { io } from '../index'
import { sendEmail } from '../services/email.service'
import {
  defaultSettings,
  mergeSection,
  SETTINGS_ID,
  type SettingsPayload,
} from '../utils/settings'

const router = Router()

// All routes require authentication and admin role
router.use(authenticate)
router.use(authorize('ADMIN'))

/**
 * @openapi
 * /api/v1/admin/settings:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Fetch platform settings (admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings
 */
// GET /admin/settings - Fetch platform settings
router.get('/settings', asyncHandler(async (_req: AuthRequest, res: Response) => {
  const settings = await prisma.appSetting.findUnique({ where: { id: SETTINGS_ID } })
  const data = (settings?.data as SettingsPayload | null) ?? defaultSettings

  res.json({
    success: true,
    data,
  })
}))

/**
 * @openapi
 * /api/v1/admin/settings:
 *   put:
 *     tags:
 *       - Admin
 *     summary: Update platform settings (admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Settings updated
 */
// PUT /admin/settings - Update platform settings
router.put('/settings', asyncHandler(async (req: AuthRequest, res: Response) => {
  const payload = req.body as Partial<SettingsPayload> | undefined

  if (!payload || typeof payload !== 'object') {
    throw new ApiError('Payload de paramètres invalide', 400)
  }

  const existing = await prisma.appSetting.findUnique({ where: { id: SETTINGS_ID } })
  const existingData = existing?.data as Partial<SettingsPayload> | undefined

  const merged: SettingsPayload = {
    general: mergeSection(defaultSettings.general, existingData?.general, payload.general),
    notifications: mergeSection(
      defaultSettings.notifications,
      existingData?.notifications,
      payload.notifications
    ),
    security: mergeSection(defaultSettings.security, existingData?.security, payload.security),
    appearance: mergeSection(defaultSettings.appearance, existingData?.appearance, payload.appearance),
    storage: mergeSection(defaultSettings.storage, existingData?.storage, payload.storage),
  }

  const saved = await prisma.appSetting.upsert({
    where: { id: SETTINGS_ID },
    update: { data: merged as Prisma.InputJsonValue },
    create: { id: SETTINGS_ID, data: merged as Prisma.InputJsonValue },
  })

  res.json({
    success: true,
    message: 'Paramètres mis à jour',
    data: saved.data,
  })
}))

/**
 * @openapi
 * /api/v1/admin/stats:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get platform statistics (admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin stats
 */
// GET /admin/stats - Get platform statistics
router.get('/stats', asyncHandler(async (_req: AuthRequest, res: Response) => {
  const [
    totalUsers,
    totalDocuments,
    totalClassrooms,
    usersByRole,
    documentsByType,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.document.count(),
    prisma.classroom.count(),
    prisma.user.groupBy({
      by: ['role'],
      _count: true,
    }),
    prisma.document.groupBy({
      by: ['fileType'],
      _count: true,
    }),
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  res.json({
    success: true,
    data: {
      totals: {
        users: totalUsers,
        documents: totalDocuments,
        classrooms: totalClassrooms,
      },
      usersByRole: usersByRole.map(r => ({
        role: r.role,
        count: r._count,
      })),
      documentsByType: documentsByType.map(d => ({
        type: d.fileType,
        count: d._count,
      })),
      recentUsers,
    },
  })
}))

/**
 * @openapi
 * /api/v1/admin/users:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get all users with filters (admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */
// GET /admin/users - Get all users with filters
router.get('/users', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '20', role, search, isActive } = req.query

  const where: Prisma.UserWhereInput = {}

  if (role && Object.values(UserRole).includes(role as UserRole)) {
    where.role = role as UserRole
  }

  if (isActive !== undefined) {
    where.isActive = isActive === 'true'
  }

  if (search) {
    where.OR = [
      { email: { contains: search as string, mode: 'insensitive' } },
      { firstName: { contains: search as string, mode: 'insensitive' } },
      { lastName: { contains: search as string, mode: 'insensitive' } },
    ]
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
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
        _count: {
          select: { ownedDocuments: true, classrooms: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
    }),
    prisma.user.count({ where }),
  ])

  res.json({
    success: true,
    data: users,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      pages: Math.ceil(total / parseInt(limit as string)),
    },
  })
}))

// PUT /admin/users/:id - Update user
router.put('/users/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { role, isActive, isVerified } = req.body

  const user = await prisma.user.update({
    where: { id },
    data: { role, isActive, isVerified },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      isVerified: true,
    },
  })

  res.json({
    success: true,
    message: 'Utilisateur mis à jour',
    data: user,
  })
}))

// DELETE /admin/users/:id - Delete user
router.delete('/users/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  await prisma.user.delete({ where: { id } })

  res.json({
    success: true,
    message: 'Utilisateur supprimé',
  })
}))

// POST /admin/users/:id/notify - Send a direct notification/message to a user
router.post('/users/:id/notify', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { title, message, type, data } = req.body as {
    title?: string
    message?: string
    type?: string
    data?: Prisma.InputJsonValue
  }

  if (!message || !message.trim()) {
    throw new ApiError('Le message est requis', 400)
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, firstName: true },
  })

  if (!user) {
    throw new ApiError('Utilisateur non trouvé', 404)
  }

  const finalTitle = title && title.trim().length > 0 ? title.trim() : "Message de l'administration"
  const finalType = type && type.trim().length > 0 ? type.trim() : 'admin'

  const notification = await prisma.notification.create({
    data: {
      title: finalTitle,
      message: message.trim(),
      type: finalType,
      userId: user.id,
      data: data ?? undefined,
    },
  })

  // Temps réel via Socket.io
  sendNotification(io, user.id, {
    title: notification.title,
    message: notification.message,
    type: notification.type,
    data: notification.data as Record<string, unknown> | undefined,
  })

  // Email si possible
  if (user.email) {
    void sendEmail({
      to: user.email,
      subject: finalTitle,
      html: `<p>Bonjour ${user.firstName || ''},</p>
             <p>Vous avez reçu un nouveau message de l'administration&nbsp;:</p>
             <p>${notification.message}</p>`,
      text: `Nouveau message de l'administration : ${notification.message}`,
    })
  }

  res.json({
    success: true,
    message: 'Message envoyé à l’utilisateur',
    data: notification,
  })
}))

// GET /admin/documents - Get all documents
router.get('/documents', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '20' } = req.query

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
    }),
    prisma.document.count(),
  ])

  res.json({
    success: true,
    data: documents,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      pages: Math.ceil(total / parseInt(limit as string)),
    },
  })
}))

// DELETE /admin/documents/:id - Delete any document
router.delete('/documents/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  await prisma.document.delete({ where: { id } })

  res.json({
    success: true,
    message: 'Document supprimé',
  })
}))

// GET /admin/classrooms - Get all classrooms
router.get('/classrooms', asyncHandler(async (_req: AuthRequest, res: Response) => {
  const classrooms = await prisma.classroom.findMany({
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

// ===== Admin Menu Management =====
/**
 * @openapi
 * /api/v1/admin/menus:
 *   get:
 *     tags:
 *       - Admin
 *     summary: List all menus (admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of menus
 */
// GET /admin/menus - list all menus
router.get('/menus', asyncHandler(async (_req: AuthRequest, res: Response) => {
  const menus = await prisma.menu.findMany({
    orderBy: { createdAt: 'desc' },
  })

  res.json({ success: true, data: menus })
}))

// GET /admin/menus/:id - get menu with items and i18n (admin)
router.get('/menus/:id',
  param('id').isString().notEmpty(),
  validateRequest,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params

    const menu = await prisma.menu.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { order: 'asc' },
          include: { i18n: true },
        },
      },
    })

    if (!menu) throw new ApiError('Menu non trouvé', 404)

    res.json({ success: true, data: menu })
  })
)

// POST /admin/menus - create a menu
router.post(
  '/menus',
  body('slug').isString().notEmpty(),
  body('title').isString().notEmpty(),
  body('published').optional().isBoolean(),
  validateRequest,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { slug, title, published = false, metadata } = req.body

    const existing = await prisma.menu.findUnique({ where: { slug } })
    if (existing) throw new ApiError('Un menu avec ce slug existe déjà', 400)

    const menu = await prisma.menu.create({
      data: { slug, title, published, metadata: metadata ?? undefined },
    })

      // Invalidate any cached menu with this slug
      await invalidateMenuCache(menu.slug)

      res.json({ success: true, message: 'Menu créé', data: menu })
  })
)


// PUT /admin/menus/:id - update menu
router.put(
  '/menus/:id',
  param('id').isString().notEmpty(),
  body('title').optional().isString(),
  body('published').optional().isBoolean(),
  validateRequest,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    const { title, published, metadata } = req.body

    const menu = await prisma.menu.update({
      where: { id },
      data: {
        title: title ?? undefined,
        published: published ?? undefined,
        metadata: metadata ?? undefined,
      },
    })

    // Invalidate cache for this menu
    await invalidateMenuCache(menu.slug)

    res.json({ success: true, message: 'Menu mis à jour', data: menu })
  })
)

// DELETE /admin/menus/:id - delete menu
router.delete(
  '/menus/:id',
  param('id').isString().notEmpty(),
  validateRequest,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params

    const existing = await prisma.menu.findUnique({ where: { id } })
    if (!existing) throw new ApiError('Menu non trouvé', 404)

    await prisma.menu.delete({ where: { id } })

    // Invalidate cache for this slug
    await invalidateMenuCache(existing.slug)

    res.json({ success: true, message: 'Menu supprimé' })
  })
)

// POST /admin/menus/:menuId/items - add menu item
router.post(
  '/menus/:menuId/items',
  param('menuId').isString().notEmpty(),
  body('label').isString().notEmpty(),
  body('url').optional().isString(),
  body('type').optional().isString(),
  body('order').optional().isInt(),
  body('visible').optional().isBoolean(),
  body('targetBlank').optional().isBoolean(),
  validateRequest,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { menuId } = req.params
    const { parentId, label, url, type = 'LINK', order = 0, visible = true, targetBlank = false, metadata, i18n } = req.body

    const item = await prisma.menuItem.create({
      data: {
        menuId,
        parentId: parentId ?? undefined,
        label,
        url: url ?? undefined,
        type,
        order,
        visible,
        targetBlank,
        metadata: metadata ?? undefined,
        i18n: i18n && Array.isArray(i18n) ? { create: i18n } : undefined,
      },
      include: { i18n: true },
    })

    // Invalidate menu cache for the menu this item belongs to
    const menu = await prisma.menu.findUnique({ where: { id: menuId }, select: { slug: true } })
    if (menu) await invalidateMenuCache(menu.slug)

    res.json({ success: true, message: 'Item créé', data: item })
  })
)

// PUT /admin/menus/:menuId/items/:id - update menu item (including i18n replace)
router.put(
  '/menus/:menuId/items/:id',
  param('menuId').isString().notEmpty(),
  param('id').isString().notEmpty(),
  body('label').optional().isString(),
  body('url').optional().isString(),
  body('type').optional().isString(),
  body('order').optional().isInt(),
  body('visible').optional().isBoolean(),
  validateRequest,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    const { parentId, label, url, type, order, visible, targetBlank, metadata, i18n } = req.body

    // Update item
    await prisma.menuItem.update({
      where: { id },
      data: {
        parentId: parentId ?? undefined,
        label: label ?? undefined,
        url: url ?? undefined,
        type: type ?? undefined,
        order: order ?? undefined,
        visible: visible ?? undefined,
        targetBlank: targetBlank ?? undefined,
        metadata: metadata ?? undefined,
      },
      include: { i18n: true },
    })

    // Replace i18n if provided
    if (i18n && Array.isArray(i18n)) {
      await prisma.menuItemI18n.deleteMany({ where: { menuItemId: id } })
      if (i18n.length > 0) {
        await prisma.menuItemI18n.createMany({
          data: i18n.map((it: any) => ({ menuItemId: id, lang: it.lang, label: it.label, description: it.description ?? null })),
        })
      }
    }

    const fresh = await prisma.menuItem.findUnique({ where: { id }, include: { i18n: true } })

    // Invalidate cache for menu
    if (fresh && fresh.menuId) {
      const menu = await prisma.menu.findUnique({ where: { id: fresh.menuId }, select: { slug: true } })
      if (menu) await invalidateMenuCache(menu.slug)
    }

    res.json({ success: true, message: 'Item mis à jour', data: fresh })
  })
)

// DELETE /admin/menus/:menuId/items/:id - delete item
router.delete(
  '/menus/:menuId/items/:id',
  param('menuId').isString().notEmpty(),
  param('id').isString().notEmpty(),
  validateRequest,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params

    const existing = await prisma.menuItem.findUnique({ where: { id } })
    if (!existing) throw new ApiError('Item non trouvé', 404)

    await prisma.menuItem.delete({ where: { id } })

    // Invalidate menu cache
    if (existing.menuId) {
      const menu = await prisma.menu.findUnique({ where: { id: existing.menuId }, select: { slug: true } })
      if (menu) await invalidateMenuCache(menu.slug)
    }

    res.json({ success: true, message: 'Item supprimé' })
  })
)

// PATCH /admin/menus/:menuId/items/reorder - body: { orders: [{ id, order, parentId? }] }
router.patch(
  '/menus/:menuId/items/reorder',
  param('menuId').isString().notEmpty(),
  body('orders').isArray({ min: 1 }),
  validateRequest,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { orders } = req.body

    if (!orders || !Array.isArray(orders)) throw new ApiError('Orders requis', 400)

    const ops = orders.map((o: any) => prisma.menuItem.update({ where: { id: o.id }, data: { order: o.order ?? 0, parentId: o.parentId ?? undefined } }))

    await prisma.$transaction(ops)

    // Invalidate cache for the menu
    const menuId = req.params.menuId
    const menu = await prisma.menu.findUnique({ where: { id: menuId }, select: { slug: true } })
    if (menu) await invalidateMenuCache(menu.slug)

    res.json({ success: true, message: 'Ordre mis à jour' })
  })
)

// POST /admin/menus/:id/publish - set published state { published: true|false }
router.post(
  '/menus/:id/publish',
  param('id').isString().notEmpty(),
  body('published').isBoolean(),
  validateRequest,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    const { published } = req.body

    const menu = await prisma.menu.update({ where: { id }, data: { published: !!published } })

    // Invalidate cache for this menu
    await invalidateMenuCache(menu.slug)

    res.json({ success: true, message: 'État de publication mis à jour', data: menu })
  })
)

export default router

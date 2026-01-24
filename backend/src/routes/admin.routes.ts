import { Router, Response } from 'express'
import { UserRole, Prisma } from '@prisma/client'
import prisma from '../utils/database'
import { asyncHandler, ApiError } from '../middleware/errorHandler'
import { authenticate, authorize, AuthRequest } from '../middleware/auth'
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

// GET /admin/settings - Fetch platform settings
router.get('/settings', asyncHandler(async (_req: AuthRequest, res: Response) => {
  const settings = await prisma.appSetting.findUnique({ where: { id: SETTINGS_ID } })
  const data = (settings?.data as SettingsPayload | null) ?? defaultSettings

  res.json({
    success: true,
    data,
  })
}))

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

export default router

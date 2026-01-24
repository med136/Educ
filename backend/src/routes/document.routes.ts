import { Router, Response } from 'express'
import multer from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { DocumentType, Prisma } from '@prisma/client'
import prisma from '../utils/database'
import { asyncHandler, ApiError } from '../middleware/errorHandler'
import { authenticate, AuthRequest } from '../middleware/auth'
import { storeDocumentFile } from '../services/storage.service'
import { sendNotification } from '../services/socket.service'
import { io } from '../index'
import { sendEmail } from '../services/email.service'

const router = Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'))
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/mp4',
    ]
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Type de fichier non autorisé'))
    }
  },
})

// All routes require authentication
router.use(authenticate)

// GET /documents - Get all documents for current user
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '20', search, type } = req.query

  const where: Prisma.DocumentWhereInput = {
    OR: [
      { ownerId: req.user!.id },
      { shares: { some: { userId: req.user!.id } } },
      { isPublic: true },
    ],
  }

  if (search) {
    where.title = { contains: search as string, mode: 'insensitive' }
  }

  if (type && Object.values(DocumentType).includes(type as DocumentType)) {
    where.fileType = type as DocumentType
  }

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true },
        },
        _count: { select: { comments: true, shares: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
    }),
    prisma.document.count({ where }),
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

// Wrapper for multer to fix type compatibility
const uploadMiddleware = upload.single('file') as any

// POST /documents - Upload a new document
router.post('/', uploadMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    throw new ApiError('Fichier requis', 400)
  }

  const { title, description, classroomId, isPublic, tags } = req.body

  // Determine file type
  const ext = path.extname(req.file.originalname).toLowerCase()
  const fileTypeMap: Record<string, DocumentType> = {
    '.pdf': 'PDF',
    '.doc': 'DOCX',
    '.docx': 'DOCX',
    '.ppt': 'PPTX',
    '.pptx': 'PPTX',
    '.jpg': 'IMAGE',
    '.jpeg': 'IMAGE',
    '.png': 'IMAGE',
    '.gif': 'IMAGE',
    '.mp4': 'VIDEO',
  }

  const stored = await storeDocumentFile(req.file)

  const document = await prisma.document.create({
    data: {
      title: title || req.file.originalname,
      description,
      fileName: req.file.originalname,
      fileType: fileTypeMap[ext] || 'OTHER',
      fileSize: req.file.size,
      fileUrl: stored.url,
      ownerId: req.user!.id,
      classroomId,
      isPublic: isPublic === 'true',
      tags: tags ? JSON.parse(tags) : [],
    },
    include: {
      owner: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  })

  res.status(201).json({
    success: true,
    message: 'Document uploadé avec succès',
    data: document,
  })
}))

// GET /documents/:id - Get document by ID (with access control)
router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const document = await prisma.document.findFirst({
    where: {
      id,
      OR: [
        { ownerId: req.user!.id },
        { isPublic: true },
        { shares: { some: { userId: req.user!.id } } },
      ],
    },
    include: {
      owner: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      shares: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      },
      comments: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      versions: {
        orderBy: { versionNumber: 'desc' },
      },
    },
  })

  if (!document) {
    throw new ApiError('Document non trouvé', 404)
  }

  // Increment view count
  await prisma.document.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  })

  res.json({
    success: true,
    data: document,
  })
}))

// DELETE /documents/:id - Delete document
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const document = await prisma.document.findUnique({ where: { id } })

  if (!document) {
    throw new ApiError('Document non trouvé', 404)
  }

  if (document.ownerId !== req.user!.id && req.user!.role !== 'ADMIN') {
    throw new ApiError('Non autorisé', 403)
  }

  await prisma.document.delete({ where: { id } })

  res.json({
    success: true,
    message: 'Document supprimé',
  })
}))

// POST /documents/:id/share - Share document with users
router.post('/:id/share', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { userIds, permission } = req.body

  const document = await prisma.document.findUnique({ where: { id } })

  if (!document || document.ownerId !== req.user!.id) {
    throw new ApiError('Non autorisé', 403)
  }

  const shares = await Promise.all(
    userIds.map((userId: string) =>
      prisma.documentShare.upsert({
        where: { documentId_userId: { documentId: id, userId } },
        create: { documentId: id, userId, permission },
        update: { permission },
      })
    )
  )

  // Créer des notifications en base et pousser en temps réel
  const targets = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, firstName: true },
  })

  await Promise.all(
    targets.map(async (target) => {
      await prisma.notification.create({
        data: {
          title: 'Nouveau document partagé',
          message: `${req.user!.email} a partagé "${document.title}" avec vous`,
          type: 'document',
          userId: target.id,
          data: { documentId: id },
        },
      })

      // Notification temps réel via Socket.io (si connecté)
      sendNotification(io, target.id, {
        title: 'Nouveau document partagé',
        message: `${req.user!.email} a partagé "${document.title}" avec vous`,
        type: 'document',
        data: { documentId: id },
      })

      // Email transactionnel (si SMTP configuré)
      if (target.email) {
        void sendEmail({
          to: target.email,
          subject: 'Nouveau document partagé sur EduShare',
          html: `<p>Bonjour ${target.firstName || ''},</p>
                 <p>${req.user!.email} a partagé le document <strong>${document.title}</strong> avec vous.</p>
                 <p>Connectez-vous à la plateforme pour le consulter.</p>`,
          text: `Un document intitulé "${document.title}" a été partagé avec vous par ${req.user!.email}.`,
        })
      }
    })
  )

  res.json({
    success: true,
    message: 'Document partagé',
    data: shares,
  })
}))

export default router

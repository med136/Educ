import { Router, Response } from 'express'
import multer from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { MediaAssetType, Prisma, StorageProvider } from '@prisma/client'
import prisma from '../utils/database'
import { asyncHandler, ApiError } from '../middleware/errorHandler'
import { authenticate, AuthRequest, authorize } from '../middleware/auth'
import { deleteStoredFile, storeUploadedFile } from '../services/storage.service'

const router = Router()

// Configure multer for image uploads
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
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Type de fichier non autorisé'))
    }
  },
})

// Wrapper for multer to fix type compatibility
const uploadMiddleware = upload.single('file') as any

router.use(authenticate)
router.use(authorize('TEACHER', 'ADMIN'))

/**
 * @openapi
 * /api/v1/media/assets:
 *   get:
 *     tags:
 *       - Media
 *     summary: List media assets for current user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated list of media assets
 */
// GET /media/assets - list assets for current user
router.get(
  '/assets',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = '1', limit = '24', type } = req.query

    const where: Prisma.MediaAssetWhereInput = {
      ownerId: req.user!.id,
    }

    if (type && Object.values(MediaAssetType).includes(type as MediaAssetType)) {
      where.type = type as MediaAssetType
    }

    const [assets, total] = await Promise.all([
      prisma.mediaAsset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      }),
      prisma.mediaAsset.count({ where }),
    ])

    res.json({
      success: true,
      data: assets,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    })
  })
)

/**
 * @openapi
 * /api/v1/media/assets/stats:
 *   get:
 *     tags:
 *       - Media
 *     summary: Get statistics for media assets
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Asset statistics
 */
// GET /media/assets/stats - get statistics for assets
router.get(
  '/assets/stats',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { type } = req.query

    const where: Prisma.MediaAssetWhereInput = {
      ownerId: req.user!.id,
    }

    if (type && Object.values(MediaAssetType).includes(type as MediaAssetType)) {
      where.type = type as MediaAssetType
    }

    const [total, assets] = await Promise.all([
      prisma.mediaAsset.count({ where }),
      prisma.mediaAsset.findMany({
        where,
        select: { size: true },
      }),
    ])

    const totalSize = assets.reduce((acc, a) => acc + (a.size || 0), 0)

    res.json({
      success: true,
      data: {
        total,
        totalSize,
      },
    })
  })
)

/**
 * @openapi
 * /api/v1/media/assets:
 *   post:
 *     tags:
 *       - Media
 *     summary: Upload a media asset
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Asset uploaded
 */
// POST /media/assets - upload an asset
router.post(
  '/assets',
  uploadMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      throw new ApiError('Fichier requis', 400)
    }

    const { type } = req.body as { type?: string }

    const assetType: MediaAssetType =
      type && Object.values(MediaAssetType).includes(type as MediaAssetType)
        ? (type as MediaAssetType)
        : 'ARTICLE_THUMBNAIL'

    const stored = await storeUploadedFile(req.file, 'media')

    const created = await prisma.mediaAsset.create({
      data: {
        type: assetType,
        url: stored.url,
        storageKey: stored.key,
        storageProvider: stored.provider as StorageProvider,
        mimeType: req.file.mimetype,
        originalName: req.file.originalname,
        size: req.file.size,
        ownerId: req.user!.id,
      },
    })

    res.status(201).json({
      success: true,
      message: 'Image uploadée avec succès',
      data: created,
    })
  })
)

/**
 * @openapi
 * /api/v1/media/assets/{id}:
 *   delete:
 *     tags:
 *       - Media
 *     summary: Delete a media asset
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Asset deleted
 */
// DELETE /media/assets/:id - delete an asset
router.delete(
  '/assets/:id',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params

    const asset = await prisma.mediaAsset.findUnique({ where: { id } })

    if (!asset) {
      throw new ApiError('Media non trouvé', 404)
    }

    if (asset.ownerId !== req.user!.id && req.user!.role !== 'ADMIN') {
      throw new ApiError('Non autorisé', 403)
    }

    await prisma.mediaAsset.delete({ where: { id } })

    await deleteStoredFile({
      key: asset.storageKey,
      provider: asset.storageProvider,
    })

    res.json({
      success: true,
      message: 'Media supprimé',
    })
  })
)

export default router

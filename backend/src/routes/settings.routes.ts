import { Router } from 'express'
import prisma from '../utils/database'
import { asyncHandler } from '../middleware/errorHandler'
import {
  defaultSettings,
  sanitizePublicSettings,
  SETTINGS_ID,
  type SettingsPayload,
} from '../utils/settings'

const router = Router()

/**
 * @openapi
 * /api/v1/settings:
 *   get:
 *     tags:
 *       - Settings
 *     summary: Get public sanitized settings for frontend
 *     responses:
 *       200:
 *         description: Public settings
 */
// GET /settings - Public, sanitized settings for frontend
router.get('/', asyncHandler(async (_req, res) => {
  const settings = await prisma.appSetting.findUnique({ where: { id: SETTINGS_ID } })
  const data = (settings?.data as SettingsPayload | null) ?? defaultSettings

  res.json({
    success: true,
    data: sanitizePublicSettings(data),
  })
}))

export default router

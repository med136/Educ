import { Router } from 'express'
import { asyncHandler, ApiError } from '../middleware/errorHandler'
import { getMenuBySlugCached } from '../services/menu.service'

const router = Router()

/**
 * @openapi
 * /api/v1/menus/{slug}:
 *   get:
 *     tags:
 *       - Menus
 *     summary: Get public menu by slug with i18n fallback
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: lang
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Menu object
 */
// GET /menus/:slug?lang=xx - public menu by slug with i18n fallback
router.get('/:slug', asyncHandler(async (req, res) => {
  const { slug } = req.params
  const lang = typeof req.query.lang === 'string' ? req.query.lang : undefined

  if (!slug) throw new ApiError('Slug requis', 400)

  const menu = await getMenuBySlugCached(slug, lang)

  if (!menu || !menu.published) {
    res.status(404).json({ success: false, message: 'Menu non trouvé' })
    return
  }

  res.json({ success: true, data: menu })
  return
}))

export default router

import { Router } from 'express'
import prisma from '../utils/database'

const router = Router()

/**
 * @route   GET /api/stats/dashboard
 * @desc    Get dashboard statistics
 * @access  Public
 */
router.get('/dashboard', async (_req, res) => {
  try {
    const [articles, users, classrooms] = await Promise.all([
      prisma.article.count({
        where: { status: 'PUBLISHED' },
      }),
      prisma.user.count({
        where: { isActive: true },
      }),
      prisma.classroom.count({
        where: { isActive: true },
      }),
    ])

    res.json({
      articles,
      users,
      classrooms,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

export default router

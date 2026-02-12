import { Router, Response } from 'express'
import { Prisma, ArticleStatus, ArticleVisibility } from '@prisma/client'
import prisma from '../utils/database'
import { asyncHandler, ApiError } from '../middleware/errorHandler'
import { authenticate, authorize, AuthRequest, maybeAuthenticate } from '../middleware/auth'
import { sendNotification } from '../services/socket.service'
import { io } from '../index'
import { sendEmail } from '../services/email.service'

const router = Router()

const buildArticleInclude = () => ({
  author: {
    select: { id: true, firstName: true, lastName: true, role: true },
  },
  category: {
    select: { id: true, name: true, slug: true },
  },
  tags: {
    include: {
      tag: { select: { id: true, name: true, slug: true } },
    },
  },
  classrooms: {
    include: {
      classroom: { select: { id: true, name: true, code: true } },
    },
  },
})

const generateSlug = async (title: string, existingId?: string): Promise<string> => {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    || 'article'

  let slug = base
  let counter = 1

  // Ensure uniqueness
  while (true) {
    const existing = await prisma.article.findFirst({
      where: {
        slug,
        ...(existingId ? { id: { not: existingId } } : {}),
      },
      select: { id: true },
    })

    if (!existing) break
    counter += 1
    slug = `${base}-${counter}`
  }

  return slug
}

// Notify class members when a class-only article is published
const notifyArticlePublication = async (articleId: string): Promise<void> => {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: {
      id: true,
      title: true,
      slug: true,
      visibility: true,
      status: true,
      classrooms: {
        select: {
          classroom: {
            select: {
              id: true,
              name: true,
              creator: { select: { id: true, email: true, firstName: true } },
              students: { select: { id: true, email: true, firstName: true } },
            },
          },
        },
      },
    },
  })

  if (!article) return
  if (article.status !== ArticleStatus.PUBLISHED) return
  if (article.visibility !== ArticleVisibility.CLASS_ONLY) return

  const targets = new Map<string, { email: string | null; firstName: string | null }>()

  for (const link of article.classrooms) {
    const classroom = link.classroom
    if (!classroom) continue

    // Creator (teacher)
    if (classroom.creator) {
      targets.set(classroom.creator.id, {
        email: classroom.creator.email ?? null,
        firstName: classroom.creator.firstName ?? null,
      })
    }

    // Students
    for (const student of classroom.students) {
      targets.set(student.id, {
        email: student.email ?? null,
        firstName: student.firstName ?? null,
      })
    }
  }

  if (targets.size === 0) return

  await Promise.all(
    Array.from(targets.entries()).map(async ([userId, info]) => {
      const notification = await prisma.notification.create({
        data: {
          title: 'Nouvel article de classe',
          message: `Un nouvel article a été publié : "${article.title}"`,
          type: 'article',
          userId,
          data: { articleId: article.id, slug: article.slug },
        },
      })

      sendNotification(io, userId, {
        title: notification.title,
        message: notification.message,
        type: notification.type,
        data: notification.data as Prisma.InputJsonValue as Record<string, unknown> | undefined,
      })

      if (info.email) {
        void sendEmail({
          to: info.email,
          subject: 'Nouvel article pour votre classe',
          html: `<p>Bonjour ${info.firstName || ''},</p>
                 <p>Un nouvel article a été publié pour votre classe : <strong>${article.title}</strong>.</p>
                 <p>Connectez-vous à la plateforme pour le lire.</p>`,
          text: `Un nouvel article a été publié pour votre classe : ${article.title}.`,
        })
      }
    })
  )
}

/**
 * @openapi
 * /api/v1/articles:
 *   get:
 *     tags:
 *       - Articles
 *     summary: List articles with filters and pagination
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: visibility
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of articles
 */
// GET /articles - List articles with filters and pagination
router.get('/', maybeAuthenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '10', status, visibility, categoryId, tagId, authorId, mine, search, classroomId } = req.query

  const where: Prisma.ArticleWhereInput = {}

  if (status && Object.values(ArticleStatus).includes(status as ArticleStatus)) {
    where.status = status as ArticleStatus
  }

  if (tagId) {
    where.tags = {
      some: {
        tagId: tagId as string,
      },
    }
  }

  if (visibility && Object.values(ArticleVisibility).includes(visibility as ArticleVisibility)) {
    where.visibility = visibility as ArticleVisibility
  }

  if (categoryId) {
    where.categoryId = categoryId as string
  }

  if (authorId) {
    where.authorId = authorId as string
  }

  if (mine === 'true' && req.user) {
    where.authorId = req.user.id
  }

  if (classroomId) {
    where.classrooms = {
      some: {
        classroomId: classroomId as string,
      },
    }
  }

  if (search && typeof search === 'string' && search.trim()) {
    const q = search.trim()
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { excerpt: { contains: q, mode: 'insensitive' } },
      { content: { contains: q, mode: 'insensitive' } },
    ]
  }

  // Visibilité selon le rôle
  const role = req.user?.role

  if (role && role !== 'ADMIN') {
    const visibilityFilter: Prisma.ArticleWhereInput = {
      OR: [
        // Articles publics publiés
        {
          visibility: ArticleVisibility.PUBLIC,
          status: ArticleStatus.PUBLISHED,
        },
        // Articles visibles pour tous les connectés
        {
          visibility: ArticleVisibility.LOGGED_IN,
          status: ArticleStatus.PUBLISHED,
        },
      ],
    }

    if (role === 'STUDENT') {
      // Articles réservés à certaines classes, auxquels l'élève appartient
      visibilityFilter.OR!.push({
        visibility: ArticleVisibility.CLASS_ONLY,
        status: ArticleStatus.PUBLISHED,
        classrooms: {
          some: {
            classroom: {
              OR: [
                { students: { some: { id: req.user!.id } } },
              ],
            },
          },
        },
      })
    }

    if (role === 'TEACHER') {
      // L'enseignant voit aussi ses propres articles (tous statuts)
      visibilityFilter.OR!.push({ authorId: req.user!.id })

      // Et les articles de type CLASS_ONLY liés à ses classes
      visibilityFilter.OR!.push({
        visibility: ArticleVisibility.CLASS_ONLY,
        status: ArticleStatus.PUBLISHED,
        classrooms: {
          some: {
            classroom: {
              creatorId: req.user!.id,
            },
          },
        },
      })
    }

    if (where.AND) {
      const currentAnd = Array.isArray(where.AND) ? where.AND : [where.AND]
      where.AND = [...currentAnd, visibilityFilter]
    } else {
      where.AND = [visibilityFilter]
    }
  }

  const pageNumber = parseInt(page as string) || 1
  const pageSize = parseInt(limit as string) || 10

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      include: buildArticleInclude(),
      orderBy: [
        { publishedAt: 'desc' },
        { createdAt: 'desc' },
      ],
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
    }),
    prisma.article.count({ where }),
  ])

  res.json({
    success: true,
    data: articles,
    pagination: {
      page: pageNumber,
      limit: pageSize,
      total,
      pages: Math.ceil(total / pageSize),
    },
  })
}))

/**
 * @openapi
 * /api/v1/articles/{slug}:
 *   get:
 *     tags:
 *       - Articles
 *     summary: Get a single article by slug
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Article object
 */
// GET /articles/:slug - Get a single article by slug
router.get('/:slug', maybeAuthenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { slug } = req.params

  const article = await prisma.article.findUnique({
    where: { slug },
    include: buildArticleInclude(),
  })

  if (!article) {
    throw new ApiError('Article non trouvé', 404)
  }

  // Only author or admin can see drafts/archived; others only published
  if (article.status !== 'PUBLISHED') {
    if (!req.user || (req.user.id !== article.authorId && req.user.role !== 'ADMIN')) {
      throw new ApiError('Accès non autorisé à cet article', 403)
    }
  }

  res.json({
    success: true,
    data: article,
  })
}))

// POST /articles - Create article (TEACHER, ADMIN)
router.post('/', authenticate, authorize('TEACHER', 'ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    title,
    slug,
    excerpt,
    content,
    status,
    visibility,
    categoryId,
    tagIds,
    classroomIds,
    coverImage,
    readingTime,
  } = req.body as {
    title?: string
    slug?: string
    excerpt?: string
    content?: string
    status?: ArticleStatus
    visibility?: ArticleVisibility
    categoryId?: string
    tagIds?: string[]
    classroomIds?: string[]
    coverImage?: string
    readingTime?: number
  }

  if (!title || !content) {
    throw new ApiError('Titre et contenu sont requis', 400)
  }

  const finalSlug = slug?.trim() || await generateSlug(title)

  const article = await prisma.article.create({
    data: {
      title,
      slug: finalSlug,
      excerpt: excerpt || null,
      content,
      status: status || ArticleStatus.DRAFT,
      visibility: visibility || ArticleVisibility.PUBLIC,
      coverImage: coverImage || null,
      readingTime: readingTime || null,
      authorId: req.user!.id,
      categoryId: categoryId || null,
      tags: tagIds && tagIds.length > 0 ? {
        create: tagIds.map((tagId: string) => ({ tagId })),
      } : undefined,
      classrooms: classroomIds && classroomIds.length > 0 ? {
        create: classroomIds.map((classroomId: string) => ({ classroomId })),
      } : undefined,
      publishedAt: status === ArticleStatus.PUBLISHED ? new Date() : null,
    },
    include: buildArticleInclude(),
  })

  if (article.status === ArticleStatus.PUBLISHED) {
    void notifyArticlePublication(article.id)
  }

  res.status(201).json({
    success: true,
    data: article,
  })
}))

// PUT /articles/:id - Update article (author or admin)
router.put('/:id', authenticate, authorize('TEACHER', 'ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const {
    title,
    slug,
    excerpt,
    content,
    status,
    visibility,
    categoryId,
    tagIds,
    classroomIds,
    coverImage,
    readingTime,
  } = req.body as {
    title?: string
    slug?: string
    excerpt?: string
    content?: string
    status?: ArticleStatus
    visibility?: ArticleVisibility
    categoryId?: string | null
    tagIds?: string[]
    classroomIds?: string[]
    coverImage?: string | null
    readingTime?: number | null
  }

  const existing = await prisma.article.findUnique({ where: { id } })

  if (!existing) {
    throw new ApiError('Article non trouvé', 404)
  }

  if (req.user!.role !== 'ADMIN' && existing.authorId !== req.user!.id) {
    throw new ApiError('Vous ne pouvez modifier que vos propres articles', 403)
  }

  let finalSlug = existing.slug
  if (slug && slug.trim() && slug.trim() !== existing.slug) {
    finalSlug = await generateSlug(slug.trim(), existing.id)
  } else if (title && title !== existing.title) {
    finalSlug = await generateSlug(title, existing.id)
  }

  const data: Prisma.ArticleUpdateInput = {
    title: title ?? existing.title,
    slug: finalSlug,
    excerpt: excerpt !== undefined ? excerpt : existing.excerpt,
    content: content ?? existing.content,
    status: status ?? existing.status,
    visibility: visibility ?? existing.visibility,
    coverImage: coverImage !== undefined ? coverImage : existing.coverImage,
    readingTime: readingTime !== undefined ? readingTime : existing.readingTime,
  }

  if (categoryId === null) {
    data.category = { disconnect: true }
  } else if (categoryId !== undefined) {
    data.category = { connect: { id: categoryId } }
  }

  // PublishedAt management
  let publishNow = false
  if (status && status === ArticleStatus.PUBLISHED && existing.status !== ArticleStatus.PUBLISHED) {
    publishNow = true
    data.publishedAt = new Date()
  }

  if (status && status !== ArticleStatus.PUBLISHED) {
    data.publishedAt = null
  }

  // Replace tags if provided
  if (tagIds) {
    await prisma.articleTagLink.deleteMany({ where: { articleId: id } })
    if (tagIds.length > 0) {
      ;(data as any).tags = {
        create: tagIds.map((tagId: string) => ({ tagId })),
      }
    }
  }

  // Replace classrooms if provided
  if (classroomIds) {
    await prisma.articleClassroomLink.deleteMany({ where: { articleId: id } })
    if (classroomIds.length > 0) {
      ;(data as any).classrooms = {
        create: classroomIds.map((classroomId: string) => ({ classroomId })),
      }
    }
  }

  const article = await prisma.article.update({
    where: { id },
    data,
    include: buildArticleInclude(),
  })

  if (publishNow) {
    void notifyArticlePublication(article.id)
  }

  res.json({
    success: true,
    data: article,
  })
}))

/**
 * @openapi
 * /api/v1/articles/{id}:
 *   delete:
 *     tags:
 *       - Articles
 *     summary: Delete an article (author or admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deletion successful
 */
// DELETE /articles/:id - Delete article (author or admin)
router.delete('/:id', authenticate, authorize('TEACHER', 'ADMIN'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params

  const existing = await prisma.article.findUnique({ where: { id } })

  if (!existing) {
    throw new ApiError('Article non trouvé', 404)
  }

  if (req.user!.role !== 'ADMIN' && existing.authorId !== req.user!.id) {
    throw new ApiError('Vous ne pouvez supprimer que vos propres articles', 403)
  }

  await prisma.article.delete({ where: { id } })

  res.json({
    success: true,
    message: 'Article supprimé',
  })
}))

export default router

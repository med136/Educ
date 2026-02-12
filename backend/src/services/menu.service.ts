import prisma from '../utils/database'
import { getCachedMenu, setCachedMenu } from '../utils/cache'

type MenuItemRaw = {
  id: string
  parentId: string | null
  label: string
  url?: string | null
  type: string
  order: number
  targetBlank: boolean
  metadata: any
  i18n: Array<{ lang: string; label: string; description?: string }>
}

const pickLabel = (item: MenuItemRaw, lang?: string) => {
  if (lang) {
    const found = item.i18n.find((i) => i.lang === lang)
    if (found && found.label) return found.label
  }
  return item.label
}

export const getMenuBySlug = async (slug: string, lang?: string) => {
  const cached = await getCachedMenu(slug, lang)
  if (cached) return cached

  const menu = await prisma.menu.findUnique({
    where: { slug },
    include: {
      items: {
        where: { visible: true },
        orderBy: { order: 'asc' },
        include: { i18n: true },
      },
    },
  })

  if (!menu) return null

  const rawItems = menu.items as unknown as MenuItemRaw[]

  const map = new Map<string, any>()

  rawItems.forEach((it) => {
    map.set(it.id, {
      id: it.id,
      parentId: it.parentId,
      label: pickLabel(it, lang),
      url: it.url,
      type: it.type,
      order: it.order,
      targetBlank: it.targetBlank,
      metadata: it.metadata ?? null,
      children: [],
    })
  })

  const roots: any[] = []

  for (const item of map.values()) {
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId).children.push(item)
    } else {
      roots.push(item)
    }
  }

  return {
    id: menu.id,
    slug: menu.slug,
    title: menu.title,
    published: menu.published,
    metadata: menu.metadata ?? null,
    items: roots,
    createdAt: menu.createdAt,
    updatedAt: menu.updatedAt,
  }
}

// cache result after building it
export const getMenuBySlugCached = async (slug: string, lang?: string) => {
  const data = await getMenuBySlug(slug, lang)
  if (data) await setCachedMenu(slug, lang, data)
  return data
}

export default {
  getMenuBySlug,
}

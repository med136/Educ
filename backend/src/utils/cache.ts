import redis from './redis'

const MENU_TTL = 60 * 5 // 5 minutes

const menuKey = (slug: string, lang?: string) => `menu:${slug}:${lang || 'default'}`

export const getCachedMenu = async (slug: string, lang?: string) => {
  if (!redis) return null
  try {
    const key = menuKey(slug, lang)
    const raw = await redis.get(key)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (error) {
    return null
  }
}

export const setCachedMenu = async (slug: string, lang: string | undefined, data: unknown) => {
  if (!redis) return
  try {
    const key = menuKey(slug, lang)
    await redis.set(key, JSON.stringify(data), 'EX', MENU_TTL)
  } catch (error) {
    // ignore cache errors
  }
}

export const invalidateMenuCache = async (slug: string) => {
  if (!redis) return
  try {
    const pattern = `menu:${slug}:*`
    const keys = await redis.keys(pattern)
    if (keys.length > 0) await redis.del(...keys)
  } catch (error) {
    // ignore
  }
}

export default {
  getCachedMenu,
  setCachedMenu,
  invalidateMenuCache,
}

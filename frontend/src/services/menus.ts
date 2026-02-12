import api from './api'

export const listAdminMenus = async () => {
  const res = await api.get('/admin/menus')
  return res.data.data
}

export const getAdminMenu = async (id: string) => {
  const res = await api.get(`/admin/menus/${id}`)
  return res.data.data
}

export const createMenu = async (payload: any) => {
  const res = await api.post('/admin/menus', payload)
  return res.data.data
}

export const updateMenu = async (id: string, payload: any) => {
  const res = await api.put(`/admin/menus/${id}`, payload)
  return res.data.data
}

export const deleteMenu = async (id: string) => {
  const res = await api.delete(`/admin/menus/${id}`)
  return res.data
}

export const createMenuItem = async (menuId: string, payload: any) => {
  const res = await api.post(`/admin/menus/${menuId}/items`, payload)
  return res.data.data
}

export const updateMenuItem = async (menuId: string, id: string, payload: any) => {
  const res = await api.put(`/admin/menus/${menuId}/items/${id}`, payload)
  return res.data.data
}

export const deleteMenuItem = async (menuId: string, id: string) => {
  const res = await api.delete(`/admin/menus/${menuId}/items/${id}`)
  return res.data
}

export const reorderMenuItems = async (menuId: string, orders: any[]) => {
  const res = await api.patch(`/admin/menus/${menuId}/items/reorder`, { orders })
  return res.data
}

export const publishMenu = async (id: string, published: boolean) => {
  const res = await api.post(`/admin/menus/${id}/publish`, { published })
  return res.data.data
}

export const getPublicMenu = async (slug: string, lang?: string) => {
  const params = lang ? `?lang=${lang}` : ''
  const res = await api.get(`/menus/${slug}${params}`)
  return res.data.data
}

export default {
  listAdminMenus,
  getAdminMenu,
  createMenu,
  updateMenu,
  deleteMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  reorderMenuItems,
  publishMenu,
  getPublicMenu,
}

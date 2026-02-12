import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as menusApi from '../services/menus'

export const useAdminMenus = () => {
  return useQuery({ queryKey: ['admin', 'menus'], queryFn: menusApi.listAdminMenus })
}

export const useAdminMenu = (id?: string) => {
  return useQuery({ queryKey: ['admin', 'menu', id], queryFn: () => menusApi.getAdminMenu(id as string), enabled: !!id })
}

export const useCreateMenu = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (payload: any) => menusApi.createMenu(payload), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'menus'] }) })
}

export const useUpdateMenu = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, payload }: any) => menusApi.updateMenu(id, payload), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'menus'] }) })
}

export const useDeleteMenu = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: string) => menusApi.deleteMenu(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'menus'] }) })
}

export const useCreateMenuItem = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ menuId, payload }: any) => menusApi.createMenuItem(menuId, payload), onSuccess: (_data, vars: any) => qc.invalidateQueries({ queryKey: ['admin', 'menu', vars.menuId] }) })
}

export const useUpdateMenuItem = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ menuId, id, payload }: any) => menusApi.updateMenuItem(menuId, id, payload), onSuccess: (_d, vars: any) => qc.invalidateQueries({ queryKey: ['admin', 'menu', vars.menuId] }) })
}

export const useDeleteMenuItem = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ menuId, id }: any) => menusApi.deleteMenuItem(menuId, id), onSuccess: (_d, vars: any) => qc.invalidateQueries({ queryKey: ['admin', 'menu', vars.menuId] }) })
}

export const useReorderMenu = () => {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ menuId, orders }: any) => menusApi.reorderMenuItems(menuId, orders), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'menu'] }) })
}

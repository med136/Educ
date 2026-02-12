import React, { useMemo, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAdminMenu, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem, useReorderMenu } from '../../hooks/useMenus'

type Props = {
  menuId: string
  onClose?: () => void
}

const MenuEditor: React.FC<Props> = ({ menuId, onClose }) => {
  const { data: menu, isLoading } = useAdminMenu(menuId)
  const createItem = useCreateMenuItem()
  const updateItem = useUpdateMenuItem()
  const deleteItem = useDeleteMenuItem()
  const reorder = useReorderMenu()

  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [form, setForm] = useState<any>({ label: '', url: '', i18n: [{ lang: 'fr', label: '' }, { lang: 'ar', label: '' }] })

  const flatItems = useMemo(() => (menu as any)?.items ?? [], [menu])
  const [order, setOrder] = useState<string[]>([])

  useEffect(() => {
    setOrder(flatItems.map((it: any) => it.id))
  }, [flatItems])

  const startEdit = (item: any) => {
    setEditingItemId(item.id)
    setForm({ label: item.label, url: item.url, i18n: item.i18n ?? [] })
  }

  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'

  const SortableItem: React.FC<any> = ({ id, item, onEdit, onDelete }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    }

    return (
      <li ref={setNodeRef} style={style} {...attributes} className="p-2 border rounded flex justify-between items-center">
        <div>
          <div className="font-medium">{item.label}</div>
          <div className="text-sm text-gray-500">{item.url}</div>
        </div>
        <div className="space-x-2">
          <button className="px-2 py-1 bg-blue-500 text-white rounded" {...listeners} onClick={onEdit}>{t('menus.drag_edit')}</button>
          <button className="px-2 py-1 bg-red-500 text-white rounded" onClick={onDelete}>{t('menus.del')}</button>
        </div>
      </li>
    )
  }

  const handleSave = async () => {
    if (!editingItemId) return
    await (updateItem as any).mutateAsync({ menuId, id: editingItemId, payload: form })
    setEditingItemId(null)
  }

  const handleAdd = async () => {
    await (createItem as any).mutateAsync({ menuId, payload: { label: form.label || t('menus.new_item'), url: form.url || '/', i18n: form.i18n } })
    setForm({ label: '', url: '', i18n: [{ lang: 'fr', label: '' }, { lang: 'ar', label: '' }] })
  }

  // removed unused move function

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    if (active.id === over.id) return

    const oldIndex = order.indexOf(active.id as string)
    const newIndex = order.indexOf(over.id as string)
    const newOrder = arrayMove(order, oldIndex, newIndex)
    setOrder(newOrder)

    const ordersPayload = newOrder.map((id, idx) => ({ id, order: idx }))
    void (reorder as any).mutateAsync({ menuId, orders: ordersPayload })
  }

  if (isLoading) return <div>{t('menus.loading')}</div>
  if (!menu) return <div>{t('menus.not_found')}</div>

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 border transition" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            {t('menus.editor_title')} {(menu as any).title}
          </h3>
          <div className="text-sm text-gray-500 mt-1">{t('menus.slug_label')} {(menu as any).slug} • {(menu as any).published ? t('menus.published') : t('menus.draft')}</div>
        </div>
        <div>
          <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition" onClick={onClose}>{t('menus.close')}</button>
        </div>
      </div>

      <div className={`flex gap-6 ${isRTL ? 'flex-row-reverse' : ''} flex-wrap`}>
        <div className="w-full md:w-1/2">
          <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            {t('menus.items')}
          </h4>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 shadow-sm">
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={order} strategy={verticalListSortingStrategy}>
                <ul className="space-y-3">
                  {order.map((id) => {
                    const it = flatItems.find((f: any) => f.id === id)
                    return (
                      <SortableItem key={id} id={id} item={it} onEdit={() => startEdit(it)} onDelete={() => (deleteItem as any).mutate({ menuId, id: it.id })} />
                    )
                  })}
                </ul>
              </SortableContext>
            </DndContext>
          </div>
        </div>

        <div className="w-full md:w-1/2">
          <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            {editingItemId ? t('menus.editing') : t('menus.add_item')}
          </h4>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 shadow-sm">
            {editingItemId ? (
              <div className="space-y-3">
                <input className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-400 ${isRTL ? 'text-right' : ''}`} placeholder={t('menus.label_placeholder')} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
                <input className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-400 ${isRTL ? 'text-right' : ''}`} placeholder={t('menus.url_placeholder')} value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
                <div>
                  <div className="text-sm font-medium mb-1">{t('menus.translations')}</div>
                  {(form.i18n || []).map((t: any, idx: number) => (
                    <div key={t.lang} className="mt-2">
                      <div className="text-xs text-gray-600 mb-1">{t.lang}</div>
                      <input className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-400 ${isRTL ? 'text-right' : ''}`} value={t.label} onChange={(e) => { const newI18n = [...form.i18n]; newI18n[idx].label = e.target.value; setForm({ ...form, i18n: newI18n }) }} />
                    </div>
                  ))}
                </div>
                <div className={`flex gap-2 mt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition" onClick={handleSave}>{t('menus.save')}</button>
                  <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition" onClick={() => setEditingItemId(null)}>{t('menus.cancel')}</button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <input className={`w-full p-2 border mt-2 rounded-lg focus:ring-2 focus:ring-blue-400 ${isRTL ? 'text-right' : ''}`} placeholder="Label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
                <input className={`w-full p-2 border mt-2 rounded-lg focus:ring-2 focus:ring-blue-400 ${isRTL ? 'text-right' : ''}`} placeholder="URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
                <div className="mt-2">
                  <div className="text-sm font-medium mb-1">Traductions</div>
                  {(form.i18n || []).map((t: any, idx: number) => (
                    <div key={t.lang} className="mt-2">
                      <div className="text-xs text-gray-600 mb-1">{t.lang}</div>
                      <input className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 ${isRTL ? 'text-right' : ''}`} value={t.label} onChange={(e) => { const newI18n = [...form.i18n]; newI18n[idx].label = e.target.value; setForm({ ...form, i18n: newI18n }) }} />
                    </div>
                  ))}
                </div>
                <div className={`flex ${isRTL ? 'flex-row-reverse' : ''} mt-2`}>
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition" onClick={handleAdd}>Ajouter</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MenuEditor

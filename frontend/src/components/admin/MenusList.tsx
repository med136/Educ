import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdminMenus, useCreateMenu, useDeleteMenu } from '../../hooks/useMenus'

const MenusList: React.FC<{ onEdit: (id: string) => void }> = ({ onEdit }) => {
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const { data: menus, isLoading } = useAdminMenus()
  const create = useCreateMenu()
  const del = useDeleteMenu()
  const [slug, setSlug] = useState('')
  const [title, setTitle] = useState('')

  const handleCreate = async () => {
    if (!slug || !title) return
    await (create as any).mutateAsync({ slug, title })
    setSlug('')
    setTitle('')
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          {t('sidebar.menus') || 'Menus'}
        </h2>
        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 shadow-sm flex flex-col gap-3">
          <input className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 ${isRTL ? 'text-right' : ''}`} placeholder={t('menus.slug_placeholder')} value={slug} onChange={(e) => setSlug(e.target.value)} />
          <input className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 ${isRTL ? 'text-right' : ''}`} placeholder={t('menus.title_placeholder')} value={title} onChange={(e) => setTitle(e.target.value)} />
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition" onClick={handleCreate}>{t('menus.create_menu')}</button>
        </div>
      </div>

      {isLoading ? <div className="text-gray-400">{t('menus.loading')}</div> : (
        <div className="grid gap-4">
          {(menus as any[]) && (menus as any[]).map((m: any) => (
            <div key={m.id} className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4 flex items-center justify-between border hover:shadow-md transition ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
              <div>
                <div className="font-bold text-lg flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                  {m.title}
                </div>
                <div className="text-xs text-gray-500 mt-1">{m.slug} • {m.published ? t('menus.published') : t('menus.draft')}</div>
              </div>
              <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <button className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition" onClick={() => onEdit(m.id)}>{t('menus.edit')}</button>
                <button className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition" onClick={() => del.mutate(m.id)}>{t('menus.delete')}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MenusList

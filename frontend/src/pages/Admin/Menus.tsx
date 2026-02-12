import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import MenusList from '../../components/admin/MenusList'
import MenuEditor from '../../components/admin/MenuEditor'

const AdminMenusPage: React.FC = () => {
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null)
  const { t, i18n } = useTranslation();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">{t('menus.title')}</h1>
      <div className={`flex gap-6 ${i18n.language === 'ar' ? 'flex-row-reverse' : ''}`}>
        <div className="w-1/3">
          <MenusList onEdit={(id) => setEditingMenuId(id)} />
        </div>
        <div className="w-2/3">
          {editingMenuId ? (
            <MenuEditor menuId={editingMenuId} onClose={() => setEditingMenuId(null)} />
          ) : (
            <div className="p-4 border rounded">{t('menus.select_menu')}</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminMenusPage

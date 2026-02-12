import React, { Suspense } from 'react'
import { NavLink, Routes, Route } from 'react-router-dom'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const MenusPage = React.lazy(() => import('./Menus'))

const Admin: React.FC = () => {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">⚙️ Administration</h1>
      </div>

      <div className="mb-6 space-x-3">
        <NavLink to="menus" className={({isActive}) => isActive ? 'font-medium underline' : 'text-gray-600'}>Menus</NavLink>
        <NavLink to="users" className={({isActive}) => isActive ? 'font-medium underline' : 'text-gray-600'}>Utilisateurs</NavLink>
        <NavLink to="settings" className={({isActive}) => isActive ? 'font-medium underline' : 'text-gray-600'}>Paramètres</NavLink>
      </div>

      <Suspense fallback={<LoadingSpinner />}> 
        <Routes>
          <Route path="menus" element={<MenusPage />} />
        </Routes>
      </Suspense>
    </div>
  )
}

export default Admin

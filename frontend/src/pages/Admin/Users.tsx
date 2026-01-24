import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import {
  UserGroupIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  ArrowPathIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline'
import api from '../../services/api'

interface AdminUser {
  id: string
  email: string
  username?: string | null
  firstName: string
  lastName: string
  role: 'STUDENT' | 'TEACHER' | 'ADMIN' | string
  isActive: boolean
  isVerified: boolean
  createdAt: string
  lastLogin?: string | null
  documentsCount?: number
  classroomsCount?: number
}

interface Pagination {
  page: number
  pages: number
  total: number
}

const Users: React.FC = () => {
  const { t, i18n } = useTranslation()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [messageTitle, setMessageTitle] = useState(t('usersManagement.default_message_title'))
  const [messageBody, setMessageBody] = useState('')

  const fetchUsers = async (params?: { page?: number; role?: string; status?: string; search?: string }) => {
    try {
      setLoading(true)
      const currentPage = params?.page ?? page
      const currentRole = params?.role ?? roleFilter
      const currentStatus = params?.status ?? statusFilter
      const currentSearch = params?.search ?? search

      const query: any = { page: currentPage, limit: 20 }
      if (currentRole !== 'all') query.role = currentRole
      if (currentStatus !== 'all') query.isActive = currentStatus === 'active'
      if (currentSearch.trim()) query.search = currentSearch.trim()

      const response = await api.get('/admin/users', { params: query })
      const data = response.data?.data || []
      setUsers(
        data.map((u: any) => ({
          id: u.id,
          email: u.email,
          username: u.username,
          firstName: u.firstName,
          lastName: u.lastName,
          role: u.role,
          isActive: u.isActive,
          isVerified: u.isVerified,
          createdAt: u.createdAt,
          lastLogin: u.lastLogin,
          documentsCount: u._count?.ownedDocuments ?? 0,
          classroomsCount: u._count?.classrooms ?? 0,
        }))
      )
      if (response.data?.pagination) {
        setPagination(response.data.pagination)
        setPage(response.data.pagination.page)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('usersManagement.load_error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchUsers({ page: 1 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleUpdateUser = async (id: string, updates: Partial<AdminUser>) => {
    try {
      setSaving(true)
      const user = users.find(u => u.id === id)
      if (!user) return

      const payload: any = {
        role: updates.role ?? user.role,
        isActive: updates.isActive ?? user.isActive,
        isVerified: updates.isVerified ?? user.isVerified,
      }

      const response = await api.put(`/admin/users/${id}`, payload)
      const updated = response.data?.data
      setUsers(prev =>
        prev.map(u =>
          u.id === id
            ? {
                ...u,
                role: updated.role,
                isActive: updated.isActive,
                isVerified: updated.isVerified,
              }
            : u
        )
      )
      toast.success(t('usersManagement.updated_success'))
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('usersManagement.action_error'))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUser = async (id: string) => {
    const user = users.find(u => u.id === id)
    if (!user) return
    const confirmed = window.confirm(
      t('usersManagement.confirm_delete', { name: `${user.firstName} ${user.lastName}` })
    )
    if (!confirmed) return

    try {
      setSaving(true)
      await api.delete(`/admin/users/${id}`)
      setUsers(prev => prev.filter(u => u.id !== id))
      toast.success(t('usersManagement.deleted_success'))
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('usersManagement.action_error'))
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = (user: AdminUser) => {
    void handleUpdateUser(user.id, { isActive: !user.isActive })
  }

  const handleApprove = (user: AdminUser) => {
    if (user.isVerified && user.isActive) return
    void handleUpdateUser(user.id, { isVerified: true, isActive: true })
  }

  const handleChangeRole = (user: AdminUser, role: string) => {
    void handleUpdateUser(user.id, { role })
  }

  const openMessageModal = (user: AdminUser) => {
    setSelectedUser(user)
    setMessageTitle(t('usersManagement.default_message_title'))
    setMessageBody('')
  }

  const closeMessageModal = () => {
    setSelectedUser(null)
    setMessageBody('')
  }

  const handleSendMessage = async () => {
    if (!selectedUser) return
    if (!messageBody.trim()) {
      toast.error(t('usersManagement.errors.empty_message'))
      return
    }

    try {
      setSaving(true)
      await api.post(`/admin/users/${selectedUser.id}/notify`, {
        title: messageTitle.trim() || t('usersManagement.default_message_title'),
        message: messageBody.trim(),
        type: 'admin',
      })
      toast.success(t('usersManagement.message_sent'))
      closeMessageModal()
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('usersManagement.action_error'))
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (value?: string | null) => {
    if (!value) return '—'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const handleSearchChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = e.target.value
    setSearch(value)
    void fetchUsers({ page: 1, search: value })
  }

  const handleRoleFilterChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const value = e.target.value
    setRoleFilter(value)
    void fetchUsers({ page: 1, role: value })
  }

  const handleStatusFilterChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const value = e.target.value
    setStatusFilter(value)
    void fetchUsers({ page: 1, status: value })
  }

  const goToPage = (newPage: number) => {
    if (!pagination) return
    if (newPage < 1 || newPage > pagination.pages) return
    void fetchUsers({ page: newPage })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserGroupIcon className="h-6 w-6 text-indigo-500" />
            {t('usersManagement.title')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t('usersManagement.desc')}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <button
            type="button"
            onClick={() => void fetchUsers({ page: 1 })}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-3.5 w-3.5" />
            {t('usersManagement.refresh')}
          </button>
          {pagination && (
            <span>
              {pagination.total} {t('usersManagement.users_label', { count: pagination.total })}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <div className="relative">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder={t('usersManagement.search_placeholder')}
              className="pl-7 pr-3 py-1.5 rounded-lg border border-gray-200 text-xs w-56 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-4 w-4 text-gray-400" />
              <select
              value={roleFilter}
              onChange={handleRoleFilterChange}
              className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">{t('usersManagement.filters.roles.all')}</option>
              <option value="STUDENT">{t('usersManagement.filters.roles.student')}</option>
              <option value="TEACHER">{t('usersManagement.filters.roles.teacher')}</option>
              <option value="ADMIN">{t('usersManagement.filters.roles.admin')}</option>
            </select>
              <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">{t('usersManagement.filters.status.all')}</option>
              <option value="active">{t('usersManagement.filters.status.active')}</option>
              <option value="inactive">{t('usersManagement.filters.status.inactive')}</option>
            </select>
          </div>
        </div>
        {saving && <p className="text-xs text-gray-400">{t('usersManagement.saving')}</p>}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left font-medium">{t('usersManagement.table.user')}</th>
                <th className="px-3 py-2 text-left font-medium">{t('usersManagement.table.role')}</th>
                <th className="px-3 py-2 text-left font-medium">{t('usersManagement.table.status')}</th>
                <th className="px-3 py-2 text-left font-medium">{t('usersManagement.table.created_at')}</th>
                <th className="px-3 py-2 text-left font-medium">{t('usersManagement.table.last_login')}</th>
                <th className="px-3 py-2 text-left font-medium">{t('usersManagement.table.activity')}</th>
                <th className="px-3 py-2 text-right font-medium">{t('usersManagement.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-3 py-4 text-center text-gray-400">
                    {t('usersManagement.loading')}
                  </td>
                </tr>
              )}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-4 text-center text-gray-400">
                    {t('usersManagement.empty')}
                  </td>
                </tr>
              )}
              {!loading && users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 align-top">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-indigo-500/10 flex items-center justify-center text-[11px] font-semibold text-indigo-600">
                        {u.firstName?.[0]}
                        {u.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {u.firstName} {u.lastName}
                        </p>
                        <p className="text-[11px] text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <select
                      value={u.role}
                      onChange={(e) => handleChangeRole(u, e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="STUDENT">{t('usersManagement.filters.roles.student')}</option>
                      <option value="TEACHER">{t('usersManagement.filters.roles.teacher')}</option>
                      <option value="ADMIN">{t('usersManagement.filters.roles.admin')}</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {u.isActive ? t('usersManagement.status.active') : t('usersManagement.status.inactive')}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          u.isVerified
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'bg-yellow-50 text-yellow-700'
                        }`}
                      >
                        {u.isVerified ? t('usersManagement.status.verified') : t('usersManagement.status.to_approve')}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 align-top text-gray-600">{formatDate(u.createdAt)}</td>
                  <td className="px-3 py-2 align-top text-gray-600">{formatDate(u.lastLogin)}</td>
                  <td className="px-3 py-2 align-top text-gray-600">
                    <p>{u.documentsCount ?? 0} {t('usersManagement.activity.documents')}</p>
                    <p>{u.classroomsCount ?? 0} {t('usersManagement.activity.classes')}</p>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openMessageModal(u)}
                        className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                        title={t('usersManagement.actions.send_message')}
                      >
                        <EnvelopeIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(u)}
                        className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100"
                        title={u.isActive ? t('usersManagement.actions.deactivate') : t('usersManagement.actions.activate')}
                      >
                        {u.isActive ? (
                          <XCircleIcon className="h-4 w-4" />
                        ) : (
                          <CheckCircleIcon className="h-4 w-4" />
                        )}
                      </button>
                      {!u.isVerified && (
                        <button
                          type="button"
                          onClick={() => handleApprove(u)}
                          className="inline-flex items-center justify-center h-7 px-2 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-medium hover:bg-emerald-100"
                        >
                          {t('usersManagement.actions.approve')}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u.id)}
                        className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-red-200 text-red-500 hover:bg-red-50"
                        title={t('usersManagement.actions.delete')}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-3 py-2 text-[11px] text-gray-500 bg-gray-50 border-t border-gray-200">
              <span>
              {t('usersManagement.pagination.page')} {pagination.page} / {pagination.pages}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-2 py-1 rounded-lg border border-gray-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                {t('usersManagement.pagination.prev')}
              </button>
              <button
                type="button"
                onClick={() => goToPage(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="px-2 py-1 rounded-lg border border-gray-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                {t('usersManagement.pagination.next')}
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-200 p-4"
          >
            <h2 className="text-sm font-semibold text-gray-900 mb-1">
              {t('usersManagement.modal.title')}
            </h2>
            <p className="text-xs text-gray-500 mb-3">
              {t('usersManagement.modal.to')} {selectedUser.firstName} {selectedUser.lastName} ({selectedUser.email})
            </p>
            <div className="space-y-2 mb-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">{t('usersManagement.modal.title_label')}</label>
                <input
                  type="text"
                  value={messageTitle}
                  onChange={(e) => setMessageTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">{t('usersManagement.modal.body_label')}</label>
                <textarea
                  rows={4}
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  placeholder={t('usersManagement.modal.body_placeholder')}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={closeMessageModal}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50"
              >
                {t('usersManagement.actions.cancel')}
              </button>
              <button
                type="button"
                onClick={() => void handleSendMessage()}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('usersManagement.actions.send')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default Users

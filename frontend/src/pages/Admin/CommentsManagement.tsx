import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import api from '../../services/api'

type CommentStatus = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'

interface Comment {
  id: string
  content: string
  authorName: string
  authorEmail?: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  updatedAt: string
  article: {
    id: string
    title: string
    slug: string
  }
}

interface Stats {
  total: number
  pending: number
  approved: number
  rejected: number
}

const CommentsManagement: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<CommentStatus>('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  })
  const { t, i18n } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')

  const fetchComments = async () => {
    try {
      setLoading(true)
      
      // Fetch based on active tab
      let endpoint = '/article-comments/all'
      const params: any = { page, limit: 20 }
      
      if (activeTab !== 'ALL') {
        params.status = activeTab
      }
      
      if (searchTerm.trim()) {
        params.search = searchTerm.trim()
      }

      const response = await api.get(endpoint, { params })
      setComments(response.data?.data || [])
      setTotalPages(response.data?.pagination?.pages || 1)
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('commentsManagement.load_error'))
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/article-comments/stats')
      setStats(response.data?.data || { total: 0, pending: 0, approved: 0, rejected: 0 })
    } catch {
      // Silencieux
    }
  }

  useEffect(() => {
    void fetchStats()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [activeTab, searchTerm])

  useEffect(() => {
    void fetchComments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, activeTab, searchTerm])

  const handleApprove = async (id: string) => {
    try {
      setProcessing(id)
      await api.put(`/article-comments/${id}/approve`)
      toast.success(t('commentsManagement.approved_success'))
      void fetchComments()
      void fetchStats()
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('commentsManagement.action_error'))
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (id: string) => {
    try {
      setProcessing(id)
      await api.put(`/article-comments/${id}/reject`)
      toast.success(t('commentsManagement.rejected_success'))
      void fetchComments()
      void fetchStats()
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('commentsManagement.action_error'))
    } finally {
      setProcessing(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('commentsManagement.confirm_delete'))) return

    try {
      setProcessing(id)
      await api.delete(`/article-comments/${id}`)
      toast.success(t('commentsManagement.deleted_success'))
      void fetchComments()
      void fetchStats()
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('commentsManagement.action_error'))
    } finally {
      setProcessing(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    }
    return badges[status as keyof typeof badges] || 'bg-slate-100 text-slate-700'
  }

  const tabs: Array<{ key: CommentStatus; label: string; count?: number }> = [
    { key: 'ALL', label: t('commentsManagement.tabs.all'), count: stats.total },
    { key: 'PENDING', label: t('commentsManagement.tabs.pending'), count: stats.pending },
    { key: 'APPROVED', label: t('commentsManagement.tabs.approved'), count: stats.approved },
    { key: 'REJECTED', label: t('commentsManagement.tabs.rejected'), count: stats.rejected },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          {t('commentsManagement.title')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('commentsManagement.desc')}
        </p>
      </div>

      {/* Stats rapides */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{t('commentsManagement.stats.total')}</div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.pending}</div>
          <div className="text-xs text-amber-600 dark:text-amber-500">{t('commentsManagement.stats.pending')}</div>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900/30 dark:bg-green-950/20">
          <div className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.approved}</div>
          <div className="text-xs text-green-600 dark:text-green-500">{t('commentsManagement.stats.approved')}</div>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-950/20">
          <div className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.rejected}</div>
          <div className="text-xs text-red-600 dark:text-red-500">{t('commentsManagement.stats.rejected')}</div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              {tab.label} {tab.count !== undefined && `(${tab.count})`}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('commentsManagement.search_placeholder')}
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      {/* Liste des commentaires */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
          {t('commentsManagement.loading')}
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
          {t('commentsManagement.empty')}
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="mb-3 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2 text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {comment.authorName}
                    </span>
                    {comment.authorEmail && (
                      <>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500 dark:text-slate-400">{comment.authorEmail}</span>
                      </>
                    )}
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {new Date(comment.createdAt).toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'fr-FR')}
                    </span>
                  </div>
                  <p className="mb-2 text-xs text-slate-600 dark:text-slate-400">
                    Article:{' '}
                    <a
                      href={`/articles/${comment.article.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      {comment.article.title}
                    </a>
                  </p>
                </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusBadge(comment.status)}`}
                  >
                    {comment.status === 'PENDING' && t('commentsManagement.status.pending')}
                    {comment.status === 'APPROVED' && t('commentsManagement.status.approved')}
                    {comment.status === 'REJECTED' && t('commentsManagement.status.rejected')}
                  </span>
              </div>

              <div className="mb-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-800 dark:bg-slate-900 dark:text-slate-100">
                {comment.content}
              </div>

              <div className="flex gap-2">
                {comment.status !== 'APPROVED' && (
                  <button
                    type="button"
                    onClick={() => handleApprove(comment.id)}
                    disabled={processing === comment.id}
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {processing === comment.id ? '...' : t('commentsManagement.actions.approve')}
                  </button>
                )}
                {comment.status !== 'REJECTED' && (
                  <button
                    type="button"
                    onClick={() => handleReject(comment.id)}
                    disabled={processing === comment.id}
                    className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    {processing === comment.id ? '...' : t('commentsManagement.actions.reject')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(comment.id)}
                  disabled={processing === comment.id}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-red-950/20"
                >
                  {processing === comment.id ? '...' : t('commentsManagement.actions.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            {t('commentsManagement.pagination.prev')}
          </button>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {t('commentsManagement.pagination.page')} {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            {t('commentsManagement.pagination.next')}
          </button>
        </div>
      )}
    </div>
  )
}

export default CommentsManagement

import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import { useTranslation } from 'react-i18next'

interface ArticleItem {
  id: string
  title: string
  slug: string
  status: string
  visibility: string
  createdAt: string
  publishedAt?: string | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

interface ArticleCategoryOption {
  id: string
  name: string
}

interface ArticleTagOption {
  id: string
  name: string
}

const ArticlesDashboardList: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [articles, setArticles] = useState<ArticleItem[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('ALL')
  const [categories, setCategories] = useState<ArticleCategoryOption[]>([])
  const [tags, setTags] = useState<ArticleTagOption[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedTagId, setSelectedTagId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const canManage = user && (user.role === 'TEACHER' || user.role === 'ADMIN')

  const page = parseInt(searchParams.get('page') || '1', 10)

  const fetchArticles = async (pageParam: number) => {
    if (!canManage) return
    try {
      setLoading(true)
      const response = await api.get('/articles', {
        params: {
          page: pageParam,
          limit: 10,
          mine: true,
          status: filterStatus === 'ALL' ? undefined : filterStatus,
          categoryId: selectedCategoryId || undefined,
          tagId: selectedTagId || undefined,
          search: debouncedSearch || undefined,
        },
      })
      setArticles(response.data?.data || [])
      if (response.data?.pagination) {
        setPagination(response.data.pagination)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('articles.list.load_error'))
    } finally {
      setLoading(false)
    }
  }

  const fetchMeta = async () => {
    try {
      const [catRes, tagRes] = await Promise.all([
        api.get('/article-meta/categories'),
        api.get('/article-meta/tags'),
      ])
      setCategories(catRes.data?.data || [])
      setTags(tagRes.data?.data || [])
    } catch {
      // silencieux, la page reste fonctionnelle sans meta
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350)
    return () => window.clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    if (canManage) {
      void fetchMeta()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage])

  useEffect(() => {
    if (!canManage) return
    void fetchArticles(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, canManage, filterStatus, selectedCategoryId, selectedTagId, debouncedSearch])

  const goToPage = (newPage: number) => {
    if (!pagination) return
    if (newPage < 1 || newPage > pagination.pages) return
    setSearchParams({ page: String(newPage) })
  }

  const onChangeFilterStatus = (status: 'ALL' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') => {
    setFilterStatus(status)
  }

  const updateStatus = async (id: string, status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') => {
    try {
      await api.put(`/articles/${id}`, { status })
      toast.success(t('articles.list.status_updated'))
      void fetchArticles(page)
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('articles.list.status_update_error'))
    }
  }

  const hasActiveFilters = useMemo(
    () => !!searchTerm || !!selectedCategoryId || !!selectedTagId || filterStatus !== 'ALL',
    [searchTerm, selectedCategoryId, selectedTagId, filterStatus]
  )

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedCategoryId('')
    setSelectedTagId('')
    setFilterStatus('ALL')
  }

  const deleteArticle = async (id: string) => {
    if (!window.confirm(t('articles.list.confirm_delete'))) return
    try {
      await api.delete(`/articles/${id}`)
      toast.success(t('articles.list.deleted'))
      void fetchArticles(page)
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('articles.list.delete_error'))
    }
  }

  if (!canManage) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{t('articles.list.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('articles.list.access_notice')}
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 shadow-sm dark:bg-indigo-500/10 dark:text-indigo-300">
            <span className="text-sm font-semibold">Aa</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{t('articles.list.title')}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('articles.list.desc')}</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={() => navigate('/dashboard/articles/new')}
          className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          {t('articles.list.new_draft')}
        </motion.button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
        <div className="space-y-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('articles.list.your_articles')}</h2>
            <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-0.5 text-[11px] dark:border-slate-700 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => onChangeFilterStatus('ALL')}
                className={`px-3 py-0.5 rounded-full ${
                  filterStatus === 'ALL'
                    ? 'bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                    : 'text-slate-500'
                }`}
              >
                {t('articles.list.filter.all')}
              </button>
              <button
                type="button"
                onClick={() => onChangeFilterStatus('DRAFT')}
                className={`px-3 py-0.5 rounded-full ${
                  filterStatus === 'DRAFT'
                    ? 'bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                    : 'text-slate-500'
                }`}
              >
                {t('articles.list.filter.drafts')}
              </button>
              <button
                type="button"
                onClick={() => onChangeFilterStatus('PUBLISHED')}
                className={`px-3 py-0.5 rounded-full ${
                  filterStatus === 'PUBLISHED'
                    ? 'bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                    : 'text-slate-500'
                }`}
              >
                {t('articles.list.filter.published')}
              </button>
              <button
                type="button"
                onClick={() => onChangeFilterStatus('ARCHIVED')}
                className={`px-3 py-0.5 rounded-full ${
                  filterStatus === 'ARCHIVED'
                    ? 'bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                    : 'text-slate-500'
                }`}
              >
                {t('articles.list.filter.archived')}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-[11px] md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('articles.list.search_placeholder')}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="whitespace-nowrap rounded-lg border border-slate-200 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  {t('articles.list.reset')}
                </button>
              )}
            </div>

            <div className="flex flex-1 flex-wrap gap-2 md:justify-end">
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="min-w-[140px] rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">{t('articles.list.all_categories')}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedTagId}
                onChange={(e) => setSelectedTagId(e.target.value)}
                className="min-w-[140px] rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">{t('articles.list.all_tags')}</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading && (
          <div className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400">{t('articles.list.loading')}</div>
        )}

        {!loading && articles.length === 0 && (
          <div className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400">{t('articles.list.empty')}</div>
        )}

        {!loading && articles.length > 0 && (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {articles.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{a.title}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-500">
                    <span
                      className={
                        a.status === 'PUBLISHED'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : a.status === 'ARCHIVED'
                            ? 'text-slate-500 dark:text-slate-400'
                            : 'text-amber-600 dark:text-amber-400'
                      }
                    >
                        {a.status === 'PUBLISHED' ? t('articles.status.published') : a.status === 'ARCHIVED' ? t('articles.status.archived') : t('articles.status.draft')}
                    </span>
                    {' • '}
                    <span>
                        {a.visibility === 'PUBLIC' && t('articles.visibility.public')}
                        {a.visibility === 'LOGGED_IN' && t('articles.visibility.logged_in')}
                        {a.visibility === 'CLASS_ONLY' && t('articles.visibility.class_only')}
                    </span>
                    {' • '}
                    {new Date(a.publishedAt || a.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  {a.status === 'PUBLISHED' && (
                    <a
                      href={`/articles/${a.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-slate-200 px-2 py-1 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
                    >
                        {t('articles.list.view')}
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate(`/dashboard/articles/${a.slug}/edit`)}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
                  >
                      {t('articles.list.edit')}
                  </button>
                  <select
                    value={a.status}
                    onChange={(e) => void updateStatus(a.id, e.target.value as any)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                      title={t('articles.list.change_status')}
                  >
                      <option value="DRAFT">{t('articles.status.draft')}</option>
                      <option value="PUBLISHED">{t('articles.status.published')}</option>
                      <option value="ARCHIVED">{t('articles.status.archived')}</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => void deleteArticle(a.id)}
                    className="rounded-lg border border-red-200 px-2 py-1 text-red-600 hover:bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                      {t('articles.list.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <span>
              Page {pagination.page} / {pagination.pages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="rounded-full border border-slate-200 px-3 py-1 disabled:opacity-40 dark:border-slate-700"
              >
                {t('articles.list.prev')}
              </button>
              <button
                type="button"
                onClick={() => goToPage(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="rounded-full border border-slate-200 px-3 py-1 disabled:opacity-40 dark:border-slate-700"
              >
                {t('articles.list.next')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ArticlesDashboardList

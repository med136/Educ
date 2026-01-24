import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../../services/api'
import { useTranslation } from 'react-i18next'

interface ArticleListItem {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  coverImage?: string | null
  status: string
  visibility: string
  publishedAt?: string | null
  createdAt: string
  author?: {
    id: string
    firstName: string
    lastName: string
  } | null
  category?: {
    id: string
    name: string
    slug: string
  } | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

const ArticlesList: React.FC = () => {
  const { t } = useTranslation();
  const [articles, setArticles] = useState<ArticleListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()

  const page = parseInt(searchParams.get('page') || '1', 10)

  const fetchArticles = async (pageParam: number) => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/articles', {
        params: {
          page: pageParam,
          limit: 9,
          status: 'PUBLISHED',
          visibility: 'PUBLIC',
        },
      })
      setArticles(response.data?.data || [])
      if (response.data?.pagination) {
        setPagination(response.data.pagination)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des articles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchArticles(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const goToPage = (newPage: number) => {
    if (!pagination) return
    if (newPage < 1 || newPage > pagination.pages) return
    setSearchParams({ page: String(newPage) })
  }

  return (
    <div className="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <section className="border-b border-slate-200/80 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            {t('articles.title', 'Articles & ressources')}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            {t('articles.desc', "Découvrez des retours d'expérience, des bonnes pratiques et des ressources autour de la collaboration pédagogique et du numérique éducatif.")}
          </p>
        </div>
      </section>

      <section className="bg-slate-50 dark:bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          {loading && (
            <p className="text-sm text-slate-500 dark:text-slate-400">Chargement des articles...</p>
          )}
          {error && !loading && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          {!loading && !error && articles.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Aucun article publié pour le moment.
            </p>
          )}

          {!loading && !error && articles.length > 0 && (
            <div className="grid gap-4 md:grid-cols-3">
              {articles.map((article) => (
                <article
                  key={article.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-900"
                >
                  {article.coverImage && (
                    <Link
                      to={`/articles/${article.slug}`}
                      className="mb-3 block overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800"
                    >
                      <img
                        src={article.coverImage}
                        alt={article.title}
                        className="h-32 w-full object-cover"
                        loading="lazy"
                      />
                    </Link>
                  )}
                  <p className="text-[11px] uppercase tracking-wide text-indigo-500 mb-1">
                    {article.category?.name || 'Ressource'}
                  </p>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 line-clamp-2">
                    <Link to={`/articles/${article.slug}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                      {article.title}
                    </Link>
                  </h2>
                  {article.excerpt && (
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 line-clamp-3">
                      {article.excerpt}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>
                      {article.author
                        ? `${article.author.firstName} ${article.author.lastName}`
                        : 'Auteur inconnu'}
                    </span>
                    <span>
                      {article.publishedAt
                        ? new Date(article.publishedAt).toLocaleDateString('fr-FR')
                        : new Date(article.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}

          {pagination && pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>
                Page {pagination.page} / {pagination.pages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => goToPage(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1.5 rounded-full border border-slate-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                >
                  Précédent
                </button>
                <button
                  type="button"
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="px-3 py-1.5 rounded-full border border-slate-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default ArticlesList

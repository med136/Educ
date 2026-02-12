import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useSettings } from '../../context/SettingsContext'
import { useTranslation } from 'react-i18next'

interface ArticleDetailData {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  content: string
  status: string
  visibility: string
  coverImage?: string | null
  readingTime?: number | null
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

interface ArticleComment {
  id: string
  content: string
  authorName: string
  createdAt: string
}

const ArticleDetail: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { slug } = useParams<{ slug: string }>()
  const { settings, loading: settingsLoading } = useSettings()
  const [article, setArticle] = useState<ArticleDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [comments, setComments] = useState<ArticleComment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentForm, setCommentForm] = useState({ authorName: '', authorEmail: '', content: '' })
  const [submitting, setSubmitting] = useState(false)

  const commentsEnabled = settings?.general?.enableComments ?? true

  const isHtmlContent = useMemo(() => {
    if (!article?.content) return false
    return /<\s*(p|h1|h2|h3|ul|ol|li|strong|em|a|div)[^>]*>/i.test(article.content)
  }, [article?.content])

  const formatDate = (dateValue?: string | null) => {
    if (!dateValue) return ''
    try {
      return new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(dateValue))
    } catch {
      return new Date(dateValue).toLocaleDateString()
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success(t('article.link_copied', 'Lien copié'))
    } catch {
      toast.error(t('article.copy_error', 'Impossible de copier'))
    }
  }

  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) return
      try {
        setLoading(true)
        setError(null)
        const response = await api.get(`/articles/${slug}`)
        setArticle(response.data?.data)
      } catch (err: any) {
        if (err.response?.status === 404) {
          setArticle(null)
          setError(t('article.not_found', 'Article introuvable'))
          return
        }
        setError(err.response?.data?.message || t('article.load_error', "Erreur lors du chargement de l'article"))
      } finally {
        setLoading(false)
      }
    }

    void fetchArticle()
  }, [slug, t])

  useEffect(() => {
    const fetchComments = async () => {
      if (!article?.id || !commentsEnabled) return
      try {
        setLoadingComments(true)
        const response = await api.get('/article-comments', { params: { articleId: article.id } })
        setComments(response.data?.data || [])
      } catch {
        // Silencieux pour les commentaires
      } finally {
        setLoadingComments(false)
      }
    }

    void fetchComments()
  }, [article?.id, commentsEnabled])

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!article?.id) return
    if (!commentsEnabled) {
      toast.error(t('article.comments_disabled', 'Les commentaires sont désactivés pour le moment'))
      return
    }
    if (!commentForm.authorName.trim() || !commentForm.content.trim()) {
      toast.error(t('article.comments_required', 'Nom et commentaire requis'))
      return
    }

    try {
      setSubmitting(true)
      await api.post('/article-comments', {
        articleId: article.id,
        authorName: commentForm.authorName.trim(),
        authorEmail: commentForm.authorEmail.trim() || undefined,
        content: commentForm.content.trim(),
      })
      toast.success(t('article.comment_submitted', 'Commentaire soumis ! Il sera publié après modération.'))
      setCommentForm({ authorName: '', authorEmail: '', content: '' })
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('article.submit_error', 'Erreur lors de la soumission'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 min-h-screen">
      <section className="border-b border-slate-200/80 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div>
            <Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400">
              {t('nav.home', 'Accueil')}
            </Link>
            <span className="mx-1">/</span>
            <Link to="/articles" className="hover:text-indigo-600 dark:hover:text-indigo-400">
              {t('articles.breadcrumb', 'Articles')}
            </Link>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              {t('article.copy_link', 'Copier le lien')}
            </button>
          </div>
          {loading && <p className="text-sm text-slate-500">{t('article.loading', "Chargement de l'article...")}</p>}
          {error && !loading && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-red-500">{error}</p>
              <Link
                to="/articles"
                className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                {t('article.back_to_articles', 'Retour aux articles')}
              </Link>
            </div>
          )}
          {!loading && !error && article && (
            <>
              <p className="text-[11px] uppercase tracking-wide text-indigo-500 mb-1">
                {article.category?.name || t('article.resource', 'Ressource')}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                {article.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                {article.author && (
                  <span>
                    {article.author.firstName} {article.author.lastName}
                  </span>
                )}
                <span>•</span>
                <span>
                  {formatDate(article.publishedAt || article.createdAt)}
                </span>
                {article.readingTime && (
                  <>
                    <span>•</span>
                    <span>{t('article.reading_time', { minutes: article.readingTime, defaultValue: '{{minutes}} min de lecture' })}</span>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {!loading && !error && article && (
        <section className="bg-slate-50 dark:bg-slate-950">
          <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
            <div className="grid gap-8 lg:grid-cols-12">
              <div className="lg:col-span-8">
                {article.coverImage && (
                  <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="aspect-[16/9] w-full">
                      <img
                        src={article.coverImage}
                        alt={article.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                )}
                {article.excerpt && (
                  <p className="mb-6 text-sm sm:text-base font-medium text-slate-700 dark:text-slate-200">
                    {article.excerpt}
                  </p>
                )}
                <div className="article-content">
                  {isHtmlContent ? (
                    <div className="article-content" dangerouslySetInnerHTML={{ __html: article.content }} />
                  ) : (
                    article.content.split('\n').map((para, index) => <p key={index}>{para}</p>)
                  )}
                </div>
              </div>

              <aside className="lg:col-span-4">
                <div className="sticky top-24 space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {article.author
                        ? `${article.author.firstName} ${article.author.lastName}`
                        : t('article.unknown_author', 'Auteur inconnu')}
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-200">
                      <div>{formatDate(article.publishedAt || article.createdAt)}</div>
                      {article.readingTime ? (
                        <div>
                          {t('article.reading_time', { minutes: article.readingTime, defaultValue: '{{minutes}} min de lecture' })}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <Link
                    to="/articles"
                    className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    {t('article.back_to_articles', 'Retour aux articles')}
                  </Link>
                </div>
              </aside>
            </div>
          </div>
        </section>
      )}

      {!loading && !error && article && (
        <section className="bg-white dark:bg-slate-900">
          <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-50">
              {t('article.comments_title', 'Commentaires')} ({comments.length})
            </h2>

            {settingsLoading ? (
              <p className="text-sm text-slate-500">{t('article.settings_loading', 'Chargement des paramètres...')}</p>
            ) : !commentsEnabled ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
                {t('article.comments_disabled', 'Les commentaires sont désactivés pour le moment')}
              </div>
            ) : loadingComments ? (
              <p className="text-sm text-slate-500">{t('article.comments_loading', 'Chargement des commentaires...')}</p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t('article.no_comments', 'Aucun commentaire pour le moment. Soyez le premier à commenter !')}
              </p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <div className="mb-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {comment.authorName}
                      </span>
                      <span>•</span>
                      <span>{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="text-sm text-slate-800 dark:text-slate-100">{comment.content}</p>
                  </div>
                ))}
              </div>
            )}

            {commentsEnabled && (
              <div className="mt-8">
                <h3 className="mb-3 text-base font-medium text-slate-900 dark:text-slate-50">
                  {t('article.add_comment', 'Ajouter un commentaire')}
                </h3>
                <form onSubmit={handleSubmitComment} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                    {t('article.name', 'Nom')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={commentForm.authorName}
                    onChange={(e) => setCommentForm((prev) => ({ ...prev, authorName: e.target.value }))}
                    placeholder={t('article.name_placeholder', 'Votre nom')}
                    required
                    maxLength={100}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                    {t('article.email', 'Email (optionnel)')}
                  </label>
                  <input
                    type="email"
                    value={commentForm.authorEmail}
                    onChange={(e) => setCommentForm((prev) => ({ ...prev, authorEmail: e.target.value }))}
                    placeholder={t('article.email_placeholder', 'votre@email.com')}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                    {t('article.comment', 'Commentaire')} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={commentForm.content}
                    onChange={(e) => setCommentForm((prev) => ({ ...prev, content: e.target.value }))}
                    placeholder={t('article.comment_placeholder', 'Votre commentaire...')}
                    required
                    maxLength={1000}
                    rows={4}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {t('article.characters_count', { count: commentForm.content.length, max: 1000, defaultValue: '{{count}} / {{max}} caractères' })}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? t('article.sending', 'Envoi...') : t('article.submit', 'Envoyer')}
                </button>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('article.moderation_note', 'Votre commentaire sera publié après modération par notre équipe.')}
                </p>
              </form>
            </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

export default ArticleDetail

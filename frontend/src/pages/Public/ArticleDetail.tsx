import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
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
  useTranslation()
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { settings, loading: settingsLoading } = useSettings()
  const [article, setArticle] = useState<ArticleDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [comments, setComments] = useState<ArticleComment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentForm, setCommentForm] = useState({ authorName: '', authorEmail: '', content: '' })
  const [submitting, setSubmitting] = useState(false)

  const isHtmlContent = useMemo(() => {
    if (!article?.content) return false
    return /<\s*(p|h1|h2|h3|ul|ol|li|strong|em|a|div)[^>]*>/i.test(article.content)
  }, [article?.content])

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
          navigate('/articles', { replace: true })
          return
        }
        setError(err.response?.data?.message || "Erreur lors du chargement de l'article")
      } finally {
        setLoading(false)
      }
    }

    void fetchArticle()
  }, [slug, navigate])

  useEffect(() => {
    const fetchComments = async () => {
      const commentsEnabled = settings?.general?.enableComments ?? true
      if (!article?.id || !commentsEnabled) {
        console.log('Comments fetch skipped. Article ID:', article?.id, 'Enable comments:', commentsEnabled)
        return
      }
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
  }, [article?.id, settings?.general?.enableComments])

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!article?.id) return
    if (!(settings?.general?.enableComments ?? true)) {
      toast.error('Les commentaires sont désactivés pour le moment')
      return
    }
    if (!commentForm.authorName.trim() || !commentForm.content.trim()) {
      toast.error('Nom et commentaire requis')
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
      toast.success('Commentaire soumis ! Il sera publié après modération.')
      setCommentForm({ authorName: '', authorEmail: '', content: '' })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la soumission')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 min-h-screen">
      <section className="border-b border-slate-200/80 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <div className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            <Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400">
              Accueil
            </Link>
            <span className="mx-1">/</span>
            <Link to="/articles" className="hover:text-indigo-600 dark:hover:text-indigo-400">
              Articles
            </Link>
          </div>
          {loading && <p className="text-sm text-slate-500">Chargement de l&apos;article...</p>}
          {error && !loading && <p className="text-sm text-red-500">{error}</p>}
          {!loading && !error && article && (
            <>
              <p className="text-[11px] uppercase tracking-wide text-indigo-500 mb-1">
                {article.category?.name || 'Ressource'}
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
                  {article.publishedAt
                    ? new Date(article.publishedAt).toLocaleDateString('fr-FR')
                    : new Date(article.createdAt).toLocaleDateString('fr-FR')}
                </span>
                {article.readingTime && (
                  <>
                    <span>•</span>
                    <span>{article.readingTime} min de lecture</span>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {!loading && !error && article && (
        <section className="bg-slate-50 dark:bg-slate-950">
          <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
            {article.coverImage && (
              <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="h-56 w-full object-cover"
                />
              </div>
            )}
            {article.excerpt && (
              <p className="mb-4 text-sm font-medium text-slate-700 dark:text-slate-200">
                {article.excerpt}
              </p>
            )}
            <div className="prose prose-sm max-w-none text-slate-800 prose-headings:text-slate-900 prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline dark:prose-invert dark:text-slate-100">
              {isHtmlContent ? (
                <div dangerouslySetInnerHTML={{ __html: article.content }} />
              ) : (
                article.content.split('\n').map((para, index) => (
                  <p key={index}>{para}</p>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {!loading && !error && article && (
        <section className="bg-white dark:bg-slate-900">
          <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-50">
              Commentaires ({comments.length})
            </h2>

            {settingsLoading ? (
              <p className="text-sm text-slate-500">Chargement des paramètres...</p>
            ) : !(settings?.general?.enableComments ?? true) ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
                Les commentaires sont désactivés actuellement.
              </div>
            ) : loadingComments ? (
              <p className="text-sm text-slate-500">Chargement des commentaires...</p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Aucun commentaire pour le moment. Soyez le premier à commenter !
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
                      <span>{new Date(comment.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <p className="text-sm text-slate-800 dark:text-slate-100">{comment.content}</p>
                  </div>
                ))}
              </div>
            )}

            {settings.general.enableComments && (
              <div className="mt-8">
                <h3 className="mb-3 text-base font-medium text-slate-900 dark:text-slate-50">
                  Laisser un commentaire
                </h3>
                <form onSubmit={handleSubmitComment} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={commentForm.authorName}
                    onChange={(e) => setCommentForm((prev) => ({ ...prev, authorName: e.target.value }))}
                    placeholder="Votre nom"
                    required
                    maxLength={100}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                    Email (optionnel)
                  </label>
                  <input
                    type="email"
                    value={commentForm.authorEmail}
                    onChange={(e) => setCommentForm((prev) => ({ ...prev, authorEmail: e.target.value }))}
                    placeholder="votre@email.com"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                    Commentaire <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={commentForm.content}
                    onChange={(e) => setCommentForm((prev) => ({ ...prev, content: e.target.value }))}
                    placeholder="Votre commentaire..."
                    required
                    maxLength={1000}
                    rows={4}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {commentForm.content.length} / 1000 caractères
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Envoi...' : 'Envoyer le commentaire'}
                </button>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Votre commentaire sera publié après modération par notre équipe.
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

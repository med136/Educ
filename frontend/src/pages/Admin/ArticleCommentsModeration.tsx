import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../../services/api'

interface PendingComment {
  id: string
  content: string
  authorName: string
  authorEmail?: string | null
  createdAt: string
  article: {
    id: string
    title: string
    slug: string
  }
}

const ArticleCommentsModeration: React.FC = () => {
  const [comments, setComments] = useState<PendingComment[]>([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchPendingComments = async () => {
    try {
      setLoading(true)
      const response = await api.get('/article-comments/pending', { params: { page, limit: 20 } })
      setComments(response.data?.data || [])
      setTotalPages(response.data?.pagination?.pages || 1)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchPendingComments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const handleApprove = async (id: string) => {
    try {
      setProcessing(id)
      await api.put(`/article-comments/${id}/approve`)
      toast.success('Commentaire approuvé')
      setComments((prev) => prev.filter((c) => c.id !== id))
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (id: string) => {
    try {
      setProcessing(id)
      await api.put(`/article-comments/${id}/reject`)
      toast.success('Commentaire rejeté')
      setComments((prev) => prev.filter((c) => c.id !== id))
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally {
      setProcessing(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer définitivement ce commentaire ?')) return

    try {
      setProcessing(id)
      await api.delete(`/article-comments/${id}`)
      toast.success('Commentaire supprimé')
      setComments((prev) => prev.filter((c) => c.id !== id))
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Modération des commentaires
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Approuvez ou rejetez les commentaires en attente
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
          Chargement...
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
          Aucun commentaire en attente
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
                  <div className="mb-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {comment.authorName}
                    </span>
                    {comment.authorEmail && (
                      <>
                        <span>•</span>
                        <span>{comment.authorEmail}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{new Date(comment.createdAt).toLocaleString('fr-FR')}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
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
              </div>

              <div className="mb-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-800 dark:bg-slate-900 dark:text-slate-100">
                {comment.content}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleApprove(comment.id)}
                  disabled={processing === comment.id}
                  className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {processing === comment.id ? '...' : 'Approuver'}
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(comment.id)}
                  disabled={processing === comment.id}
                  className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {processing === comment.id ? '...' : 'Rejeter'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(comment.id)}
                  disabled={processing === comment.id}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-red-950/20"
                >
                  {processing === comment.id ? '...' : 'Supprimer'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            Précédent
          </button>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  )
}

export default ArticleCommentsModeration

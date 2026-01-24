import React, { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../../services/api'

interface ClassroomDetailData {
  id: string
  name: string
  subject?: string | null
  description?: string | null
  code: string
  creator?: {
    id: string
    firstName: string
    lastName: string
  } | null
  _count?: {
    students: number
    documents: number
    messages: number
  }
}

interface ArticleItem {
  id: string
  title: string
  slug: string
  status: string
  visibility: string
  createdAt: string
  publishedAt?: string | null
}

const ClassroomDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [classroom, setClassroom] = useState<ClassroomDetailData | null>(null)
  const [articles, setArticles] = useState<ArticleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingArticles, setLoadingArticles] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      try {
        setLoading(true)
        const [clsRes, artRes] = await Promise.all([
          api.get(`/classrooms/${id}`),
          api.get('/articles', {
            params: {
              classroomId: id,
              status: 'PUBLISHED',
            },
          }),
        ])
        setClassroom(clsRes.data?.data)
        setArticles(artRes.data?.data || [])
      } catch (error: any) {
        if (error.response?.status === 404) {
          toast.error('Classe introuvable')
          navigate('/dashboard/classrooms', { replace: true })
        } else {
          toast.error(error.response?.data?.message || 'Erreur lors du chargement de la classe')
        }
      } finally {
        setLoading(false)
        setLoadingArticles(false)
      }
    }

    setLoadingArticles(true)
    void load()
  }, [id, navigate])

  if (loading && !classroom) {
    return <p className="text-sm text-slate-500">Chargement de la classe...</p>
  }

  if (!classroom) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">Classe</p>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{classroom.name}</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {classroom.subject || 'Classe'} • Code d&apos;invitation : <span className="font-mono">{classroom.code}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/dashboard/classrooms')}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
        >
          Retour aux classes
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Informations
          </p>
          {classroom.description && (
            <p className="mt-2 text-slate-600 dark:text-slate-300">{classroom.description}</p>
          )}
          <dl className="mt-3 space-y-1 text-slate-500 dark:text-slate-400">
            <div className="flex justify-between">
              <dt>Enseignant</dt>
              <dd>{classroom.creator ? `${classroom.creator.firstName} ${classroom.creator.lastName}` : '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Élèves</dt>
              <dd>{classroom._count?.students ?? 0}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Documents</dt>
              <dd>{classroom._count?.documents ?? 0}</dd>
            </div>
          </dl>
        </div>

        <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Articles liés</h2>
            <Link
              to={`/dashboard/articles?classroomId=${classroom.id}`}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Rédiger un article pour cette classe
            </Link>
          </div>
          {loadingArticles && (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Chargement des articles...</p>
          )}
          {!loadingArticles && articles.length === 0 && (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Aucun article encore lié à cette classe.
            </p>
          )}
          {!loadingArticles && articles.length > 0 && (
            <div className="mt-3 space-y-2">
              {articles.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs hover:bg-white dark:border-slate-800 dark:bg-slate-900/80 dark:hover:bg-slate-900"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900 dark:text-slate-100">{a.title}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {a.status === 'PUBLISHED' ? 'Publié' : 'Brouillon'} •{' '}
                      {new Date(a.publishedAt || a.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <Link
                    to={`/articles/${a.slug}`}
                    className="ml-3 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    Voir →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default ClassroomDetail

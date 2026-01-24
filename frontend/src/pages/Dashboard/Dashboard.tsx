import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  DocumentTextIcon,
  AcademicCapIcon,
  LinkIcon,
  ChatBubbleLeftRightIcon,
  ArrowUpRightIcon,
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  EllipsisHorizontalIcon,
  ClockIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  PlusIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../../hooks/useAuth'
import api from '../../services/api'
import { useTranslation } from 'react-i18next'

interface DashboardStats {
  totalDocuments: number
  totalClasses: number
  sharedDocuments: number
  totalMessages: number
}

interface RecentDocument {
  id: string
  title: string
  type: string
  size: string
  date: string
}

interface UpcomingClass {
  id: string
  name: string
  time: string
  teacher: string
  students: number
  color: string
}

interface RecentArticle {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  date: string
}

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([])
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([])
  const [recentArticles, setRecentArticles] = useState<RecentArticle[]>([])

  const formatSize = (bytes: number | null | undefined): string => {
    if (!bytes || bytes <= 0) return '0 B'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    const value = bytes / Math.pow(1024, i)
    return `${value.toFixed(1)} ${sizes[i]}`
  }

  const formatRelativeDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMinutes < 1) return t('ago') + " 1 min" // Simplification for now, or use t('just_now')
    if (diffMinutes < 60) return `${t('ago')} ${diffMinutes} min`
    if (diffHours < 24) return `${t('ago')} ${diffHours} h`
    return `${t('ago')} ${diffDays} j`
  }

  useEffect(() => {
    const load = async () => {
      try {
        const [docsRes, classesRes, articlesRes] = await Promise.all([
          api.get('/documents', { params: { page: 1, limit: 5 } }),
          api.get('/classrooms'),
          api.get('/articles', { params: { page: 1, limit: 3 } }),
        ])

        const docsData = docsRes.data?.data || []
        const docsPagination = docsRes.data?.pagination
        const classesData = classesRes.data?.data || []
        const articlesData = articlesRes.data?.data || []

        setStats({
          totalDocuments: docsPagination?.total ?? docsData.length,
          totalClasses: classesData.length,
          sharedDocuments: docsData.filter((d: any) => (d._count?.shares ?? 0) > 0).length,
          totalMessages: 0,
        })

        setRecentDocuments(
          docsData.slice(0, 3).map((doc: any) => ({
            id: doc.id,
            title: doc.title,
            type: doc.fileType,
            size: formatSize(doc.fileSize),
            date: formatRelativeDate(doc.createdAt),
          }))
        )

        setUpcomingClasses(
          classesData.slice(0, 3).map((c: any, index: number) => ({
            id: c.id,
            name: c.name,
            time: t('time_today'),
            teacher: c.creator ? `${c.creator.firstName} ${c.creator.lastName}` : t('role_teacher'),
            students: c._count?.students ?? 0,
            color: ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500'][index % 3],
          }))
        )

        setRecentArticles(
          articlesData.map((a: any) => ({
            id: a.id,
            title: a.title,
            slug: a.slug,
            excerpt: a.excerpt,
            date: a.publishedAt || a.createdAt,
          }))
        )
      } catch (_err) {
        // Si l'API renvoie 401 => rediriger vers la page de login
        // et logger l'erreur pour faciliter le debug
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = _err as any
        console.error('Dashboard load error:', err?.response?.data || err?.message || err)
        if (err?.response?.status === 401) {
          // token manquant ou expiré
          navigate('/login')
        }
      }
    }

    void load()
  }, [])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Welcome Header */}
      <motion.div
        variants={item}
        className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-50 px-6 py-5 dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950"
      >
        <div className="absolute inset-0 opacity-40">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-purple-500/5 blur-3xl" />
        </div>
        <div className={`relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between ${i18n.language === 'ar' ? 'md:flex-row-reverse' : ''}`}>
          <div className={i18n.language === 'ar' ? 'text-right' : ''}>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              {t('dashboard')}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">
              {t('welcome')} {user?.firstName}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {t('dashboard_summary')}
            </p>
          </div>
          <div className={`flex flex-wrap items-center gap-2 md:gap-3 ${i18n.language === 'ar' ? 'md:flex-row-reverse' : ''}`}>
            <Link
              to="/dashboard/documents"
              className={`inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white/80 px-3 py-2 text-xs font-medium text-slate-800 hover:border-indigo-500 hover:text-indigo-600 hover:bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-900 ${i18n.language === 'ar' ? 'flex-row-reverse' : ''}`}
            >
              <DocumentTextIcon className="h-4 w-4" />
              {t('my_documents')}
            </Link>
            <button
              type="button"
              onClick={() => navigate('/dashboard/documents')}
              className={`inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors ${i18n.language === 'ar' ? 'flex-row-reverse' : ''}`}
            >
              <PlusIcon className="h-4 w-4" />
              {t('new_resource')}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[ 
          { label: t('stats_documents'), value: stats?.totalDocuments ?? 0, icon: DocumentTextIcon },
          { label: t('stats_classes'), value: stats?.totalClasses ?? 0, icon: AcademicCapIcon },
          { label: t('stats_shared'), value: stats?.sharedDocuments ?? 0, icon: LinkIcon },
          { label: t('stats_messages'), value: stats?.totalMessages ?? 0, icon: ChatBubbleLeftRightIcon },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              whileHover={{ y: -2 }}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/60 dark:shadow-[0_10px_40px_rgba(15,23,42,0.45)]"
            >
              <div className={`flex items-start justify-between gap-2 ${i18n.language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                  <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{stat.value}</p>
                </div>
                <div className={`flex flex-col items-end gap-1 ${i18n.language === 'ar' ? 'items-start' : ''}`}>
                  <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 ${i18n.language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <ArrowUpRightIcon className="h-3 w-3" />
                    7j
                  </span>
                  <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Documents */}
        <motion.div
          variants={item}
          className="lg:col-span-2 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950/70"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <DocumentTextIcon className="h-4 w-4" />
              {t('recent_documents')}
            </h2>
            <Link
              to="/dashboard/documents"
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              {t('view_all')}
              <ArrowTopRightOnSquareIcon className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {recentDocuments.length === 0 && (
              <div className="px-5 py-6 text-xs text-slate-500 dark:text-slate-400">
                {t('no_recent_documents')}
              </div>
            )}
            {recentDocuments.map((doc, index) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="cursor-pointer bg-white px-5 py-3.5 text-sm text-slate-800 hover:bg-slate-50 transition-colors group dark:bg-slate-950/60 dark:text-slate-200 dark:hover:bg-slate-900/70"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    <DocumentTextIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 group-hover:text-indigo-600 transition-colors dark:text-slate-100 dark:group-hover:text-indigo-300">
                      {doc.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      {doc.type} • {doc.size}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 flex items-center justify-end gap-1 dark:text-slate-500">
                      <ClockIcon className="h-3 w-3" />
                      {doc.date}
                    </p>
                    <div className="mt-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
                        <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                      </button>
                      <button className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
                        <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                      </button>
                      <button className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
                        <EllipsisHorizontalIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="border-t border-slate-100 bg-slate-50 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-950/60">
            <button
              type="button"
              onClick={() => navigate('/dashboard/documents')}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:border-indigo-500 hover:text-indigo-600 hover:bg-white transition-colors dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:text-indigo-300 dark:hover:bg-slate-900/70"
            >
              <PlusIcon className="h-4 w-4" />
              {t('add_document')}
            </button>
          </div>
        </motion.div>

        {/* Upcoming Classes */}
        <motion.div
          variants={item}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950/70"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <CalendarDaysIcon className="h-4 w-4" />
              {t('upcoming_classes')}
            </h2>
          </div>
          <div className="space-y-3 px-4 py-4">
            {upcomingClasses.length === 0 && (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {t('no_upcoming_classes')}
              </div>
            )}
            {upcomingClasses.map((cls, index) => (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="cursor-pointer rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-900 hover:border-indigo-200 hover:bg-white transition-all group dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:hover:border-indigo-500/60 dark:hover:bg-slate-900/70"
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 h-9 w-1 rounded-full ${cls.color}`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 group-hover:text-indigo-600 transition-colors dark:text-slate-100 dark:group-hover:text-indigo-300">
                      {cls.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-500">{cls.teacher}</p>
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <ClockIcon className="h-3 w-3" />
                        {cls.time}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <UserGroupIcon className="h-3 w-3" />
                        {cls.students} {t('students')}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="border-t border-slate-100 bg-slate-50 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-950/60">
            <button
              type="button"
              onClick={() => navigate('/dashboard/classrooms')}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <CalendarDaysIcon className="h-4 w-4" />
              {t('view_schedule')}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={item} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[ 
          { icon: ArrowDownTrayIcon, title: t('action_upload'), desc: t('action_upload_desc'), accent: 'bg-indigo-500/10 text-indigo-600', onClick: () => navigate('/dashboard/documents') },
          { icon: AcademicCapIcon, title: t('action_create_class'), desc: t('action_create_class_desc'), accent: 'bg-emerald-500/10 text-emerald-600', onClick: () => navigate('/dashboard/classrooms') },
          { icon: UserGroupIcon, title: t('action_invite'), desc: t('action_invite_desc'), accent: 'bg-purple-500/10 text-purple-600', onClick: () => navigate('/dashboard/classrooms') },
          { icon: ChartBarIcon, title: t('action_stats'), desc: t('action_stats_desc'), accent: 'bg-amber-500/10 text-amber-600', onClick: () => navigate('/dashboard') },
        ].map((action) => {
          const Icon = action.icon
          return (
            <motion.button
              key={action.title}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
              type="button"
              onClick={action.onClick}
              className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-950/70 dark:shadow-[0_10px_40px_rgba(15,23,42,0.45)]"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${action.accent} dark:bg-opacity-20 dark:text-inherit`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors dark:text-slate-100 dark:group-hover:text-indigo-300">
                {action.title}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">{action.desc}</p>
            </motion.button>
          )
        })}
      </motion.div>

      {/* Recent Articles */}
      {recentArticles.length > 0 && (
        <motion.div
          variants={item}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950/70"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <DocumentTextIcon className="h-4 w-4" />
              {t('recent_articles')}
            </h2>
            <Link
              to="/articles"
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              {t('view_all')}
              <ArrowTopRightOnSquareIcon className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid gap-3 px-5 py-4 md:grid-cols-3">
            {recentArticles.map((article) => (
              <Link
                key={article.id}
                to={`/articles/${article.slug}`}
                className="group rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 hover:border-indigo-300 hover:bg-white transition-colors dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-100 dark:hover:border-indigo-500/60 dark:hover:bg-slate-900"
              >
                <p className="line-clamp-2 text-sm font-medium text-slate-900 group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-300">
                  {article.title}
                </p>
                {article.excerpt && (
                  <p className="mt-1 line-clamp-3 text-[11px] text-slate-500 dark:text-slate-400">
                    {article.excerpt}
                  </p>
                )}
                <p className="mt-2 text-[11px] text-slate-400">
                  {t('published_on')} {new Date(article.date).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'fr-FR')}
                </p>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default Dashboard

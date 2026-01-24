import React, { useEffect, useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HomeIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  BellIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  MoonIcon,
  SunIcon,
  UsersIcon,
  PlusCircleIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PhotoIcon,
  ChatBubbleBottomCenterTextIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../context/ThemeContext'
import { useSettings } from '../../context/SettingsContext'
import api from '../../services/api'
import { getSocket } from '../../services/socket'
import { useTranslation } from 'react-i18next'

const Layout: React.FC = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const { settings } = useSettings()
  const isDark = theme === 'dark'
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar';
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [articlesMenuOpen, setArticlesMenuOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Array<{
    id: string
    title: string
    message: string
    type: string
    isRead: boolean
    createdAt: string
  }>>([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true)
      const response = await api.get('/notifications', { params: { limit: 10 } })
      setNotifications(response.data?.data || [])
    } catch {
      // on reste silencieux dans le header si erreur
    } finally {
      setLoadingNotifications(false)
    }
  }

  useEffect(() => {
    if (user) {
      void fetchNotifications()

      // Écouter les notifications en temps réel via Socket.io
      const socket = getSocket()
      
      const handleNotification = (notification: {
        title: string
        message: string
        type: string
        data?: Record<string, unknown>
      }) => {
        // Ajouter la nouvelle notification
        setNotifications((prev) => [
          {
            id: `temp-${Date.now()}`,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            isRead: false,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ])

        // Afficher un toast
        import('react-hot-toast').then(({ default: toast }) => {
          toast.success(notification.title, {
            duration: 4000,
            position: 'top-right',
          })
        })

        // Re-fetch pour avoir les vraies IDs
        setTimeout(() => void fetchNotifications(), 500)
      }

      socket.on('notification', handleNotification)

      return () => {
        socket.off('notification', handleNotification)
      }
    } else {
      setNotifications([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const toggleNotifications = () => {
    const next = !showNotifications
    setShowNotifications(next)
    if (next && notifications.length === 0 && !loadingNotifications) {
      void fetchNotifications()
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    } catch {
      // silencieux
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read')
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch {
      // silencieux
    }
  }

  const navigation = [
    { name: t('sidebar.dashboard'), path: '/dashboard', icon: HomeIcon },
    { name: t('sidebar.documents'), path: '/dashboard/documents', icon: DocumentTextIcon },
    { name: t('sidebar.classes'), path: '/dashboard/classrooms', icon: AcademicCapIcon },
    { name: t('sidebar.messages'), path: '/dashboard/messages', icon: ChatBubbleLeftRightIcon },
    // L'entrée Utilisateurs est réservée aux administrateurs et ajoutée dynamiquement plus bas
    { name: t('sidebar.calendar'), path: '/dashboard/calendar', icon: CalendarDaysIcon },
  ]

  const bottomNav = [
    { name: t('sidebar.settings'), path: '/dashboard/settings', icon: Cog6ToothIcon },
    { name: t('sidebar.help'), path: '/help', icon: QuestionMarkCircleIcon },
  ]

  const navItemClass = (isActive: boolean) => {
    const base = `flex items-center gap-3 ${sidebarOpen ? 'px-3 py-2.5' : 'px-2 py-2'} rounded-lg text-sm transition-all duration-200`
    const rtl = isRTL ? (sidebarOpen ? ' flex-row-reverse text-right' : ' flex-row-reverse justify-end') : ''
    const state = isActive
      ? 'bg-slate-900 text-slate-50'
      : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900/80 dark:hover:text-slate-100'
    return `${base}${rtl} ${state}`
  }

  

  useEffect(() => {
    if (
      location.pathname.startsWith('/dashboard/articles') &&
      !location.pathname.startsWith('/dashboard/articles/gallery')
    ) {
      setArticlesMenuOpen(true)
    }
  }, [location.pathname])

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex${isRTL ? ' flex-row-reverse' : ''}`}> 
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className={`fixed ${isRTL ? 'right-0' : 'left-0'} top-0 h-screen bg-white ${isRTL ? 'border-l' : 'border-r'} border-slate-200 dark:bg-slate-950 dark:border-slate-900 z-40 flex flex-col${isRTL ? ' items-end' : ''}`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-900/80">
          <Link to="/" className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-400/40 flex items-center justify-center">
              <span className="text-sm font-semibold text-indigo-500">
                {settings.general.siteName.slice(0, 2).toUpperCase() || 'ES'}
              </span>
            </div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-base font-semibold text-slate-900 dark:text-slate-100 overflow-hidden whitespace-nowrap tracking-tight"
                >
                  {settings.general.siteName}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? t('collapse_sidebar') : t('expand_sidebar')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors text-slate-400"
          >
            {
              (() => {
                const OpenIcon = sidebarOpen ? (isRTL ? ChevronRightIcon : ChevronLeftIcon) : (isRTL ? ChevronLeftIcon : ChevronRightIcon)
                return <OpenIcon className="h-4 w-4" />
              })()
            }
          </button>
        </div>

        {/* Navigation */}
        <nav role="navigation" className="flex-1 p-3 space-y-1 overflow-y-auto">
          {[...navigation,
            ...(user && (user.role === 'TEACHER' || user.role === 'ADMIN')
              ? [{ name: t('sidebar.gallery'), path: '/dashboard/articles/gallery', icon: PhotoIcon }]
              : []),
            ...(user?.role === 'ADMIN'
              ? [
                  { name: t('sidebar.users'), path: '/dashboard/users', icon: UsersIcon },
                  { name: t('sidebar.comments'), path: '/dashboard/comments-management', icon: ChatBubbleBottomCenterTextIcon },
                ]
              : []),
          ].map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={isActive ? 'page' : undefined}
                className={navItemClass(isActive)}
              >
                <Icon className="h-5 w-5" />
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className={`font-medium overflow-hidden whitespace-nowrap flex-1 ${isRTL ? 'text-right' : ''}`}
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )
          })}

          {user && (user.role === 'TEACHER' || user.role === 'ADMIN') && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setArticlesMenuOpen((v) => !v)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  location.pathname.startsWith('/dashboard/articles') &&
                  !location.pathname.startsWith('/dashboard/articles/gallery')
                    ? 'bg-slate-900 text-slate-50'
                    : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900/80 dark:hover:text-slate-100'
                }`}
                aria-expanded={articlesMenuOpen}
              >
                <div className="flex items-center gap-3">
                  <DocumentTextIcon className="h-5 w-5" />
                  <AnimatePresence>
                    {sidebarOpen && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          className={`font-medium overflow-hidden whitespace-nowrap flex-1 ${isRTL ? 'text-right' : ''}`}
                        >
                          {t('sidebar.articles')}
                        </motion.span>
                      )}
                  </AnimatePresence>
                </div>
                {sidebarOpen && (
                  <ChevronDownIcon
                    className={`h-4 w-4 transition-transform ${articlesMenuOpen ? 'rotate-180' : ''}`}
                  />
                )}
              </button>

              {articlesMenuOpen && sidebarOpen && (
                <div className={`mt-1 space-y-1 ${isRTL ? 'pr-6' : 'pl-6'}`}>
                      <Link to="/dashboard/articles" className={navItemClass(location.pathname === '/dashboard/articles')}>
                        <DocumentTextIcon className="h-5 w-5" />
                        <span className={`font-medium overflow-hidden whitespace-nowrap flex-1 ${isRTL ? 'text-right' : ''}`}>{t('sidebar.articlesList')}</span>
                      </Link>
                      <Link to="/dashboard/articles/new" className={navItemClass(location.pathname === '/dashboard/articles/new')}>
                        <PlusCircleIcon className="h-5 w-5" />
                        <span className={`font-medium overflow-hidden whitespace-nowrap flex-1 ${isRTL ? 'text-right' : ''}`}>{t('sidebar.addArticle')}</span>
                      </Link>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Bottom Navigation */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-900/80 space-y-1">
          {bottomNav.map((item) => (
            <Link key={item.path} to={item.path} className={navItemClass(false)}>
              <item.icon className="h-5 w-5" />
              {sidebarOpen && <span className={`font-medium flex-1 ${isRTL ? 'text-right' : ''}`}>{item.name}</span>}
            </Link>
          ))}
        </div>

        {/* User Profile */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-900/80">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900/80 transition-all"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white text-xs font-semibold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              {sidebarOpen && (
                <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-500">{user?.role}</p>
                </div>
              )}
            </button>

            {/* User Menu Dropdown */}
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                    className={`absolute bottom-full ${isRTL ? 'right-0' : 'left-0'} ${isRTL ? 'text-right' : ''} mb-2 bg-white dark:bg-slate-950 rounded-xl shadow-xl border border-slate-200 dark:border-slate-900 overflow-hidden`}
                >
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <UserCircleIcon className="h-5 w-5" />
                    <span className="font-medium">Mon profil</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-500/5 transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    <span className="font-medium">Déconnexion</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main
        className="flex-1 transition-all duration-300 bg-slate-50 dark:bg-slate-950"
        style={isRTL ? { marginRight: sidebarOpen ? 280 : 80 } : { marginLeft: sidebarOpen ? 280 : 80 }}
      >
        {/* Top Header */}
        <header className="h-16 bg-white/80 border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30 backdrop-blur-xl dark:bg-slate-950/80 dark:border-slate-900/80">
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500`}>
                <MagnifyingGlassIcon className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Rechercher..."
                className={`${isRTL ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2 bg-slate-100 border border-slate-200 rounded-lg w-72 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all outline-none dark:bg-slate-900/70 dark:border-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900`}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleTheme}
              className="relative p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900 transition-colors"
            >
              {isDark ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={toggleNotifications}
                className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 dark:hover:bg-slate-900 dark:text-slate-400"
              >
                <BellIcon className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className={`absolute top-1 ${isRTL ? 'left-1' : 'right-1'} min-w-[16px] h-4 px-1 bg-emerald-500 rounded-full text-[10px] text-white flex items-center justify-center`}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-80 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-40`}>
                  <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-100">
                      Notifications
                    </span>
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={() => void markAllAsRead()}
                        className="text-[11px] text-indigo-600 hover:text-indigo-700"
                      >
                        Tout marquer comme lu
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto text-xs">
                    {loadingNotifications && (
                      <div className="px-3 py-3 text-slate-400 text-center">
                        Chargement...
                      </div>
                    )}
                    {!loadingNotifications && notifications.length === 0 && (
                      <div className="px-3 py-3 text-slate-400 text-center">
                        Aucune notification pour le moment.
                      </div>
                    )}
                    {!loadingNotifications && notifications.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => void markAsRead(n.id)}
                        className={`w-full text-left px-3 py-2 border-b border-slate-100 dark:border-slate-900/80 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-900/70 ${
                          !n.isRead ? 'bg-emerald-50/40 dark:bg-slate-900/60' : ''
                        }`}
                      >
                        <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 mb-0.5">
                          {n.title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                          {n.message}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {new Date(n.createdAt).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 dark:hover:bg-slate-900 dark:text-slate-400">
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
              <span className={`absolute top-1 ${isRTL ? 'left-1' : 'right-1'} min-w-[16px] h-4 px-1 bg-indigo-500 rounded-full text-[10px] text-white flex items-center justify-center`}>
                3
              </span>
            </button>

            {/* User connected info */}
              {user && (
              <div className={`hidden md:flex items-center gap-3 ${isRTL ? 'pr-4 mr-2 border-r' : 'pl-4 ml-2 border-l'} border-slate-200 dark:border-slate-800`}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white text-xs font-semibold">
                  {user.firstName?.[0]}
                  {user.lastName?.[0]}
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Connecté
                  </span>
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-100">
                    {user.firstName} {user.lastName}
                  </span>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout

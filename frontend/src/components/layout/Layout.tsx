import React, { useEffect, useMemo, useRef, useState } from 'react'
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
  Bars3Icon,
  PhotoIcon,
  ChatBubbleBottomCenterTextIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../context/ThemeContext'
import { useSettings } from '../../context/SettingsContext'
import api from '../../services/api'
import { getSocket } from '../../services/socket'
import { useTranslation } from 'react-i18next'
import LanguageSelector from '../common/LanguageSelector'

const Layout: React.FC = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const { settings } = useSettings()
  const isDark = theme === 'dark'
  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [articlesMenuOpen, setArticlesMenuOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const notificationsRef = useRef<HTMLDivElement | null>(null)
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null
      if (!target) return

      if (showUserMenu && userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false)
      }

      if (
        showNotifications &&
        notificationsRef.current &&
        !notificationsRef.current.contains(target)
      ) {
        setShowNotifications(false)
      }
    }

    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [showNotifications, showUserMenu])

  const notificationDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    [i18n.language]
  )



  // Close open menus with Escape for keyboard users
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setArticlesMenuOpen(false)
        setShowUserMenu(false)
        setShowNotifications(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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
    { name: t('sidebar.menus'), path: '/dashboard/menus', icon: Bars3Icon },
    { name: t('sidebar.calendar'), path: '/dashboard/calendar', icon: CalendarDaysIcon },
  ]

  const bottomNav = [
    { name: t('sidebar.settings'), path: '/dashboard/settings', icon: Cog6ToothIcon },
    { name: t('sidebar.help'), path: '/help', icon: QuestionMarkCircleIcon },
  ]

  const navItemClass = (isActive: boolean) => {
    const base = `flex items-center gap-3 ${sidebarOpen ? 'px-3 py-2.5' : 'px-2 py-2'} rounded-lg text-sm transition-all duration-200 w-full`
    const rtl = isRTL ? (sidebarOpen ? ' justify-between' : ' justify-center') : ''
    const state = isActive
      ? 'bg-slate-900 text-slate-50'
      : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900/80 dark:hover:text-slate-100'
    return `${base}${rtl} ${state}`
  }

  const getSidebarMargin = () => {
    if (!sidebarOpen) return isRTL ? 'mr-[80px]' : 'ml-[80px]';
    return isRTL ? 'mr-[280px]' : 'ml-[280px]';
  };

  useEffect(() => {
    if (
      location.pathname.startsWith('/dashboard/articles') &&
      !location.pathname.startsWith('/dashboard/articles/gallery')
    ) {
      setArticlesMenuOpen(true)
    }
  }, [location.pathname])

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex ${isRTL ? 'flex-row-reverse' : ''} overflow-x-hidden`}>
      {/* Skip link for keyboard users */}
      <a href="#main" className="sr-only focus:not-sr-only block p-2">Aller au contenu</a>
      
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          width: sidebarOpen ? 280 : 80,
          x: 0
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className={`fixed ${isRTL ? 'right-0' : 'left-0'} top-0 h-screen bg-white ${isRTL ? 'border-l' : 'border-r'} border-slate-200 dark:bg-slate-950 dark:border-slate-900 z-40 flex flex-col shadow-lg`}
        style={{ 
          maxWidth: '100vw',
          boxSizing: 'border-box'
        }}
      >
        {/* Logo */}
        <div className={`h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-900/80 w-full `}>
          <Link to="/" className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-400/40 flex items-center justify-center shrink-0">
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
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors text-slate-400 shrink-0"
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
        <nav 
          role="navigation" 
          aria-label={t('sidebar')} 
          className="flex-1 p-3 space-y-1 overflow-y-auto w-full"
          style={{ 
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}
        >
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
            const label = item.name
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={isActive ? 'page' : undefined}
                className={navItemClass(isActive)}
                title={!sidebarOpen ? label : undefined}
                aria-label={!sidebarOpen ? label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className={`font-medium overflow-hidden whitespace-nowrap flex-1 ${isRTL ? 'text-right pr-2' : ''}`}
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )
          })}

          {user && (user.role === 'TEACHER' || user.role === 'ADMIN') && (
            <div className="pt-1 w-full">
              <button
                type="button"
                onClick={() => setArticlesMenuOpen((v) => !v)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  location.pathname.startsWith('/dashboard/articles') &&
                  !location.pathname.startsWith('/dashboard/articles/gallery')
                    ? 'bg-slate-900 text-slate-50'
                    : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900/80 dark:hover:text-slate-100'
                } `}
                aria-expanded={articlesMenuOpen}
              >
                <div className={`flex items-center gap-3`}>
                  <DocumentTextIcon className="h-5 w-5 shrink-0" />
                  <AnimatePresence>
                    {sidebarOpen && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          className={`font-medium overflow-hidden whitespace-nowrap flex-1 ${isRTL ? 'text-right pr-2' : ''}`}
                        >
                          {t('sidebar.articles')}
                        </motion.span>
                      )}
                  </AnimatePresence>
                </div>
                {sidebarOpen && (
                  <ChevronDownIcon
                    className={`h-4 w-4 shrink-0 transition-transform ${articlesMenuOpen ? 'rotate-180' : ''}`}
                  />
                )}
              </button>

              {articlesMenuOpen && sidebarOpen && (
                <div className={`mt-1 space-y-1 w-full ${isRTL ? 'pr-6' : 'pl-6'}`}>
                      <Link to="/dashboard/articles" className={navItemClass(location.pathname === '/dashboard/articles')} title={!sidebarOpen ? t('sidebar.articlesList') : undefined} aria-label={!sidebarOpen ? t('sidebar.articlesList') : undefined}>
                        <DocumentTextIcon className="h-5 w-5 shrink-0" />
                        <span className={`font-medium overflow-hidden whitespace-nowrap flex-1 ${isRTL ? 'text-right pr-2' : ''}`}>{t('sidebar.articlesList')}</span>
                      </Link>
                      <Link to="/dashboard/articles/new" className={navItemClass(location.pathname === '/dashboard/articles/new')} title={!sidebarOpen ? t('sidebar.addArticle') : undefined} aria-label={!sidebarOpen ? t('sidebar.addArticle') : undefined}>
                        <PlusCircleIcon className="h-5 w-5 shrink-0" />
                        <span className={`font-medium overflow-hidden whitespace-nowrap flex-1 ${isRTL ? 'text-right pr-2' : ''}`}>{t('sidebar.addArticle')}</span>
                      </Link>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Bottom Navigation */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-900/80 space-y-1 w-full">
          {bottomNav.map((item) => (
            <Link key={item.path} to={item.path} className={navItemClass(false)} title={!sidebarOpen ? item.name : undefined} aria-label={!sidebarOpen ? item.name : undefined}>
              <item.icon className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span className={`font-medium flex-1 ${isRTL ? 'text-right pr-2' : ''}`}>{item.name}</span>}
            </Link>
          ))}
        </div>

        {/* User Profile */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-900/80 w-full">
          <div ref={userMenuRef} className="relative w-full">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900/80 transition-all ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              {sidebarOpen && (
                <div className={`flex-1 ${isRTL ? 'text-right pr-2' : 'text-left'}`}>
                  <p className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-500 truncate">{user?.role}</p>
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
                  className={`absolute bottom-full ${isRTL ? 'right-0' : 'left-0'} mb-2 bg-white dark:bg-slate-950 rounded-xl shadow-xl border border-slate-200 dark:border-slate-900 overflow-hidden min-w-[180px]`}
                >
                  <Link
                    to="/profile"
                    className={`flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
                    onClick={() => setShowUserMenu(false)}
                  >
                    <UserCircleIcon className="h-5 w-5 shrink-0" />
                    <span className="font-medium">{t('dashboard.user.profile')}</span>
                  </Link>
                  <button
                    onClick={logout}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-500/5 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5 shrink-0" />
                    <span className="font-medium">{t('logout')}</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main
        id="main"
        className={`flex-1 transition-all duration-300 bg-slate-50 dark:bg-slate-950 min-h-screen ${getSidebarMargin()}`}
        style={{
          maxWidth: 'calc(100vw - 80px)',
          width: '100%'
        }}
      >
        {/* Top Header */}
        <header className="h-16 bg-white/80 border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30 backdrop-blur-xl dark:bg-slate-950/80 dark:border-slate-900/80">
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <span className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500`}>
                <MagnifyingGlassIcon className="h-4 w-4" />
              </span>
              <input
                type="text"
                aria-label={t('dashboard.header.search_aria')}
                placeholder={t('dashboard.header.search_placeholder')}
                className={`${isRTL ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2 bg-slate-100 border border-slate-200 rounded-lg w-44 sm:w-56 md:w-72 max-w-[48vw] text-sm text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all outline-none dark:bg-slate-900/70 dark:border-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900`}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSelector />
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={t('dashboard.header.toggle_theme')}
              className="relative p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900 transition-colors"
            >
              {isDark ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
            </button>
            <div ref={notificationsRef} className="relative">
              <button
                type="button"
                onClick={toggleNotifications}
                aria-label={t('dashboard.header.open_notifications')}
                aria-haspopup="menu"
                aria-expanded={showNotifications}
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
                      {t('dashboard.header.notifications_title')}
                    </span>
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={() => void markAllAsRead()}
                        className="text-[11px] text-indigo-600 hover:text-indigo-700"
                      >
                        {t('dashboard.header.notifications_mark_all')}
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto text-xs">
                    {loadingNotifications && (
                      <div className="px-3 py-3 text-slate-400 text-center">
                        {t('dashboard.header.notifications_loading')}
                      </div>
                    )}
                    {!loadingNotifications && notifications.length === 0 && (
                      <div className="px-3 py-3 text-slate-400 text-center">
                        {t('dashboard.header.notifications_empty')}
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
                          {notificationDateFormatter.format(new Date(n.createdAt))}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Link
              to="/dashboard/messages"
              aria-label={t('dashboard.header.open_messages')}
              className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 dark:hover:bg-slate-900 dark:text-slate-400"
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
            </Link>

            {/* User connected info */}
              {user && (
              <div className={`hidden md:flex items-center gap-3 ${isRTL ? 'pr-4 mr-2 border-r' : 'pl-4 ml-2 border-l'} border-slate-200 dark:border-slate-800`}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white text-xs font-semibold">
                  {user.firstName?.[0]}
                  {user.lastName?.[0]}
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    {t('dashboard.header.connected')}
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

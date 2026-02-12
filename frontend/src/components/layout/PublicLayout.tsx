import React, { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../hooks/useAuth'
import { useSettings } from '../../context/SettingsContext'
import { useTranslation } from 'react-i18next'
import LanguageSelector from '../common/LanguageSelector'

const PublicLayout: React.FC = () => {
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const { settings } = useSettings()
  const { t } = useTranslation()

  const isDark = theme === 'dark'

  useEffect(() => {
    if (!location.hash) return

    const targetId = decodeURIComponent(location.hash.slice(1))

    const tryScroll = (attempt: number) => {
      const element = document.getElementById(targetId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }

      if (attempt >= 10) return
      requestAnimationFrame(() => tryScroll(attempt + 1))
    }

    tryScroll(0)
  }, [location.hash, location.pathname])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col">
      <header className="border-b border-slate-200/80 bg-white/80 dark:bg-slate-950/80 dark:border-slate-800 sticky top-0 z-30 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-400/40">
              <span className="text-sm font-semibold text-indigo-500">
                {settings.general.siteName.slice(0, 2).toUpperCase() || 'ES'}
              </span>
            </div>
            <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {settings.general.siteName}
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-slate-600 dark:text-slate-300 md:flex">
            <Link
              to="/"
              className={
                'hover:text-indigo-600 dark:hover:text-indigo-400 ' +
                (location.pathname === '/' ? 'text-indigo-600 dark:text-indigo-400 font-medium' : '')
              }
            >
              {t('nav.home')}
            </Link>
            <Link to="/#pour-qui" className="hover:text-indigo-600 dark:hover:text-indigo-400">
              {t('nav.for_who')}
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSelector />
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
              aria-label="Basculer le thème"
            >
              {isDark ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
            </button>
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-700"
              >
                Accéder au dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-indigo-500 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-indigo-500 md:inline-flex"
                >
                  Se connecter
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-700"
                >
                  Créer un compte
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200/80 bg-white/80 dark:bg-slate-950/80 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-4 text-xs text-slate-500 sm:flex-row sm:px-6">
          <span>{t('footer.copyright', { year: new Date().getFullYear(), siteName: settings.general.siteName })}</span>
          <div className="flex gap-4">
            <button className="hover:text-slate-700 dark:hover:text-slate-300">{t('footer.legal')}</button>
            <button className="hover:text-slate-700 dark:hover:text-slate-300">{t('footer.privacy')}</button>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PublicLayout

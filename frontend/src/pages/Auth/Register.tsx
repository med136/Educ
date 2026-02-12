import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LockClosedIcon,
  EyeSlashIcon,
  UserIcon,
  EnvelopeIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import { useTheme } from '../../context/ThemeContext'
import { useTranslation } from 'react-i18next'

const Register: React.FC = () => {
  const { register, isLoading } = useAuth()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { t } = useTranslation()
  const isDark = theme === 'dark'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'STUDENT',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error(t('auth.register.password_mismatch'))
      return
    }

    const result = await register({
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      role: formData.role,
    })

    if (result.success) {
      toast.success(t('auth.register.success'))
      navigate('/login')
    } else {
      toast.error(result.error || t('auth.register.error'))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center"
      >
        {/* Branding / Pitch */}
        <div className="hidden lg:block text-slate-900 dark:text-slate-100">
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="h-11 w-11 rounded-xl bg-indigo-500/10 border border-indigo-400/40 flex items-center justify-center">
              <span className="text-lg font-semibold text-indigo-300">ES</span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Platform</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">EduShare</p>
            </div>
          </div>

          <h1 className="text-3xl xl:text-4xl font-semibold text-slate-900 dark:text-slate-50 tracking-tight">
            {t('auth.register.title')}
            <span className="block text-indigo-300">{t('auth.register.subtitle')}</span>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400 max-w-md">
            {t('auth.register.description')}
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4 text-sm">
            <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-4 py-3">
              <p className="text-xs text-slate-400">{t('auth.register.stats.profiles')}</p>
              <p className="mt-1 text-lg font-semibold text-slate-50">{t('auth.register.stats.profiles_value')}</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-4 py-3">
              <p className="text-xs text-slate-400">{t('auth.register.stats.setup')}</p>
              <p className="mt-1 text-lg font-semibold text-slate-50">{t('auth.register.stats.setup_value')}</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-4 py-3">
              <p className="text-xs text-slate-400">{t('auth.register.stats.security')}</p>
              <p className="mt-1 text-lg font-semibold text-slate-50">{t('auth.register.stats.security_value')}</p>
            </div>
          </div>
        </div>

        {/* Register card */}
        <div className="w-full">
          <div className="mb-6 flex items-center justify-between gap-3 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-400/40 flex items-center justify-center">
                <span className="text-sm font-semibold text-indigo-500">ES</span>
              </div>
              <span className="text-base font-semibold text-slate-900 dark:text-white">EduShare</span>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? t('auth.login.theme_dark') : t('auth.login.theme_light')}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              {isDark ? <SunIcon className="h-4 w-4" aria-hidden="true" /> : <MoonIcon className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>

          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_22px_70px_rgba(15,23,42,0.45)] border border-slate-100 dark:bg-slate-950/90 dark:border-slate-800 p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{t('auth.register.heading')}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {t('auth.register.subheading')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">{t('auth.register.first_name_label')}</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                      <UserIcon className="h-5 w-5" />
                    </span>
                    <input
                      id="register-first-name"
                      type="text"
                      required
                      autoComplete="given-name"
                      className="input-field pl-10 py-2.5 bg-slate-50 border-slate-200 text-sm"
                      placeholder={t('auth.register.first_name_placeholder')}
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">{t('auth.register.last_name_label')}</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                      <UserIcon className="h-5 w-5" />
                    </span>
                    <input
                      id="register-last-name"
                      type="text"
                      required
                      autoComplete="family-name"
                      className="input-field pl-10 py-2.5 bg-slate-50 border-slate-200 text-sm"
                      placeholder={t('auth.register.last_name_placeholder')}
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">{t('auth.register.email_label')}</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                    <EnvelopeIcon className="h-5 w-5" />
                  </span>
                  <input
                    id="register-email"
                    type="email"
                    required
                    autoComplete="email"
                    className="input-field pl-10 py-2.5 bg-slate-50 border-slate-200 text-sm"
                    placeholder={t('auth.register.email_placeholder')}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">{t('auth.register.password_label')}</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                      <LockClosedIcon className="h-5 w-5" />
                    </span>
                    <input
                      id="register-password"
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className="input-field pl-10 py-2.5 bg-slate-50 border-slate-200 text-sm"
                      placeholder={t('auth.register.password_placeholder')}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">{t('auth.register.confirm_label')}</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                      <LockClosedIcon className="h-5 w-5" />
                    </span>
                    <input
                      id="register-confirm-password"
                      type="password"
                      required
                      autoComplete="new-password"
                      className="input-field pl-10 pr-10 py-2.5 bg-slate-50 border-slate-200 text-sm"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                    <button
                      type="button"
                      aria-hidden="true"
                      tabIndex={-1}
                      className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400"
                    >
                      <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">{t('auth.register.role_label')}</label>
                <select
                  className="input-field bg-slate-50 border-slate-200 text-sm dark:bg-slate-900/70 dark:border-slate-700"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="STUDENT">{t('auth.register.role_student')}</option>
                  <option value="TEACHER">{t('auth.register.role_teacher')}</option>
                  <option value="PARENT">{t('auth.register.role_parent')}</option>
                </select>
              </div>

              <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-500">
                <input
                  type="checkbox"
                  required
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>
                  {t('auth.register.terms')}
                </span>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex justify-center items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? t('auth.register.loading') : t('auth.register.button')}
              </motion.button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-600 dark:text-slate-500">
              {t('auth.register.has_account')}{' '}
              <Link
                to="/login"
                className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                {t('auth.register.login')}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Register

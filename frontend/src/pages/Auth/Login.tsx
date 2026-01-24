import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import { useTheme } from '../../context/ThemeContext'

const Login: React.FC = () => {
  const { login, isLoading } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await login(formData.email, formData.password)
    if (!result.success) {
      toast.error(result.error || 'Erreur de connexion')
    } else {
      toast.success('Connexion réussie!')
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
            Plateforme de collaboration
            <span className="block text-indigo-300">moderne pour l'éducation</span>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400 max-w-md">
            Centralisez vos documents, vos classes et vos échanges dans une interface claire et professionnelle,
            pensée pour les établissements, enseignants et étudiants exigeants.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4 text-sm">
            <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-4 py-3">
              <p className="text-xs text-slate-400">Utilisateurs actifs</p>
              <p className="mt-1 text-lg font-semibold text-slate-50">10 000+</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-4 py-3">
              <p className="text-xs text-slate-400">Documents gérés</p>
              <p className="mt-1 text-lg font-semibold text-slate-50">50 000+</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/40 px-4 py-3">
              <p className="text-xs text-slate-400">Taux de disponibilité</p>
              <p className="mt-1 text-lg font-semibold text-slate-50">99,9%</p>
            </div>
          </div>
        </div>

        {/* Login card */}
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
              aria-label={isDark ? 'Désactiver le mode sombre' : 'Activer le mode sombre'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              {isDark ? <SunIcon className="h-4 w-4" aria-hidden="true" /> : <MoonIcon className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>

          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_22px_70px_rgba(15,23,42,0.45)] border border-slate-100 dark:bg-slate-950/90 dark:border-slate-800 p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Connexion</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Accédez à votre espace EduShare.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                  Adresse email
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                    <EnvelopeIcon className="h-5 w-5" />
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    className="input-field pl-10 py-2.5 bg-slate-50 border-slate-200 text-sm"
                    placeholder="vous@etablissement.fr"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                  Mot de passe
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                    <LockClosedIcon className="h-5 w-5" />
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    className="input-field pl-10 pr-10 py-2.5 bg-slate-50 border-slate-200 text-sm"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" aria-hidden="true" /> : <EyeIcon className="h-5 w-5" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-400">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Se souvenir de moi</span>
                </label>
                <button
                  type="button"
                  className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex justify-center items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Connexion...
                  </span>
                ) : (
                  'Se connecter'
                )}
              </motion.button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-600 dark:text-slate-500">
              Pas encore de compte ?{' '}
              <Link
                to="/register"
                className="font-medium text-indigo-600 hover:text-indigo-700"
              >
                Créer un compte
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Login

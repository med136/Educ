import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'
import api from '../../services/api'
import {
  defaultSettings,
  type SettingsPayload,
  type TabType,
  type GeneralSettings,
  type NotificationSettings,
  type SecuritySettings,
  type AppearanceSettings,
  type StorageSettings,
} from '../../types/settings'
import { useSettings } from '../../context/SettingsContext'
import { useTheme } from '../../context/ThemeContext'
import { useTranslation } from 'react-i18next'
import {
  Cog6ToothIcon,
  UserGroupIcon,
  BellIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  ServerIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  KeyIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

const Settings: React.FC = () => {
  const { refresh } = useSettings()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabType>('general')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>(defaultSettings.general)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultSettings.notifications)
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(defaultSettings.security)
  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>(defaultSettings.appearance)
  const [storageSettings, setStorageSettings] = useState<StorageSettings>(defaultSettings.storage)
  const { setTheme } = useTheme()
  const themeInitialRef = useRef(true)

  // Apply appearance preview (theme + colors) immediately when user changes values
  useEffect(() => {
    if (!appearanceSettings.theme) return

    setTheme(appearanceSettings.theme)

    // skip toast on initial load
    if (themeInitialRef.current) {
      themeInitialRef.current = false
      return
    }

    // Notify user that theme was applied
    toast.success(
      t('settings.appearance.theme_applied', {
        theme: appearanceSettings.theme,
        defaultValue: `Thème appliqué : ${appearanceSettings.theme}`,
      }),
      { duration: 2000 }
    )
  }, [appearanceSettings.theme, setTheme, t])

  useEffect(() => {
    try {
      if (appearanceSettings.primaryColor) {
        document.documentElement.style.setProperty('--primary', appearanceSettings.primaryColor)
      }
      if (appearanceSettings.accentColor) {
        document.documentElement.style.setProperty('--secondary', appearanceSettings.accentColor)
      }
    } catch (e) {
      // ignore errors in SSR or restricted envs
    }
  }, [appearanceSettings.primaryColor, appearanceSettings.accentColor])

  const tabs = [
    { id: 'general' as TabType, name: t('settings.tabs.general'), icon: Cog6ToothIcon },
    { id: 'users' as TabType, name: t('settings.tabs.users'), icon: UserGroupIcon },
    { id: 'notifications' as TabType, name: t('settings.tabs.notifications'), icon: BellIcon },
    { id: 'security' as TabType, name: t('settings.tabs.security'), icon: ShieldCheckIcon },
    { id: 'appearance' as TabType, name: t('settings.tabs.appearance'), icon: PaintBrushIcon },
    { id: 'storage' as TabType, name: t('settings.tabs.storage'), icon: ServerIcon },
  ]

  const applySettings = (settings: Partial<SettingsPayload>) => {
    setGeneralSettings({ ...defaultSettings.general, ...(settings.general ?? {}) })
    setNotificationSettings({ ...defaultSettings.notifications, ...(settings.notifications ?? {}) })
    setSecuritySettings({ ...defaultSettings.security, ...(settings.security ?? {}) })
    setAppearanceSettings({ ...defaultSettings.appearance, ...(settings.appearance ?? {}) })
    setStorageSettings({ ...defaultSettings.storage, ...(settings.storage ?? {}) })
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const payload: SettingsPayload = {
        general: generalSettings,
        notifications: notificationSettings,
        security: securitySettings,
        appearance: appearanceSettings,
        storage: storageSettings,
      }

      const response = await api.put('/admin/settings', payload)
      const saved = (response.data?.data as Partial<SettingsPayload> | undefined) ?? payload
      applySettings(saved)
      void refresh()

      toast.success(t('settings.saved_success'))
    } catch (error) {
      toast.error(t('settings.save_error'))
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await api.get('/admin/settings')
        const settings = response.data?.data as Partial<SettingsPayload> | undefined
        applySettings(settings ?? defaultSettings)
      } catch (error) {
        toast.error(t('settings.load_error'))
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    void loadSettings()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
          <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin" />
          {t('settings.loading')}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t('settings.desc')}</p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving || loading}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
              {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t('settings.saving')}
            </>
          ) : (
            <>
              <CheckCircleIcon className="w-5 h-5" />
              {t('settings.save_button')}
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
                  ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                <tab.icon className="w-5 h-5" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <GlobeAltIcon className="w-4 h-4" />
                      {t('settings.general.site_name')}
                    </label>
                  <input
                    type="text"
                    value={generalSettings.siteName}
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, siteName: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <EnvelopeIcon className="w-4 h-4" />
                    {t('settings.general.admin_email')}
                  </label>
                  <input
                    type="email"
                    value={generalSettings.adminEmail}
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, adminEmail: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    {t('settings.general.site_description')}
                  </label>
                  <textarea
                    value={generalSettings.siteDescription}
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, siteDescription: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    {t('settings.general.site_url')}
                  </label>
                  <input
                    type="url"
                    value={generalSettings.siteUrl}
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, siteUrl: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    {t('settings.general.language')}
                  </label>
                  <select
                    value={generalSettings.language}
                    onChange={(e) => {
                      const lang = e.target.value;
                      setGeneralSettings({ ...generalSettings, language: lang });
                      if (lang === 'ar' || lang === 'fr') {
                        import('i18next').then(i18next => {
                          i18next.default.changeLanguage(lang);
                        });
                        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="fr">{t('settings.languages.fr')}</option>
                    <option value="ar">{t('settings.languages.ar')}</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    {t('settings.general.timezone')}
                  </label>
                  <select
                    value={generalSettings.timezone}
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, timezone: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="Europe/Paris">Europe/Paris</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="Asia/Tokyo">Asia/Tokyo</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    {t('settings.general.items_per_page')}
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={generalSettings.itemsPerPage}
                    onChange={(e) =>
                      setGeneralSettings({
                        ...generalSettings,
                        itemsPerPage: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('settings.general.features_title')}
                </h3>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generalSettings.enableRegistration}
                    onChange={(e) =>
                      setGeneralSettings({
                        ...generalSettings,
                        enableRegistration: e.target.checked,
                      })
                    }
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {t('settings.general.enable_registration.title')}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t('settings.general.enable_registration.desc')}
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generalSettings.enableComments}
                    onChange={(e) =>
                      setGeneralSettings({
                        ...generalSettings,
                        enableComments: e.target.checked,
                      })
                    }
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {t('settings.general.enable_comments.title')}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t('settings.general.enable_comments.desc')}
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generalSettings.requireEmailVerification}
                    onChange={(e) =>
                      setGeneralSettings({
                        ...generalSettings,
                        requireEmailVerification: e.target.checked,
                      })
                    }
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {t('settings.general.require_email_verification.title')}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t('settings.general.require_email_verification.desc')}
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Users Settings */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  {t('settings.users.title')}
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {t('settings.users.desc')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                  <UserGroupIcon className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">3</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{t('settings.users.roles_active')}</div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
                  <ShieldCheckIcon className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-3" />
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">12</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{t('settings.users.permissions')}</div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
                  <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400 mb-3" />
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">10</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{t('settings.users.active_users')}</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('settings.users.available_roles')}
                </h3>
                <div className="space-y-3">
                  {['ADMIN', 'TEACHER', 'STUDENT'].map((role) => (
                    <div
                      key={role}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{role}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {role === 'ADMIN' && t('settings.users.role_desc.admin')}
                          {role === 'TEACHER' && t('settings.users.role_desc.teacher')}
                          {role === 'STUDENT' && t('settings.users.role_desc.student')}
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                        {t('settings.users.status_active')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('settings.notifications.title')}
                </h3>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailNotifications}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        emailNotifications: e.target.checked,
                      })
                    }
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {t('settings.notifications.email_notifications.title')}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t('settings.notifications.email_notifications.desc')}
                    </div>
                  </div>
                </label>

                {notificationSettings.emailNotifications && (
                  <div className="ml-8 space-y-4 pt-4 border-l-2 border-blue-200 dark:border-blue-800 pl-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.newUserNotification}
                        onChange={(e) =>
                          setNotificationSettings({
                            ...notificationSettings,
                            newUserNotification: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {t('settings.notifications.new_user.title')}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          {t('settings.notifications.new_user.desc')}
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.newCommentNotification}
                        onChange={(e) =>
                          setNotificationSettings({
                            ...notificationSettings,
                            newCommentNotification: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {t('settings.notifications.new_comment.title')}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          {t('settings.notifications.new_comment.desc')}
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.newArticleNotification}
                        onChange={(e) =>
                          setNotificationSettings({
                            ...notificationSettings,
                            newArticleNotification: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {t('settings.notifications.new_article.title')}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          {t('settings.notifications.new_article.desc')}
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.systemAlerts}
                        onChange={(e) =>
                          setNotificationSettings({
                            ...notificationSettings,
                            systemAlerts: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {t('settings.notifications.system_alerts.title')}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          {t('settings.notifications.system_alerts.desc')}
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.weeklyReport}
                        onChange={(e) =>
                          setNotificationSettings({
                            ...notificationSettings,
                            weeklyReport: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {t('settings.notifications.weekly_report.title')}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          {t('settings.notifications.weekly_report.desc')}
                        </div>
                      </div>
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheckIcon className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-1">
                      {t('settings.security.title')}
                    </h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {t('settings.security.desc')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {t('settings.security.password_policy')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <KeyIcon className="w-4 h-4" />
                        {t('settings.security.password_min_length')}
                      </label>
                      <input
                        type="number"
                        min="6"
                        max="32"
                        value={securitySettings.passwordMinLength}
                        onChange={(e) =>
                          setSecuritySettings({
                            ...securitySettings,
                            passwordMinLength: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        {t('settings.security.session_timeout')}
                      </label>
                      <input
                        type="number"
                        min="15"
                        max="480"
                        value={securitySettings.sessionTimeout}
                        onChange={(e) =>
                          setSecuritySettings({
                            ...securitySettings,
                            sessionTimeout: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        {t('settings.security.max_login_attempts')}
                      </label>
                      <input
                        type="number"
                        min="3"
                        max="10"
                        value={securitySettings.maxLoginAttempts}
                        onChange={(e) =>
                          setSecuritySettings({
                            ...securitySettings,
                            maxLoginAttempts: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 mt-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={securitySettings.requireSpecialChar}
                        onChange={(e) =>
                          setSecuritySettings({
                            ...securitySettings,
                            requireSpecialChar: e.target.checked,
                          })
                        }
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {t('settings.security.require_special_char.title')}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {t('settings.security.require_special_char.desc')}
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={securitySettings.requireNumber}
                        onChange={(e) =>
                          setSecuritySettings({
                            ...securitySettings,
                            requireNumber: e.target.checked,
                          })
                        }
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {t('settings.security.require_number.title')}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {t('settings.security.require_number.desc')}
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={securitySettings.requireUppercase}
                        onChange={(e) =>
                          setSecuritySettings({
                            ...securitySettings,
                            requireUppercase: e.target.checked,
                          })
                        }
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {t('settings.security.require_uppercase.title')}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {t('settings.security.require_uppercase.desc')}
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={securitySettings.enableTwoFactor}
                        onChange={(e) =>
                          setSecuritySettings({
                            ...securitySettings,
                            enableTwoFactor: e.target.checked,
                          })
                        }
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {t('settings.security.enable_two_factor.title')}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {t('settings.security.enable_two_factor.desc')}
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Liste blanche IP (une par ligne)
                  </label>
                  <textarea
                    value={securitySettings.ipWhitelist}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        ipWhitelist: e.target.value,
                      })
                    }
                    rows={4}
                    placeholder="192.168.1.1&#10;10.0.0.0/24"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Laissez vide pour autoriser toutes les IP. Format: adresse IP ou CIDR
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <PaintBrushIcon className="w-4 h-4" />
                    {t('settings.appearance.theme')}
                  </label>
                  <select
                    value={appearanceSettings.theme}
                    onChange={(e) =>
                      setAppearanceSettings({
                        ...appearanceSettings,
                        theme: e.target.value as 'light' | 'dark' | 'auto',
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="light">{t('settings.appearance.theme_options.light')}</option>
                    <option value="dark">{t('settings.appearance.theme_options.dark')}</option>
                    <option value="auto">{t('settings.appearance.theme_options.auto')}</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    {t('settings.appearance.primary_color')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={appearanceSettings.primaryColor}
                      onChange={(e) =>
                        setAppearanceSettings({
                          ...appearanceSettings,
                          primaryColor: e.target.value,
                        })
                      }
                      className="h-10 w-20 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={appearanceSettings.primaryColor}
                      onChange={(e) =>
                        setAppearanceSettings({
                          ...appearanceSettings,
                          primaryColor: e.target.value,
                        })
                      }
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    {t('settings.appearance.accent_color')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={appearanceSettings.accentColor}
                      onChange={(e) =>
                        setAppearanceSettings({
                          ...appearanceSettings,
                          accentColor: e.target.value,
                        })
                      }
                      className="h-10 w-20 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={appearanceSettings.accentColor}
                      onChange={(e) =>
                        setAppearanceSettings({
                          ...appearanceSettings,
                          accentColor: e.target.value,
                        })
                      }
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={appearanceSettings.enableAnimations}
                    onChange={(e) =>
                      setAppearanceSettings({
                        ...appearanceSettings,
                        enableAnimations: e.target.checked,
                      })
                    }
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {t('settings.appearance.enable_animations.title')}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {t('settings.appearance.enable_animations.desc')}
                      </div>
                    </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={appearanceSettings.compactMode}
                    onChange={(e) =>
                      setAppearanceSettings({
                        ...appearanceSettings,
                        compactMode: e.target.checked,
                      })
                    }
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{t('settings.appearance.compact_mode.title')}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {t('settings.appearance.compact_mode.desc')}
                      </div>
                    </div>
                </label>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t('settings.appearance.preview')}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('settings.appearance.primary_button')}
                    </div>
                    <button
                      style={{ backgroundColor: appearanceSettings.primaryColor }}
                      className="px-4 py-2 text-white rounded-lg font-medium"
                    >
                      {t('settings.appearance.example')}
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('settings.appearance.accent_button')}
                    </div>
                    <button
                      style={{ backgroundColor: appearanceSettings.accentColor }}
                      className="px-4 py-2 text-white rounded-lg font-medium"
                    >
                      {t('settings.appearance.example')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Storage Settings */}
          {activeTab === 'storage' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <CloudArrowUpIcon className="w-4 h-4" />
                    {t('settings.storage.provider')}
                  </label>
                  <select
                    value={storageSettings.provider}
                    onChange={(e) =>
                      setStorageSettings({
                        ...storageSettings,
                        provider: e.target.value as 'local' | 's3' | 'minio',
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="local">{t('settings.storage.provider_options.local')}</option>
                    <option value="s3">{t('settings.storage.provider_options.s3')}</option>
                    <option value="minio">{t('settings.storage.provider_options.minio')}</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    {t('settings.storage.max_file_size')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={storageSettings.maxFileSize}
                    onChange={(e) =>
                      setStorageSettings({
                        ...storageSettings,
                        maxFileSize: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    {t('settings.storage.allowed_extensions')}
                  </label>
                  <input
                    type="text"
                    value={storageSettings.allowedExtensions}
                    onChange={(e) =>
                      setStorageSettings({
                        ...storageSettings,
                        allowedExtensions: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono"
                  />
                </div>
              </div>

              {storageSettings.provider === 's3' && (
                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('settings.storage.s3_title')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        {t('settings.storage.s3_bucket')}
                      </label>
                      <input
                        type="text"
                        value={storageSettings.s3Bucket}
                        onChange={(e) =>
                          setStorageSettings({
                            ...storageSettings,
                            s3Bucket: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        {t('settings.storage.s3_region')}
                      </label>
                      <input
                        type="text"
                        value={storageSettings.s3Region}
                        onChange={(e) =>
                          setStorageSettings({
                            ...storageSettings,
                            s3Region: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        {t('settings.storage.s3_access_key')}
                      </label>
                      <input
                        type="password"
                        value={storageSettings.s3AccessKey}
                        onChange={(e) =>
                          setStorageSettings({
                            ...storageSettings,
                            s3AccessKey: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  {t('settings.storage.info_title')}
                </h4>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>{t('settings.storage.info_used_space')}</span>
                    <span className="font-medium">124 MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('settings.storage.info_file_count')}</span>
                    <span className="font-medium">48</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('settings.storage.info_last_upload')}</span>
                    <span className="font-medium">Il y a 2 heures</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings

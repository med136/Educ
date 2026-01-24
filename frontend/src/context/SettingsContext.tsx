import React, { createContext, useContext, useEffect, useState } from 'react'
import i18n from '../i18n'
import api from '../services/api'
import {
  defaultSettings,
  type PublicSettings,
} from '../types/settings'

interface SettingsContextValue {
  settings: PublicSettings
  loading: boolean
  refresh: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined)

const toPublic = (payload: Partial<PublicSettings> | undefined): PublicSettings => ({
  general: { ...defaultSettings.general, ...(payload?.general ?? {}) },
  appearance: { ...defaultSettings.appearance, ...(payload?.appearance ?? {}) },
  storage: {
    provider: payload?.storage?.provider ?? defaultSettings.storage.provider,
    maxFileSize: payload?.storage?.maxFileSize ?? defaultSettings.storage.maxFileSize,
    allowedExtensions: payload?.storage?.allowedExtensions ?? defaultSettings.storage.allowedExtensions,
    s3Bucket: payload?.storage?.s3Bucket ?? '',
    s3Region: payload?.storage?.s3Region ?? '',
  },
})

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<PublicSettings>(toPublic(defaultSettings))
  const [loading, setLoading] = useState(true)

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await api.get('/settings')
      const data = response.data?.data as Partial<PublicSettings> | undefined
      console.log('Settings loaded from API:', data)
      const publicSettings = toPublic(data)
      setSettings(publicSettings)
      
      // Mettre à jour la langue si elle est définie dans les paramètres
      if (publicSettings.general?.language) {
        const lang = publicSettings.general.language
        if (i18n.language !== lang) {
          void i18n.changeLanguage(lang)
          document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres', error)
      setSettings(toPublic(defaultSettings))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchSettings()
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, loading, refresh: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = (): SettingsContextValue => {
  const ctx = useContext(SettingsContext)
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return ctx
}

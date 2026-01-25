import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSettings } from './SettingsContext'

export type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const THEME_STORAGE_KEY = 'edushare-theme'

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, refresh } = useSettings()
  const [theme, setTheme] = useState<Theme>('light')

  // Determine the effective theme based on settings
  const getEffectiveTheme = (): Theme => {
    const appearanceTheme = settings.appearance?.theme
    if (appearanceTheme === 'light' || appearanceTheme === 'dark') {
      return appearanceTheme
    }
    if (appearanceTheme === 'auto') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      return prefersDark ? 'dark' : 'light'
    }
    // Fallback to stored preference or system preference
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
    if (stored === 'light' || stored === 'dark') {
      return stored
    }
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    return prefersDark ? 'dark' : 'light'
  }

  useEffect(() => {
    const effectiveTheme = getEffectiveTheme()
    setTheme(effectiveTheme)
  }, [settings.appearance?.theme])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = async () => {
    const currentTheme = settings.appearance?.theme
    let newTheme: 'light' | 'dark' | 'auto'

    if (currentTheme === 'auto') {
      newTheme = 'light'
    } else if (currentTheme === 'light') {
      newTheme = 'dark'
    } else {
      newTheme = 'auto'
    }

    // Update settings via API
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appearance: {
            ...settings.appearance,
            theme: newTheme,
          },
        }),
      })

      if (response.ok) {
        await refresh()
      }
    } catch (error) {
      console.error('Failed to update theme setting:', error)
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

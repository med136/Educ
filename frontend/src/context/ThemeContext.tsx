import React, { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'auto'

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const THEME_STORAGE_KEY = 'edushare-theme'

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('auto')

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
    if (stored === 'light' || stored === 'dark' || stored === 'auto') {
      setThemeState(stored)
      return
    }

    // Default to system preference
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    setThemeState(prefersDark ? 'dark' : 'light')
  }, [])

  useEffect(() => {
    const root = document.documentElement

    const mq = window.matchMedia('(prefers-color-scheme: dark)')

    const applyDark = () => {
      if (theme === 'dark') return true
      if (theme === 'light') return false
      // auto -> follow system
      return mq.matches
    }

    const update = () => {
      if (applyDark()) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }

    update()

    // if auto, listen to system changes
    if (mq && mq.addEventListener) {
      const handler = () => {
        if (theme === 'auto') update()
      }
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }

    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const setTheme = (t: Theme) => {
    setThemeState(t)
  }

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
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

import React, { useEffect } from 'react'
import { useSettings } from '../../context/SettingsContext'

const AppearanceApplier: React.FC = () => {
  const { settings } = useSettings()

  useEffect(() => {
    if (settings.appearance) {
      const root = document.documentElement

      // Apply primary color
      root.style.setProperty('--primary', settings.appearance.primaryColor)

      // Apply accent color
      root.style.setProperty('--accent', settings.appearance.accentColor)

      // Apply compact mode
      if (settings.appearance.compactMode) {
        root.classList.add('compact-mode')
      } else {
        root.classList.remove('compact-mode')
      }

      // Apply animations
      if (settings.appearance.enableAnimations) {
        root.classList.remove('no-animations')
      } else {
        root.classList.add('no-animations')
      }
    }
  }, [settings.appearance])

  return null
}

export default AppearanceApplier

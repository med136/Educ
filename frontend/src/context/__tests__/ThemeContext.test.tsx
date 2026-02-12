import React from 'react'
import { render, act } from '@testing-library/react'
import { ThemeProvider, useTheme } from '../ThemeContext'

// jsdom doesn't implement matchMedia; provide a simple mock for tests
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  // @ts-ignore
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })
}

describe('ThemeContext', () => {
  it('applies dark class when setTheme("dark")', () => {
    let setThemeFn: (t: any) => void = () => {}

    function Consumer() {
      const { setTheme } = useTheme()
      setThemeFn = setTheme
      return null
    }

    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>
    )

    act(() => {
      setThemeFn('dark')
    })

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('toggleTheme switches between light and dark', () => {
    let setThemeFn: (t: any) => void = () => {}
    let toggleFn: () => void = () => {}

    function C() {
      const { setTheme, toggleTheme } = useTheme()
      setThemeFn = setTheme
      toggleFn = toggleTheme
      return null
    }

    render(
      <ThemeProvider>
        <C />
      </ThemeProvider>
    )

    act(() => {
      setThemeFn('light')
    })
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    act(() => {
      toggleFn()
    })
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
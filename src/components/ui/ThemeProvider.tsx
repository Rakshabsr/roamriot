'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeCtx {
  theme: Theme
  toggle: () => void
}

const Ctx = createContext<ThemeCtx>({ theme: 'light', toggle: () => {} })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')

  // Initialise from localStorage or system preference
  useEffect(() => {
    const stored = localStorage.getItem('roamriot_theme') as Theme | null
    // Default to dark if no preference stored
    const preferred: Theme = stored ?? 'dark'
    setTheme(preferred)
    applyTheme(preferred)
  }, [])

  function applyTheme(t: Theme) {
    const html = document.documentElement
    if (t === 'dark') html.classList.add('dark')
    else html.classList.remove('dark')
  }

  function toggle() {
    setTheme(prev => {
      const next: Theme = prev === 'light' ? 'dark' : 'light'
      applyTheme(next)
      localStorage.setItem('roamriot_theme', next)
      return next
    })
  }

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>
}

export function useTheme() {
  return useContext(Ctx)
}

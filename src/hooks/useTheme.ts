import { useState, useEffect, useMemo, useSyncExternalStore } from 'react'

type Theme = 'light' | 'dark' | 'system'

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  return (localStorage.getItem('theme') as Theme) || 'system'
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  const resolved = theme === 'system' ? getSystemTheme() : theme

  root.classList.remove('light', 'dark')
  root.classList.add(resolved)
}

// Subscribe to system theme changes
function subscribeToSystemTheme(callback: () => void) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', callback)
  return () => mediaQuery.removeEventListener('change', callback)
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme)

  // Use useSyncExternalStore to track system theme changes
  const systemTheme = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemTheme,
    () => 'light' as const
  )

  // Derive resolvedTheme from theme and systemTheme
  const resolvedTheme = useMemo(
    () => (theme === 'system' ? systemTheme : theme),
    [theme, systemTheme]
  )

  // Apply theme to DOM when it changes
  useEffect(() => {
    applyTheme(theme)
  }, [theme, systemTheme])

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem('theme', newTheme)
    setThemeState(newTheme)
  }

  return { theme, setTheme, resolvedTheme }
}

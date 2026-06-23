'use client'

/**
 * Lightweight theme system  no external dependency.
 *
 * - `theme` is the user's choice: 'light' | 'dark' | 'system'
 * - `resolved` is what's actually applied ('light' | 'dark')
 * - Choice persists to localStorage('mw-theme') and toggles the `.dark`
 *   class on <html>. The matching no-flash script (themeScript) must run in
 *   <head> before paint so there's no lightdark flicker on load.
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

type Theme = 'light' | 'dark' | 'system'
type Resolved = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  resolved: Resolved
  setTheme: (t: Theme) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'mw-theme'

/** Inline script string  render once in <head> to prevent FOUC. */
export const themeScript = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}')||'light';var m=window.matchMedia('(prefers-color-scheme: dark)').matches;var d=t==='dark'||(t==='system'&&m);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`

function systemPrefersDark() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function apply(theme: Theme): Resolved {
  const resolved: Resolved = theme === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : theme
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', resolved === 'dark')
  }
  return resolved
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Default to LIGHT (the expected baseline for a healthcare product); dark is opt-in.
  const [theme, setThemeState] = useState<Theme>('light')
  const [resolved, setResolved] = useState<Resolved>('light')

  // Hydrate from storage on mount.
  useEffect(() => {
    const stored = (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY)) as Theme | null
    const initial: Theme = stored || 'light'
    setThemeState(initial)
    setResolved(apply(initial))
  }, [])

  // React to OS changes while in 'system' mode.
  useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setResolved(apply('system'))
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    try { localStorage.setItem(STORAGE_KEY, t) } catch { /* ignore */ }
    setResolved(apply(t))
  }, [])

  const toggle = useCallback(() => {
    setTheme(resolved === 'dark' ? 'light' : 'dark')
  }, [resolved, setTheme])

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

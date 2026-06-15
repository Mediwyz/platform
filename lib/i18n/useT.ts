'use client'

import { useCallback, useEffect, useState } from 'react'
import { translate, coerceLocale, type Locale } from './translate'
import type { MessageKey } from './dictionaries/en'

/**
 * React hook that resolves the current user's preferred locale (from
 * `/api/auth/me.user.preferences.language` OR `navigator.language`) and
 * returns a memoized `t(key, vars?)` function.
 *
 * Usage:
 *   const t = useT()
 *   <button>{t('workflow.action.accept')}</button>
 *   <p>{t('booking.toast.statusUpdated', { status: stepLabel })}</p>
 *
 * Falls back silently to English on first render + before the user
 * preference resolves - no flicker, no provider boilerplate.
 */
export function useT() {
  const [locale, setLocale] = useState<Locale>('en')

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(j => {
        const lang = j?.user?.preferences?.language ?? j?.user?.regionLanguage
        if (lang) setLocale(coerceLocale(lang))
        else if (typeof navigator !== 'undefined') {
          setLocale(coerceLocale(navigator.language?.slice(0, 2)))
        }
      })
      .catch(() => {
        if (typeof navigator !== 'undefined') {
          setLocale(coerceLocale(navigator.language?.slice(0, 2)))
        }
      })
  }, [])

  const t = useCallback(
    (key: MessageKey | string, vars?: Record<string, string | number>) => translate(key, locale, vars),
    [locale],
  )

  return t
}

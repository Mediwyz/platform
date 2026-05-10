'use client'

/**
 * Lightweight analytics helper.
 *
 * Wraps any analytics provider that exposes a global:
 *   - window.gtag  (Google Analytics 4)
 *   - window.posthog (PostHog)
 *
 * Falls back to console.debug in development so events are always visible
 * without a provider configured.
 *
 * Usage:
 *   trackEvent('discover_tab_switch', { tab: 'services', userId })
 */

export interface AnalyticsProps {
  [key: string]: string | number | boolean | null | undefined
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    posthog?: { capture: (event: string, props?: Record<string, unknown>) => void }
  }
}

export function trackEvent(name: string, props: AnalyticsProps = {}): void {
  if (typeof window === 'undefined') return

  const userId = getUserIdForAnalytics()
  const enriched: AnalyticsProps = {
    ...props,
    userId,
    userType: getUserTypeForAnalytics(),
    platform: 'web',
  }

  if (window.gtag) {
    window.gtag('event', name, enriched)
    return
  }

  if (window.posthog) {
    window.posthog.capture(name, enriched as Record<string, unknown>)
    return
  }

  if (process.env.NODE_ENV === 'development') {
    console.debug(`[analytics] ${name}`, enriched)
  }
}

function getUserIdForAnalytics(): string | null {
  try {
    const stored = localStorage.getItem('mediwyz_user')
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed.id ?? null
    }
  } catch { /* silent */ }
  return null
}

function getUserTypeForAnalytics(): string | null {
  try {
    const stored = localStorage.getItem('mediwyz_user')
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed.userType ?? null
    }
  } catch { /* silent */ }
  return null
}

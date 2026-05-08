import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    integrations: [
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    ],
    // Don't log to console in production
    debug: process.env.NODE_ENV === 'development',
    // Never include PII in breadcrumbs
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === 'console') return null
      return breadcrumb
    },
  })
}

/**
 * Central app configuration - driven by environment variables.
 * Change APP_NAME, APP_DOMAIN etc. in .env to rebrand without touching code.
 */

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || process.env.APP_NAME || 'MediWyz'
export const APP_SHORT_NAME = process.env.NEXT_PUBLIC_APP_SHORT_NAME || process.env.APP_SHORT_NAME || 'MediWyz'
export const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || process.env.APP_DOMAIN || 'mediwyz.com'
export const APP_TAGLINE = process.env.APP_TAGLINE || 'Your trusted healthcare companion'
export const APP_EMAIL = process.env.APP_EMAIL || `info@${APP_DOMAIN}`
export const APP_SUPPORT_EMAIL = process.env.APP_SUPPORT_EMAIL || `support@${APP_DOMAIN}`

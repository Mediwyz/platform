/**
 * Search-page registry (pure data — no React/next imports so it's trivially
 * testable).
 *
 * Provider categories are CRUD-driven: a regional admin creates/edits provider
 * roles, and the generic `ProviderSearchPage` renders any of them from config
 * fetched via `/api/roles`. So a category needs a dedicated page file ONLY when
 * it has a genuinely custom UI (bespoke booking flow, cart, claims, …).
 *
 * `CUSTOM_SEARCH_SLUGS` lists those exceptions. Everything else falls through to
 * the dynamic, role-driven path — no per-category file, no hardcoded config.
 */
export const CUSTOM_SEARCH_SLUGS = [
  'childcare',
  'lab',
  'emergency',
  'medicines',
  'insurance',
  'health-shop',
] as const

export type CustomSearchSlug = (typeof CUSTOM_SEARCH_SLUGS)[number]

export function isCustomSearchSlug(slug: string): slug is CustomSearchSlug {
  return (CUSTOM_SEARCH_SLUGS as readonly string[]).includes(slug)
}

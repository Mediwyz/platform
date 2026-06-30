import { describe, it, expect } from 'vitest'
import { CUSTOM_SEARCH_SLUGS, isCustomSearchSlug } from '../search-registry'

/**
 * Regression guard for the CRUD-driven search refactor: simple provider
 * categories must NOT be hardcoded as custom search pages — they render the
 * generic ProviderSearchPage from /api/roles. Only genuinely-custom UIs keep a
 * dedicated page. If someone re-adds a per-category file/static entry, this
 * fails.
 */
describe('search registry (CRUD-driven provider categories)', () => {
  const CRUD_PROVIDER_SLUGS = [
    'doctors', 'nurses', 'dentists', 'optometrists',
    'nutritionists', 'caregivers', 'physiotherapists',
  ]

  it('keeps simple provider categories OFF the custom list (they are role-driven)', () => {
    for (const slug of CRUD_PROVIDER_SLUGS) {
      expect(isCustomSearchSlug(slug), `${slug} should be CRUD-driven, not a hardcoded custom page`).toBe(false)
    }
  })

  it('lists only the genuinely-custom-UI categories', () => {
    expect([...CUSTOM_SEARCH_SLUGS].sort()).toEqual(
      ['childcare', 'emergency', 'health-shop', 'insurance', 'lab', 'medicines'].sort(),
    )
  })

  it('isCustomSearchSlug recognises custom slugs', () => {
    expect(isCustomSearchSlug('lab')).toBe(true)
    expect(isCustomSearchSlug('emergency')).toBe(true)
    expect(isCustomSearchSlug('doctors')).toBe(false)
    expect(isCustomSearchSlug('unknown-new-role')).toBe(false)
  })
})

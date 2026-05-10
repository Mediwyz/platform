import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// useProviderRoles has a module-level cachedRoles. Reset with vi.resetModules()
// so each test gets a fresh cache.

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const apiRoles = [
  {
    code: 'DOCTOR',
    label: 'Doctors',
    singularLabel: 'Doctor',
    slug: 'doctors',
    searchPath: '/search/providers?type=DOCTOR',
    icon: '🩺',
    color: '#001E40',
    providerCount: 10,
    bookingEnabled: true,
    specialties: [{ name: 'Cardiology', description: null }],
  },
  {
    code: 'NURSE',
    label: 'Nurses',
    singularLabel: 'Nurse',
    slug: 'nurses',
    searchPath: '/search/providers?type=NURSE',
    icon: '💉',
    color: '#0C6780',
    providerCount: 5,
    bookingEnabled: true,
    specialties: [],
  },
]

describe('useProviderRoles', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    vi.resetModules()
  })

  it('starts with loading=true and empty roles', async () => {
    // Slow fetch so we can catch the loading state
    let resolve!: (v: unknown) => void
    mockFetch.mockReturnValue(new Promise(r => { resolve = r }))

    const { useProviderRoles } = await import('../useProviderRoles')
    const { result } = renderHook(() => useProviderRoles())

    expect(result.current.loading).toBe(true)
    expect(result.current.roles).toHaveLength(0)

    resolve({ json: () => Promise.resolve({ success: true, data: apiRoles }) })
  })

  it('fetches roles and sets loading=false when done', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ success: true, data: apiRoles }),
    })

    const { useProviderRoles } = await import('../useProviderRoles')
    const { result } = renderHook(() => useProviderRoles())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.roles).toHaveLength(2)
  })

  it('normalizes code → role for backward compat', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ success: true, data: apiRoles }),
    })

    const { useProviderRoles } = await import('../useProviderRoles')
    const { result } = renderHook(() => useProviderRoles())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.roles[0].role).toBe('DOCTOR')
    expect(result.current.roles[0].code).toBe('DOCTOR')
  })

  it('includes specialties on each role', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ success: true, data: apiRoles }),
    })

    const { useProviderRoles } = await import('../useProviderRoles')
    const { result } = renderHook(() => useProviderRoles())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.roles[0].specialties).toEqual([{ name: 'Cardiology', description: null }])
  })

  it('returns empty roles and loading=false on network failure', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    const { useProviderRoles } = await import('../useProviderRoles')
    const { result } = renderHook(() => useProviderRoles())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.roles).toHaveLength(0)
  })

  it('returns empty roles and loading=false when API returns success=false', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ success: false, message: 'Unauthorized' }),
    })

    const { useProviderRoles } = await import('../useProviderRoles')
    const { result } = renderHook(() => useProviderRoles())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.roles).toHaveLength(0)
  })

  it('queries the correct endpoint', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ success: true, data: [] }),
    })

    const { useProviderRoles } = await import('../useProviderRoles')
    renderHook(() => useProviderRoles())

    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(
      '/api/roles?isProvider=true&bookingEnabled=true',
    ))
  })
})

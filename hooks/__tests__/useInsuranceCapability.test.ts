import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

vi.mock('@/hooks/useUser', () => ({
  useUser: vi.fn(),
}))

import { useUser } from '@/hooks/useUser'
import { useInsuranceCapability } from '../useInsuranceCapability'

const mockUseUser = vi.mocked(useUser)

const makeUser = (id = 'U001') => ({
  user: { id, firstName: 'A', lastName: 'B', email: 'a@b.com', userType: 'MEMBER' },
  loading: false,
  updateUser: vi.fn(),
  clearUser: vi.fn(),
})

describe('useInsuranceCapability', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('returns has=false and loading=false immediately when no user is logged in', async () => {
    mockUseUser.mockReturnValue({ user: null, loading: false, updateUser: vi.fn(), clearUser: vi.fn() })

    const { result } = renderHook(() => useInsuranceCapability())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.has).toBe(false)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns has=true when the API confirms insurance ownership', async () => {
    mockUseUser.mockReturnValue(makeUser())
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ data: { hasCapability: true } }),
    })

    const { result } = renderHook(() => useInsuranceCapability())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.has).toBe(true)
  })

  it('returns has=false when the API says no capability', async () => {
    mockUseUser.mockReturnValue(makeUser())
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ data: { hasCapability: false } }),
    })

    const { result } = renderHook(() => useInsuranceCapability())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.has).toBe(false)
  })

  it('returns has=false when the API call throws', async () => {
    mockUseUser.mockReturnValue(makeUser())
    mockFetch.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useInsuranceCapability())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.has).toBe(false)
  })

  it('calls the correct endpoint with credentials', async () => {
    mockUseUser.mockReturnValue(makeUser())
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ data: { hasCapability: false } }),
    })

    renderHook(() => useInsuranceCapability())

    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(
      '/api/corporate/insurance-capability',
      { credentials: 'include' },
    ))
  })

  it('capability check is independent per user - MEMBER can own insurance', async () => {
    mockUseUser.mockReturnValue(makeUser('MEMBER001'))
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ data: { hasCapability: true } }),
    })

    const { result } = renderHook(() => useInsuranceCapability())

    await waitFor(() => expect(result.current.loading).toBe(false))
    // Capability is not tied to userType - any user can own an insurance company
    expect(result.current.has).toBe(true)
  })
})

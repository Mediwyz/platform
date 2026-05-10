import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

vi.mock('@/hooks/useUser', () => ({
  useUser: vi.fn(),
}))

import { useUser } from '@/hooks/useUser'
import { useCorporateCapability } from '../useCorporateCapability'

const mockUseUser = vi.mocked(useUser)

const makeUser = (id = 'U001') => ({
  user: { id, firstName: 'A', lastName: 'B', email: 'a@b.com', userType: 'MEMBER' },
  loading: false,
  updateUser: vi.fn(),
  clearUser: vi.fn(),
})

describe('useCorporateCapability', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('returns has=false and loading=false immediately when no user is logged in', async () => {
    mockUseUser.mockReturnValue({ user: null, loading: false, updateUser: vi.fn(), clearUser: vi.fn() })

    const { result } = renderHook(() => useCorporateCapability())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.has).toBe(false)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns has=true when the API confirms the capability', async () => {
    mockUseUser.mockReturnValue(makeUser())
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ data: { hasCapability: true } }),
    })

    const { result } = renderHook(() => useCorporateCapability())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.has).toBe(true)
  })

  it('returns has=false when the API says no capability', async () => {
    mockUseUser.mockReturnValue(makeUser())
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ data: { hasCapability: false } }),
    })

    const { result } = renderHook(() => useCorporateCapability())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.has).toBe(false)
  })

  it('returns has=false when the API call throws', async () => {
    mockUseUser.mockReturnValue(makeUser())
    mockFetch.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useCorporateCapability())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.has).toBe(false)
  })

  it('calls the correct endpoint with credentials', async () => {
    mockUseUser.mockReturnValue(makeUser())
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ data: { hasCapability: false } }),
    })

    renderHook(() => useCorporateCapability())

    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(
      '/api/corporate/capability',
      { credentials: 'include' },
    ))
  })

  it('re-fetches when userId changes', async () => {
    const { rerender } = renderHook(
      ({ id }: { id: string | null }) => {
        mockUseUser.mockReturnValue(
          id ? makeUser(id) : { user: null, loading: false, updateUser: vi.fn(), clearUser: vi.fn() },
        )
        return useCorporateCapability()
      },
      { initialProps: { id: null as string | null } },
    )

    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ data: { hasCapability: true } }),
    })

    rerender({ id: 'NEW_USER' })

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from '../useAuth'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const STORAGE_KEY = 'mediwyz_user'

const sampleUser = {
  id: 'PAT001',
  firstName: 'Emma',
  lastName: 'Johnson',
  email: 'emma@mediwyz.com',
  userType: 'MEMBER',
}

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear()
    mockFetch.mockReset()
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) })
  })

  it('returns null user when nothing is stored', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })

  it('reads stored user from localStorage on mount', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleUser))
    const { result } = renderHook(() => useAuth())
    expect(result.current.user).toMatchObject(sampleUser)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.isLoading).toBe(false)
  })

  it('login() saves user to localStorage and marks authenticated', () => {
    const { result } = renderHook(() => useAuth())
    act(() => result.current.login(sampleUser))
    expect(result.current.user).toMatchObject(sampleUser)
    expect(result.current.isAuthenticated).toBe(true)
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(stored).toMatchObject(sampleUser)
  })

  it('logout() calls the API, clears user, and marks unauthenticated', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleUser))
    const { result } = renderHook(() => useAuth())

    expect(result.current.isAuthenticated).toBe(true)

    await act(() => result.current.logout())

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/auth/logout',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('logout() clears user even when the API call throws', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleUser))
    const { result } = renderHook(() => useAuth())

    await act(() => result.current.logout())

    expect(result.current.user).toBeNull()
  })

  it('isLoading is false immediately after mount', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.isLoading).toBe(false)
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

// useUser has a module-level cachedUser. Reset with vi.resetModules() + dynamic import
// so each test starts with a clean module state.

const STORAGE_KEY = 'mediwyz_user'

const sampleUser = {
  id: 'PAT001',
  firstName: 'Emma',
  lastName: 'Johnson',
  email: 'emma@mediwyz.com',
  userType: 'MEMBER',
  verified: true,
}

describe('useUser', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('returns null user when nothing is stored', async () => {
    const { useUser } = await import('../useUser')
    const { result } = renderHook(() => useUser())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.user).toBeNull()
  })

  it('returns user from localStorage on mount', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleUser))
    const { useUser } = await import('../useUser')
    const { result } = renderHook(() => useUser())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.user).toMatchObject(sampleUser)
  })

  it('updateUser() merges partial data and persists to localStorage', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleUser))
    const { useUser } = await import('../useUser')
    const { result } = renderHook(() => useUser())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => result.current.updateUser({ firstName: 'Updated' }))

    expect(result.current.user?.firstName).toBe('Updated')
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(stored.firstName).toBe('Updated')
    expect(stored.email).toBe('emma@mediwyz.com')
  })

  it('updateUser() is a no-op when user is null', async () => {
    const { useUser } = await import('../useUser')
    const { result } = renderHook(() => useUser())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => result.current.updateUser({ firstName: 'Ghost' }))

    expect(result.current.user).toBeNull()
  })

  it('clearUser() nullifies user and removes localStorage entries', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleUser))
    localStorage.setItem('mediwyz_token', 'tok_abc')
    localStorage.setItem('mediwyz_userType', 'MEMBER')

    const { useUser } = await import('../useUser')
    const { result } = renderHook(() => useUser())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => result.current.clearUser())

    expect(result.current.user).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(localStorage.getItem('mediwyz_token')).toBeNull()
  })

  it('getUserId() returns the id from localStorage', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleUser))
    const { getUserId } = await import('../useUser')
    expect(getUserId()).toBe('PAT001')
  })

  it('getUserId() returns null when nothing stored', async () => {
    const { getUserId } = await import('../useUser')
    expect(getUserId()).toBeNull()
  })
})

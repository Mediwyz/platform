import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDashboardUser } from '../useDashboardUser'

const STORAGE_KEY = 'mediwyz_user'

describe('useDashboardUser', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when no user is stored', () => {
    const { result } = renderHook(() => useDashboardUser())
    expect(result.current).toBeNull()
  })

  it('returns parsed user from localStorage', () => {
    const raw = {
      id: 'PAT001',
      firstName: 'Marie',
      lastName: 'Dupont',
      email: 'marie@mediwyz.com',
      userType: 'MEMBER',
      profileImage: '/img/avatar.jpg',
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(raw))

    const { result } = renderHook(() => useDashboardUser())

    expect(result.current).toMatchObject({
      id: 'PAT001',
      firstName: 'Marie',
      lastName: 'Dupont',
      email: 'marie@mediwyz.com',
      userType: 'MEMBER',
      profileImage: '/img/avatar.jpg',
    })
  })

  it('defaults email to empty string when missing from stored data', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      id: 'P002',
      firstName: 'No',
      lastName: 'Email',
      userType: 'MEMBER',
    }))

    const { result } = renderHook(() => useDashboardUser())
    expect(result.current?.email).toBe('')
  })

  it('defaults profileImage to null when missing from stored data', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      id: 'P003',
      firstName: 'A',
      lastName: 'B',
      email: 'a@b.com',
      userType: 'MEMBER',
    }))

    const { result } = renderHook(() => useDashboardUser())
    expect(result.current?.profileImage).toBeNull()
  })

  it('handles extra fields in storage without breaking', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      id: 'D001',
      firstName: 'Dr',
      lastName: 'Smith',
      email: 'dr@mediwyz.com',
      userType: 'DOCTOR',
      profileImage: null,
      someOtherField: 'ignored',
    }))

    const { result } = renderHook(() => useDashboardUser())
    expect(result.current?.id).toBe('D001')
    expect(result.current?.userType).toBe('DOCTOR')
  })
})

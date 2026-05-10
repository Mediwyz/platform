import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useCurrency } from '../useCurrency'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('useCurrency', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('returns MUR defaults when no userId provided', () => {
    const { result } = renderHook(() => useCurrency())
    expect(result.current.currency).toBe('MUR')
    expect(result.current.symbol).toBe('Rs')
    expect(result.current.loading).toBe(false)
  })

  it('starts loading when userId is provided', () => {
    mockFetch.mockResolvedValue({ json: () => Promise.resolve({ success: false }) })
    const { result } = renderHook(() => useCurrency('USER001'))
    expect(result.current.loading).toBe(true)
  })

  it('updates currency from API response', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ success: true, data: { currency: 'KES' } }),
    })
    const { result } = renderHook(() => useCurrency('USER001'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.currency).toBe('KES')
    expect(result.current.symbol).toBe('KSh')
  })

  it('falls back to MUR when API returns no currency', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ success: true, data: {} }),
    })
    const { result } = renderHook(() => useCurrency('USER001'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.currency).toBe('MUR')
  })

  it('falls back to MUR when API call throws', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    const { result } = renderHook(() => useCurrency('USER001'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.currency).toBe('MUR')
  })

  it('calls the wallet endpoint with the correct userId', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ success: true, data: { currency: 'MGA' } }),
    })
    renderHook(() => useCurrency('PAT001'))
    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(
      '/api/users/PAT001/wallet',
      { credentials: 'include' },
    ))
  })

  it('format() returns correctly formatted MUR amount', () => {
    const { result } = renderHook(() => useCurrency())
    expect(result.current.format(500)).toBe('Rs 500')
  })

  it('format() respects the active currency', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ success: true, data: { currency: 'KES' } }),
    })
    const { result } = renderHook(() => useCurrency('USER001'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.format(1000)).toContain('KSh')
  })

  it('does not call fetch when userId is undefined', () => {
    renderHook(() => useCurrency(undefined))
    expect(mockFetch).not.toHaveBeenCalled()
  })
})

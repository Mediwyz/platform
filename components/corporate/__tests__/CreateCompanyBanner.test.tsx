import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import CreateCompanyBanner from '../CreateCompanyBanner'

describe('CreateCompanyBanner', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('hides banner when user already owns a company', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { company: { companyName: 'Acme Corp' } } }),
    } as Response)

    const { container } = render(<CreateCompanyBanner userId="u1" />)
    await waitFor(() => {
      expect(container.textContent).not.toContain('Start managing your company')
    })
  })

  it('shows banner + create form when no company exists', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { company: null, stats: {} } }),
    } as Response)

    render(<CreateCompanyBanner userId="u1" />)
    await waitFor(() => {
      expect(screen.getByText(/Start managing your company/)).toBeDefined()
    })

    fireEvent.click(screen.getByRole('button', { name: /Create Company/i }))
    expect(screen.getByLabelText(/Company name/i)).toBeDefined()
  })

  it('submits the form and calls onCreated', async () => {
    const fetchMock = vi.fn()
      // 1. GET /api/corporate/:id/dashboard → no company
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { company: null } }),
      } as Response)
      // 2. GET /api/subscriptions?type=corporate → empty plan list (loads when form opens)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] }),
      } as Response)
      // 3. POST /api/corporate/companies → created
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: 'c1' } }),
      } as Response)
    global.fetch = fetchMock

    const onCreated = vi.fn()
    render(<CreateCompanyBanner userId="u1" onCreated={onCreated} />)
    await waitFor(() => screen.getByRole('button', { name: /Create Company/i }))

    fireEvent.click(screen.getByRole('button', { name: /Create Company/i }))
    const nameInput = screen.getByLabelText(/Company name/i) as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: 'Acme' } })
    fireEvent.click(screen.getByRole('button', { name: /^Create$/i }))

    await waitFor(() => expect(onCreated).toHaveBeenCalled())
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/corporate/companies',
      expect.objectContaining({ method: 'POST' }),
    )
  })
})

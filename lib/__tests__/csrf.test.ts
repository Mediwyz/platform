import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateCsrfToken, verifyCsrfToken, validateCsrf, setCsrfCookie } from '@/lib/auth/csrf'
import { NextRequest, NextResponse } from 'next/server'

describe('generateCsrfToken', () => {
  it('generates a token with three dot-separated parts', () => {
    const token = generateCsrfToken()
    const parts = token.split('.')
    expect(parts).toHaveLength(3)
  })

  it('generates unique tokens on each call', () => {
    const token1 = generateCsrfToken()
    const token2 = generateCsrfToken()
    expect(token1).not.toBe(token2)
  })

  it('includes a timestamp in the token', () => {
    const before = Date.now()
    const token = generateCsrfToken()
    const after = Date.now()

    const timestamp = parseInt(token.split('.')[1], 10)
    expect(timestamp).toBeGreaterThanOrEqual(before)
    expect(timestamp).toBeLessThanOrEqual(after)
  })

  it('has a random component as hex string', () => {
    const token = generateCsrfToken()
    const random = token.split('.')[0]
    // 32 bytes as hex = 64 characters
    expect(random).toHaveLength(64)
    expect(random).toMatch(/^[0-9a-f]+$/)
  })

  it('has an HMAC signature as hex string', () => {
    const token = generateCsrfToken()
    const signature = token.split('.')[2]
    // SHA-256 HMAC as hex = 64 characters
    expect(signature).toHaveLength(64)
    expect(signature).toMatch(/^[0-9a-f]+$/)
  })
})

describe('verifyCsrfToken', () => {
  it('returns true for a freshly generated token', () => {
    const token = generateCsrfToken()
    expect(verifyCsrfToken(token)).toBe(true)
  })

  it('returns false for an empty string', () => {
    expect(verifyCsrfToken('')).toBe(false)
  })

  it('returns false for a malformed token (wrong number of parts)', () => {
    expect(verifyCsrfToken('only-one-part')).toBe(false)
    expect(verifyCsrfToken('two.parts')).toBe(false)
    expect(verifyCsrfToken('four.parts.here.extra')).toBe(false)
  })

  it('returns false for a token with tampered signature', () => {
    const token = generateCsrfToken()
    const parts = token.split('.')
    parts[2] = 'a'.repeat(64) // Replace signature with fake one
    expect(verifyCsrfToken(parts.join('.'))).toBe(false)
  })

  it('returns false for a token with tampered random data', () => {
    const token = generateCsrfToken()
    const parts = token.split('.')
    parts[0] = 'b'.repeat(64) // Replace random with different value
    expect(verifyCsrfToken(parts.join('.'))).toBe(false)
  })

  it('returns false for a token with tampered timestamp', () => {
    const token = generateCsrfToken()
    const parts = token.split('.')
    parts[1] = '0' // Replace timestamp
    expect(verifyCsrfToken(parts.join('.'))).toBe(false)
  })

  it('returns false for an expired token', () => {
    // Create a token that appears to be from 5 hours ago (past the 4-hour expiry)
    const fiveHoursAgo = Date.now() - 5 * 60 * 60 * 1000

    // We need to mock Date.now for the generation, then restore it
    const originalNow = Date.now
    vi.spyOn(Date, 'now').mockReturnValue(fiveHoursAgo)
    const token = generateCsrfToken()
    vi.mocked(Date.now).mockRestore()
    Date.now = originalNow

    expect(verifyCsrfToken(token)).toBe(false)
  })

  it('returns true for a token within the 4-hour window', () => {
    // Create a token that appears to be from 3 hours ago (within the 4-hour expiry)
    const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000

    const originalNow = Date.now
    vi.spyOn(Date, 'now').mockReturnValue(threeHoursAgo)
    const token = generateCsrfToken()
    vi.mocked(Date.now).mockRestore()
    Date.now = originalNow

    expect(verifyCsrfToken(token)).toBe(true)
  })

  it('returns false when timestamp is not a number', () => {
    const token = generateCsrfToken()
    const parts = token.split('.')
    parts[1] = 'not-a-number'
    expect(verifyCsrfToken(parts.join('.'))).toBe(false)
  })
})

describe('validateCsrf', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null for GET requests (no validation needed)', () => {
    const request = new NextRequest('http://localhost:3000/api/data', {
      method: 'GET',
    })
    expect(validateCsrf(request)).toBeNull()
  })

  it('returns null for HEAD requests', () => {
    const request = new NextRequest('http://localhost:3000/api/data', {
      method: 'HEAD',
    })
    expect(validateCsrf(request)).toBeNull()
  })

  it('returns null for OPTIONS requests', () => {
    const request = new NextRequest('http://localhost:3000/api/data', {
      method: 'OPTIONS',
    })
    expect(validateCsrf(request)).toBeNull()
  })

  it('returns 403 for POST without CSRF token', async () => {
    const request = new NextRequest('http://localhost:3000/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const response = validateCsrf(request)

    expect(response).not.toBeNull()
    expect(response!.status).toBe(403)

    const data = await response!.json()
    expect(data.success).toBe(false)
    expect(data.message).toBe('Missing CSRF token')
  })

  it('returns 403 when cookie and header tokens do not match', async () => {
    const token1 = generateCsrfToken()
    const token2 = generateCsrfToken()

    const request = new NextRequest('http://localhost:3000/api/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': token2,
        cookie: `mediwyz_csrf=${token1}`,
      },
    })
    const response = validateCsrf(request)

    expect(response).not.toBeNull()
    expect(response!.status).toBe(403)

    const data = await response!.json()
    expect(data.message).toBe('CSRF token mismatch')
  })

  it('returns null (valid) when cookie and header match with valid token', () => {
    const token = generateCsrfToken()

    const request = new NextRequest('http://localhost:3000/api/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': token,
        cookie: `mediwyz_csrf=${token}`,
      },
    })

    expect(validateCsrf(request)).toBeNull()
  })

  it('returns 403 when tokens match but token is expired', async () => {
    // Create an expired token
    const fiveHoursAgo = Date.now() - 5 * 60 * 60 * 1000
    const originalNow = Date.now
    vi.spyOn(Date, 'now').mockReturnValue(fiveHoursAgo)
    const expiredToken = generateCsrfToken()
    vi.mocked(Date.now).mockRestore()
    Date.now = originalNow

    const request = new NextRequest('http://localhost:3000/api/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': expiredToken,
        cookie: `mediwyz_csrf=${expiredToken}`,
      },
    })
    const response = validateCsrf(request)

    expect(response).not.toBeNull()
    expect(response!.status).toBe(403)

    const data = await response!.json()
    expect(data.message).toBe('Invalid or expired CSRF token')
  })

  it('validates PUT requests', async () => {
    const request = new NextRequest('http://localhost:3000/api/data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    })
    const response = validateCsrf(request)

    expect(response).not.toBeNull()
    expect(response!.status).toBe(403)
  })

  it('validates DELETE requests', async () => {
    const request = new NextRequest('http://localhost:3000/api/data', {
      method: 'DELETE',
    })
    const response = validateCsrf(request)

    expect(response).not.toBeNull()
    expect(response!.status).toBe(403)
  })

  it('validates PATCH requests', async () => {
    const request = new NextRequest('http://localhost:3000/api/data', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    })
    const response = validateCsrf(request)

    expect(response).not.toBeNull()
    expect(response!.status).toBe(403)
  })
})

describe('setCsrfCookie', () => {
  it('sets a csrf cookie on the response', () => {
    const response = NextResponse.json({ ok: true })
    const result = setCsrfCookie(response)

    const cookieHeader = result.headers.get('set-cookie')
    expect(cookieHeader).toBeTruthy()
    expect(cookieHeader).toContain('mediwyz_csrf=')
  })

  it('sets the cookie with path=/', () => {
    const response = NextResponse.json({ ok: true })
    const result = setCsrfCookie(response)

    const cookieHeader = result.headers.get('set-cookie')
    expect(cookieHeader).toContain('Path=/')
  })

  it('sets SameSite=Strict', () => {
    const response = NextResponse.json({ ok: true })
    const result = setCsrfCookie(response)

    const cookieHeader = result.headers.get('set-cookie')?.toLowerCase() || ''
    expect(cookieHeader).toContain('samesite=strict')
  })

  it('does not set httpOnly (client needs to read it)', () => {
    const response = NextResponse.json({ ok: true })
    const result = setCsrfCookie(response)

    const cookieHeader = result.headers.get('set-cookie') || ''
    // httpOnly=false means the HttpOnly flag should NOT be present
    expect(cookieHeader.toLowerCase()).not.toContain('httponly')
  })
})

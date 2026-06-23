'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { FaHospital, FaSpinner, FaCheckCircle, FaTimesCircle, FaSignInAlt } from 'react-icons/fa'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────────────────────────

interface InvitationInfo {
  id: string
  invitedEmail: string
  suggestedRole: string | null
  status: string
  expiresAt: string | null
  isExpired: boolean
  alreadyAccepted: boolean
  inviterName: string | null
  entity: {
    id: string
    name: string
    type: string
    city: string | null
    logoUrl: string | null
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function OrganizationJoinPage() {
  const params = useParams()
  const token = params.token as string
  const router = useRouter()

  const [info, setInfo] = useState<InvitationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [acceptError, setAcceptError] = useState<string | null>(null)

  const isLoggedIn = !!getCookie('mediwyz_token')

  useEffect(() => {
    async function fetchInvitation() {
      try {
        const res = await fetch(`/api/organizations/invitations/${token}`)
        const json = await res.json()
        if (!json.success) throw new Error(json.message ?? 'Invitation not found')
        setInfo(json.data)
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : 'Could not load invitation')
      } finally {
        setLoading(false)
      }
    }
    fetchInvitation()
  }, [token])

  async function handleAccept() {
    setAccepting(true)
    setAcceptError(null)
    try {
      const res = await fetch(`/api/organizations/invitations/${token}/accept`, {
        method: 'POST',
        credentials: 'include',
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message ?? 'Could not accept invitation')
      setAccepted(true)
      // Redirect to provider dashboard after a short pause
      setTimeout(() => {
        const userType = getCookie('mediwyz_userType') ?? 'patient'
        router.push(`/${userType}/feed`)
      }, 2200)
    } catch (err) {
      setAcceptError(err instanceof Error ? err.message : 'Failed to accept invitation')
    } finally {
      setAccepting(false)
    }
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-subtle flex items-center justify-center">
        <FaSpinner className="text-[#0C6780] text-3xl animate-spin" />
      </div>
    )
  }

  // ── Fetch error ──
  if (fetchError) {
    return (
      <Shell>
        <FaTimesCircle className="text-5xl text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-fg mb-2">Invitation Not Found</h2>
        <p className="text-soft text-sm mb-6">{fetchError}</p>
        <Link href="/" className="text-sm font-medium text-[#0C6780] hover:underline">
          Back to home
        </Link>
      </Shell>
    )
  }

  if (!info) return null

  // ── Already accepted ──
  if (info.alreadyAccepted) {
    return (
      <Shell>
        <FaCheckCircle className="text-5xl text-green-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-fg mb-2">Already Accepted</h2>
        <p className="text-soft text-sm mb-6">This invitation has already been accepted.</p>
        <Link href="/" className="text-sm font-medium text-[#0C6780] hover:underline">
          Go to home
        </Link>
      </Shell>
    )
  }

  // ── Expired ──
  if (info.isExpired || isExpired(info.expiresAt)) {
    return (
      <Shell>
        <FaTimesCircle className="text-5xl text-amber-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-fg mb-2">Invitation Expired</h2>
        <p className="text-soft text-sm mb-6">This invitation link has expired. Ask the entity admin to send a new one.</p>
        <Link href="/" className="text-sm font-medium text-[#0C6780] hover:underline">
          Back to home
        </Link>
      </Shell>
    )
  }

  // ── Success state ──
  if (accepted) {
    return (
      <Shell>
        <FaCheckCircle className="text-5xl text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-fg mb-2">Welcome to {info.entity.name}!</h2>
        <p className="text-soft text-sm">Your membership request is pending approval by the admin.</p>
        <p className="text-faint text-xs mt-3">Redirecting to your dashboard…</p>
      </Shell>
    )
  }

  // ── Main invitation view ──
  return (
    <div className="min-h-screen bg-subtle flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl shadow-xl border border-line max-w-md w-full overflow-hidden">
        {/* Header banner */}
        <div className="bg-gradient-to-br from-[#001E40] to-[#0C6780] px-6 py-8 text-center">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-4 overflow-hidden">
            {info.entity.logoUrl ? (
              <Image
                src={info.entity.logoUrl}
                alt={info.entity.name}
                width={80}
                height={80}
                unoptimized
                className="object-cover w-full h-full"
              />
            ) : (
              <FaHospital className="text-white text-3xl" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-white">{info.entity.name}</h1>
          <p className="text-white/60 text-sm mt-1">{info.entity.type}</p>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <p className="text-center text-soft text-sm leading-relaxed">
            {info.inviterName ? (
              <><strong>{info.inviterName}</strong> has invited you to join <strong>{info.entity.name}</strong>.</>
            ) : (
              <>You&apos;ve been invited to join <strong>{info.entity.name}</strong>.</>
            )}
          </p>

          {info.suggestedRole && (
            <div className="mt-4 bg-[#9AE1FF]/20 border border-[#9AE1FF]/40 rounded-xl px-4 py-3 text-center">
              <p className="text-xs font-medium text-fg uppercase tracking-wide">Suggested Role</p>
              <p className="text-[#0C6780] font-semibold mt-0.5">{info.suggestedRole}</p>
            </div>
          )}

          {info.expiresAt && (
            <p className="text-xs text-faint text-center mt-3">
              Expires {new Date(info.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}

          <div className="mt-6 space-y-3">
            {!isLoggedIn ? (
              <>
                <p className="text-sm text-center text-soft">You need to log in to accept this invitation.</p>
                <Link
                  href={`/login?redirect=/organization/join/${token}`}
                  className="flex items-center justify-center gap-2 w-full bg-[#0C6780] hover:bg-[#0a5568] text-white px-5 py-3 rounded-xl font-semibold text-sm transition-colors"
                >
                  <FaSignInAlt /> Log in to Accept
                </Link>
                <Link
                  href={`/signup?redirect=/organization/join/${token}`}
                  className="flex items-center justify-center w-full border border-[#0C6780] text-[#0C6780] hover:bg-[#0C6780]/5 px-5 py-3 rounded-xl font-semibold text-sm transition-colors"
                >
                  Create an Account
                </Link>
              </>
            ) : (
              <>
                {acceptError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">
                    {acceptError}
                  </p>
                )}
                <button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="flex items-center justify-center gap-2 w-full bg-[#0C6780] hover:bg-[#0a5568] text-white px-5 py-3 rounded-xl font-semibold text-sm disabled:opacity-60 transition-colors"
                >
                  {accepting ? (
                    <><FaSpinner className="animate-spin" /> Accepting…</>
                  ) : (
                    <><FaCheckCircle /> Accept Invitation</>
                  )}
                </button>
                <Link
                  href="/"
                  className="flex items-center justify-center w-full text-soft hover:text-soft text-sm py-2 transition-colors"
                >
                  Decline
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Shell layout ─────────────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-subtle flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl shadow-xl border border-line max-w-sm w-full p-8 text-center">
        {children}
      </div>
    </div>
  )
}

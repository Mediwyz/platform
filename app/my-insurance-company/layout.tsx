'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { FaChartLine, FaShieldAlt, FaFileAlt, FaArrowLeft } from 'react-icons/fa'
import { useInsuranceCapability } from '@/hooks/useInsuranceCapability'

/**
 * Capability-gated layout for insurance-company owners. Accessible to ANY
 * user with `insurance-capability`, regardless of their `userType` - 
 * members, providers, admins who have created an insurance company can all
 * manage it here. Redirects everyone else away.
 */
const NAV = [
  { href: '/my-insurance-company/analytics', label: 'Analytics', icon: FaChartLine },
  { href: '/my-insurance-company/claims', label: 'Claims', icon: FaFileAlt },
  { href: '/my-insurance-company/pre-auths', label: 'Pre-auths', icon: FaShieldAlt },
]

export default function MyInsuranceCompanyLayout({ children }: { children: React.ReactNode }) {
  const { has, loading } = useInsuranceCapability()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !has) router.replace('/login?msg=insurance-capability-required')
  }, [has, loading, router])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-6 w-6 border-2 border-[#0C6780] border-t-transparent rounded-full" />
    </div>
  )
  if (!has) return null

  return (
    <div className="min-h-screen bg-subtle">
      <header className="bg-surface border-b border-line">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-subtle rounded-lg text-soft"
              aria-label="Back"
            >
              <FaArrowLeft />
            </button>
            <h1 className="text-sm font-bold text-fg">My Insurance Company</h1>
          </div>
          <nav className="flex gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 text-xs font-medium text-soft hover:bg-subtle rounded-lg inline-flex items-center gap-1.5"
              >
                <item.icon className="text-[10px]" /> {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}

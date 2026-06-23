'use client'

import { useState, useEffect } from 'react'
import { FaBuilding, FaPlus, FaTimes, FaShieldAlt } from 'react-icons/fa'

interface Plan {
  id: string
  name: string
  price: number
  currency: string
}

/**
 * Inline CTA banner + company-creation form.
 * Any user may create a company now that CORPORATE_ADMIN is a capability.
 * Supports:
 *   - Subscription plan picker (corporate/enterprise plans curated by regional admin)
 *   - Optional insurance-company toggle with fixed monthly contribution
 */
export default function CreateCompanyBanner({
  userId,
  onCreated,
}: {
  userId: string
  onCreated?: () => void
}) {
  const [show, setShow] = useState(false)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [form, setForm] = useState({
    companyName: '',
    registrationNumber: '',
    industry: '',
    employeeCount: '10',
    subscriptionPlanId: '',
    isInsuranceCompany: false,
    monthlyContribution: '0',
    coverageDescription: '',
  })

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/corporate/${userId}/dashboard`, { credentials: 'include' })
        const json = await res.json()
        if (cancelled) return
        const hasCompany = !!json?.data?.company?.companyName
        setShow(!hasCompany)
      } catch { /* ignore */ }
    })()
    return () => { cancelled = true }
  }, [userId])

  // Load curated corporate/enterprise plans when the form opens.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/subscriptions?type=corporate', { credentials: 'include' })
        const json = await res.json()
        if (cancelled) return
        const list = Array.isArray(json?.data) ? json.data : []
        setPlans(list.map((p: any) => ({
          id: p.id, name: p.name,
          price: Number(p.price ?? 0),
          currency: p.currency ?? 'MUR',
        })))
      } catch { /* ignore */ }
    })()
    return () => { cancelled = true }
  }, [open])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        companyName: form.companyName,
        registrationNumber: form.registrationNumber || undefined,
        industry: form.industry || undefined,
        employeeCount: parseInt(form.employeeCount, 10) || 1,
        subscriptionPlanId: form.subscriptionPlanId || undefined,
        isInsuranceCompany: form.isInsuranceCompany,
      }
      if (form.isInsuranceCompany) {
        body.monthlyContribution = parseFloat(form.monthlyContribution) || 0
        body.coverageDescription = form.coverageDescription || undefined
      }
      const res = await fetch('/api/corporate/companies', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.message || 'Failed to create company')
        return
      }
      setShow(false)
      setOpen(false)
      onCreated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setBusy(false)
    }
  }

  if (!show) return null

  return (
    <div className="bg-gradient-to-br from-[#0C6780] to-[#001E40] text-white rounded-xl p-5 mb-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="bg-white/10 p-3 rounded-lg">
          <FaBuilding className="text-2xl" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg mb-1">Start managing your company</h3>
          <p className="text-sm text-white/80 mb-3">
            Register a company to invite members, apply a group plan to everyone, and optionally run it as an insurance scheme with monthly member contributions.
          </p>
          {!open ? (
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 bg-surface text-[#0C6780] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-subtle transition-colors"
            >
              <FaPlus className="text-xs" /> Create Company
            </button>
          ) : (
            <form onSubmit={submit} className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white/10 rounded-lg p-4">
              <label className="block">
                <span className="text-xs font-medium text-white/90">Company name *</span>
                <input
                  required
                  value={form.companyName}
                  onChange={e => setForm(s => ({ ...s, companyName: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-surface text-fg text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-white/90">Registration number</span>
                <input
                  value={form.registrationNumber}
                  onChange={e => setForm(s => ({ ...s, registrationNumber: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-surface text-fg text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-white/90">Industry</span>
                <input
                  value={form.industry}
                  onChange={e => setForm(s => ({ ...s, industry: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-surface text-fg text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-white/90">Approx. employees</span>
                <input
                  type="number" min="1"
                  value={form.employeeCount}
                  onChange={e => setForm(s => ({ ...s, employeeCount: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-surface text-fg text-sm"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="text-xs font-medium text-white/90">Subscription plan (applies to all members)</span>
                <select
                  value={form.subscriptionPlanId}
                  onChange={e => setForm(s => ({ ...s, subscriptionPlanId: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-surface text-fg text-sm"
                >
                  <option value=""> - No group plan - </option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.currency} {p.price}/member)
                    </option>
                  ))}
                </select>
              </label>

              <label className="sm:col-span-2 flex items-center gap-2 mt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isInsuranceCompany}
                  onChange={e => setForm(s => ({ ...s, isInsuranceCompany: e.target.checked }))}
                  className="w-4 h-4 accent-white"
                />
                <FaShieldAlt className="text-white/90" />
                <span className="text-sm text-white">This is an insurance company (members pay monthly contributions)</span>
              </label>

              {form.isInsuranceCompany && (
                <>
                  <label className="block">
                    <span className="text-xs font-medium text-white/90">Monthly contribution (MUR) *</span>
                    <input
                      type="number" min="0" step="1"
                      required
                      value={form.monthlyContribution}
                      onChange={e => setForm(s => ({ ...s, monthlyContribution: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-surface text-fg text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-white/90">Coverage description</span>
                    <input
                      value={form.coverageDescription}
                      onChange={e => setForm(s => ({ ...s, coverageDescription: e.target.value }))}
                      placeholder="e.g. Hospitalization, outpatient, dental"
                      className="mt-1 w-full px-3 py-2 rounded-lg bg-surface text-fg text-sm"
                    />
                  </label>
                </>
              )}

              {error && (
                <div className="sm:col-span-2 bg-red-500/20 border border-red-300 text-red-100 text-xs px-3 py-2 rounded-lg flex items-center justify-between">
                  <span>{error}</span>
                  <button type="button" onClick={() => setError(null)}><FaTimes /></button>
                </div>
              )}
              <div className="sm:col-span-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy || !form.companyName.trim()}
                  className="px-4 py-2 rounded-lg bg-surface text-[#0C6780] text-sm font-semibold hover:bg-subtle disabled:bg-gray-300 disabled:text-soft"
                >
                  {busy ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

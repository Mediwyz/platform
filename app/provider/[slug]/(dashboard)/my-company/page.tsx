'use client'

import { useState, useEffect, useCallback } from 'react'
import { getUserId } from '@/hooks/useUser'
import {
  FaBuilding, FaUsers, FaIdCard, FaIndustry, FaPlus,
  FaCheckCircle, FaClock, FaEnvelope, FaSearch, FaUserPlus,
} from 'react-icons/fa'
import InsuranceMembersTable from '@/components/corporate/InsuranceMembersTable'
import CompanyAnalytics from '@/components/corporate/CompanyAnalytics'
import CompanyDangerZone from '@/components/corporate/CompanyDangerZone'
import MyOrganisationsOverview from '@/components/corporate/MyOrganisationsOverview'
import MyOrganisationsList from '@/components/corporate/MyOrganisationsList'

interface Company {
  id: string
  companyName: string
  registrationNumber: string | null
  industry: string | null
  employeeCount: number
}

interface Employee {
  id: string
  userId: string
  status: string
  user: { firstName: string; lastName: string; email: string }
}

interface Plan {
  id: string
  name: string
  description: string | null
  type: string
  price: number
  currency: string
  billingCycle: string
}

export default function MyCompanyPage() {
  const [company, setCompany] = useState<Company | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form state for company creation
  const [form, setForm] = useState({
    companyName: '',
    registrationNumber: '',
    industry: '',
    employeeCount: 0,
    isInsuranceCompany: false,
    monthlyContribution: 500,
  })

  const userId = getUserId()

  const fetchCompany = useCallback(async () => {
    if (!userId) return
    try {
      // Check if user has a company via corporate dashboard
      const res = await fetch(`/api/corporate/${userId}/dashboard`, { credentials: 'include' })
      if (res.ok) {
        const json = await res.json()
        // Backend returns: { company, stats, wallet, billingMethods, recentTransactions, notifications }
        if (json.success && json.data?.company) {
          setCompany(json.data.company)
          // Fetch employees/members
          const empRes = await fetch(`/api/corporate/${userId}/members`, { credentials: 'include' })
          if (empRes.ok) {
            const empJson = await empRes.json()
            // Backend returns: { id, userId, status, user: { firstName, lastName, email } }
            if (empJson.success) setEmployees(empJson.data || [])
          }
        }
      }
    } catch {
      // No company yet
    } finally {
      setLoading(false)
    }
  }, [userId])

  const fetchPlans = useCallback(async () => {
    try {
      // Look up the current user's region so we only show plans priced in
      // their currency. Without this filter, every region's plans appear
      // (MUR + KES + XOF + RWF + MGA - creates the duplicate-plan illusion).
      let countryCode: string | null = null
      try {
        const meRes = await fetch('/api/auth/me', { credentials: 'include' })
        const meJson = await meRes.json()
        countryCode = meJson?.user?.regionCode ?? null
      } catch { /* fall through - show plans anyway */ }

      const qs = new URLSearchParams({ type: 'corporate' })
      if (countryCode) qs.set('countryCode', countryCode)
      const res = await fetch(`/api/subscriptions?${qs.toString()}`)
      if (res.ok) {
        const json = await res.json()
        if (json.success) setPlans(json.data || [])
      }
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchCompany()
    fetchPlans()
  }, [fetchCompany, fetchPlans])

  const handleCreate = async () => {
    if (!form.companyName.trim()) {
      setMessage({ type: 'error', text: 'Company name is required' })
      return
    }
    setCreating(true)
    setMessage(null)
    try {
      const res = await fetch('/api/corporate/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          // Only send monthlyContribution when it's actually an insurance company.
          monthlyContribution: form.isInsuranceCompany ? form.monthlyContribution : undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setCompany(json.data)
        setMessage({ type: 'success', text: 'Company page created successfully!' })
      } else {
        setMessage({ type: 'error', text: json.message || 'Failed to create company' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setCreating(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviting(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/corporate/${userId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })
      const json = await res.json()
      if (json.success) {
        setMessage({ type: 'success', text: `Invitation sent to ${inviteEmail}` })
        setInviteEmail('')
        fetchCompany()
      } else {
        setMessage({ type: 'error', text: json.message || 'Failed to invite' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' })
    } finally {
      setInviting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-line rounded w-48 mb-4" />
          <div className="h-4 bg-subtle rounded w-96 mb-8" />
          <div className="h-64 bg-subtle rounded-2xl" />
        </div>
      </div>
    )
  }

  // No corporate/insurance company yet: still show the user's healthcare
  // organisations (clinics/hospitals/clinics) overview, then the company creation form.
  if (!company) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        {/* 1  Organisations you belong to (clinics, pharmacies, labs) */}
        <MyOrganisationsList />
        {/* 2  Create or join a healthcare organisation */}
        <MyOrganisationsOverview />

        {/* 3  Corporate company  a SEPARATE, optional concern from the
            healthcare organisations above (employer / insurer entity). */}
        <div className="flex items-center gap-3 mb-2 mt-10 pt-6 border-t border-line">
          <FaBuilding className="text-2xl text-[#0C6780]" />
          <h1 className="text-2xl font-bold text-fg">Company &amp; insurance</h1>
        </div>
        <p className="text-soft mb-8">
          Different from the healthcare organisations above, separate from them, create a company to run employee wellness programs, enrol your team in corporate health plans, or operate as a health insurer.
        </p>

        {message && (
          <div className={`p-4 rounded-xl mb-6 ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {message.text}
          </div>
        )}

        <div className="bg-surface rounded-2xl border border-line shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-soft mb-1.5">
              <FaBuilding className="inline mr-1.5 text-faint" /> Company Name *
            </label>
            <input
              type="text"
              value={form.companyName}
              onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
              className="w-full px-4 py-2.5 border border-line rounded-xl focus:ring-2 focus:ring-[#0C6780] focus:border-transparent outline-none"
              placeholder="e.g. MediCorp Mauritius Ltd"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-soft mb-1.5">
              <FaIdCard className="inline mr-1.5 text-faint" /> Company Registration Number
            </label>
            <input
              type="text"
              value={form.registrationNumber}
              onChange={e => setForm(f => ({ ...f, registrationNumber: e.target.value }))}
              className="w-full px-4 py-2.5 border border-line rounded-xl focus:ring-2 focus:ring-[#0C6780] focus:border-transparent outline-none"
              placeholder="e.g. BRN-2024-00123"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-soft mb-1.5">
                <FaIndustry className="inline mr-1.5 text-faint" /> Industry
              </label>
              <select
                value={form.industry}
                onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
                className="w-full px-4 py-2.5 border border-line rounded-xl focus:ring-2 focus:ring-[#0C6780] focus:border-transparent outline-none bg-surface"
              >
                <option value="">Select industry</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Technology">Technology</option>
                <option value="Finance">Finance</option>
                <option value="Education">Education</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
                <option value="Hospitality">Hospitality</option>
                <option value="Government">Government</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-soft mb-1.5">
                <FaUsers className="inline mr-1.5 text-faint" /> Number of Employees
              </label>
              <input
                type="number"
                min={0}
                value={form.employeeCount}
                onChange={e => setForm(f => ({ ...f, employeeCount: parseInt(e.target.value) || 0 }))}
                className="w-full px-4 py-2.5 border border-line rounded-xl focus:ring-2 focus:ring-[#0C6780] focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/*  Insurance-company toggle  */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isInsuranceCompany}
                onChange={(e) => setForm((f) => ({ ...f, isInsuranceCompany: e.target.checked }))}
                className="mt-1 w-4 h-4 text-[#0C6780] rounded border-line focus:ring-[#0C6780]"
              />
              <div>
                <div className="text-sm font-semibold text-fg">This is an insurance company</div>
                <p className="text-xs text-soft mt-0.5">
                  Tick this if your company sells health insurance plans. Members will pay a monthly contribution,
                  file claims through MediWyz, and receive reimbursements to their Account Balance. You&apos;ll get
                  access to <strong>Analytics</strong>, <strong>Pre-authorizations</strong>, and claim review tools.
                </p>
              </div>
            </label>
            {form.isInsuranceCompany && (
              <div>
                <label className="block text-xs font-semibold text-soft mb-1.5">
                  Monthly contribution per member
                </label>
                <input
                  type="number" min={0}
                  value={form.monthlyContribution}
                  onChange={(e) => setForm((f) => ({ ...f, monthlyContribution: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-line rounded-lg text-sm focus:ring-2 focus:ring-[#0C6780] focus:border-transparent outline-none"
                  placeholder="500"
                />
                <p className="text-[11px] text-soft mt-1">
                  Amount debited from each member&apos;s Account Balance every month. You can adjust later.
                </p>
              </div>
            )}
          </div>

          {plans.length > 0 && !form.isInsuranceCompany && (
            <div>
              <h3 className="text-sm font-semibold text-soft mb-3">Available Corporate Plans</h3>
              <div className="grid gap-3">
                {plans.map(plan => (
                  <div key={plan.id} className="p-4 border border-line rounded-xl bg-subtle">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-fg">{plan.name}</h4>
                        {plan.description && <p className="text-xs text-soft">{plan.description}</p>}
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-[#0C6780]">{plan.currency} {plan.price}</span>
                        <span className="text-xs text-faint">/{plan.billingCycle}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-faint mt-2">You can enroll employees in a plan after creating your company page.</p>
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={creating || !form.companyName.trim()}
            className="w-full py-3 bg-[#0C6780] text-white font-semibold rounded-xl hover:bg-[#0a5568] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {creating ? (
              <><span className="animate-spin">&#9696;</span> Creating...</>
            ) : (
              <><FaPlus /> Create Company Page</>
            )}
          </button>
        </div>
      </div>
    )
  }

  // Company exists: show management dashboard
  const activeEmployees = employees.filter(e => e.status === 'active')
  const pendingEmployees = employees.filter(e => e.status === 'pending')

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#0C6780]/10 flex items-center justify-center">
          <FaBuilding className="text-xl text-[#0C6780]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-fg">{company.companyName}</h1>
          <p className="text-sm text-soft">
            {company.industry && `${company.industry}  `}
            {company.registrationNumber && `Reg: ${company.registrationNumber}`}
          </p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl mb-6 ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {message.text}
        </div>
      )}

      {/* Organisations you belong to, then create/join more */}
      <MyOrganisationsList />
      <MyOrganisationsOverview />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface rounded-xl border border-line p-4">
          <div className="flex items-center gap-2 text-sm text-soft mb-1">
            <FaUsers className="text-[#0C6780]" /> Total Employees
          </div>
          <p className="text-2xl font-bold text-fg">{activeEmployees.length}</p>
        </div>
        <div className="bg-surface rounded-xl border border-line p-4">
          <div className="flex items-center gap-2 text-sm text-soft mb-1">
            <FaClock className="text-amber-500" /> Pending
          </div>
          <p className="text-2xl font-bold text-fg">{pendingEmployees.length}</p>
        </div>
        <div className="bg-surface rounded-xl border border-line p-4">
          <div className="flex items-center gap-2 text-sm text-soft mb-1">
            <FaCheckCircle className="text-green-500" /> Active
          </div>
          <p className="text-2xl font-bold text-fg">{activeEmployees.length}</p>
        </div>
      </div>

      {/* Invite employee */}
      <div className="bg-surface rounded-2xl border border-line shadow-sm p-6 mb-8">
        <h2 className="text-lg font-bold text-fg mb-4 flex items-center gap-2">
          <FaUserPlus className="text-[#0C6780]" /> Invite Employee
        </h2>
        <p className="text-sm text-soft mb-4">Search by email to invite someone to your company. They will receive a notification to accept.</p>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-faint text-sm" />
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleInvite()}
              className="w-full pl-9 pr-4 py-2.5 border border-line rounded-xl focus:ring-2 focus:ring-[#0C6780] focus:border-transparent outline-none"
              placeholder="Enter employee email address"
            />
          </div>
          <button
            onClick={handleInvite}
            disabled={inviting || !inviteEmail.trim()}
            className="px-5 py-2.5 bg-[#0C6780] text-white font-medium rounded-xl hover:bg-[#0a5568] disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <FaEnvelope className="text-sm" />
            {inviting ? 'Sending...' : 'Invite'}
          </button>
        </div>
      </div>

      <CompanyAnalytics />

      {/* Insurance members table - rendered only when this company is flagged as insurance. */}
      <div className="mb-8">
        <InsuranceMembersTable />
      </div>

      {/* Employee list */}
      <div className="bg-surface rounded-2xl border border-line shadow-sm p-6">
        <h2 className="text-lg font-bold text-fg mb-4 flex items-center gap-2">
          <FaUsers className="text-[#0C6780]" /> Employees ({employees.length})
        </h2>
        {employees.length === 0 ? (
          <p className="text-faint text-center py-8">No employees yet. Invite team members using their email address above.</p>
        ) : (
          <div className="divide-y divide-line">
            {employees.map(emp => (
              <div key={emp.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-line flex items-center justify-center text-sm font-bold text-soft">
                    {emp.user.firstName[0]}{emp.user.lastName[0]}
                  </div>
                  <div>
                    <p className="font-medium text-fg">{emp.user.firstName} {emp.user.lastName}</p>
                    <p className="text-xs text-faint">{emp.user.email}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  emp.status === 'active' ? 'bg-green-100 text-green-700' :
                  emp.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  'bg-subtle text-soft'
                }`}>
                  {emp.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {company && (
        <CompanyDangerZone
          companyId={company.id}
          companyName={company.companyName}
          onChanged={fetchCompany}
        />
      )}
    </div>
  )
}

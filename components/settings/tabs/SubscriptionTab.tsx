'use client'

import { useState, useEffect, useCallback } from 'react'
import { FaCrown, FaCheckCircle, FaSpinner, FaExchangeAlt } from 'react-icons/fa'
import { getCurrencySymbol } from '@/lib/currency'

interface Plan {
 id: string
 name: string
 slug: string
 type: string
 price: number
 currency: string
 gpConsultsPerMonth: number
 specialistConsultsPerMonth: number
 nurseConsultsPerMonth: number
 mentalHealthConsultsPerMonth: number
 features: string[]
}

interface CurrentSubscription {
 hasSubscription: boolean
 status?: string
 plan?: Plan
 usage?: Record<string, number>
}

// Keep the old interface for backward compatibility
export interface SubscriptionPlan {
 id: string
 name: string
 price: number
 currency?: string
 period: 'monthly' | 'yearly'
 features: string[]
 isCurrent?: boolean
}

interface SubscriptionTabProps {
 plans?: SubscriptionPlan[]
 currentPlanId?: string
 userId?: string
}

const SubscriptionTab: React.FC<SubscriptionTabProps> = ({ userId }) => {
 const [current, setCurrent] = useState<CurrentSubscription | null>(null)
 const [individualPlans, setIndividualPlans] = useState<Plan[]>([])
 const [corporatePlans, setCorporatePlans] = useState<Plan[]>([])
 const [, setIsCorporateAdmin] = useState(false)
 const [isCorporateEmployee, setIsCorporateEmployee] = useState(false)
 const [loading, setLoading] = useState(true)
 const [changing, setChanging] = useState(false)
 const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

 const fetchData = useCallback(async () => {
 if (!userId) return
 setLoading(true)
 try {
 // Step 1: Get user info (region) + corporate capability check.
 // Capability — not role — so any user who owns a company / has a
 // corporate subscription sees corporate plans here.
 const [userRes, capRes] = await Promise.all([
 fetch(`/api/users/${userId}`, { credentials: 'include' }),
 fetch('/api/corporate/capability', { credentials: 'include' }).catch(() => null),
 ])
 const userJson = await userRes.json()
 const capJson = capRes ? await capRes.json().catch(() => null) : null
 let countryParam = ''
 const isCorpAdmin = !!capJson?.data?.hasCapability
 setIsCorporateAdmin(isCorpAdmin)

 if (userJson.success && userJson.data?.regionId) {
 const regionRes = await fetch(`/api/regions/${userJson.data.regionId}`)
 const regionJson = await regionRes.json()
 if (regionJson.success && regionJson.data?.countryCode) {
 countryParam = `&countryCode=${regionJson.data.countryCode}`
 }
 }

 // Step 2: Fetch subscription + individual plans (always)
 const [subRes, indRes] = await Promise.all([
 fetch(`/api/users/${userId}/subscription`, { credentials: 'include' }),
 fetch(`/api/subscriptions?type=individual${countryParam}`),
 ])
 const subJson = await subRes.json()
 const indJson = await indRes.json()

 if (subJson.success) {
 setCurrent(subJson.data)
 // Check if user is a corporate employee (subscription paid by employer)
 if (subJson.data?.hasSubscription && subJson.data?.plan?.type === 'corporate') {
 setIsCorporateEmployee(true)
 }
 }
 if (indJson.success) setIndividualPlans(indJson.data)

 // Step 3: Only fetch corporate plans for corporate admins
 if (isCorpAdmin) {
 const corpRes = await fetch(`/api/subscriptions?type=corporate${countryParam}`)
 const corpJson = await corpRes.json()
 if (corpJson.success) setCorporatePlans(corpJson.data)
 }
 } catch {
 // silent
 } finally {
 setLoading(false)
 }
 }, [userId])

 useEffect(() => { fetchData() }, [fetchData])

 const handleChangePlan = async (planId: string) => {
 if (!userId) return
 setChanging(true)
 setMessage(null)
 try {
 const res = await fetch(`/api/users/${userId}/subscription`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ action: current?.hasSubscription ? 'change' : 'subscribe', planId }),
 credentials: 'include',
 })
 const json = await res.json()
 if (json.success) {
 setMessage({ type: 'success', text: json.message || 'Plan updated successfully' })
 fetchData()
 } else {
 setMessage({ type: 'error', text: json.message || 'Failed to change plan' })
 }
 } catch {
 setMessage({ type: 'error', text: 'Network error' })
 } finally {
 setChanging(false)
 }
 }

 const handleCancel = async () => {
 if (!userId || !confirm('Are you sure you want to cancel your subscription?')) return
 setChanging(true)
 try {
 const res = await fetch(`/api/users/${userId}/subscription`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ action: 'cancel' }),
 credentials: 'include',
 })
 const json = await res.json()
 if (json.success) {
 setMessage({ type: 'success', text: 'Subscription cancelled' })
 fetchData()
 } else {
 setMessage({ type: 'error', text: json.message || 'Failed to cancel' })
 }
 } catch {
 setMessage({ type: 'error', text: 'Network error' })
 } finally {
 setChanging(false)
 }
 }

 if (loading) {
 return (
 <div className="flex items-center justify-center py-12">
 <FaSpinner className="animate-spin text-blue-500 text-xl" />
 </div>
 )
 }

 const currentPlanId = current?.plan?.id

 return (
 <div>
 <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
 <FaCrown className="text-yellow-500" /> Subscription Management
 </h2>

 {/* Current plan summary */}
 {current?.hasSubscription && current.plan ? (
 <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
 <div className="flex items-center justify-between flex-wrap gap-2">
 <div>
 <p className="text-sm text-blue-600 font-medium">Current Plan</p>
 <p className="text-lg font-bold text-gray-900">{current.plan.name}</p>
 <p className="text-sm text-gray-600">
 {getCurrencySymbol(current.plan.currency)} {current.plan.price.toLocaleString()}/month
 {current.status === 'active' && <span className="ml-2 text-green-600 font-medium">Active</span>}
 </p>
 </div>
 {isCorporateEmployee ? (
 <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
 Managed by employer
 </span>
 ) : (
 <button
 onClick={handleCancel}
 disabled={changing}
 className="text-sm text-red-500 hover:text-red-700 underline"
 >
 Cancel Plan
 </button>
 )}
 </div>

 {/* Usage summary — dynamic from quotas */}
 {current.usage?.quotas && ((current.usage as unknown as { quotas: { key: string; label: string; used: number; limit: number }[] }).quotas).length > 0 && (
 <div className="mt-3 pt-3 border-t border-blue-200 grid grid-cols-2 sm:grid-cols-3 gap-2">
 {((current.usage as unknown as { quotas: { key: string; label: string; used: number; limit: number }[] }).quotas).map(q => (
 <div key={q.key} className="text-xs">
 <span className="text-gray-500">{q.label}:</span>{' '}
 <span className="font-medium">{q.used}/{q.limit === -1 ? '∞' : q.limit}</span>
 </div>
 ))}
 </div>
 )}
 </div>
 ) : (
 <p className="mb-6 text-sm text-gray-500">You don&apos;t have an active subscription. Choose a plan below.</p>
 )}

 {message && (
 <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
 {message.text}
 </div>
 )}

 {/* MediWyz For You — Individual Plans */}
 {individualPlans.length > 0 && (
 <div className="mb-8">
 <div className="mb-4">
 <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
 <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm">
 <FaCrown />
 </span>
 MediWyz For You
 </h3>
 <p className="text-sm text-gray-500 mt-1">Personal health plans for individuals</p>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
 {individualPlans.map((plan) => renderPlanCard(plan, currentPlanId))}
 </div>
 </div>
 )}

 {/* MediWyz For Business — only visible to Corporate Admins */}
 {corporatePlans.length > 0 && (
 <div>
 <div className="mb-4">
 <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
 <span className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-sm">
 <FaCrown />
 </span>
 MediWyz For Business
 </h3>
 <p className="text-sm text-gray-500 mt-1">Corporate wellness plans — employer pays per employee</p>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
 {corporatePlans.map((plan) => renderPlanCard(plan, currentPlanId))}
 </div>
 </div>
 )}
 </div>
 )

 function renderPlanCard(plan: Plan, activePlanId?: string) {
 const isCurrent = activePlanId === plan.id
 const sym = getCurrencySymbol(plan.currency)
 return (
 <div
 key={plan.id}
 className={`border rounded-xl p-5 transition-all ${
 isCurrent ? 'border-blue-500 ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-lg'
 }`}
 >
 <h4 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h4>
 <p className="text-2xl font-bold mb-3">
 {plan.price > 0 ? `${sym} ${plan.price.toLocaleString()}` : 'Free'}
 <span className="text-sm font-normal text-gray-500">
 {plan.type === 'corporate' ? '/employee/mo' : '/month'}
 </span>
 </p>
 <ul className="space-y-1.5 text-gray-600 mb-5 text-sm">
 {(plan.features as string[]).slice(0, 6).map((feature) => (
 <li key={feature} className="flex items-start gap-2">
 <FaCheckCircle className="text-green-500 flex-shrink-0 mt-0.5 text-xs" /> {feature}
 </li>
 ))}
 {(plan.features as string[]).length > 6 && (
 <li className="text-xs text-gray-400">+{(plan.features as string[]).length - 6} more</li>
 )}
 </ul>
 {isCurrent ? (
 <div className="w-full py-2 rounded-lg font-semibold bg-blue-600 text-white text-center text-sm">
 Current Plan
 </div>
 ) : isCorporateEmployee ? (
 <div className="w-full py-2 rounded-lg font-semibold bg-gray-100 text-gray-400 text-center text-sm">
 Managed by employer
 </div>
 ) : (
 <button
 onClick={() => handleChangePlan(plan.id)}
 disabled={changing}
 className="w-full py-2 rounded-lg font-semibold bg-gray-200 text-gray-800 hover:bg-gray-300 transition flex items-center justify-center gap-2 text-sm"
 >
 {changing ? <FaSpinner className="animate-spin" /> : <FaExchangeAlt className="text-xs" />}
 {current?.hasSubscription ? 'Switch Plan' : 'Subscribe'}
 </button>
 )}
 </div>
 )
 }
}

export default SubscriptionTab

'use client'

import { useState, useEffect } from 'react'
import { FaCrown, FaCheckCircle, FaSpinner } from 'react-icons/fa'

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
 nutritionConsultsPerMonth: number
 ambulanceFreePerMonth: number
 discounts: Record<string, number> | null
 features: string[]
}

interface SubscriptionStepProps {
 regionId?: string
 userType: string
 selectedPlanId?: string
 selectedBusinessPlanId?: string
 onSelectPlan: (planId: string | undefined) => void
 onSelectBusinessPlan: (planId: string | undefined) => void
}

export default function SubscriptionStep({
 regionId,
 selectedPlanId,
 selectedBusinessPlanId,
 onSelectPlan,
 onSelectBusinessPlan,
}: SubscriptionStepProps) {
 const [individualPlans, setIndividualPlans] = useState<Plan[]>([])
 const [corporatePlans, setCorporatePlans] = useState<Plan[]>([])
 const [loading, setLoading] = useState(true)

 // Corporate-admin is a capability acquired AFTER signup (by creating a
 // company). Signup only ever picks an individual plan - users can upgrade
 // via the Settings  Subscription tab once they have a company.
 const isCorporate = false

 useEffect(() => {
 async function fetchPlans() {
 setLoading(true)
 try {
 // Fetch plans - use countryCode from regionId if available
 let countryParam = ''
 if (regionId) {
 const regionRes = await fetch(`/api/regions/${regionId}`)
 const regionJson = await regionRes.json()
 if (regionJson.success && regionJson.data?.countryCode) {
 countryParam = `&countryCode=${regionJson.data.countryCode}`
 }
 }

 const individualRes = await fetch(`/api/subscriptions?type=individual${countryParam}`)
 const individualJson = await individualRes.json()
 if (individualJson.success) {
 setIndividualPlans(individualJson.data)
 }

 if (isCorporate) {
 const corpRes = await fetch(`/api/subscriptions?type=corporate${countryParam}`)
 const corpJson = await corpRes.json()
 if (corpJson.success) {
 setCorporatePlans(corpJson.data)
 }
 }
 } catch {
 // Plans will be empty - user can skip
 } finally {
 setLoading(false)
 }
 }
 fetchPlans()
 }, [regionId, isCorporate])

 const formatPrice = (price: number, currency: string) => {
 const symbols: Record<string, string> = {
 MUR: 'Rs', MGA: 'Ar', KES: 'KSh', XOF: 'CFA', RWF: 'FRw', USD: '$', EUR: '',
 }
 return `${symbols[currency] || currency} ${Math.round(price).toLocaleString()}`
 }

 const renderPlanCards = (
 plans: Plan[],
 selected: string | undefined,
 onSelect: (id: string | undefined) => void,
 title: string
 ) => (
 <div className="mb-8">
 <h3 className="text-lg font-semibold text-fg mb-4">{title}</h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
 {plans.map((plan) => {
 const isSelected = selected === plan.id
 return (
 <button
 key={plan.id}
 type="button"
 onClick={() => onSelect(isSelected ? undefined : plan.id)}
 className={`border rounded-xl p-5 text-left transition-all ${
 isSelected
 ? 'border-blue-500 ring-2 ring-blue-500 bg-blue-50'
 : 'border-line hover:border-blue-300 hover:shadow-md'
 }`}
 >
 <div className="flex items-center justify-between mb-3">
 <h4 className="text-base font-bold text-fg">{plan.name}</h4>
 {isSelected && <FaCheckCircle className="text-blue-500" />}
 </div>
 <p className="text-2xl font-bold text-fg mb-1">
 {formatPrice(plan.price, plan.currency)}
 <span className="text-sm font-normal text-soft">/mo</span>
 </p>
 <div className="mt-3 space-y-1.5">
 {plan.features.slice(0, 6).map((feature) => (
 <div key={feature} className="flex items-start gap-2 text-sm text-soft">
 <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0 text-xs" />
 <span>{feature}</span>
 </div>
 ))}
 {plan.features.length > 6 && (
 <p className="text-xs text-faint">+{plan.features.length - 6} more features</p>
 )}
 </div>
 </button>
 )
 })}
 </div>
 </div>
 )

 if (loading) {
 return (
 <div className="flex flex-col items-center justify-center py-12">
 <FaSpinner className="animate-spin text-blue-500 text-2xl mb-3" />
 <p className="text-soft">Loading subscription plans...</p>
 </div>
 )
 }

 return (
 <div>
 <div className="flex items-center gap-2 mb-6">
 <FaCrown className="text-yellow-500 text-xl" />
 <h2 className="text-xl font-bold text-fg">Choose Your Plan</h2>
 </div>

 <p className="text-soft text-sm mb-6">
 Select a subscription plan to get started. You can also skip this and choose later from your settings.
 </p>

 {/* Individual/Personal Plan */}
 {individualPlans.length > 0 &&
 renderPlanCards(
 individualPlans,
 selectedPlanId,
 onSelectPlan,
 isCorporate ? 'Your Personal Plan' : 'MediWyz For You'
 )}

 {/* Corporate Plans (only for corporate admin) */}
 {isCorporate && corporatePlans.length > 0 &&
 renderPlanCards(
 corporatePlans,
 selectedBusinessPlanId,
 onSelectBusinessPlan,
 'MediWyz For Business'
 )}

 {/* Skip option */}
 <div className="text-center mt-4">
 <button
 type="button"
 onClick={() => {
 onSelectPlan(undefined)
 onSelectBusinessPlan(undefined)
 }}
 className="text-sm text-soft hover:text-soft underline"
 >
 Skip for now - choose a plan later
 </button>
 </div>
 </div>
 )
}

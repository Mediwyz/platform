'use client'

import { useState, useEffect, useCallback } from 'react'
import { FaCrown, FaPlus, FaEdit, FaToggleOn, FaToggleOff, FaSpinner, FaCheckCircle, FaTimes, FaMagic } from 'react-icons/fa'
import { useDashboardUser } from '@/hooks/useDashboardUser'
import { getCurrencySymbol } from '@/lib/currency'

interface PlanService {
 isFree: boolean
 adminPrice: number | null
 monthlyLimit: number
 discountPercent: number
 platformService: { id: string; serviceName: string; category: string; defaultPrice: number; providerType: string } | null
 serviceGroup: { id: string; name: string } | null
}

interface Plan {
 id: string
 name: string
 slug: string
 type: string
 price: number
 currency: string
 countryCode: string | null
 targetAudience: string | null
 gpConsultsPerMonth: number
 specialistConsultsPerMonth: number
 nurseConsultsPerMonth: number
 mentalHealthConsultsPerMonth: number
 nutritionConsultsPerMonth: number
 ambulanceFreePerMonth: number
 discounts: Record<string, number> | null
 features: string[]
 isActive: boolean
 createdByAdminId: string | null
 planServices?: PlanService[]
}

interface CatalogService {
 id: string
 serviceName: string
 defaultPrice: number
 description: string
 duration: number | null
 isDefault: boolean
}

interface ServiceCategory {
 category: string
 services: CatalogService[]
}

interface PlanServiceLink {
 platformServiceId: string
 serviceName: string
 isFree: boolean
 adminPrice: number | null
 discountPercent: number // % discount off provider's market price (0-100)
 monthlyLimit: number
}

interface QuotaEntry {
 role: string
 specialty?: string | null
 limit: number
}

const EMPTY_FORM: {
 name: string
 type: 'individual' | 'corporate'
 price: number
 currency: string
 targetAudience: string
 quotas: QuotaEntry[]
 discounts: Record<string, number>
 features: string[]
 serviceLinks: PlanServiceLink[]
} = {
 name: '',
 type: 'individual',
 price: 0,
 currency: 'MUR',
 targetAudience: '',
 quotas: [],
 discounts: {},
 features: [],
 serviceLinks: [],
}

export default function SubscriptionsManagementPage() {
 const user = useDashboardUser()
 const [plans, setPlans] = useState<Plan[]>([])
 const [loading, setLoading] = useState(true)
 const [showForm, setShowForm] = useState(false)
 const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
 const [form, setForm] = useState(EMPTY_FORM)
 const [featureInput, setFeatureInput] = useState('')
 const [saving, setSaving] = useState(false)
 const [generatingFeatures, setGeneratingFeatures] = useState(false)
 const [discountToAdd, setDiscountToAdd] = useState('')
 const [quotaToAdd, setQuotaToAdd] = useState('')
 const [error, setError] = useState<string | null>(null)
 const [services, setServices] = useState<ServiceCategory[]>([])
 const [providerRoles, setProviderRoles] = useState<{ role: string; specialties: { name: string }[] }[]>([])


 const generateFeatures = async () => {
 setGeneratingFeatures(true)
 try {
 const quotas: Record<string, number> = {
 }
 // Build quotas for AI from the flexible quotas array
 for (const q of form.quotas) {
 const label = q.specialty ? `${q.specialty} consultations` : `${q.role} consultations`
 quotas[label] = q.limit
 }
 // Include service details (free, discount %, name)
 const serviceDetails = form.serviceLinks.map(sl => {
 if (sl.isFree) return `${sl.serviceName} (FREE - included)`
 if (sl.discountPercent > 0) return `${sl.serviceName} (${sl.discountPercent}% discount)`
 if (sl.adminPrice) return `${sl.serviceName} (fixed price: ${sl.adminPrice})`
 return sl.serviceName
 })

 const res = await fetch('/api/ai/generate-features', { credentials: 'include',
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 planName: form.name,
 planType: form.type,
 price: form.price,
 currency: form.currency,
 quotas,
 discounts: form.discounts,
 services: serviceDetails,
 targetAudience: form.targetAudience,
 }),
 })
 const json = await res.json()
 if (json.success && Array.isArray(json.data)) {
 setForm(prev => ({ ...prev, features: json.data }))
 } else {
 setError(json.message || 'Failed to generate features')
 }
 } catch {
 setError('Failed to generate features')
 } finally {
 setGeneratingFeatures(false)
 }
 }

 const fetchPlans = useCallback(async () => {
 try {
 setLoading(true)
 const res = await fetch('/api/regional/subscriptions', { credentials: 'include' })
 const json = await res.json()
 if (json.success) {
 setPlans(json.data)
 }
 } catch {
 setError('Failed to load plans')
 } finally {
 setLoading(false)
 }
 }, [])

 const fetchServices = useCallback(async () => {
 try {
 const res = await fetch('/api/services/catalog')
 const json = await res.json()
 if (json.success) setServices(json.data)
 } catch {}
 }, [])

 const fetchRoles = useCallback(async () => {
 try {
 const res = await fetch('/api/roles')
 const json = await res.json()
 if (json.success) setProviderRoles(json.data)
 } catch {}
 }, [])

 useEffect(() => {
 fetchPlans()
 fetchServices()
 fetchRoles()
 }, [fetchPlans, fetchServices, fetchRoles])

 const handleEdit = (plan: Plan) => {
 setEditingPlan(plan)
 // Load existing linked services from planServices
 const existingLinks: PlanServiceLink[] = (plan.planServices || [])
 .filter(ps => ps.platformService)
 .map(ps => ({
 platformServiceId: ps.platformService!.id,
 serviceName: ps.platformService!.serviceName,
 isFree: ps.isFree,
 adminPrice: ps.adminPrice,
 discountPercent: ps.discountPercent ?? 0,
 monthlyLimit: ps.monthlyLimit,
 }))

 setForm({
 name: plan.name,
 type: plan.type as 'individual' | 'corporate',
 price: plan.price,
 currency: plan.currency,
 targetAudience: plan.targetAudience || '',
 quotas: ((plan as unknown as Record<string, unknown>).quotas || []) as QuotaEntry[],
 discounts: (plan.discounts || {}) as Record<string, number>,
 features: plan.features,
 serviceLinks: existingLinks,
 })
 setShowForm(true)
 }

 const handleCreate = () => {
 setEditingPlan(null)
 setForm(EMPTY_FORM)
 setShowForm(true)
 }

 const handleSubmit = async () => {
 setSaving(true)
 setError(null)
 try {
 const url = editingPlan
 ? `/api/regional/subscriptions/${editingPlan.id}`
 : '/api/regional/subscriptions'
 const method = editingPlan ? 'PATCH' : 'POST'

 const payload = {
 ...form,
 services: form.serviceLinks.map(sl => ({
 platformServiceId: sl.platformServiceId,
 isFree: sl.isFree,
 adminPrice: sl.adminPrice,
 discountPercent: sl.discountPercent,
 monthlyLimit: sl.monthlyLimit,
 })),
 }

 const res = await fetch(url, {
 method,
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(payload),
 })
 const json = await res.json()
 if (json.success) {
 setShowForm(false)
 setEditingPlan(null)
 fetchPlans()
 } else {
 setError(json.message || 'Failed to save plan')
 }
 } catch {
 setError('Failed to save plan')
 } finally {
 setSaving(false)
 }
 }

 const toggleActive = async (plan: Plan) => {
 try {
 const res = await fetch(`/api/regional/subscriptions/${plan.id}`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ isActive: !plan.isActive }),
 credentials: 'include',
 })
 const json = await res.json()
 if (json.success) fetchPlans()
 } catch {
 // silently fail
 }
 }

 const addFeature = () => {
 if (featureInput.trim()) {
 setForm(prev => ({ ...prev, features: [...prev.features, featureInput.trim()] }))
 setFeatureInput('')
 }
 }

 const removeFeature = (index: number) => {
 setForm(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }))
 }

 if (!user) return null

 const individualPlans = plans.filter(p => p.type === 'individual')
 const corporatePlans = plans.filter(p => p.type === 'corporate')

 const renderPlanRow = (plan: Plan) => {
 const sym = getCurrencySymbol(plan.currency)
 return (
 <tr key={plan.id} className={`border-b border-line ${!plan.isActive ? 'opacity-50' : ''}`}>
 <td className="p-3">
 <div className="font-medium text-fg">{plan.name}</div>
 {plan.targetAudience && <div className="text-xs text-soft">{plan.targetAudience}</div>}
 </td>
 <td className="p-3 font-semibold text-fg">{sym} {plan.price.toLocaleString()}/mo</td>
 <td className="p-3 text-sm text-soft">
 GP: {plan.gpConsultsPerMonth === -1 ? '∞' : plan.gpConsultsPerMonth},
 Nurse: {plan.nurseConsultsPerMonth === -1 ? '∞' : plan.nurseConsultsPerMonth},
 Mental: {plan.mentalHealthConsultsPerMonth === -1 ? '∞' : plan.mentalHealthConsultsPerMonth}
 </td>
 <td className="p-3">
 <span className={`px-2 py-1 rounded-full text-xs font-medium ${plan.isActive ? 'bg-green-100 text-green-700' : 'bg-subtle text-soft'}`}>
 {plan.isActive ? 'Active' : 'Inactive'}
 </span>
 </td>
 <td className="p-3">
 <div className="flex items-center gap-2">
 <button onClick={() => handleEdit(plan)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
 <FaEdit className="text-sm" />
 </button>
 <button onClick={() => toggleActive(plan)} className="p-1.5 text-soft hover:bg-subtle rounded">
 {plan.isActive ? <FaToggleOn className="text-green-600 text-lg" /> : <FaToggleOff className="text-faint text-lg" />}
 </button>
 </div>
 </td>
 </tr>
 )
 }

 const renderPlanTable = (planList: Plan[], title: string) => (
 <div className="mb-8">
 <h3 className="text-lg font-semibold text-fg mb-3">{title}</h3>
 {planList.length === 0 ? (
 <p className="text-soft text-sm">No plans yet.</p>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-subtle">
 <tr>
 <th className="p-3 text-left font-medium text-soft">Plan</th>
 <th className="p-3 text-left font-medium text-soft">Price</th>
 <th className="p-3 text-left font-medium text-soft">Consults</th>
 <th className="p-3 text-left font-medium text-soft">Status</th>
 <th className="p-3 text-left font-medium text-soft">Actions</th>
 </tr>
 </thead>
 <tbody>
 {planList.map(renderPlanRow)}
 </tbody>
 </table>
 </div>
 )}
 </div>
 )

 return (
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <FaCrown className="text-yellow-500 text-xl" />
 <h2 className="text-xl font-bold text-fg">Subscription Plans</h2>
 </div>
 <button
 onClick={handleCreate}
 className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
 >
 <FaPlus className="text-xs" /> New Plan
 </button>
 </div>

 {loading ? (
 <div className="flex items-center justify-center py-12">
 <FaSpinner className="animate-spin text-blue-500 text-xl" />
 </div>
 ) : (
 <div className="bg-surface rounded-xl border border-line p-4 sm:p-6">
 {renderPlanTable(individualPlans, 'MediWyz For You - Individual Plans')}
 {renderPlanTable(corporatePlans, 'MediWyz For Business - Corporate Plans')}
 </div>
 )}

 {/* Available Services Reference */}
 {services.length > 0 && (
 <div className="bg-surface rounded-xl border border-line p-4 sm:p-6">
 <h3 className="text-lg font-semibold text-fg mb-3">Available Provider Services</h3>
 <p className="text-sm text-soft mb-4">Reference list of services from providers in your region. Use these when configuring plan features and discounts.</p>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
 {services.map((cat) => (
 <div key={cat.category} className="border border-line rounded-lg p-3">
 <h4 className="text-sm font-medium text-fg mb-2">{cat.category}</h4>
 <ul className="space-y-1">
 {cat.services.map((svc) => (
 <li key={svc.serviceName} className="text-xs text-soft flex justify-between">
 <span>{svc.serviceName}</span>
 <span className="text-faint">{svc.defaultPrice > 0 ? svc.defaultPrice.toLocaleString() : 'Free'}</span>
 </li>
 ))}
 </ul>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Create / Edit Form Modal */}
 {showForm && (
 <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
 <div className="bg-surface rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
 <div className="flex items-center justify-between mb-6">
 <h3 className="text-lg font-bold text-fg">
 {editingPlan ? 'Edit Plan' : 'Create New Plan'}
 </h3>
 <button onClick={() => setShowForm(false)} className="p-2 text-faint hover:text-soft">
 <FaTimes />
 </button>
 </div>

 <div className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-soft mb-1">Plan Name</label>
 <input
 type="text"
 value={form.name}
 onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
 className="w-full px-3 py-2 border border-line rounded-lg text-sm"
 placeholder="e.g. Premium"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-soft mb-1">Type</label>
 <select
 value={form.type}
 onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value as 'individual' | 'corporate' }))}
 className="w-full px-3 py-2 border border-line rounded-lg text-sm"
 >
 <option value="individual">Individual</option>
 <option value="corporate">Corporate</option>
 </select>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-soft mb-1">Price/month</label>
 <input
 type="number"
 value={form.price}
 onChange={(e) => setForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
 className="w-full px-3 py-2 border border-line rounded-lg text-sm"
 min="0"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-soft mb-1">Target Audience</label>
 <input
 type="text"
 value={form.targetAudience}
 onChange={(e) => setForm(prev => ({ ...prev, targetAudience: e.target.value }))}
 className="w-full px-3 py-2 border border-line rounded-lg text-sm"
 placeholder="e.g. families"
 />
 </div>
 </div>

 {/* Dynamic quotas by role + specialty */}
 <div className="border-t pt-4">
 <h4 className="text-sm font-semibold text-fg mb-3">Monthly Consultation Quotas (-1 = unlimited)</h4>
 <p className="text-xs text-soft mb-3">Set free consultation limits per provider role and specialty.</p>
 <div className="space-y-2 max-h-48 overflow-y-auto">
 {form.quotas.map((q, i) => (
 <div key={i} className="flex items-center gap-2 text-sm">
 <span className="flex-1 text-soft text-xs">{q.specialty ? `${q.role} - ${q.specialty}` : q.role}</span>
 <input
 type="number"
 value={q.limit}
 onChange={(e) => setForm(prev => ({
 ...prev,
 quotas: prev.quotas.map((qq, j) => j === i ? { ...qq, limit: parseInt(e.target.value) || 0 } : qq),
 }))}
 className="w-16 px-2 py-1 border border-line rounded text-xs text-center"
 min="-1"
 />
 <button onClick={() => setForm(prev => ({ ...prev, quotas: prev.quotas.filter((_, j) => j !== i) }))} className="text-red-400 hover:text-red-600 text-xs">
 <FaTimes />
 </button>
 </div>
 ))}
 </div>
 {/* Add quota button */}
 <div className="mt-2 flex gap-2">
 <select
 value={quotaToAdd}
 onChange={(e) => setQuotaToAdd(e.target.value)}
 className="flex-1 px-2 py-1.5 border border-line rounded text-xs"
 >
 <option value="">Add quota for...</option>
 {providerRoles.map(r => (
 <optgroup key={r.role} label={r.role}>
 <option value={`${r.role}:`}>{r.role} (any specialty)</option>
 {r.specialties.map(s => (
 <option key={`${r.role}:${s.name}`} value={`${r.role}:${s.name}`}>{r.role} - {s.name}</option>
 ))}
 </optgroup>
 ))}
 </select>
 <button
 onClick={() => {
 if (!quotaToAdd) return
 const [role, specialty] = quotaToAdd.split(':')
 const exists = form.quotas.some(q => q.role === role && (q.specialty || '') === (specialty || ''))
 if (exists) return
 setForm(prev => ({ ...prev, quotas: [...prev.quotas, { role, specialty: specialty || null, limit: 0 }] }))
 setQuotaToAdd('')
 }}
 className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200"
 >
 Add
 </button>
 </div>
 </div>

 <div className="border-t pt-4">
 <h4 className="text-sm font-semibold text-fg mb-3">Discounts (%) - by role, specialty, or service category</h4>
 <p className="text-xs text-soft mb-3">Set discount % off provider market price. Applies when quota is exhausted.</p>
 <div className="space-y-2 max-h-48 overflow-y-auto">
 {Object.entries(form.discounts).filter(([k]) => !k.startsWith('volume_')).map(([key, val]) => (
 <div key={key} className="flex items-center gap-2 text-sm">
 <span className="flex-1 text-soft text-xs">{key}</span>
 <div className="flex items-center gap-1">
 <input
 type="number"
 value={val ?? ''}
 onChange={(e) => {
 const v = parseInt(e.target.value)
 setForm(prev => {
 const d = { ...prev.discounts }
 if (isNaN(v) || v <= 0) delete d[key]
 else d[key] = Math.min(v, 100)
 return { ...prev, discounts: d }
 })
 }}
 className="w-14 px-2 py-1 border border-line rounded text-xs text-center"
 min="0" max="100"
 />
 <span className="text-xs text-faint">%</span>
 </div>
 <button onClick={() => setForm(prev => {
 const d = { ...prev.discounts }; delete d[key]; return { ...prev, discounts: d }
 })} className="text-red-400 hover:text-red-600 text-xs"><FaTimes /></button>
 </div>
 ))}
 </div>
 {/* Add discount */}
 <div className="mt-2 flex gap-2">
 <select
 value={discountToAdd}
 onChange={(e) => setDiscountToAdd(e.target.value)}
 className="flex-1 px-2 py-1.5 border border-line rounded text-xs"
 >
 <option value="">Add discount for...</option>
 <optgroup label="Service Categories">
 {['lab', 'pharmacy', 'emergency', 'childcare'].map(c => (
 <option key={c} value={c}>{c}</option>
 ))}
 </optgroup>
 {providerRoles.map(r => (
 <optgroup key={r.role} label={r.role}>
 <option value={r.role}>{r.role} (any)</option>
 {r.specialties.map(s => (
 <option key={`${r.role}:${s.name}`} value={`${r.role}:${s.name}`}>{r.role} - {s.name}</option>
 ))}
 </optgroup>
 ))}
 </select>
 <button
 onClick={() => {
 if (!discountToAdd) return
 if (form.discounts[discountToAdd] !== undefined) return
 setForm(prev => ({ ...prev, discounts: { ...prev.discounts, [discountToAdd]: 10 } }))
 setDiscountToAdd('')
 }}
 className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200"
 >Add</button>
 </div>
 </div>
 <div className="border-t pt-3">
 {form.type === 'corporate' && (
 <div className="mt-3 pt-3 border-t border-line">
 <h5 className="text-xs font-semibold text-soft mb-2">Volume Discounts (Corporate)</h5>
 <div className="grid grid-cols-4 gap-3">
 {[
 { key: 'volume_50', label: '50+ emp' },
 { key: 'volume_100', label: '100+ emp' },
 { key: 'volume_300', label: '300+ emp' },
 { key: 'volume_1000', label: '1000+ emp' },
 ].map(({ key, label }) => (
 <div key={key}>
 <label className="block text-xs font-medium text-soft mb-1">{label}</label>
 <div className="flex items-center gap-1">
 <input
 type="number"
 value={form.discounts[key] ?? ''}
 onChange={(e) => {
 const val = parseInt(e.target.value)
 setForm(prev => {
 const newDiscounts = { ...prev.discounts }
 if (isNaN(val) || val <= 0) {
 delete newDiscounts[key]
 } else {
 newDiscounts[key] = Math.min(val, 100)
 }
 return { ...prev, discounts: newDiscounts }
 })
 }}
 placeholder="0"
 className="w-full px-2 py-1.5 border border-line rounded text-sm text-center"
 min="0"
 max="100"
 />
 <span className="text-xs text-faint">%</span>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>

 {/* Services to include in plan */}
 <div className="border-t pt-4">
 <h4 className="text-sm font-semibold text-fg mb-3">Included Services & Discounts</h4>
 <p className="text-xs text-soft mb-3">Select services to include. For each: mark as free, set a discount %, an admin price, and monthly limit.</p>
 {services.length > 0 ? (
 <div className="max-h-60 overflow-y-auto border border-line rounded-lg divide-y divide-line">
 {services.flatMap(cat => cat.services).map(svc => {
 const linked = form.serviceLinks.find(sl => sl.platformServiceId === svc.id)
 return (
 <div key={svc.id} className="flex items-center gap-3 p-2 text-sm hover:bg-subtle">
 <input
 type="checkbox"
 checked={!!linked}
 onChange={(e) => {
 if (e.target.checked) {
 setForm(prev => ({
 ...prev,
 serviceLinks: [...prev.serviceLinks, {
 platformServiceId: svc.id,
 serviceName: svc.serviceName,
 isFree: false,
 adminPrice: null,
 discountPercent: 0,
 monthlyLimit: 0,
 }],
 }))
 } else {
 setForm(prev => ({
 ...prev,
 serviceLinks: prev.serviceLinks.filter(sl => sl.platformServiceId !== svc.id),
 }))
 }
 }}
 className="rounded text-blue-600"
 />
 <span className="flex-1 text-soft">{svc.serviceName}</span>
 <span className="text-xs text-faint">{svc.defaultPrice.toLocaleString()}</span>
 {linked && (
 <div className="flex items-center gap-1.5 flex-wrap">
 <label className="flex items-center gap-1 text-xs whitespace-nowrap">
 <input
 type="checkbox"
 checked={linked.isFree}
 onChange={(e) => setForm(prev => ({
 ...prev,
 serviceLinks: prev.serviceLinks.map(sl =>
 sl.platformServiceId === svc.id ? { ...sl, isFree: e.target.checked, discountPercent: e.target.checked ? 100 : sl.discountPercent } : sl
 ),
 }))}
 className="rounded text-green-600"
 />
 Free
 </label>
 {!linked.isFree && (
 <>
 <div className="flex items-center gap-0.5">
 <input
 type="number"
 value={linked.discountPercent || ''}
 onChange={(e) => setForm(prev => ({
 ...prev,
 serviceLinks: prev.serviceLinks.map(sl =>
 sl.platformServiceId === svc.id
 ? { ...sl, discountPercent: parseInt(e.target.value) || 0 }
 : sl
 ),
 }))}
 placeholder="0"
 title="Discount % off provider's market price"
 className="w-12 px-1 py-1 border border-line rounded text-xs text-center"
 min="0"
 max="100"
 />
 <span className="text-xs text-faint">%</span>
 </div>
 <input
 type="number"
 value={linked.adminPrice ?? ''}
 onChange={(e) => setForm(prev => ({
 ...prev,
 serviceLinks: prev.serviceLinks.map(sl =>
 sl.platformServiceId === svc.id
 ? { ...sl, adminPrice: e.target.value ? parseFloat(e.target.value) : null }
 : sl
 ),
 }))}
 placeholder="Price"
 title="Admin-set fixed price (overrides discount)"
 className="w-16 px-1 py-1 border border-line rounded text-xs"
 min="0"
 />
 </>
 )}
 <input
 type="number"
 value={linked.monthlyLimit}
 onChange={(e) => setForm(prev => ({
 ...prev,
 serviceLinks: prev.serviceLinks.map(sl =>
 sl.platformServiceId === svc.id
 ? { ...sl, monthlyLimit: parseInt(e.target.value) || 0 }
 : sl
 ),
 }))}
 placeholder="Lim"
 title="Monthly limit (-1 = unlimited, 0 = pay per use)"
 className="w-12 px-1 py-1 border border-line rounded text-xs text-center"
 min="-1"
 />
 </div>
 )}
 </div>
 )
 })}
 </div>
 ) : (
 <p className="text-xs text-faint">No services loaded. Services will be available after platform services are seeded.</p>
 )}
 </div>

 {/* Features - generated from all config above */}
 <div className="border-t pt-4">
 <div className="flex items-center justify-between mb-3">
 <h4 className="text-sm font-semibold text-fg">Features (Display Text)</h4>
 <button
 type="button"
 onClick={generateFeatures}
 disabled={generatingFeatures || !form.name}
 className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200 disabled:opacity-50 transition"
 >
 {generatingFeatures ? <FaSpinner className="animate-spin text-xs" /> : <FaMagic className="text-xs" />}
 {generatingFeatures ? 'Generating...' : 'Generate with AI'}
 </button>
 </div>
 <p className="text-xs text-faint mb-2">Click &quot;Generate with AI&quot; to create feature text from quotas, discounts, and selected services above.</p>
 <div className="flex gap-2 mb-2">
 <input
 type="text"
 value={featureInput}
 onChange={(e) => setFeatureInput(e.target.value)}
 onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
 className="flex-1 px-3 py-2 border border-line rounded-lg text-sm"
 placeholder="Add a feature..."
 />
 <button onClick={addFeature} className="px-3 py-2 bg-subtle text-soft rounded-lg text-sm hover:bg-line">
 Add
 </button>
 </div>
 <div className="space-y-1">
 {form.features.map((feat, i) => (
 <div key={i} className="flex items-center gap-2 text-sm text-soft">
 <FaCheckCircle className="text-green-500 text-xs flex-shrink-0" />
 <span className="flex-1">{feat}</span>
 <button onClick={() => removeFeature(i)} className="text-red-400 hover:text-red-600 text-xs">
 <FaTimes />
 </button>
 </div>
 ))}
 </div>
 </div>

 {error && <p className="text-sm text-red-500">{error}</p>}

 <div className="flex justify-end gap-3 border-t pt-4">
 <button
 onClick={() => setShowForm(false)}
 className="px-4 py-2 text-soft border border-line rounded-lg text-sm hover:bg-subtle"
 >
 Cancel
 </button>
 <button
 onClick={handleSubmit}
 disabled={saving || !form.name || form.features.length === 0}
 className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
 >
 {saving && <FaSpinner className="animate-spin" />}
 {editingPlan ? 'Save Changes' : 'Create Plan'}
 </button>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 )
}

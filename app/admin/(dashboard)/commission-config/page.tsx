'use client'

import { useState, useEffect } from 'react'
import { FaPercentage, FaSave, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa'

interface PlatformConfig {
 id: string
 platformCommissionRate: number
 regionalCommissionRate: number
 providerCommissionRate: number
 currency: string
 trialWalletAmount: number
}

export default function CommissionConfigPage() {
 const [, setConfig] = useState<PlatformConfig | null>(null)
 const [loading, setLoading] = useState(true)
 const [saving, setSaving] = useState(false)
 const [error, setError] = useState<string | null>(null)
 const [success, setSuccess] = useState(false)

 // Form state
 const [platform, setPlatform] = useState(5)
 const [regional, setRegional] = useState(10)
 const [provider, setProvider] = useState(85)
 const [currency, setCurrency] = useState('MUR')
 const [trialAmount, setTrialAmount] = useState(4500)

 useEffect(() => {
 fetch('/api/admin/commission-config', { credentials: 'include' })
 .then((res) => res.json())
 .then((json) => {
 if (json.success && json.data) {
 const c = json.data
 setConfig(c)
 setPlatform(c.platformCommissionRate)
 setRegional(c.regionalCommissionRate)
 setProvider(c.providerCommissionRate)
 setCurrency(c.currency)
 setTrialAmount(c.trialWalletAmount)
 }
 })
 .catch(() => setError('Failed to load config'))
 .finally(() => setLoading(false))
 }, [])

 const total = platform + regional + provider
 const isValid = Math.abs(total - 100) < 0.01

 const handleSave = async () => {
 if (!isValid) {
 setError('Commission rates must sum to exactly 100%')
 return
 }

 setSaving(true)
 setError(null)
 setSuccess(false)

 try {
 const res = await fetch('/api/admin/commission-config', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 credentials: 'include',
 body: JSON.stringify({
 platformCommissionRate: platform,
 regionalCommissionRate: regional,
 providerCommissionRate: provider,
 currency,
 trialWalletAmount: trialAmount,
 }),
 })

 const json = await res.json()
 if (json.success) {
 setConfig(json.data)
 setSuccess(true)
 setTimeout(() => setSuccess(false), 3000)
 } else {
 setError(json.message || 'Failed to save')
 }
 } catch {
 setError('Network error')
 } finally {
 setSaving(false)
 }
 }

 if (loading) {
 return (
 <div className="flex items-center justify-center min-h-[400px]">
 <FaSpinner className="animate-spin text-2xl text-blue-500" />
 </div>
 )
 }

 return (
 <div className="p-4 sm:p-6 max-w-2xl">
 <h1 className="text-xl sm:text-2xl font-bold text-fg mb-6">Commission Configuration</h1>

 {/* Visual breakdown */}
 <div className="bg-surface rounded-xl shadow-sm border border-line p-6 mb-6">
 <h2 className="text-lg font-semibold text-fg mb-4 flex items-center gap-2">
 <FaPercentage className="text-blue-500" />
 Revenue Split
 </h2>

 {/* Visual bar */}
 <div className="flex rounded-full overflow-hidden h-8 mb-4">
 <div
 className="bg-blue-500 flex items-center justify-center text-white text-xs font-medium transition-all"
 style={{ width: `${provider}%` }}
 >
 {provider}%
 </div>
 <div
 className="bg-yellow-500 flex items-center justify-center text-white text-xs font-medium transition-all"
 style={{ width: `${regional}%` }}
 >
 {regional}%
 </div>
 <div
 className="bg-green-500 flex items-center justify-center text-white text-xs font-medium transition-all"
 style={{ width: `${platform}%` }}
 >
 {platform}%
 </div>
 </div>

 <div className="flex items-center gap-4 text-sm text-soft">
 <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-full inline-block" /> Provider</span>
 <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-500 rounded-full inline-block" /> Regional Admin</span>
 <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-full inline-block" /> Platform</span>
 </div>
 </div>

 {/* Form */}
 <div className="bg-surface rounded-xl shadow-sm border border-line p-6 space-y-5">
 <div>
 <label className="block text-sm font-medium text-soft mb-1">
 Provider Commission Rate (%)
 </label>
 <input
 type="number"
 min={0}
 max={100}
 step={0.5}
 value={provider}
 onChange={(e) => setProvider(parseFloat(e.target.value) || 0)}
 className="w-full px-3 py-2 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
 />
 <p className="text-xs text-faint mt-1">Percentage going to doctors, nurses, and other service providers</p>
 </div>

 <div>
 <label className="block text-sm font-medium text-soft mb-1">
 Regional Admin Commission Rate (%)
 </label>
 <input
 type="number"
 min={0}
 max={100}
 step={0.5}
 value={regional}
 onChange={(e) => setRegional(parseFloat(e.target.value) || 0)}
 className="w-full px-3 py-2 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
 />
 <p className="text-xs text-faint mt-1">Default rate for regional administrators (can be overridden per admin)</p>
 </div>

 <div>
 <label className="block text-sm font-medium text-soft mb-1">
 Platform Commission Rate (%)
 </label>
 <input
 type="number"
 min={0}
 max={100}
 step={0.5}
 value={platform}
 onChange={(e) => setPlatform(parseFloat(e.target.value) || 0)}
 className="w-full px-3 py-2 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
 />
 <p className="text-xs text-faint mt-1">MediWyz platform maintenance fee</p>
 </div>

 {/* Total indicator */}
 <div className={`flex items-center gap-2 p-3 rounded-lg ${isValid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
 {isValid ? <FaCheckCircle /> : <FaExclamationTriangle />}
 <span className="text-sm font-medium">
 Total: {total.toFixed(1)}% {isValid ? '(valid)' : '(must equal 100%)'}
 </span>
 </div>

 <hr className="border-line" />

 <div>
 <label className="block text-sm font-medium text-soft mb-1">Currency</label>
 <input
 type="text"
 value={currency}
 onChange={(e) => setCurrency(e.target.value)}
 className="w-full px-3 py-2 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-soft mb-1">Trial Wallet Amount</label>
 <input
 type="number"
 min={0}
 value={trialAmount}
 onChange={(e) => setTrialAmount(parseFloat(e.target.value) || 0)}
 className="w-full px-3 py-2 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
 />
 <p className="text-xs text-faint mt-1">Initial credit given to new users for trial</p>
 </div>

 {error && (
 <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
 {error}
 </div>
 )}

 {success && (
 <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
 <FaCheckCircle /> Configuration saved successfully
 </div>
 )}

 <button
 onClick={handleSave}
 disabled={saving || !isValid}
 className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
 >
 {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
 {saving ? 'Saving...' : 'Save Configuration'}
 </button>
 </div>
 </div>
 )
}

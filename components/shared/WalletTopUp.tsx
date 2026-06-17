'use client'

import { useState } from 'react'
import { FaPlus, FaSpinner, FaTimes, FaMobileAlt, FaCreditCard } from 'react-icons/fa'
import { getCurrencySymbol } from '@/lib/currency'

interface WalletTopUpProps {
 userId: string
 currency?: string
 onSuccess: () => void
}

const QUICK_AMOUNTS = [250, 500, 1000, 2000, 5000]

export default function WalletTopUp({ userId, currency = 'MUR', onSuccess }: WalletTopUpProps) {
 const symbol = getCurrencySymbol(currency)
 const [showForm, setShowForm] = useState(false)
 const [amount, setAmount] = useState('')
 const [paymentMethod, setPaymentMethod] = useState<'mcb_juice' | 'card'>('card')
 const [loading, setLoading] = useState(false)
 const [error, setError] = useState<string | null>(null)

 const handleTopUp = async () => {
 const numAmount = parseFloat(amount)
 if (!numAmount || numAmount <= 0) {
 setError('Enter a valid amount')
 return
 }
 if (numAmount > 50000) {
 setError(`Maximum top-up is ${symbol} 50,000`)
 return
 }

 setError(null)
 setLoading(true)
 try {
 const res = await fetch(`/api/users/${userId}/wallet/topup`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ amount: numAmount, paymentMethod }),
 credentials: 'include',
 })
 const json = await res.json()
 if (json.success) {
 setShowForm(false)
 setAmount('')
 if (typeof window !== 'undefined') window.dispatchEvent(new Event('mediwyz:wallet-changed'))
 onSuccess()
 } else {
 setError(json.message || 'Top-up failed')
 }
 } catch {
 setError('Top-up failed')
 } finally {
 setLoading(false)
 }
 }

 if (!showForm) {
 return (
 <button
 onClick={() => setShowForm(true)}
 className="w-full mt-3 py-2.5 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-sm"
 >
 <FaPlus className="text-xs" /> Top Up Balance
 </button>
 )
 }

 return (
 <div className="mt-3 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
 <div className="flex items-center justify-between mb-3">
 <h4 className="text-sm font-semibold text-gray-900">Top Up Balance</h4>
 <button
 onClick={() => { setShowForm(false); setError(null) }}
 className="p-1 text-gray-400 hover:text-gray-600"
 >
 <FaTimes className="text-xs" />
 </button>
 </div>

 {/* Quick amounts */}
 <div className="flex flex-wrap gap-2 mb-3">
 {QUICK_AMOUNTS.map((qa) => (
 <button
 key={qa}
 onClick={() => setAmount(qa.toString())}
 className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
 amount === qa.toString()
 ? 'bg-blue-600 text-white'
 : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
 }`}
 >
 {symbol} {qa.toLocaleString()}
 </button>
 ))}
 </div>

 {/* Custom amount */}
 <div className="relative mb-3">
 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">{symbol}</span>
 <input
 type="number"
 value={amount}
 onChange={(e) => { setAmount(e.target.value); setError(null) }}
 placeholder="Enter amount"
 min="1"
 max="50000"
 className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 />
 </div>

 {/* Payment method */}
 <div className="flex gap-2 mb-3">
 <button
 onClick={() => setPaymentMethod('card')}
 className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
 paymentMethod === 'card'
 ? 'border-blue-500 bg-blue-50 text-blue-700'
 : 'border-gray-200 text-gray-600 hover:bg-gray-50'
 }`}
 >
 <FaCreditCard /> Card
 </button>
 <button
 onClick={() => setPaymentMethod('mcb_juice')}
 className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
 paymentMethod === 'mcb_juice'
 ? 'border-blue-500 bg-blue-50 text-blue-700'
 : 'border-gray-200 text-gray-600 hover:bg-gray-50'
 }`}
 >
 <FaMobileAlt /> MCB Juice
 </button>
 </div>

 {error && (
 <p className="text-xs text-red-500 mb-2">{error}</p>
 )}

 <button
 onClick={handleTopUp}
 disabled={loading || !amount}
 className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
 >
 {loading ? <FaSpinner className="animate-spin" /> : <FaPlus className="text-xs" />}
 {loading ? 'Processing...' : `Top Up${amount ? ` ${symbol} ${parseFloat(amount).toLocaleString()}` : ''}`}
 </button>

 <p className="text-xs text-gray-400 text-center mt-2">
 Simulated payment - no real charge applied
 </p>
 </div>
 )
}

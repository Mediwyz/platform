'use client'

import { useState, useEffect, useCallback } from 'react'
import { FaWallet, FaArrowDown, FaArrowUp, FaChevronDown, FaChevronUp, FaRedo } from 'react-icons/fa'
import { getCurrencySymbol } from '@/lib/currency'
import { toast } from 'react-toastify'
import WalletTransactionHistory from './WalletTransactionHistory'
import WalletTopUp from './WalletTopUp'

interface Transaction {
 id: string
 type: string
 amount: number
 description: string
 serviceType: string | null
 balanceBefore: number
 balanceAfter: number
 status: string
 createdAt: string
}

interface WalletData {
 balance: number
 currency: string
 initialCredit: number
 transactions: Transaction[]
}

interface WalletBalanceCardProps {
 userId: string
}

const WalletBalanceCard: React.FC<WalletBalanceCardProps> = ({ userId }) => {
 const [wallet, setWallet] = useState<WalletData | null>(null)
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState<string | null>(null)
 const [showAllTransactions, setShowAllTransactions] = useState(false)
 const [resetting, setResetting] = useState(false)
 const [showReset, setShowReset] = useState(false)
 const [customReset, setCustomReset] = useState('')

 const fetchWallet = useCallback(async () => {
 try {
 setLoading(true)
 const res = await fetch(`/api/users/${userId}/wallet`, { credentials: 'include' })
 const json = await res.json()
 if (json.success && json.data) {
 setWallet(json.data)
 } else {
 setWallet(null)
 }
 } catch {
 setError('Failed to load wallet data')
 } finally {
 setLoading(false)
 }
 }, [userId])

 useEffect(() => {
 if (!userId) return
 fetchWallet()
 }, [userId, fetchWallet])

 // Reset credit via the gateway-free /wallet/reset endpoint. Passing no amount
 // restores the trial credit (server falls back to a usable default if the
 // account had none); an explicit amount sets the balance directly.
 const handleReset = async (amount?: number) => {
 try {
 setResetting(true)
 const res = await fetch(`/api/users/${userId}/wallet/reset`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(amount != null ? { amount } : {}),
 credentials: 'include',
 })
 const json = await res.json()
 if (json.success) {
 await fetchWallet()
 if (typeof window !== 'undefined') window.dispatchEvent(new Event('mediwyz:wallet-changed'))
 setShowReset(false)
 setCustomReset('')
 toast.success('Credit reset successfully')
 } else {
 toast.error(json.message || 'Failed to reset credit')
 }
 } catch {
 toast.error('Failed to reset credit')
 } finally {
 setResetting(false)
 }
 }

 if (!userId) return null

 if (loading) {
 return (
 <div className="bg-brand-navy rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white animate-pulse">
 <div className="flex items-center gap-2 mb-3">
 <div className="w-5 h-5 bg-white/30 rounded" />
 <div className="h-5 w-28 bg-white/30 rounded" />
 </div>
 <div className="h-8 w-36 bg-white/30 rounded mb-3" />
 <div className="h-2.5 w-full bg-white/20 rounded-full mb-2" />
 <div className="h-4 w-48 bg-white/20 rounded" />
 </div>
 )
 }

 if (error) {
 return (
 <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
 {error}
 </div>
 )
 }

 if (!wallet) return null

 const symbol = getCurrencySymbol(wallet.currency)

 const percentage = wallet.initialCredit > 0
 ? Math.round((wallet.balance / wallet.initialCredit) * 100)
 : 0

 const recentTransactions = wallet.transactions.slice(0, 3)

 const formatDate = (dateStr: string) => {
 const date = new Date(dateStr)
 return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
 }

 return (
 <div className="space-y-3">
 {/* Main Balance Card */}
 <div className="bg-brand-navy rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white shadow-lg">
 <div className="flex items-center gap-2 mb-3 sm:mb-4">
 <FaWallet className="text-white/90 text-base sm:text-lg" />
 <h3 className="text-sm sm:text-base font-semibold text-white/90">Account Balance</h3>
 </div>

 <p className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
 {symbol} {wallet.balance.toLocaleString()}
 </p>

 {/* Progress Bar */}
 <div className="w-full bg-white/20 rounded-full h-2 sm:h-2.5 mb-2">
 <div
 className="bg-surface rounded-full h-2 sm:h-2.5 transition-all duration-500"
 style={{ width: `${Math.min(percentage, 100)}%` }}
 />
 </div>
 <div className="flex items-center justify-between">
 <p className="text-xs sm:text-sm text-white/80">
 {percentage}% remaining of {symbol} {wallet.initialCredit.toLocaleString()}
 </p>
 <button
 onClick={() => setShowReset((s) => !s)}
 disabled={resetting}
 className="text-xs px-3 py-1 bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center gap-1.5"
 >
 <FaRedo className={`text-[10px] ${resetting ? 'animate-spin' : ''}`} />
 {resetting ? 'Resetting...' : 'Reset credit'}
 </button>
 </div>

 {/* Reset credit panel  pick a preset, restore the trial, or set a custom
     amount. Uses the reliable reset endpoint (no payment gateway). */}
 {showReset && (
 <div className="mt-3 bg-white/10 rounded-xl p-3">
 <p className="text-xs text-white/80 mb-2">Reset your balance to:</p>
 <div className="flex flex-wrap gap-2 mb-2">
 <button
 onClick={() => handleReset()}
 disabled={resetting}
 className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/20 hover:bg-white/30 disabled:opacity-50 transition-colors"
 >
 Restore trial
 </button>
 {[1000, 5000, 10000].map((amt) => (
 <button
 key={amt}
 onClick={() => handleReset(amt)}
 disabled={resetting}
 className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/20 hover:bg-white/30 disabled:opacity-50 transition-colors"
 >
 {symbol} {amt.toLocaleString()}
 </button>
 ))}
 </div>
 <div className="flex gap-2">
 <input
 type="number"
 min={0}
 max={50000}
 value={customReset}
 onChange={(e) => setCustomReset(e.target.value)}
 placeholder="Custom amount"
 className="flex-1 px-3 py-1.5 rounded-lg text-xs text-fg placeholder-gray-400 outline-none"
 />
 <button
 onClick={() => { const a = parseFloat(customReset); if (a >= 0) handleReset(a) }}
 disabled={resetting || customReset === ''}
 className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface text-brand-navy hover:bg-white/90 disabled:opacity-50 transition-colors"
 >
 Set
 </button>
 </div>
 </div>
 )}

 {/* Recent Transactions Mini-List */}
 {recentTransactions.length > 0 && (
 <div className="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-white/20 space-y-2 sm:space-y-3">
 {recentTransactions.map((tx) => {
 const isCredit = tx.type === 'CREDIT'
 return (
 <div key={tx.id} className="flex items-center gap-3">
 <div className={`p-1.5 rounded-full ${isCredit ? 'bg-green-400/30' : 'bg-red-400/30'}`}>
 {isCredit ? (
 <FaArrowUp className="text-green-200 text-xs" />
 ) : (
 <FaArrowDown className="text-red-200 text-xs" />
 )}
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-xs sm:text-sm font-medium text-white truncate">
 {tx.description}
 </p>
 <p className="text-xs text-white/60">
 {tx.serviceType ? `${tx.serviceType} \u2022 ` : ''}{formatDate(tx.createdAt)}
 </p>
 </div>
 <p className={`text-xs sm:text-sm font-semibold whitespace-nowrap ${isCredit ? 'text-green-300' : 'text-red-300'}`}>
 {isCredit ? '+' : '-'}{symbol} {Math.abs(tx.amount).toLocaleString()}
 </p>
 </div>
 )
 })}
 </div>
 )}

 {/* View Transaction History Toggle */}
 {wallet.transactions.length > 0 && (
 <button
 onClick={() => setShowAllTransactions(!showAllTransactions)}
 className="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2"
 >
 {showAllTransactions ? (
 <>
 Hide Transaction History <FaChevronUp className="text-xs" />
 </>
 ) : (
 <>
 View Transaction History <FaChevronDown className="text-xs" />
 </>
 )}
 </button>
 )}
 </div>

 {/* Wallet Top-Up */}
 <WalletTopUp userId={userId} currency={wallet.currency} onSuccess={fetchWallet} />

 {/* Full Transaction History */}
 {showAllTransactions && wallet.transactions.length > 0 && (
 <WalletTransactionHistory transactions={wallet.transactions} currency={wallet.currency} />
 )}
 </div>
 )
}

export default WalletBalanceCard

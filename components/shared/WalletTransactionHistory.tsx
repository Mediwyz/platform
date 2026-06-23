'use client'

import { FaArrowDown, FaArrowUp } from 'react-icons/fa'
import { getCurrencySymbol } from '@/lib/currency'

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

interface WalletTransactionHistoryProps {
 transactions: Transaction[]
 currency?: string
}

const WalletTransactionHistory: React.FC<WalletTransactionHistoryProps> = ({ transactions, currency = 'MUR' }) => {
 const symbol = getCurrencySymbol(currency)
 const formatDate = (dateStr: string) => {
 const date = new Date(dateStr)
 return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
 }

 const formatTime = (dateStr: string) => {
 const date = new Date(dateStr)
 return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
 }

 const getServiceTypeBadge = (serviceType: string | null) => {
 if (!serviceType) return null
 const colorMap: Record<string, string> = {
 consultation: 'bg-blue-100 text-blue-700',
 prescription: 'bg-purple-100 text-purple-700',
 lab_test: 'bg-cyan-100 text-cyan-700',
 emergency: 'bg-red-100 text-red-700',
 nurse_service: 'bg-pink-100 text-pink-700',
 childcare: 'bg-yellow-100 text-yellow-700',
 pharmacy: 'bg-green-100 text-green-700',
 initial_credit: 'bg-teal-100 text-teal-700',
 }
 const color = colorMap[serviceType] || 'bg-subtle text-soft'
 return (
 <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
 {serviceType.replace(/_/g, ' ')}
 </span>
 )
 }

 if (transactions.length === 0) {
 return (
 <div className="bg-surface rounded-xl p-6 shadow-lg border border-line text-center text-soft text-sm">
 No transactions yet.
 </div>
 )
 }

 return (
 <div className="bg-surface rounded-xl sm:rounded-2xl shadow-lg border border-line overflow-hidden">
 <div className="p-4 sm:p-5 border-b border-line">
 <h3 className="text-sm sm:text-base font-bold text-fg">Transaction History</h3>
 <p className="text-xs text-soft mt-1">{transactions.length} transaction{transactions.length !== 1 ? 's' : ''}</p>
 </div>

 {/* Desktop Table */}
 <div className="hidden md:block overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-subtle">
 <tr>
 <th className="p-3 text-left font-medium text-soft">Date</th>
 <th className="p-3 text-left font-medium text-soft">Description</th>
 <th className="p-3 text-left font-medium text-soft">Service</th>
 <th className="p-3 text-right font-medium text-soft">Amount</th>
 <th className="p-3 text-right font-medium text-soft">Balance After</th>
 </tr>
 </thead>
 <tbody>
 {transactions.map((tx) => {
 const isCredit = tx.type === 'CREDIT'
 return (
 <tr key={tx.id} className="border-b border-gray-50 hover:bg-subtle transition-colors">
 <td className="p-3">
 <p className="text-fg text-sm">{formatDate(tx.createdAt)}</p>
 <p className="text-soft text-xs">{formatTime(tx.createdAt)}</p>
 </td>
 <td className="p-3">
 <div className="flex items-center gap-2">
 <div className={`p-1 rounded-full ${isCredit ? 'bg-green-100' : 'bg-red-100'}`}>
 {isCredit ? (
 <FaArrowUp className="text-green-600 text-xs" />
 ) : (
 <FaArrowDown className="text-red-600 text-xs" />
 )}
 </div>
 <span className="text-fg">{tx.description}</span>
 </div>
 </td>
 <td className="p-3">
 {getServiceTypeBadge(tx.serviceType)}
 </td>
 <td className={`p-3 text-right font-semibold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
 {isCredit ? '+' : '-'}{symbol} {Math.abs(tx.amount).toLocaleString()}
 </td>
 <td className="p-3 text-right text-soft font-medium">
 {symbol} {tx.balanceAfter.toLocaleString()}
 </td>
 </tr>
 )
 })}
 </tbody>
 </table>
 </div>

 {/* Mobile Card List */}
 <div className="md:hidden divide-y divide-line">
 {transactions.map((tx) => {
 const isCredit = tx.type === 'CREDIT'
 return (
 <div key={tx.id} className="p-4 hover:bg-subtle transition-colors">
 <div className="flex items-start justify-between gap-3 mb-2">
 <div className="flex items-center gap-2 flex-1 min-w-0">
 <div className={`p-1.5 rounded-full flex-shrink-0 ${isCredit ? 'bg-green-100' : 'bg-red-100'}`}>
 {isCredit ? (
 <FaArrowUp className="text-green-600 text-xs" />
 ) : (
 <FaArrowDown className="text-red-600 text-xs" />
 )}
 </div>
 <p className="text-sm font-medium text-fg truncate">{tx.description}</p>
 </div>
 <p className={`text-sm font-bold whitespace-nowrap ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
 {isCredit ? '+' : '-'}{symbol} {Math.abs(tx.amount).toLocaleString()}
 </p>
 </div>
 <div className="flex items-center justify-between ml-8">
 <div className="flex items-center gap-2">
 {getServiceTypeBadge(tx.serviceType)}
 <span className="text-xs text-soft">
 {formatDate(tx.createdAt)}
 </span>
 </div>
 <span className="text-xs text-soft">
 Bal: {symbol} {tx.balanceAfter.toLocaleString()}
 </span>
 </div>
 </div>
 )
 })}
 </div>
 </div>
 )
}

export default WalletTransactionHistory

import { FaClock, FaCheckCircle, FaSpinner, FaDollarSign } from 'react-icons/fa'
import { ConversionData } from '../types'

interface RecentConversionsProps {
 conversions: ConversionData[]
}

export default function RecentConversions({ conversions }: RecentConversionsProps) {
 const getStatusInfo = (status: 'pending' | 'paid' | 'processing' | 'completed') => {
 switch (status) {
 case 'pending': return { icon: FaClock, color: 'bg-yellow-100 text-yellow-800', text: 'Pending' };
 case 'paid': return { icon: FaCheckCircle, color: 'bg-green-100 text-green-800', text: 'Paid' };
 case 'processing': return { icon: FaSpinner, color: 'bg-blue-100 text-blue-800', text: 'Processing' };
 case 'completed': return { icon: FaCheckCircle, color: 'bg-green-100 text-green-800', text: 'Completed' };
 }
 }

 const totalPendingCommission = conversions
 .filter(c => c.status === 'pending')
 .reduce((sum, c) => sum + c.commission, 0)

 return (
 <div className="bg-surface rounded-2xl p-6 shadow-lg">
 <div className="flex items-center justify-between mb-6">
 <h2 className="text-xl font-bold text-fg">Recent Conversions</h2>
 <div className="text-sm text-soft">
 Last 7 days
 </div>
 </div>

 {/* Pending Commission Summary */}
 <div className=" border border-green-200 rounded-lg p-4 mb-6">
 <div className="flex items-center justify-between">
 <div>
 <h3 className="text-sm font-medium text-green-700">Pending Commission</h3>
 <p className="text-2xl font-bold text-green-800">Rs {totalPendingCommission.toLocaleString()}</p>
 </div>
 <div className="text-green-600">
 <FaDollarSign className="text-2xl" />
 </div>
 </div>
 <p className="text-green-600 text-xs mt-2">
 Next payout: {(() => {
 const now = new Date()
 const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
 return next.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
 })()}
 </p>
 </div>

 {/* Conversions List */}
 <div className="space-y-4">
 {conversions.map((conversion) => {
 const statusInfo = getStatusInfo(conversion.status)
 const StatusIcon = statusInfo.icon

 return (
 <div key={conversion.id} className="border border-line rounded-lg p-4 hover:bg-subtle transition">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
 <span className="text-purple-600 font-semibold text-sm">
 {conversion.customerName.split(' ').map(n => n[0]).join('')}
 </span>
 </div>
 <div>
 <h3 className="font-semibold text-fg">{conversion.customerName}</h3>
 <p className="text-sm text-soft">{conversion.planType}</p>
 <p className="text-xs text-soft">
 Converted on {new Date(conversion.conversionDate).toLocaleDateString('en-US', {
 year: 'numeric',
 month: 'short',
 day: 'numeric'
 })}
 </p>
 </div>
 </div>
 <div className="text-right">
 <div className="flex items-center justify-end gap-3 mb-2">
 <span className="text-lg font-bold text-green-600">
 Rs {conversion.commission.toLocaleString()}
 </span>
 </div>
 <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${statusInfo.color}`}>
 <StatusIcon className={statusInfo.icon === FaSpinner ? 'animate-spin' : ''} />
 {statusInfo.text}
 </span>
 </div>
 </div>
 </div>
 )
 })}
 </div>

 {conversions.length === 0 && (
 <div className="text-center py-12">
 <div className="text-faint mb-4">
 <FaDollarSign className="text-4xl mx-auto" />
 </div>
 <h3 className="text-soft font-medium mb-2">No conversions yet</h3>
 <p className="text-soft text-sm">
 Start sharing your referral links to earn commissions!
 </p>
 </div>
 )}

 {/* Commission Breakdown */}
 {conversions.length > 0 && (
 <div className="mt-6 p-4 bg-subtle rounded-lg">
 <h4 className="font-semibold text-fg mb-3">Commission Breakdown</h4>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
 <div>
 <span className="text-soft">Total Commissions:</span>
 <span className="font-semibold ml-2 text-green-600">
 Rs {conversions.reduce((sum, c) => sum + c.commission, 0).toLocaleString()}
 </span>
 </div>
 <div>
 <span className="text-soft">Paid Out:</span>
 <span className="font-semibold ml-2">
 Rs {conversions
 .filter(c => c.status === 'paid')
 .reduce((sum, c) => sum + c.commission, 0)
 .toLocaleString()}
 </span>
 </div>
 <div>
 <span className="text-soft">Avg. Commission:</span>
 <span className="font-semibold ml-2">
 Rs {conversions.length > 0 ? 
 Math.round(conversions.reduce((sum, c) => sum + c.commission, 0) / conversions.length) : 0}
 </span>
 </div>
 </div>
 </div>
 )}
 </div>
 )
}
import { FaFileExport, FaChartLine } from 'react-icons/fa'
import Link from 'next/link'

interface EarningsSidebarProps {
 totalCommission: number
 platformFee: number
 netPayout: number
 claimApprovalRate: number
 expiringPolicies: number
}

export default function EarningsSidebar({ totalCommission, platformFee, netPayout, claimApprovalRate, expiringPolicies }: EarningsSidebarProps) {
 return (
 <div className="space-y-8">
 {/* Today's Payout */}
 <div className="bg-surface rounded-2xl p-6 shadow-lg">
 <div className="flex items-center justify-between mb-4">
 <h3 className="text-lg font-bold text-fg"> Payout</h3>
 <button className="text-blue-600 text-sm hover:underline">
 <FaFileExport />
 </button>
 </div>
 <div className="space-y-3">
 <div className="flex justify-between text-sm">
 <span className="text-soft">Total Commission</span>
 <span className="font-medium">Rs {totalCommission.toLocaleString()}</span>
 </div>
 <div className="flex justify-between text-sm">
 <span className="text-soft">Platform Fee (5%)</span>
 <span className="font-medium text-red-500">-Rs {platformFee.toLocaleString()}</span>
 </div>
 <div className="border-t pt-3 mt-3 flex justify-between">
 <span className="font-bold">Net Payout</span>
 <span className="font-bold text-xl text-green-600">Rs {netPayout.toLocaleString()}</span>
 </div>
 </div>
 </div>

 {/* Performance Metrics */}
 <div className="bg-surface rounded-2xl p-6 shadow-lg">
 <h3 className="text-lg font-bold text-fg mb-4">Performance Overview</h3>
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <span className="text-soft">Claim Approval Rate</span>
 <div className="flex items-center gap-2">
 <div className="w-16 h-2 bg-line rounded-full">
 <div className="h-2 bg-green-500 rounded-full" style={{ width: `${Math.min(claimApprovalRate, 100)}%` }}></div>
 </div>
 <span className="font-semibold text-green-600">{claimApprovalRate}%</span>
 </div>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-soft">Expiring Policies</span>
 <span className={`font-semibold ${expiringPolicies > 0 ? 'text-orange-600' : 'text-green-600'}`}>
 {expiringPolicies} soon
 </span>
 </div>
 </div>
 <Link 
 href="/insurance/billing" 
 className="bg-brand-navy text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2 mt-4"
 >
 <FaChartLine />
 View Analytics
 </Link>
 </div>

 {/* Alerts & Notifications */}
 <div className="bg-brand-navy text-white rounded-2xl p-6">
 <h3 className="text-lg font-bold mb-2">Policy Alerts</h3>
 {expiringPolicies > 0 ? (
 <>
 <p className="text-white/90 text-sm mb-4">{expiringPolicies} {expiringPolicies === 1 ? 'policy is' : 'policies are'} expiring within 30 days. Take action to ensure renewals.</p>
 <div className="space-y-2 mb-4">
 <div className="bg-white/20 rounded-lg p-2 text-sm">
 <span className="font-medium">Expiring soon:</span> {expiringPolicies} {expiringPolicies === 1 ? 'policy' : 'policies'}
 </div>
 </div>
 </>
 ) : (
 <p className="text-white/90 text-sm mb-4">No policies expiring in the next 30 days. All policies are up to date.</p>
 )}
 <Link
 href="/insurance/clients"
 className="bg-surface text-blue-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-subtle transition"
 >
 Manage Alerts
 </Link>
 </div>
 </div>
 )
}
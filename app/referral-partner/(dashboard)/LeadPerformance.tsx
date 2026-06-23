import { LeadSourceData } from '../types'
import { utmSources } from '../constants'

interface LeadPerformanceProps {
 leadsBySource: LeadSourceData[]
}

export default function LeadPerformance({ leadsBySource }: LeadPerformanceProps) {
 const getSourceIcon = (sourceName: string) => {
 const source = utmSources.find(s => s.name.toLowerCase() === sourceName.toLowerCase())
 return source ? { Icon: source.icon, color: source.color } : null
 }

 const totalVisitors = leadsBySource.reduce((sum, source) => sum + source.visitors, 0)
 const totalConversions = leadsBySource.reduce((sum, source) => sum + source.conversions, 0)
 const totalEarnings = leadsBySource.reduce((sum, source) => sum + source.earnings, 0)

 return (
 <div className="bg-surface rounded-2xl p-6 shadow-lg">
 <div className="flex items-center justify-between mb-6">
 <h2 className="text-xl font-bold text-fg">Lead Generation Performance</h2>
 <div className="text-sm text-soft">
 Last 30 days
 </div>
 </div>

 {/* Summary Cards */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
 <h3 className="text-sm font-medium text-blue-600">Total Visitors</h3>
 <p className="text-2xl font-bold text-blue-800">{totalVisitors.toLocaleString()}</p>
 </div>
 <div className="bg-green-50 border border-green-200 rounded-lg p-4">
 <h3 className="text-sm font-medium text-green-600">Total Conversions</h3>
 <p className="text-2xl font-bold text-green-800">{totalConversions}</p>
 </div>
 <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
 <h3 className="text-sm font-medium text-purple-600">Total Earnings</h3>
 <p className="text-2xl font-bold text-purple-800">Rs {totalEarnings.toLocaleString()}</p>
 </div>
 </div>

 {/* Performance by Source */}
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-subtle">
 <tr>
 <th className="p-3 text-left font-medium text-soft">Source</th>
 <th className="p-3 text-center font-medium text-soft">Visitors</th>
 <th className="p-3 text-center font-medium text-soft">Conversions</th>
 <th className="p-3 text-center font-medium text-soft">Conversion Rate</th>
 <th className="p-3 text-center font-medium text-soft">Earnings</th>
 <th className="p-3 text-center font-medium text-soft">ARPU</th>
 </tr>
 </thead>
 <tbody>
 {leadsBySource
 .sort((a, b) => b.earnings - a.earnings)
 .map((source) => {
 const sourceInfo = getSourceIcon(source.source)
 const arpu = source.conversions > 0 ? (source.earnings / source.conversions).toFixed(0) : 0

 return (
 <tr key={source.source} className="border-b hover:bg-subtle">
 <td className="p-3">
 <div className="flex items-center gap-3">
 {sourceInfo && (
 <div className={`w-8 h-8 ${sourceInfo.color} rounded-lg flex items-center justify-center`}>
 <sourceInfo.Icon className="text-white text-sm" />
 </div>
 )}
 <span className="font-medium">{source.source}</span>
 </div>
 </td>
 <td className="p-3 text-center font-medium">
 {source.visitors.toLocaleString()}
 </td>
 <td className="p-3 text-center">
 <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
 {source.conversions}
 </span>
 </td>
 <td className="p-3 text-center">
 <div className="flex items-center justify-center gap-2">
 <div className="w-12 h-2 bg-line rounded-full">
 <div 
 className="h-2 bg-blue-500 rounded-full" 
 style={{ width: `${Math.min(source.conversionRate, 100)}%` }}
 />
 </div>
 <span className="text-sm font-medium">{source.conversionRate}%</span>
 </div>
 </td>
 <td className="p-3 text-center font-semibold text-green-600">
 Rs {source.earnings.toLocaleString()}
 </td>
 <td className="p-3 text-center text-soft">
 Rs {arpu}
 </td>
 </tr>
 )
 })}
 </tbody>
 </table>
 </div>

 {/* Performance Insights */}
 {leadsBySource.length > 0 && (
 <div className="mt-6 p-4 bg-subtle rounded-lg">
 <h4 className="font-semibold text-fg mb-3">Performance Insights</h4>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
 <div>
 <span className="text-soft">Best Converting Source:</span>
 <span className="font-medium ml-2">
 {leadsBySource.reduce((best, current) =>
 current.conversionRate > best.conversionRate ? current : best
 ).source} ({leadsBySource.reduce((best, current) =>
 current.conversionRate > best.conversionRate ? current : best
 ).conversionRate}%)
 </span>
 </div>
 <div>
 <span className="text-soft">Highest Earning Source:</span>
 <span className="font-medium ml-2">
 {leadsBySource.reduce((best, current) =>
 current.earnings > best.earnings ? current : best
 ).source} (Rs {leadsBySource.reduce((best, current) =>
 current.earnings > best.earnings ? current : best
 ).earnings.toLocaleString()})
 </span>
 </div>
 <div>
 <span className="text-soft">Average Conversion Rate:</span>
 <span className="font-medium ml-2">
 {totalVisitors > 0 ? (totalConversions / totalVisitors * 100).toFixed(1) : '0.0'}%
 </span>
 </div>
 <div>
 <span className="text-soft">Revenue per Visitor:</span>
 <span className="font-medium ml-2">
 Rs {totalVisitors > 0 ? (totalEarnings / totalVisitors).toFixed(2) : '0.00'}
 </span>
 </div>
 </div>
 </div>
 )}

 {leadsBySource.length === 0 && (
 <div className="mt-6 p-6 text-center text-soft">
 <p className="text-sm">No lead data yet. Start sharing your referral links to see performance metrics here.</p>
 </div>
 )}
 </div>
 )
}
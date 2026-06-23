import { FaEdit, FaTrash, FaEye, FaPlus } from 'react-icons/fa'
import { PolicyHolder } from './types'
import { policyStatuses } from './constants'

interface PolicyHoldersTableProps {
 policyHolders: PolicyHolder[]
 onEdit?: (policyHolderId: string) => void
 onDelete?: (policyHolderId: string) => void
 onView?: (policyHolderId: string) => void
 onAdd?: () => void
}

export default function PolicyHoldersTable({ 
 policyHolders, 
 onEdit, 
 onDelete, 
 onView, 
 onAdd 
}: PolicyHoldersTableProps) {
 const getStatusInfo = (status: string) => {
 const statusConfig = policyStatuses.find(s => s.value === status)
 return statusConfig || { label: status, color: 'bg-subtle text-fg' }
 }

 const isExpiringSoon = (expiryDate: string) => {
 const expiry = new Date(expiryDate)
 const today = new Date()
 const diffTime = expiry.getTime() - today.getTime()
 const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
 return diffDays <= 30 && diffDays > 0
 }

 return (
 <div className="bg-surface rounded-2xl p-6 shadow-lg">
 <div className="flex items-center justify-between mb-6">
 <h2 className="text-xl font-bold text-fg">Policy Holders Management</h2>
 <div className="flex gap-3">
 <button className="text-blue-600 hover:underline font-medium">View All</button>
 {onAdd && (
 <button 
 onClick={onAdd}
 className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
 >
 <FaPlus />
 Add Policy Holder
 </button>
 )}
 </div>
 </div>
 
 <div className="overflow-x-auto">
 <table className="w-full text-sm text-left">
 <thead className="bg-subtle">
 <tr>
 <th className="p-3 font-medium text-soft">Policy Number</th>
 <th className="p-3 font-medium text-soft">Name</th>
 <th className="p-3 font-medium text-soft">Policy Type</th>
 <th className="p-3 font-medium text-soft">Premium</th>
 <th className="p-3 font-medium text-soft">Coverage</th>
 <th className="p-3 font-medium text-soft">Status</th>
 <th className="p-3 font-medium text-soft">Expiry</th>
 <th className="p-3 font-medium text-soft">Actions</th>
 </tr>
 </thead>
 <tbody>
 {policyHolders.map((holder) => {
 const statusInfo = getStatusInfo(holder.status)
 const expiringSoon = isExpiringSoon(holder.expiryDate)
 
 return (
 <tr key={holder.id} className="border-b hover:bg-subtle">
 <td className="p-3 font-mono text-xs">{holder.policyNumber}</td>
 <td className="p-3">
 <div>
 <p className="font-medium">{holder.name}</p>
 <p className="text-soft text-xs">{holder.email}</p>
 <p className="text-soft text-xs">{holder.phone}</p>
 </div>
 </td>
 <td className="p-3 text-soft">{holder.policyType}</td>
 <td className="p-3 font-semibold">Rs {holder.premium.toLocaleString()}</td>
 <td className="p-3 font-semibold">Rs {holder.coverageAmount.toLocaleString()}</td>
 <td className="p-3">
 <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
 {statusInfo.label}
 </span>
 </td>
 <td className="p-3">
 <div>
 <p className={`text-xs ${expiringSoon ? 'text-red-600 font-semibold' : 'text-soft'}`}>
 {holder.expiryDate}
 </p>
 {expiringSoon && (
 <p className="text-xs text-red-500">Expiring Soon!</p>
 )}
 </div>
 </td>
 <td className="p-3">
 <div className="flex items-center gap-2">
 {onView && (
 <button 
 onClick={() => onView(holder.id)}
 className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
 title="View Details"
 >
 <FaEye className="text-xs" />
 </button>
 )}
 {onEdit && (
 <button 
 onClick={() => onEdit(holder.id)}
 className="bg-green-500 text-white p-2 rounded hover:bg-green-600 transition-colors"
 title="Edit Policy"
 >
 <FaEdit className="text-xs" />
 </button>
 )}
 {onDelete && (
 <button 
 onClick={() => onDelete(holder.id)}
 className="bg-red-500 text-white p-2 rounded hover:bg-red-600 transition-colors"
 title="Delete Policy"
 >
 <FaTrash className="text-xs" />
 </button>
 )}
 </div>
 </td>
 </tr>
 )
 })}
 </tbody>
 </table>
 </div>
 </div>
 )
}
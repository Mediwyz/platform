'use client'

import { useState, useEffect } from 'react'
import { useDashboardUser } from '@/hooks/useDashboardUser'
import { FaSpinner, FaPlus, FaEye, FaTimes } from 'react-icons/fa'
import { IconType } from 'react-icons'
import dynamic from 'next/dynamic'

const CreateBookingModal = dynamic(() => import('@/components/shared/CreateBookingModal'), { ssr: false })

interface ListItem {
 id: string
 title: string
 subtitle?: string
 date: string
 status: string
 price?: number | null
}

interface HealthSectionListProps {
 title: string
 icon: IconType
 apiUrl: string
 mapData: (data: unknown[]) => ListItem[]
 emptyMessage?: string
 showCreateButton?: boolean
 defaultProviderType?: string
}

const statusColor = (s: string) =>
 s === 'completed' ? 'bg-green-100 text-green-700' :
 s === 'cancelled' || s === 'denied' ? 'bg-red-100 text-red-700' :
 s === 'pending' ? 'bg-yellow-100 text-yellow-700' :
 s === 'active' ? 'bg-green-100 text-green-700' :
 'bg-blue-100 text-blue-700'

export default function HealthSectionList({ title, icon: Icon, apiUrl, mapData, emptyMessage, showCreateButton = true, defaultProviderType }: HealthSectionListProps) {
 const user = useDashboardUser()
 const [items, setItems] = useState<ListItem[]>([])
 const [loading, setLoading] = useState(true)
 const [showBookingModal, setShowBookingModal] = useState(false)

 const fetchData = () => {
 if (!user) return
 setLoading(true)
 const url = apiUrl.replace('{userId}', user.id)
 fetch(url)
 .then(r => r.json())
 .then(json => {
 if (json.success && json.data) setItems(mapData(json.data))
 else if (Array.isArray(json.data)) setItems(mapData(json.data))
 })
 .catch(() => {})
 .finally(() => setLoading(false))
 }

 useEffect(() => { fetchData() }, [user, apiUrl, mapData]) // eslint-disable-line react-hooks/exhaustive-deps

 if (!user) return null
 if (loading) return <div className="flex justify-center py-12"><FaSpinner className="animate-spin text-blue-500 text-xl" /></div>

 return (
 <div className="p-4">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-lg font-bold text-fg flex items-center gap-2">
 <Icon className="text-blue-500" /> {title}
 </h2>
 {showCreateButton && (
 <button
 onClick={() => setShowBookingModal(true)}
 className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
 >
 <FaPlus className="text-xs" /> Book
 </button>
 )}
 </div>

 {items.length === 0 ? (
 <div className="text-center py-8">
 <p className="text-faint text-sm">{emptyMessage || `No ${title.toLowerCase()} yet.`}</p>
 {showCreateButton && (
 <button onClick={() => setShowBookingModal(true)}
 className="mt-3 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100">
 Book your first appointment
 </button>
 )}
 </div>
 ) : (
 <div className="space-y-2">
 {items.map(item => (
 <div key={item.id} className="bg-surface rounded-lg border border-line p-3 flex items-center justify-between">
 <div className="min-w-0 flex-1">
 <p className="font-medium text-fg text-sm truncate">{item.title}</p>
 {item.subtitle && <p className="text-xs text-soft truncate">{item.subtitle}</p>}
 <p className="text-xs text-faint">{item.date}</p>
 </div>
 <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
 <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor(item.status)}`}>{item.status}</span>
 {item.price != null && item.price > 0 && (
 <span className="text-xs font-medium text-soft">Rs {(item.price ?? 0).toLocaleString()}</span>
 )}
 {/* Action buttons */}
 {item.status === 'completed' && (
 <button className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded font-medium hover:bg-blue-100" title="View result">
 <FaEye className="inline mr-0.5" /> Result
 </button>
 )}
 {(item.status === 'pending' || item.status === 'upcoming' || item.status === 'accepted') && (
 <button className="text-[10px] px-2 py-0.5 bg-red-50 text-red-600 rounded font-medium hover:bg-red-100" title="Cancel">
 <FaTimes className="inline mr-0.5" /> Cancel
 </button>
 )}
 </div>
 </div>
 ))}
 </div>
 )}

 {/* Create Booking Modal */}
 <CreateBookingModal
 isOpen={showBookingModal}
 onClose={() => setShowBookingModal(false)}
 onCreated={fetchData}
 defaultProviderType={defaultProviderType}
 />
 </div>
 )
}

'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { FaFileAlt, FaUsers } from 'react-icons/fa'

const ClaimsContent = dynamic(() => import('../claims/page'), { ssr: false, loading: () => <TabLoading /> })
const ClientsContent = dynamic(() => import('../clients/page'), { ssr: false, loading: () => <TabLoading /> })

function TabLoading() {
 return (
 <div className="flex items-center justify-center py-20">
 <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
 </div>
 )
}

const TABS = [
 { id: 'claims', label: 'Claims', icon: FaFileAlt },
 { id: 'clients', label: 'Clients', icon: FaUsers },
] as const

type TabId = typeof TABS[number]['id']

export default function InsurancePortfolioPage() {
 const [activeTab, setActiveTab] = useState<TabId>('claims')

 return (
 <div className="pb-20 sm:pb-0">
 <div className="hidden sm:block border-b border-line bg-surface rounded-t-xl mb-0">
 <div className="flex overflow-x-auto">
 {TABS.map((tab) => {
 const Icon = tab.icon
 const isActive = activeTab === tab.id
 return (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
 isActive
 ? 'border-blue-600 text-blue-600'
 : 'border-transparent text-soft hover:text-soft hover:border-line'
 }`}
 >
 <Icon className={isActive ? 'text-blue-600' : 'text-faint'} />
 {tab.label}
 </button>
 )
 })}
 </div>
 </div>

 <div>
 {activeTab === 'claims' && <ClaimsContent />}
 {activeTab === 'clients' && <ClientsContent />}
 </div>

 <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-line flex justify-around items-center py-2 px-1 z-50 shadow-lg">
 {TABS.map((tab) => {
 const Icon = tab.icon
 const isActive = activeTab === tab.id
 return (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`flex flex-col items-center justify-center p-1 min-w-[40px] ${
 isActive ? 'text-blue-600' : 'text-faint'
 }`}
 >
 <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-faint'}`} />
 <span className="text-[10px] mt-0.5">{tab.label}</span>
 {isActive && <div className="w-1 h-1 bg-blue-600 rounded-full mt-0.5" />}
 </button>
 )
 })}
 </div>
 </div>
 )
}

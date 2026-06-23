'use client'

import { useState } from 'react'
import { IconType } from 'react-icons'

export interface SettingsTab {
 id: string
 label: string
 icon: IconType
 component: React.ReactNode
}

interface SettingsLayoutProps {
 tabs: SettingsTab[]
 title?: string
 defaultTab?: string
}

const SettingsLayout: React.FC<SettingsLayoutProps> = ({
 tabs,
 title = 'Account Settings',
 defaultTab,
}) => {
 const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '')

 const activeComponent = tabs.find((t) => t.id === activeTab)?.component

 return (
 <div className="min-h-screen bg-subtle">
 <div className="container mx-auto px-4 py-8">
 <h1 className="text-3xl font-bold text-fg mb-8">{title}</h1>
 <div className="flex flex-col md:flex-row gap-8">
 {/* Sidebar Navigation */}
 <aside className="w-full md:w-1/4">
 <div className="bg-surface rounded-xl shadow-lg p-4">
 <div className="flex md:flex-col gap-1 md:gap-2 overflow-x-auto md:overflow-visible" role="tablist">
 {tabs.map((tab) => {
 const Icon = tab.icon
 const isActive = activeTab === tab.id
 return (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 role="tab"
 aria-selected={isActive}
 id={`tab-${tab.id}`}
 aria-controls={`tabpanel-${tab.id}`}
 className={`flex-shrink-0 flex items-center justify-center md:justify-start text-left px-3 md:px-4 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${
 isActive
 ? ' text-white shadow-md'
 : 'text-soft hover:bg-subtle'
 }`}
 title={tab.label}
 >
 <Icon className="md:mr-3 text-lg" />
 <span className="hidden md:inline">{tab.label}</span>
 </button>
 )
 })}
 </div>
 </div>
 </aside>

 {/* Content Area */}
 <main className="w-full md:w-3/4">
 <div
 role="tabpanel"
 id={`tabpanel-${activeTab}`}
 aria-labelledby={`tab-${activeTab}`}
 className="bg-surface rounded-xl shadow-lg p-6 sm:p-8"
 >
 {activeComponent}
 </div>
 </main>
 </div>
 </div>
 </div>
 )
}

export default SettingsLayout

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { getUserId } from '@/hooks/useUser'
import {
 FaBuilding,
 FaUsers,
 FaCreditCard,
 FaBell,
 FaSave,
 FaTrash,
 FaEdit,
 FaPlus,
 FaToggleOn,
 FaToggleOff,
 FaDownload,
 FaUpload
} from 'react-icons/fa'
import { IconType } from 'react-icons'
import { ActiveTab, CorporateProfile, PaymentMethod, NotificationSettings, BillingHistory } from './types'

const emptyProfile: CorporateProfile = {
 companyName: '', adminName: '', email: '', phone: '', companyAddress: '',
 taxId: '', sector: '', logo: '', description: '', website: '', employeeCount: 0,
}

const emptyNotifications: NotificationSettings = {
 newClaims: true, employeeAdditions: true, billingUpdates: true,
 policyRenewals: true, employeeNotifications: true, customAlerts: false,
}

interface TabButtonProps {
 icon: IconType
 label: string
 tabName: ActiveTab
 activeTab: ActiveTab
 setActiveTab: (tab: ActiveTab) => void
}

const TabButton = ({ icon: Icon, label, tabName, activeTab, setActiveTab }: TabButtonProps) => (
 <button
 onClick={() => setActiveTab(tabName)}
 className={`flex items-center justify-center md:justify-start w-full text-left px-3 md:px-4 py-3 rounded-lg font-medium transition-colors ${
 activeTab === tabName
 ? 'bg-brand-navy text-white shadow-md'
 : 'text-soft hover:bg-subtle'
 }`}
 title={label}
 >
 <Icon className="md:mr-3 text-lg" />
 <span className="hidden md:inline">{label}</span>
 </button>
)

interface QuickStats {
 totalEmployees: number
 activePolicies: number
 pendingClaims: number
 coverageRate: number
}

interface SettingsTabsProps {
 initialTab?: ActiveTab
}

export default function SettingsTabs({ initialTab }: SettingsTabsProps) {
 const searchParams = useSearchParams()
 const urlTab = searchParams.get('tab') as ActiveTab | null
 const [activeTab, setActiveTab] = useState<ActiveTab>(urlTab || initialTab || 'profile')
 const [profile, setProfile] = useState<CorporateProfile>(emptyProfile)
 const [paymentMethods] = useState<PaymentMethod[]>([])
 const [notifications, setNotifications] = useState<NotificationSettings>(emptyNotifications)
 const [billingHistory] = useState<BillingHistory[]>([])
 const [quickStats, setQuickStats] = useState<QuickStats>({
 totalEmployees: 0,
 activePolicies: 0,
 pendingClaims: 0,
 coverageRate: 0,
 })

 useEffect(() => {
 const userId = getUserId()
 if (!userId) return

 fetch(`/api/corporate/${userId}/dashboard`, { credentials: 'include' })
 .then(res => res.ok ? res.json() : null)
 .then(json => {
 if (json?.success) {
 const s = json.data.stats
 const total = s.totalEmployees || 0
 const approved = s.approvedClaims || 0
 const pending = s.pendingClaims || 0
 const coverageRate = total > 0 ? Math.round(((total - pending) / total) * 100) : 0
 setQuickStats({
 totalEmployees: total,
 activePolicies: approved,
 pendingClaims: pending,
 coverageRate,
 })
 }
 })
 .catch(() => { /* silent fail */ })
 }, [])

 const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
 const { name, value } = e.target
 setProfile(prev => ({ ...prev, [name]: value }))
 }

 const handleNotificationToggle = (key: keyof NotificationSettings) => {
 setNotifications(prev => ({ ...prev, [key]: !prev[key] }))
 }

 return (
 <div className="flex flex-col md:flex-row gap-8">
 {/* Sidebar Navigation */}
 <aside className="w-full md:w-1/4">
 <div className="bg-surface rounded-xl shadow-lg p-4 space-y-2">
 <TabButton 
 icon={FaBuilding} 
 label="Corporate Profile" 
 tabName="profile" 
 activeTab={activeTab} 
 setActiveTab={setActiveTab} 
 />
 <TabButton 
 icon={FaUsers} 
 label="Employee Management" 
 tabName="employees" 
 activeTab={activeTab} 
 setActiveTab={setActiveTab} 
 />
 <TabButton 
 icon={FaCreditCard} 
 label="Billing & Payments" 
 tabName="billing" 
 activeTab={activeTab} 
 setActiveTab={setActiveTab} 
 />
 <TabButton 
 icon={FaBell} 
 label="Notifications" 
 tabName="notifications" 
 activeTab={activeTab} 
 setActiveTab={setActiveTab} 
 />
 </div>
 </aside>

 {/* Content Area */}
 <main className="w-full md:w-3/4">
 <div className="bg-surface rounded-xl shadow-lg p-8">
 {/* Corporate Profile Tab */}
 {activeTab === 'profile' && (
 <form className="space-y-8">
 <div className="pb-6 border-b">
 <h2 className="text-xl font-bold text-fg mb-4">Company Information</h2>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div>
 <label htmlFor="companyName" className="block text-sm font-medium text-soft">Company Name</label>
 <input
 type="text"
 id="companyName"
 name="companyName"
 value={profile.companyName}
 onChange={handleProfileChange}
 className="mt-1 block w-full rounded-md border-line shadow-sm focus:border-blue-500 focus:ring-blue-500"
 />
 </div>
 <div>
 <label htmlFor="phone" className="block text-sm font-medium text-soft">Phone Number</label>
 <input
 type="tel"
 id="phone"
 name="phone"
 value={profile.phone}
 onChange={handleProfileChange}
 className="mt-1 block w-full rounded-md border-line shadow-sm focus:border-blue-500 focus:ring-blue-500"
 />
 </div>
 </div>
 </div>

 <div className="text-right pt-6 mt-6 border-t">
 <button type="submit" className="bg-brand-navy text-white px-6 py-2.5 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2 inline-flex">
 <FaSave />
 Save Profile Changes
 </button>
 </div>
 </form>
 )}

 {/* Employee Management Tab */}
 {activeTab === 'employees' && (
 <div>
 <div className="flex justify-between items-center mb-6">
 <h2 className="text-2xl font-bold text-fg">Employee Management</h2>
 <div className="flex gap-3">
 <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2">
 <FaUpload />
 Bulk Import
 </button>
 <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
 <FaPlus />
 Add Employee
 </button>
 </div>
 </div>

 <div className="bg-subtle rounded-lg p-4 mb-6">
 <h3 className="font-semibold text-fg mb-3">Quick Stats</h3>
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <div className="bg-surface p-4 rounded-lg">
 <p className="text-2xl font-bold text-blue-600">{quickStats.totalEmployees}</p>
 <p className="text-sm text-soft">Total Employees</p>
 </div>
 <div className="bg-surface p-4 rounded-lg">
 <p className="text-2xl font-bold text-green-600">{quickStats.activePolicies}</p>
 <p className="text-sm text-soft">Approved Claims</p>
 </div>
 <div className="bg-surface p-4 rounded-lg">
 <p className="text-2xl font-bold text-yellow-600">{quickStats.pendingClaims}</p>
 <p className="text-sm text-soft">Pending Claims</p>
 </div>
 <div className="bg-surface p-4 rounded-lg">
 <p className="text-2xl font-bold text-purple-600">{quickStats.coverageRate}%</p>
 <p className="text-sm text-soft">Coverage Rate</p>
 </div>
 </div>
 </div>

 <div className="space-y-4">
 <div className="flex justify-between items-center">
 <h3 className="font-semibold text-fg">Employee Actions</h3>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="border-2 border-dashed border-line rounded-lg p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer">
 <FaUsers className="text-4xl text-faint mx-auto mb-3" />
 <h4 className="font-semibold text-fg mb-2">Add Individual Employee</h4>
 <p className="text-sm text-soft">Add a single employee with policy details</p>
 </div>
 <div className="border-2 border-dashed border-line rounded-lg p-6 text-center hover:border-green-500 hover:bg-green-50 transition cursor-pointer">
 <FaUpload className="text-4xl text-faint mx-auto mb-3" />
 <h4 className="font-semibold text-fg mb-2">Bulk Employee Import</h4>
 <p className="text-sm text-soft">Upload CSV/Excel file with employee data</p>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Billing & Payments Tab */}
 {activeTab === 'billing' && (
 <div>
 <h2 className="text-2xl font-bold text-fg mb-6">Billing & Payment Management</h2>
 
 {/* Payment Methods */}
 <div className="mb-8">
 <h3 className="font-bold text-fg mb-4">Payment Methods</h3>
 <div className="space-y-4">
 {paymentMethods.map((method) => (
 <div key={method.id} className="border rounded-lg p-4">
 <div className="flex justify-between items-center">
 <div>
 <h4 className="font-semibold text-fg">{method.type}</h4>
 <p className="text-sm text-soft">{method.details}</p>
 {method.isPrimary && (
 <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium mt-1 inline-block">
 Primary
 </span>
 )}
 </div>
 <div className="flex items-center gap-2">
 <button className="text-blue-600 hover:text-blue-800">
 <FaEdit />
 </button>
 <button className="text-red-600 hover:text-red-800">
 <FaTrash />
 </button>
 </div>
 </div>
 </div>
 ))}
 </div>
 <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
 <FaPlus />
 Add Payment Method
 </button>
 </div>

 {/* Billing History */}
 <div>
 <div className="flex justify-between items-center mb-4">
 <h3 className="font-bold text-fg">Billing History</h3>
 <button className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
 <FaDownload />
 Export All
 </button>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full border rounded-lg">
 <thead className="bg-subtle">
 <tr>
 <th className="p-3 text-left font-medium text-soft">Date</th>
 <th className="p-3 text-left font-medium text-soft">Description</th>
 <th className="p-3 text-right font-medium text-soft">Amount</th>
 <th className="p-3 text-center font-medium text-soft">Status</th>
 <th className="p-3 text-center font-medium text-soft">Invoice</th>
 </tr>
 </thead>
 <tbody>
 {billingHistory.map((bill) => (
 <tr key={bill.id} className="border-t hover:bg-subtle">
 <td className="p-3 text-sm">{bill.date}</td>
 <td className="p-3 text-sm">{bill.description}</td>
 <td className="p-3 text-sm text-right font-semibold">Rs {bill.amount.toLocaleString()}</td>
 <td className="p-3 text-center">
 <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
 bill.status === 'paid' ? 'bg-green-100 text-green-800' :
 bill.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
 'bg-red-100 text-red-800'
 }`}>
 {bill.status}
 </span>
 </td>
 <td className="p-3 text-center">
 {bill.invoice && (
 <button className="text-blue-600 hover:text-blue-800 text-sm">
 Download
 </button>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 )}

 {/* Notifications Tab */}
 {activeTab === 'notifications' && (
 <div>
 <h2 className="text-2xl font-bold text-fg mb-6">Notification Settings</h2>
 <div className="space-y-6">
 <div className="space-y-4">
 {Object.entries({
 newClaims: "New Claims Submitted",
 employeeAdditions: "Employee Policy Additions",
 billingUpdates: "Billing & Payment Updates",
 policyRenewals: "Policy Renewal Reminders",
 employeeNotifications: "Employee Notification Confirmations",
 customAlerts: "Custom Alert Notifications"
 }).map(([key, label]) => (
 <div key={key} className="flex items-center justify-between p-4 border rounded-lg hover:bg-subtle">
 <div>
 <p className="font-medium text-fg">{label}</p>
 <p className="text-sm text-soft">
 {key === 'newClaims' && "Get notified when employees submit new insurance claims"}
 {key === 'employeeAdditions' && "Receive alerts when new employees are added to policies"}
 {key === 'billingUpdates' && "Updates about billing cycles and payment processing"}
 {key === 'policyRenewals' && "Reminders about upcoming policy renewal dates"}
 {key === 'employeeNotifications' && "Confirmations when employee notifications are sent"}
 {key === 'customAlerts' && "Custom alerts based on your specified criteria"}
 </p>
 </div>
 <button 
 type="button" 
 onClick={() => handleNotificationToggle(key as keyof NotificationSettings)}
 >
 {notifications[key as keyof NotificationSettings] ? 
 <FaToggleOn className="text-3xl text-green-500" /> : 
 <FaToggleOff className="text-3xl text-faint" />
 }
 </button>
 </div>
 ))}
 </div>
 <div className="text-right pt-6 mt-6 border-t">
 <button type="button" className="bg-brand-navy text-white px-6 py-2.5 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2 inline-flex">
 <FaSave />
 Save Notification Settings
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 </main>
 </div>
 )
}
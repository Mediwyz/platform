import React from 'react'
import { 
 FaFileUpload,
 FaSave,
 FaToggleOn,
 FaToggleOff,
 FaUniversity,
 FaCheckCircle
} from 'react-icons/fa'
import { 
 ActiveTab, 
 ReferralPartnerSettings,
 BillingSettings,
 NotificationSettings
} from './types'

interface TabButtonProps {
 icon: React.ComponentType<{ className?: string }>
 label: string
 tabName: ActiveTab
 activeTab: ActiveTab
 setActiveTab: (tab: ActiveTab) => void
}

export const TabButton = ({ icon: Icon, label, tabName, activeTab, setActiveTab }: TabButtonProps) => (
 <button
 onClick={() => setActiveTab(tabName)}
 className={`flex items-center w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
 activeTab === tabName
 ? ' text-white shadow-md'
 : 'text-soft hover:bg-subtle'
 }`}
 >
 <Icon className="mr-3 text-lg" />
 {label}
 </button>
)

interface ProfileSettingsProps {
 profile: ReferralPartnerSettings
 onProfileChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
}

export const ProfileSettings = ({ profile, onProfileChange }: ProfileSettingsProps) => (
 <form className="space-y-8">
 <div className="pb-6 border-b">
 <h2 className="text-xl font-bold text-fg mb-4">Personal Information</h2>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div>
 <label htmlFor="name" className="block text-sm font-medium text-soft">Full Name</label>
 <input
 type="text"
 id="name"
 name="name"
 value={profile.name}
 onChange={onProfileChange}
 className="mt-1 block w-full rounded-md border-line shadow-sm focus:border-purple-500 focus:ring-purple-500"
 />
 </div>
 <div>
 <label htmlFor="email" className="block text-sm font-medium text-soft">Email Address</label>
 <input
 type="email"
 id="email"
 name="email"
 value={profile.email}
 onChange={onProfileChange}
 className="mt-1 block w-full rounded-md border-line shadow-sm focus:border-purple-500 focus:ring-purple-500"
 />
 </div>
 <div>
 <label htmlFor="phone" className="block text-sm font-medium text-soft">Phone Number</label>
 <input
 type="tel"
 id="phone"
 name="phone"
 value={profile.phone}
 onChange={onProfileChange}
 className="mt-1 block w-full rounded-md border-line shadow-sm focus:border-purple-500 focus:ring-purple-500"
 />
 </div>
 <div>
 <label htmlFor="dateOfBirth" className="block text-sm font-medium text-soft">Date of Birth</label>
 <input
 type="date"
 id="dateOfBirth"
 name="dateOfBirth"
 value={profile.dateOfBirth}
 onChange={onProfileChange}
 className="mt-1 block w-full rounded-md border-line shadow-sm focus:border-purple-500 focus:ring-purple-500"
 />
 </div>
 <div>
 <label htmlFor="businessType" className="block text-sm font-medium text-soft">Business Type</label>
 <select
 id="businessType"
 name="businessType"
 value={profile.businessType}
 onChange={onProfileChange}
 className="mt-1 block w-full rounded-md border-line shadow-sm focus:border-purple-500 focus:ring-purple-500"
 >
 <option value="Individual Marketer">Individual Marketer</option>
 <option value="Marketing Agency">Marketing Agency</option>
 <option value="Social Media Influencer">Social Media Influencer</option>
 <option value="Healthcare Related Business">Healthcare Related Business</option>
 <option value="Other">Other</option>
 </select>
 </div>
 <div>
 <label htmlFor="taxId" className="block text-sm font-medium text-soft">Tax ID (Optional)</label>
 <input
 type="text"
 id="taxId"
 name="taxId"
 value={profile.taxId}
 onChange={onProfileChange}
 className="mt-1 block w-full rounded-md border-line shadow-sm focus:border-purple-500 focus:ring-purple-500"
 />
 </div>
 <div className="md:col-span-2">
 <label htmlFor="address" className="block text-sm font-medium text-soft">Full Address</label>
 <input
 type="text"
 id="address"
 name="address"
 value={profile.address}
 onChange={onProfileChange}
 className="mt-1 block w-full rounded-md border-line shadow-sm focus:border-purple-500 focus:ring-purple-500"
 />
 </div>
 </div>
 </div>
 <div className="text-right pt-6 mt-6 border-t">
 <button type="button" className="bg-brand-navy text-white px-6 py-2.5 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2 inline-flex">
 <FaSave />
 Save Profile
 </button>
 </div>
 </form>
)

interface BillingSettingsProps {
 billing: BillingSettings
 onBillingChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
}

export const BillingSettingsComponent = ({ billing, onBillingChange }: BillingSettingsProps) => (
 <div>
 <h2 className="text-2xl font-bold text-fg mb-6">Billing & Payment Settings</h2>
 
 {/* MCB Juice Integration */}
 <div className=" border border-green-200 p-6 rounded-lg mb-6">
 <div className="flex justify-between items-start">
 <div>
 <h3 className="font-bold text-green-900 mb-2 flex items-center gap-2">
 <FaUniversity className="text-xl" /> 
 Primary Payout Account
 </h3>
 <div className="space-y-1 text-sm text-soft">
 <p><span className="font-medium">Type:</span> {billing.accountType}</p>
 <p><span className="font-medium">Account:</span> {billing.accountDetails.accountNumber}</p>
 <p><span className="font-medium">Name:</span> {billing.accountDetails.accountName}</p>
 <p><span className="font-medium">Bank:</span> {billing.accountDetails.bankName}</p>
 </div>
 <div className="mt-3 flex items-center gap-2 text-green-600">
 <FaCheckCircle />
 <span className="text-sm font-medium">Verified & Active</span>
 </div>
 </div>
 <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
 Update Account
 </button>
 </div>
 </div>

 {/* MCB Juice Configuration */}
 <div className="border rounded-lg p-6 mb-6">
 <h3 className="font-bold text-fg mb-4">MCB Juice Integration</h3>
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
 <span className="text-green-600 font-bold">MCB</span>
 </div>
 <div>
 <p className="font-medium text-fg">MCB Juice</p>
 <p className="text-sm text-soft">Linked to: {billing.mcbJuiceNumber}</p>
 </div>
 </div>
 <FaToggleOn className="text-4xl text-green-500" />
 </div>
 <div className="bg-green-50 border border-green-200 rounded-lg p-3">
 <p className="text-sm text-green-800 flex items-center gap-2">
 <FaCheckCircle /> MCB Juice is connected and ready for payouts
 </p>
 </div>
 </div>

 {/* Payout Settings */}
 <div className="mb-6">
 <h3 className="font-bold text-fg mb-4">Payout Preferences</h3>
 <div className="space-y-4">
 <div>
 <label htmlFor="payoutFrequency" className="block text-sm font-medium text-soft">Payout Frequency</label>
 <select
 id="payoutFrequency"
 name="payoutFrequency"
 value={billing.payoutFrequency}
 onChange={onBillingChange}
 className="mt-1 block w-full rounded-md border-line shadow-sm focus:border-purple-500 focus:ring-purple-500"
 >
 <option value="weekly">Weekly (Minimum Rs 1,000)</option>
 <option value="monthly">Monthly (Minimum Rs 500)</option>
 <option value="quarterly">Quarterly (No Minimum)</option>
 </select>
 <p className="text-xs text-soft mt-1">
 Current setting: {billing.payoutFrequency} payouts
 </p>
 </div>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
 <h4 className="font-semibold text-blue-800 mb-2">Next Payout</h4>
 <p className="text-blue-700">September 1, 2025</p>
 <p className="text-sm text-blue-600">Est. Amount: Rs 5,200</p>
 </div>
 <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
 <h4 className="font-semibold text-purple-800 mb-2">Commission Rate</h4>
 <p className="text-purple-700">15-25%</p>
 <p className="text-sm text-purple-600">Based on plan type</p>
 </div>
 </div>
 </div>
 </div>

 <div className="text-right mt-6 pt-6 border-t">
 <button type="button" className="bg-brand-navy text-white px-6 py-2.5 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2 inline-flex">
 <FaSave />
 Save Billing Settings
 </button>
 </div>
 </div>
)

interface NotificationSettingsProps {
 notifications: NotificationSettings
 onNotificationToggle: (key: keyof NotificationSettings) => void
}

export const NotificationSettingsComponent = ({ notifications, onNotificationToggle }: NotificationSettingsProps) => (
 <div>
 <h2 className="text-2xl font-bold text-fg mb-6">Notification Preferences</h2>
 <p className="text-soft mb-6">Manage how you receive updates about your referral performance and earnings.</p>
 
 <div className="space-y-4">
 {Object.entries({
 emailNotifications: "Email Notifications",
 smsNotifications: "SMS Notifications",
 conversionAlerts: "Conversion Alerts",
 payoutNotifications: "Payout Notifications", 
 weeklyReports: "Weekly Performance Reports",
 marketingTips: "Marketing Tips & Best Practices"
 }).map(([key, label]) => (
 <div key={key} className="flex items-center justify-between p-4 border rounded-lg hover:bg-subtle transition">
 <div>
 <p className="font-medium text-fg">{label}</p>
 <p className="text-sm text-soft">
 {key === 'conversionAlerts' && 'Get notified immediately when someone converts through your link'}
 {key === 'payoutNotifications' && 'Receive updates about payout processing and completion'}
 {key === 'weeklyReports' && 'Weekly summary of your referral performance and earnings'}
 {key === 'marketingTips' && 'Tips and strategies to improve your conversion rates'}
 {key === 'emailNotifications' && 'General email notifications for important updates'}
 {key === 'smsNotifications' && 'SMS alerts for urgent notifications'}
 </p>
 </div>
 <button 
 type="button" 
 onClick={() => onNotificationToggle(key as keyof NotificationSettings)}
 >
 {notifications[key as keyof NotificationSettings] ? (
 <FaToggleOn className="text-3xl text-green-500" />
 ) : (
 <FaToggleOff className="text-3xl text-faint" />
 )}
 </button>
 </div>
 ))}
 </div>
 
 <div className="text-right pt-6 mt-6 border-t">
 <button type="button" className="bg-brand-navy text-white px-6 py-2.5 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2 inline-flex">
 <FaSave />
 Save Preferences
 </button>
 </div>
 </div>
)

export const DocumentSettings = () => (
 <div>
 <h2 className="text-2xl font-bold text-fg mb-6">Document Management</h2>
 <p className="text-soft mb-6">Upload and manage your referral partner verification documents.</p>
 
 <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
 <div className="flex items-center gap-3">
 <FaCheckCircle className="text-green-600 text-2xl"/>
 <div>
 <h4 className="font-bold text-green-900">Verification Status: Complete</h4>
 <p className="text-sm text-green-800">Your referral partner account is fully verified and active.</p>
 </div>
 </div>
 </div>

 <div className="space-y-4 mb-6">
 {[
 {id: 'd1', name: 'National-ID-Document.pdf', type: 'Identity Verification', status: 'Verified', uploadDate: '2024-01-15'},
 {id: 'd2', name: 'Business-Registration.pdf', type: 'Business Document', status: 'Verified', uploadDate: '2024-01-15'},
 {id: 'd3', name: 'Tax-Certificate.pdf', type: 'Tax Document', status: 'Verified', uploadDate: '2024-01-16'}
 ].map(doc => (
 <div key={doc.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg hover:bg-subtle">
 <div>
 <p className="font-medium text-fg">{doc.name}</p>
 <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-soft mt-1">
 <span>Type: {doc.type}</span>
 <span>Uploaded: {doc.uploadDate}</span>
 <span className="flex items-center gap-1 text-green-600 font-medium">
 <FaCheckCircle/> {doc.status}
 </span>
 </div>
 </div>
 <div className="flex items-center gap-4 mt-2 md:mt-0">
 <button className="text-blue-600 hover:text-blue-800 text-sm">
 View
 </button>
 <button className="text-red-600 hover:text-red-800 text-sm">
 Replace
 </button>
 </div>
 </div>
 ))}
 </div>

 <div>
 <label className="block text-sm font-medium text-soft mb-2">Upload Additional Document</label>
 <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-line border-dashed rounded-md">
 <div className="space-y-1 text-center">
 <FaFileUpload className="mx-auto h-12 w-12 text-faint" />
 <div className="flex text-sm text-soft">
 <label htmlFor="file-upload" className="relative cursor-pointer bg-surface rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none">
 <span>Click to upload</span>
 <input id="file-upload" name="file-upload" type="file" className="sr-only"/>
 </label>
 <p className="pl-1">or drag and drop</p>
 </div>
 <p className="text-xs text-soft">PDF, PNG, JPG up to 10MB</p>
 </div>
 </div>
 </div>
 </div>
)
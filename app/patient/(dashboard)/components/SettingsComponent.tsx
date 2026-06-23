import React, { useState } from 'react'
import { Patient } from '@/lib/data/patients'
import { 
 FaCog, 
 FaBell, 
 FaShieldAlt, 
 FaCreditCard, 
 FaUser, 
 FaMobile, 
 FaEnvelope, 
 FaSms, 
 FaToggleOn, 
 FaToggleOff,
 FaEdit,
 FaSave,
 FaTimes,
 FaPlus,
 FaTrash,
 FaIdCard,
 FaHeart,
 FaFileAlt,
 FaCalendarAlt,
 FaCrown,
 FaBirthdayCake,
 FaPhone,
 FaTint,
 FaWeight,
 FaRuler,
 FaThermometerHalf,
 FaNutritionix,
 FaUpload,
 FaCheck,
 FaExclamationTriangle,
 FaChevronDown,
 FaChevronUp
} from 'react-icons/fa'

interface Props {
 patientData: Patient
 setPatientData: React.Dispatch<React.SetStateAction<Patient | null>>
}

type ActiveTab = 'profile' | 'notifications' | 'security' | 'billing' | 'subscription' | 'health' | 'documents' | 'preferences'

interface EditableField {
 field: string
 value: string
 editing: boolean
}

const SettingsComponent: React.FC<Props> = ({ patientData, setPatientData }) => {
 const [activeTab, setActiveTab] = useState<ActiveTab>('profile')
 const [editingFields, setEditingFields] = useState<{ [key: string]: EditableField }>({})
 const [expandedSection, setExpandedSection] = useState<string>('profile')

 const handleNotificationToggle = (key: keyof typeof patientData.notificationPreferences) => {
 setPatientData((prev) => {
 if (!prev) return null
 return {
 ...prev,
 notificationPreferences: {
 ...prev.notificationPreferences,
 [key]: !prev.notificationPreferences[key]
 }
 }
 })
 }

 const handleSecurityToggle = (key: keyof typeof patientData.securitySettings) => {
 setPatientData((prev) => {
 if (!prev) return null
 return {
 ...prev,
 securitySettings: {
 ...prev.securitySettings,
 [key]: !prev.securitySettings[key]
 }
 }
 })
 }

 const startEditing = (field: string, value: string) => {
 setEditingFields(prev => ({
 ...prev,
 [field]: { field, value, editing: true }
 }))
 }

 const saveField = (field: string) => {
 const editField = editingFields[field]
 if (editField) {
 // In a real app, this would save to the backend
 setEditingFields(prev => ({
 ...prev,
 [field]: { ...editField, editing: false }
 }))
 }
 }

 const cancelEdit = (field: string) => {
 setEditingFields(prev => {
 const newFields = { ...prev }
 delete newFields[field]
 return newFields
 })
 }

 const tabs = [
 { id: 'profile', label: 'Profile', icon: FaUser, color: 'blue', gradient: ' ' },
 { id: 'health', label: 'Health Info', icon: FaHeart, color: 'red', gradient: ' ' },
 { id: 'notifications', label: 'Notifications', icon: FaBell, color: 'yellow', gradient: ' ' },
 { id: 'security', label: 'Security', icon: FaShieldAlt, color: 'green', gradient: ' ' },
 { id: 'billing', label: 'Billing', icon: FaCreditCard, color: 'purple', gradient: ' ' },
 { id: 'subscription', label: 'Subscription', icon: FaCrown, color: 'orange', gradient: ' ' },
 { id: 'documents', label: 'Documents', icon: FaFileAlt, color: 'indigo', gradient: ' ' },
 { id: 'preferences', label: 'Preferences', icon: FaCog, color: 'gray', gradient: ' ' }
 ]

 const toggleSection = (sectionId: string) => {
 if (expandedSection === sectionId) {
 setExpandedSection('')
 } else {
 setExpandedSection(sectionId)
 setActiveTab(sectionId as ActiveTab)
 }
 }

 const renderEditableField = (field: string, label: string, value: string, type: string = 'text') => {
 const isEditing = editingFields[field]?.editing
 
 return (
 <div className="space-y-1.5 sm:space-y-2">
 <label className="block text-xs sm:text-sm font-medium text-soft">{label}</label>
 <div className="flex items-center gap-1.5 sm:gap-2">
 {isEditing ? (
 <>
 <input
 type={type}
 value={editingFields[field]?.value || value}
 onChange={(e) => setEditingFields(prev => ({
 ...prev,
 [field]: { ...prev[field], value: e.target.value }
 }))}
 className="flex-1 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 border border-line rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-xs sm:text-sm md:text-base"
 />
 <button
 onClick={() => saveField(field)}
 className="p-1.5 sm:p-2 bg-sky-50 transition"
 >
 <FaSave className="text-xs sm:text-sm" />
 </button>
 <button
 onClick={() => cancelEdit(field)}
 className="p-1.5 sm:p-2 bg-sky-50 text-red-600 rounded-lg transition"
 >
 <FaTimes className="text-xs sm:text-sm" />
 </button>
 </>
 ) : (
 <>
 <input
 type={type}
 value={value}
 className="flex-1 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 border border-line rounded-lg bg-surface text-xs sm:text-sm md:text-base"
 readOnly
 />
 <button
 onClick={() => startEditing(field, value)}
 className="p-1.5 sm:p-2 bg-sky-50 transition"
 >
 <FaEdit className="text-xs sm:text-sm" />
 </button>
 </>
 )}
 </div>
 </div>
 )
 }

 const renderProfileSettings = () => (
 <div className="space-y-4 sm:space-y-6 md:space-y-8">
 {/* Basic Information */}
 <div className="bg-surface rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-blue-200">
 <h3 className="text-base sm:text-lg font-semibold text-fg mb-4 sm:mb-5 md:mb-6 flex items-center">
 <FaUser className="mr-2 text-blue-500" />
 Basic Information
 </h3>
 
 <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4 md:gap-6">
 {renderEditableField('firstName', 'First Name', patientData.firstName)}
 {renderEditableField('lastName', 'Last Name', patientData.lastName)}
 {renderEditableField('email', 'Email Address', patientData.email, 'email')}
 {renderEditableField('phone', 'Phone Number', patientData.phone, 'tel')}
 
 <div className="space-y-1.5 sm:space-y-2">
 <label className="block text-xs sm:text-sm font-medium text-soft">Date of Birth</label>
 <div className="flex flex-col sm:flex-row sm:items-center gap-2">
 <input
 type="date"
 value={patientData.dateOfBirth}
 className="flex-1 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 border border-line rounded-lg bg-surface text-xs sm:text-sm md:text-base"
 readOnly
 />
 <div className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-sky-50 text-blue-700 rounded-lg text-xs sm:text-sm">
 <FaBirthdayCake className="inline mr-1" />
 Age: {patientData.age}
 </div>
 </div>
 </div>

 <div className="space-y-1.5 sm:space-y-2">
 <label className="block text-xs sm:text-sm font-medium text-soft">Gender</label>
 <input
 type="text"
 value={patientData.gender}
 className="w-full px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 border border-line rounded-lg bg-surface text-xs sm:text-sm md:text-base"
 readOnly
 />
 </div>
 </div>

 <div className="mt-4 sm:mt-6">
 {renderEditableField('address', 'Address', patientData.address)}
 </div>

 <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-sky-50 rounded-xl">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
 <div>
 <p className="text-xs sm:text-sm font-medium text-blue-800">Profile Completeness</p>
 <p className="text-xs text-blue-600">Complete your profile to access all features</p>
 </div>
 <div className="text-xl sm:text-2xl font-bold text-blue-600">{patientData.profileCompleteness}%</div>
 </div>
 <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
 <div 
 className="bg-blue-500 h-2 rounded-full transition-all duration-500"
 style={{ width: `${patientData.profileCompleteness}%` }}
 ></div>
 </div>
 </div>
 </div>

 {/* ID Documents */}
 <div className="bg-surface rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-green-200">
 <h3 className="text-base sm:text-lg font-semibold text-fg mb-4 sm:mb-5 md:mb-6 flex items-center">
 <FaIdCard className="mr-2 text-green-500" />
 Identification Documents
 </h3>
 
 <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4 md:gap-6">
 {renderEditableField('nationalId', 'National ID', patientData.nationalId)}
 {patientData.passportNumber && renderEditableField('passportNumber', 'Passport Number', patientData.passportNumber)}
 </div>
 </div>

 {/* Emergency Contact */}
 <div className="bg-surface rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-red-200">
 <h3 className="text-base sm:text-lg font-semibold text-fg mb-4 sm:mb-5 md:mb-6 flex items-center">
 <FaPhone className="mr-2 text-red-500" />
 Emergency Contact
 </h3>
 
 <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4 md:gap-6">
 <div className="space-y-1.5 sm:space-y-2">
 <label className="block text-xs sm:text-sm font-medium text-soft">Name</label>
 <input 
 onChange={(e) =>
 setPatientData(prev => {
 if (!prev) return prev
 return {
 ...prev,
 emergencyContact: {
 ...prev.emergencyContact,
 name: e.target.value
 }
 }
 })
 }
 type="text"
 value={patientData.emergencyContact.name}
 className="w-full px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 border border-line rounded-lg focus:outline-none focus:border-blue-500 text-xs sm:text-sm md:text-base"
 />
 </div>
 
 <div className="space-y-1.5 sm:space-y-2">
 <label className="block text-xs sm:text-sm font-medium text-soft">Relationship</label>
 <input
 onChange={(e) =>
 setPatientData(prev => {
 if (!prev) return prev
 return {
 ...prev,
 emergencyContact: {
 ...prev.emergencyContact,
 relationship: e.target.value
 }
 }
 })
 }
 type="text"
 value={patientData.emergencyContact.relationship}
 className="w-full px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 border border-line rounded-lg focus:outline-none focus:border-blue-500 text-xs sm:text-sm md:text-base"
 />
 </div>
 
 <div className="space-y-1.5 sm:space-y-2">
 <label className="block text-xs sm:text-sm font-medium text-soft">Phone</label>
 <input
 onChange={(e) =>
 setPatientData(prev => {
 if (!prev) return prev
 return {
 ...prev,
 emergencyContact: {
 ...prev.emergencyContact,
 phone: e.target.value
 }
 }
 })
 }
 type="tel"
 value={patientData.emergencyContact.phone}
 className="w-full px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 border border-line rounded-lg focus:outline-none focus:border-blue-500 text-xs sm:text-sm md:text-base"
 />
 </div>
 
 <div className="space-y-1.5 sm:space-y-2">
 <label className="block text-xs sm:text-sm font-medium text-soft">Address</label>
 <input
 onChange={(e) =>
 setPatientData(prev => {
 if (!prev) return prev
 return {
 ...prev,
 emergencyContact: {
 ...prev.emergencyContact,
 address: e.target.value
 }
 }
 })
 }
 type="text"
 value={patientData.emergencyContact.address}
 className="w-full px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 border border-line rounded-lg focus:outline-none focus:border-blue-500 text-xs sm:text-sm md:text-base"
 />
 </div>
 </div>
 </div>
 </div>
 )

 const renderHealthSettings = () => (
 <div className="space-y-4 sm:space-y-6 md:space-y-8">
 {/* Medical Information */}
 <div className="bg-surface rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-red-200">
 <h3 className="text-base sm:text-lg font-semibold text-fg mb-4 sm:mb-5 md:mb-6 flex items-center">
 <FaHeart className="mr-2 text-red-500" />
 Medical Information
 </h3>
 
 <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-4 md:gap-6">
 <div className="space-y-1.5 sm:space-y-2">
 <label className="block text-xs sm:text-sm font-medium text-soft">Blood Type</label>
 <div className="flex items-center gap-2">
 <div className="px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-sky-50 text-red-700 rounded-lg font-bold text-center flex-1 text-xs sm:text-sm md:text-base">
 <FaTint className="inline mr-1 sm:mr-2" />
 {patientData.bloodType}
 </div>
 </div>
 </div>

 <div className="space-y-1.5 sm:space-y-2">
 <label className="block text-xs sm:text-sm font-medium text-soft">Health Score</label>
 <div className="flex items-center gap-2">
 <div className="px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-sky-50 text-green-700 rounded-lg font-bold text-center flex-1 text-xs sm:text-sm md:text-base">
 <FaHeart className="inline mr-1 sm:mr-2" />
 {patientData.healthScore}%
 </div>
 </div>
 </div>

 <div className="space-y-1.5 sm:space-y-2">
 <label className="block text-xs sm:text-sm font-medium text-soft">Body Age</label>
 <div className="flex items-center gap-2">
 <div className="px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-sky-50 text-blue-700 rounded-lg font-bold text-center flex-1 text-xs sm:text-sm md:text-base">
 <FaBirthdayCake className="inline mr-1 sm:mr-2" />
 {patientData.bodyAge} years
 </div>
 </div>
 </div>
 </div>

 {/* Allergies */}
 <div className="mt-4 sm:mt-6">
 <label className="block text-xs sm:text-sm font-medium text-soft mb-2 sm:mb-3">Allergies</label>
 <div className="flex flex-wrap gap-1.5 sm:gap-2">
 {patientData.allergies.map((allergy, index) => (
 <span key={index} className="px-2 sm:px-3 py-0.5 sm:py-1 bg-sky-50 text-red-800 rounded-full text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
 <FaExclamationTriangle className="text-xs" />
 {allergy}
 <button className="text-red-600 hover:text-red-800">
 <FaTimes className="text-xs" />
 </button>
 </span>
 ))}
 <button className="px-2 sm:px-3 py-0.5 sm:py-1 bg-sky-50 text-soft rounded-full text-xs sm:text-sm transition">
 <FaPlus className="inline mr-1" />
 Add Allergy
 </button>
 </div>
 </div>

 {/* Chronic Conditions */}
 <div className="mt-4 sm:mt-6">
 <label className="block text-xs sm:text-sm font-medium text-soft mb-2 sm:mb-3">Chronic Conditions</label>
 <div className="flex flex-wrap gap-1.5 sm:gap-2">
 {patientData.chronicConditions.map((condition, index) => (
 <span key={index} className="px-2 sm:px-3 py-0.5 sm:py-1 bg-sky-50 text-yellow-800 rounded-full text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
 <FaHeart className="text-xs" />
 {condition}
 <button className="text-yellow-600 hover:text-yellow-800">
 <FaTimes className="text-xs" />
 </button>
 </span>
 ))}
 <button className="px-2 sm:px-3 py-0.5 sm:py-1 bg-sky-50 text-soft rounded-full text-xs sm:text-sm transition">
 <FaPlus className="inline mr-1" />
 Add Condition
 </button>
 </div>
 </div>
 </div>

 {/* Latest Vital Signs */}
 {patientData.vitalSigns && patientData.vitalSigns.length > 0 && (
 <div className="bg-surface rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-orange-200">
 <h3 className="text-base sm:text-lg font-semibold text-fg mb-4 sm:mb-5 md:mb-6 flex items-center">
 <FaThermometerHalf className="mr-2 text-orange-500" />
 Latest Vital Signs
 </h3>
 
 {(() => {
 const latestVitals = patientData.vitalSigns[0]
 return (
 <div>
 <p className="text-xs sm:text-sm text-soft mb-3 sm:mb-4">
 Recorded on {new Date(latestVitals.date).toLocaleDateString()} at {latestVitals.time}
 </p>
 
 <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
 <div className="bg-sky-50 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
 <FaHeart className="text-red-500 text-base sm:text-lg md:text-xl mx-auto mb-1 sm:mb-2" />
 <p className="text-xs text-soft">Blood Pressure</p>
 <p className="text-sm sm:text-base md:text-lg font-bold text-red-600">
 {latestVitals.bloodPressure.systolic}/{latestVitals.bloodPressure.diastolic}
 </p>
 </div>
 
 <div className="bg-sky-50 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
 <FaWeight className="text-blue-500 text-base sm:text-lg md:text-xl mx-auto mb-1 sm:mb-2" />
 <p className="text-xs text-soft">Weight</p>
 <p className="text-sm sm:text-base md:text-lg font-bold text-blue-600">{latestVitals.weight} kg</p>
 </div>
 
 <div className="bg-sky-50 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
 <FaRuler className="text-green-500 text-base sm:text-lg md:text-xl mx-auto mb-1 sm:mb-2" />
 <p className="text-xs text-soft">Height</p>
 <p className="text-sm sm:text-base md:text-lg font-bold text-green-600">{latestVitals.height} cm</p>
 </div>
 
 <div className="bg-sky-50 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
 <FaThermometerHalf className="text-orange-500 text-base sm:text-lg md:text-xl mx-auto mb-1 sm:mb-2" />
 <p className="text-xs text-soft">Temperature</p>
 <p className="text-sm sm:text-base md:text-lg font-bold text-orange-600">{latestVitals.temperature}°C</p>
 </div>
 </div>
 </div>
 )
 })()}
 </div>
 )}

 {/* Health Metrics */}
 {patientData.healthMetrics && (
 <div className="bg-surface rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-purple-200">
 <h3 className="text-base sm:text-lg font-semibold text-fg mb-4 sm:mb-5 md:mb-6 flex items-center">
 <FaNutritionix className="mr-2 text-purple-500" />
 Health Metrics & Analytics
 </h3>
 
 <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-3 md:gap-4 lg:gap-6">
 {/* Cholesterol */}
 <div className="bg-sky-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
 <h4 className="font-medium text-purple-800 mb-2 sm:mb-3 text-sm sm:text-base">Cholesterol Profile</h4>
 <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
 <div className="flex justify-between">
 <span>Total:</span>
 <span className="font-semibold">{patientData.healthMetrics.cholesterol.total} mg/dL</span>
 </div>
 <div className="flex justify-between">
 <span>LDL:</span>
 <span className="font-semibold">{patientData.healthMetrics.cholesterol.ldl} mg/dL</span>
 </div>
 <div className="flex justify-between">
 <span>HDL:</span>
 <span className="font-semibold">{patientData.healthMetrics.cholesterol.hdl} mg/dL</span>
 </div>
 <div className="flex justify-between">
 <span>Triglycerides:</span>
 <span className="font-semibold">{patientData.healthMetrics.cholesterol.triglycerides} mg/dL</span>
 </div>
 </div>
 </div>

 {/* BMI */}
 <div className="bg-sky-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
 <h4 className="font-medium text-green-800 mb-2 sm:mb-3 text-sm sm:text-base">Body Composition</h4>
 <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
 <div className="flex justify-between">
 <span>BMI:</span>
 <span className="font-semibold">{patientData.healthMetrics.bmi.value}</span>
 </div>
 <div className="flex justify-between">
 <span>Category:</span>
 <span className="font-semibold">{patientData.healthMetrics.bmi.category}</span>
 </div>
 <div className="flex justify-between">
 <span>Muscle Mass:</span>
 <span className="font-semibold">{patientData.healthMetrics.muscleMass} kg</span>
 </div>
 <div className="flex justify-between">
 <span>Visceral Fat:</span>
 <span className="font-semibold">{patientData.healthMetrics.visceralFat}</span>
 </div>
 </div>
 </div>

 {/* Sleep & Wellness */}
 <div className="bg-sky-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
 <h4 className="font-medium text-blue-800 mb-2 sm:mb-3 text-sm sm:text-base">Sleep & Wellness</h4>
 <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
 <div className="flex justify-between">
 <span>Avg Sleep:</span>
 <span className="font-semibold">{patientData.healthMetrics.sleepQuality.averageHours} hrs</span>
 </div>
 <div className="flex justify-between">
 <span>Quality:</span>
 <span className="font-semibold capitalize">{patientData.healthMetrics.sleepQuality.quality}</span>
 </div>
 <div className="flex justify-between">
 <span>Stress Level:</span>
 <span className="font-semibold capitalize">{patientData.healthMetrics.stressLevel}</span>
 </div>
 <div className="flex justify-between">
 <span>HRV:</span>
 <span className="font-semibold">{patientData.healthMetrics.heartRateVariability} ms</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 )

 const renderNotificationSettings = () => (
 <div className="space-y-4 sm:space-y-6">
 <div className="bg-surface rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-yellow-200">
 <h3 className="text-base sm:text-lg font-semibold text-fg mb-4 sm:mb-5 md:mb-6 flex items-center">
 <FaBell className="mr-2 text-yellow-500" />
 Notification Preferences
 </h3>
 
 <div className="space-y-3 sm:space-y-4 md:space-y-6">
 {Object.entries({
 appointments: { label: 'Appointment Reminders', desc: 'Get notified about upcoming appointments', icon: FaCalendarAlt, color: 'text-blue-500' },
 medications: { label: 'Medication Reminders', desc: 'Reminders to take your medications', icon: FaCog, color: 'text-green-500' },
 testResults: { label: 'Lab Test Results', desc: 'Notifications when lab results are ready', icon: FaFileAlt, color: 'text-purple-500' },
 healthTips: { label: 'Health Tips & Articles', desc: 'Personalized health tips and articles', icon: FaHeart, color: 'text-red-500' },
 emergencyAlerts: { label: 'Emergency Alerts', desc: 'Important emergency notifications', icon: FaExclamationTriangle, color: 'text-red-600' },
 chatMessages: { label: 'Chat Messages', desc: 'New messages from healthcare providers', icon: FaEnvelope, color: 'text-indigo-500' },
 videoCallReminders: { label: 'Video Call Reminders', desc: 'Reminders for video consultations', icon: FaMobile, color: 'text-green-600' },
 dietReminders: { label: 'Diet & Nutrition Reminders', desc: 'Meal and hydration reminders', icon: FaNutritionix, color: 'text-orange-500' },
 exerciseReminders: { label: 'Exercise Reminders', desc: 'Exercise and activity reminders', icon: FaHeart, color: 'text-pink-500' }
 }).map(([key, config]) => (
 <div key={key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-line rounded-lg sm:rounded-xl hover:border-line transition gap-3">
 <div className="flex items-center gap-3 sm:gap-4">
 <div className={`p-2 sm:p-3 bg-surface rounded-lg ${config.color}`}>
 <config.icon className="text-base sm:text-lg md:text-xl" />
 </div>
 <div>
 <p className="font-medium text-fg text-xs sm:text-sm md:text-base">{config.label}</p>
 <p className="text-xs sm:text-sm text-soft">{config.desc}</p>
 </div>
 </div>
 <button
 onClick={() => handleNotificationToggle(key as keyof typeof patientData.notificationPreferences)}
 className="text-2xl sm:text-3xl transition-all self-end sm:self-auto"
 >
 {patientData.notificationPreferences[key as keyof typeof patientData.notificationPreferences] ? (
 <FaToggleOn className="text-green-500" />
 ) : (
 <FaToggleOff className="text-faint" />
 )}
 </button>
 </div>
 ))}
 </div>

 {/* Notification Timing */}
 <div className="mt-4 sm:mt-6 md:mt-8 pt-4 sm:pt-6 border-t">
 <h4 className="font-medium text-fg mb-3 sm:mb-4 text-sm sm:text-base">Notification Timing</h4>
 <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
 <div className="space-y-1.5 sm:space-y-2">
 <label className="block text-xs sm:text-sm font-medium text-soft">Preferred Time</label>
 <input
 onChange={(e) =>
 setPatientData((prev) => {
 if (!prev) return null
 return {
 ...prev,
 notificationPreferences: {
 ...prev.notificationPreferences,
 notificationTime: e.target.value
 }
 }
 })
 }
 type="time"
 value={patientData.notificationPreferences.notificationTime}
 className="w-full px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 border border-line rounded-lg focus:outline-none focus:border-blue-500 text-xs sm:text-sm md:text-base"
 />
 </div>
 </div>
 </div>

 {/* Notification Channels */}
 <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
 <h4 className="font-medium text-fg mb-3 sm:mb-4 text-sm sm:text-base">Notification Channels</h4>
 <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-3 md:gap-4">
 {[
 { key: 'emailNotifications', label: 'Email', icon: FaEnvelope, color: 'text-blue-500' },
 { key: 'smsNotifications', label: 'SMS', icon: FaSms, color: 'text-green-500' },
 { key: 'pushNotifications', label: 'Push Notifications', icon: FaMobile, color: 'text-purple-500' }
 ].map(channel => (
 <div key={channel.key} className="flex items-center justify-between p-3 sm:p-4 border border-line rounded-lg sm:rounded-xl">
 <div className="flex items-center gap-2 sm:gap-3">
 <channel.icon className={`${channel.color} text-base sm:text-lg md:text-xl`} />
 <span className="font-medium text-xs sm:text-sm md:text-base">{channel.label}</span>
 </div>
 <button
 onClick={() => handleNotificationToggle(channel.key as keyof typeof patientData.notificationPreferences)}
 className="text-xl sm:text-2xl"
 >
 {patientData.notificationPreferences[channel.key as keyof typeof patientData.notificationPreferences] ? (
 <FaToggleOn className="text-green-500" />
 ) : (
 <FaToggleOff className="text-faint" />
 )}
 </button>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 )

 const renderSecuritySettings = () => (
 <div className="space-y-4 sm:space-y-6">
 {/* Security Features */}
 <div className="bg-surface rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-green-200">
 <h3 className="text-base sm:text-lg font-semibold text-fg mb-4 sm:mb-5 md:mb-6 flex items-center">
 <FaShieldAlt className="mr-2 text-green-500" />
 Security Features
 </h3>
 
 <div className="space-y-3 sm:space-y-4">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-line rounded-lg sm:rounded-xl gap-3">
 <div>
 <h4 className="font-medium text-fg text-sm sm:text-base">Two-Factor Authentication</h4>
 <p className="text-xs sm:text-sm text-soft">Add an extra layer of security to your account</p>
 </div>
 <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
 {patientData.securitySettings.twoFactorEnabled ? (
 <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-sky-50 text-green-800 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1">
 <FaCheck className="text-xs" />
 Enabled
 </span>
 ) : (
 <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-sky-50 text-fg rounded-full text-xs sm:text-sm font-medium">
 Disabled
 </span>
 )}
 <button
 onClick={() => handleSecurityToggle('twoFactorEnabled')}
 className="text-xl sm:text-2xl"
 >
 {patientData.securitySettings.twoFactorEnabled ? (
 <FaToggleOn className="text-green-500" />
 ) : (
 <FaToggleOff className="text-faint" />
 )}
 </button>
 </div>
 </div>

 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-line rounded-lg sm:rounded-xl gap-3">
 <div>
 <h4 className="font-medium text-fg text-sm sm:text-base">Biometric Authentication</h4>
 <p className="text-xs sm:text-sm text-soft">Use fingerprint or face recognition to access your account</p>
 </div>
 <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
 {patientData.securitySettings.biometricEnabled ? (
 <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-sky-50 text-green-800 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1">
 <FaCheck className="text-xs" />
 Enabled
 </span>
 ) : (
 <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-sky-50 text-fg rounded-full text-xs sm:text-sm font-medium">
 Disabled
 </span>
 )}
 <button
 onClick={() => handleSecurityToggle('biometricEnabled')}
 className="text-xl sm:text-2xl"
 >
 {patientData.securitySettings.biometricEnabled ? (
 <FaToggleOn className="text-green-500" />
 ) : (
 <FaToggleOff className="text-faint" />
 )}
 </button>
 </div>
 </div>
 </div>
 </div>

 {/* Other security sections would continue with similar responsive patterns... */}
 </div>
 )

 const renderBillingSettings = () => (
 <div className="space-y-4 sm:space-y-6">
 {/* Payment Methods */}
 <div className="bg-surface rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-purple-200">
 <h3 className="text-base sm:text-lg font-semibold text-fg mb-4 sm:mb-5 md:mb-6 flex items-center">
 <FaCreditCard className="mr-2 text-purple-500" />
 Payment Methods
 </h3>
 
 <div className="space-y-3 sm:space-y-4">
 {patientData.billingInformation.map((billing) => (
 <div key={billing.id} className="border border-line rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-md transition">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
 <div className="flex items-center gap-3 sm:gap-4">
 <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center ${
 billing.type === 'credit_card' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
 }`}>
 <FaCreditCard className="text-base sm:text-lg md:text-xl" />
 </div>
 <div>
 <p className="font-medium text-fg text-sm sm:text-base">
 {billing.type === 'credit_card' ? 'Credit Card' : 'MCB Juice'}
 </p>
 <p className="text-xs sm:text-sm text-soft">{billing.cardNumber}</p>
 <p className="text-xs text-soft">
 Expires: {billing.expiryDate} • Added: {new Date(billing.addedDate).toLocaleDateString()}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2 self-end sm:self-auto">
 {billing.isDefault && (
 <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-sky-50 text-green-800 rounded-full text-xs font-medium">
 <FaCheck className="inline mr-1" />
 Default
 </span>
 )}
 <button className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
 <FaEdit className="text-xs sm:text-sm" />
 </button>
 <button className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
 <FaTrash className="text-xs sm:text-sm" />
 </button>
 </div>
 </div>
 </div>
 ))}
 
 <button className="w-full p-3 sm:p-4 border-2 border-dashed border-line rounded-lg sm:rounded-xl text-soft hover:border-purple-400 hover:text-purple-600 transition text-xs sm:text-sm md:text-base">
 <FaPlus className="inline mr-1 sm:mr-2" />
 Add Payment Method
 </button>
 </div>
 </div>
 </div>
 )

 const renderSubscriptionSettings = () => (
 <div className="space-y-4 sm:space-y-6">
 {/* Current Subscription */}
 <div className="bg-brand-navy rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
 <div>
 <h3 className="text-base sm:text-lg md:text-xl font-bold mb-1 sm:mb-2 flex items-center">
 <FaCrown className="mr-2" />
 {patientData.subscriptionPlan.planName}
 </h3>
 <p className="opacity-90 capitalize text-xs sm:text-sm md:text-base">{patientData.subscriptionPlan.type} Plan</p>
 </div>
 <div className="text-right">
 <p className="text-xl sm:text-2xl md:text-3xl font-bold">Rs {patientData.subscriptionPlan.price}</p>
 <p className="opacity-80 text-xs sm:text-sm">/{patientData.subscriptionPlan.billingCycle}</p>
 </div>
 </div>
 
 <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
 <div>
 <p className="opacity-80">Start Date</p>
 <p className="font-semibold">{patientData.subscriptionPlan.startDate}</p>
 </div>
 {patientData.subscriptionPlan.endDate && (
 <div>
 <p className="opacity-80">End Date</p>
 <p className="font-semibold">{patientData.subscriptionPlan.endDate}</p>
 </div>
 )}
 </div>
 </div>

 {/* Plan Features */}
 <div className="bg-surface rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-green-200">
 <h3 className="text-base sm:text-lg font-semibold text-fg mb-4 sm:mb-5 md:mb-6">Plan Features</h3>
 
 <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-3 md:gap-4">
 {patientData.subscriptionPlan.features.map((feature, index) => (
 <div key={index} className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-sky-50 rounded-lg">
 <FaCheck className="text-green-600 flex-shrink-0 text-xs sm:text-sm" />
 <span className="text-green-800 text-xs sm:text-sm md:text-base">{feature}</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 )

 const renderDocumentsSettings = () => (
 <div className="space-y-4 sm:space-y-6">
 {/* Document Upload */}
 <div className="bg-surface rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-indigo-200">
 <h3 className="text-base sm:text-lg font-semibold text-fg mb-4 sm:mb-5 md:mb-6 flex items-center">
 <FaUpload className="mr-2 text-blue-500" />
 Upload Documents
 </h3>
 
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
 {[
 { type: 'medical_report', label: 'Medical Reports', gradient: ' ', textColor: 'text-red-600', icon: FaHeart },
 { type: 'prescription', label: 'Prescriptions', gradient: ' ', textColor: 'text-green-600', icon: FaCog },
 { type: 'lab_result', label: 'Lab Results', gradient: ' ', textColor: 'text-blue-600', icon: FaFileAlt },
 { type: 'insurance', label: 'Insurance Documents', gradient: ' ', textColor: 'text-purple-600', icon: FaShieldAlt },
 { type: 'id_proof', label: 'ID Proof', gradient: ' ', textColor: 'text-yellow-600', icon: FaIdCard }
 ].map((docType) => (
 <button
 key={docType.type}
 className={`p-3 sm:p-4 border-2 border-dashed border-line rounded-lg sm:rounded-xl hover:border-blue-400 transition ${docType.gradient} ${docType.textColor}`}
 >
 <docType.icon className="text-xl sm:text-2xl mx-auto mb-1 sm:mb-2" />
 <p className="font-medium text-xs sm:text-sm md:text-base">{docType.label}</p>
 <p className="text-xs opacity-70 mt-1">Click to upload</p>
 </button>
 ))}
 </div>
 </div>
 </div>
 )

 const renderPreferencesSettings = () => (
 <div className="space-y-4 sm:space-y-6">
 {/* General Preferences */}
 <div className="bg-surface rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-line">
 <h3 className="text-base sm:text-lg font-semibold text-fg mb-4 sm:mb-5 md:mb-6 flex items-center">
 <FaCog className="mr-2 text-soft" />
 General Preferences
 </h3>
 
 <div className="space-y-4 sm:space-y-6">
 <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4 md:gap-6">
 <div className="space-y-1.5 sm:space-y-2">
 <label className="block text-xs sm:text-sm font-medium text-soft">Language</label>
 <select className="w-full px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 border border-line rounded-lg focus:outline-none focus:border-blue-500 text-xs sm:text-sm md:text-base">
 <option value="en">English</option>
 <option value="fr">French</option>
 <option value="hi">Hindi</option>
 <option value="ta">Tamil</option>
 </select>
 </div>
 
 <div className="space-y-1.5 sm:space-y-2">
 <label className="block text-xs sm:text-sm font-medium text-soft">Time Zone</label>
 <select className="w-full px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 border border-line rounded-lg focus:outline-none focus:border-blue-500 text-xs sm:text-sm md:text-base">
 <option value="indian/mauritius">Indian/Mauritius</option>
 <option value="utc">UTC</option>
 <option value="asia/kolkata">Asia/Kolkata</option>
 </select>
 </div>
 
 <div className="space-y-1.5 sm:space-y-2">
 <label className="block text-xs sm:text-sm font-medium text-soft">Date Format</label>
 <select className="w-full px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 border border-line rounded-lg focus:outline-none focus:border-blue-500 text-xs sm:text-sm md:text-base">
 <option value="dd/mm/yyyy">DD/MM/YYYY</option>
 <option value="mm/dd/yyyy">MM/DD/YYYY</option>
 <option value="yyyy-mm-dd">YYYY-MM-DD</option>
 </select>
 </div>
 
 <div className="space-y-1.5 sm:space-y-2">
 <label className="block text-xs sm:text-sm font-medium text-soft">Theme</label>
 <select className="w-full px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 border border-line rounded-lg focus:outline-none focus:border-blue-500 text-xs sm:text-sm md:text-base">
 <option value="light">Light</option>
 <option value="dark">Dark</option>
 <option value="auto">Auto</option>
 </select>
 </div>
 </div>
 </div>
 </div>
 </div>
 )

 return (
 <div className="space-y-4 sm:space-y-5 md:space-y-6">
 {/* Settings Header */}
 <div className="bg-brand-navy rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
 <div>
 <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2 flex items-center">
 <FaCog className="mr-2 sm:mr-3" />
 Account Settings
 </h2>
 <p className="opacity-90 text-xs sm:text-sm md:text-base">Manage your account preferences and security settings</p>
 </div>
 <div className="text-right">
 <p className="text-xs sm:text-sm opacity-80">Account Status</p>
 <p className="text-base sm:text-lg font-bold text-green-300">
 {patientData.verified ? 'Verified' : 'Pending Verification'}
 </p>
 </div>
 </div>
 </div>

 {/* Settings Navigation - Accordion on Mobile, Tabs on Desktop */}
 <div className="bg-surface rounded-xl sm:rounded-2xl shadow-lg border border-line overflow-hidden">
 {/* Desktop Tab Navigation */}
 <div className="hidden sm:block border-b">
 <div className="flex overflow-x-auto">
 {tabs.map((tab) => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id as ActiveTab)}
 className={`flex-shrink-0 px-3 md:px-4 lg:px-6 py-3 md:py-4 text-center font-medium transition-all text-xs md:text-sm lg:text-base ${
 activeTab === tab.id 
 ? `text-${tab.color}-600 border-b-2 border-current ${tab.gradient}` 
 : 'text-soft hover:text-fg hover:bg-subtle'
 }`}
 >
 <tab.icon className="inline mr-1 md:mr-2 text-sm md:text-base" />
 <span className="whitespace-nowrap">{tab.label}</span>
 </button>
 ))}
 </div>
 </div>

 {/* Mobile Accordion */}
 <div className="sm:hidden">
 {tabs.map((tab) => (
 <div key={tab.id} className="border-b border-line">
 <button
 onClick={() => toggleSection(tab.id)}
 className={`w-full px-4 py-3 flex items-center justify-between transition-all ${
 expandedSection === tab.id ? ` ${tab.gradient}` : 'bg-surface'
 }`}
 >
 <div className="flex items-center gap-2">
 <tab.icon className={`text-${tab.color}-500`} />
 <span className={`font-medium ${
 expandedSection === tab.id ? `text-${tab.color}-700` : 'text-soft'
 } text-sm`}>
 {tab.label}
 </span>
 </div>
 {expandedSection === tab.id ? (
 <FaChevronUp className={`text-${tab.color}-500`} />
 ) : (
 <FaChevronDown className="text-faint" />
 )}
 </button>
 {expandedSection === tab.id && (
 <div className="p-4 bg-surface">
 {tab.id === 'profile' && renderProfileSettings()}
 {tab.id === 'health' && renderHealthSettings()}
 {tab.id === 'notifications' && renderNotificationSettings()}
 {tab.id === 'security' && renderSecuritySettings()}
 {tab.id === 'billing' && renderBillingSettings()}
 {tab.id === 'subscription' && renderSubscriptionSettings()}
 {tab.id === 'documents' && renderDocumentsSettings()}
 {tab.id === 'preferences' && renderPreferencesSettings()}
 </div>
 )}
 </div>
 ))}
 </div>

 {/* Desktop Content */}
 <div className="hidden sm:block p-4 md:p-6">
 {activeTab === 'profile' && renderProfileSettings()}
 {activeTab === 'health' && renderHealthSettings()}
 {activeTab === 'notifications' && renderNotificationSettings()}
 {activeTab === 'security' && renderSecuritySettings()}
 {activeTab === 'billing' && renderBillingSettings()}
 {activeTab === 'subscription' && renderSubscriptionSettings()}
 {activeTab === 'documents' && renderDocumentsSettings()}
 {activeTab === 'preferences' && renderPreferencesSettings()}
 </div>
 </div>
 </div>
 )
}

export default SettingsComponent
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import {
 FaUser,
 FaEnvelope,
 FaPhone,
 FaBirthdayCake,
 FaMapMarkerAlt,
 FaCheckCircle,
 FaClock,
 FaEdit,
 FaVenusMars,
 FaFileAlt,
 FaNotesMedical,
 FaBriefcaseMedical,
 FaSave,
 FaTimes,
 FaUpload,
 FaTrash,
 FaExclamationTriangle,
 FaSpinner,
 FaStar,
 FaPenFancy,
 FaCamera,
} from 'react-icons/fa'
import dynamic from 'next/dynamic'

const ProviderReviews = dynamic(() => import('@/components/shared/ProviderReviews'), { ssr: false })
const PostFeed = dynamic(() => import('@/components/posts/PostFeed'), { ssr: false })
const CreatePostForm = dynamic(() => import('@/components/posts/CreatePostForm'), { ssr: false })

const PdfViewer = dynamic(() => import('@/components/shared/PdfViewer'), {
 ssr: false,
 loading: () => (
 <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center">
 <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
 </div>
 ),
})

/* ─── Interfaces ─────────────────────────────────────────────────────────── */

interface UserProfileProps {
 userId: string
 userType: string
 settingsPath: string
}

interface UserProfileData {
 // Patient
 bloodType?: string
 allergies?: string[]
 chronicConditions?: string[]
 healthScore?: number
 emergencyContact?: { name: string; relationship: string; phone: string }
 // Doctor
 specialty?: string
 licenseNumber?: string
 clinicAffiliation?: string
 consultationFee?: number
 rating?: number
 bio?: string
 // Nurse
 experience?: number
 specializations?: string[]
 // Nanny
 certifications?: string[]
 // Pharmacist
 pharmacyName?: string
 // Lab Technician
 labName?: string
 // Emergency Worker
 vehicleType?: string
 responseZone?: string
 emtLevel?: string
 // Insurance Rep
 companyName?: string
 coverageTypes?: string[]
 // Corporate Admin
 employeeCount?: number
 // Referral Partner
 businessType?: string
 commissionRate?: number
 referralCode?: string
 // Regional Admin
 region?: string
 country?: string
}

interface DocumentData {
 id: string
 name: string
 type: string
 url: string
 size?: number
 uploadedAt: string
}

interface UserData {
 firstName?: string
 lastName?: string
 email?: string
 phone?: string
 dateOfBirth?: string
 gender?: string
 address?: string
 profileImage?: string
 verified?: boolean
 accountStatus?: string
 createdAt?: string
 profile?: UserProfileData | null
}

/* ─── Tab config ─────────────────────────────────────────────────────────── */

type TabId = 'overview' | 'documents' | 'info' | 'reviews' | 'posts'

interface TabConfig {
 id: TabId
 label: string
 icon: React.ComponentType<{ className?: string }>
}

// Role types that do NOT act as providers (no reviews, no posts feed authoring).
// Everyone else is treated as a provider - aligned with dynamic-roles principle.
const NON_PROVIDER_TYPES = new Set(['MEMBER', 'REGIONAL_ADMIN', 'CORPORATE_ADMIN', 'INSURANCE_REP', 'REFERRAL_PARTNER'])

function getTabsForUserType(userType: string): TabConfig[] {
 const tabs: TabConfig[] = [
 { id: 'overview', label: 'Overview', icon: FaUser },
 { id: 'documents', label: 'Documents', icon: FaFileAlt },
 ]

 if (userType === 'MEMBER') {
 tabs.push({ id: 'info', label: 'Medical Info', icon: FaNotesMedical })
 } else {
 tabs.push({ id: 'info', label: 'Professional Info', icon: FaBriefcaseMedical })
 }

 // All provider roles get reviews + posts - no role-specific gating.
 if (!NON_PROVIDER_TYPES.has(userType)) {
 tabs.push({ id: 'reviews', label: 'Reviews', icon: FaStar })
 tabs.push({ id: 'posts', label: 'Posts', icon: FaPenFancy })
 }

 return tabs
}

/* ─── Constants ──────────────────────────────────────────────────────────── */

const USER_TYPE_LABELS: Record<string, string> = {
 MEMBER: 'Member',
 DOCTOR: 'Doctor',
 NURSE: 'Nurse',
 NANNY: 'Nanny',
 PHARMACIST: 'Pharmacist',
 LAB_TECHNICIAN: 'Lab Technician',
 EMERGENCY_WORKER: 'Emergency Worker',
 INSURANCE_REP: 'Insurance Representative',
 CORPORATE_ADMIN: 'Corporate Admin',
 REFERRAL_PARTNER: 'Referral Partner',
 REGIONAL_ADMIN: 'Regional Admin',
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
 lab_report: 'Lab Report',
 prescription: 'Prescription',
 imaging: 'Imaging',
 insurance: 'Insurance',
 id_proof: 'ID Proof',
 license: 'License',
 national_id: 'National ID',
 'national-id': 'National ID/Passport',
 'proof-address': 'Proof of Address',
 'insurance-card': 'Health Insurance Card',
 'medical-history': 'Medical History',
 'medical-degree': 'Medical Degree',
 'medical-license': 'Professional License',
 'nursing-degree': 'Nursing Degree',
 'nursing-license': 'Nursing License',
 'registration-cert': 'Registration Certificate',
 'work-certificate': 'Work Certificate',
 other: 'Other',
}

const DOCUMENT_TYPE_COLORS: Record<string, string> = {
 lab_report: 'bg-blue-100 text-blue-700',
 prescription: 'bg-green-100 text-green-700',
 imaging: 'bg-purple-100 text-purple-700',
 insurance: 'bg-yellow-100 text-yellow-700',
 id_proof: 'bg-red-100 text-red-700',
 license: 'bg-indigo-100 text-indigo-700',
 national_id: 'bg-orange-100 text-orange-700',
 'national-id': 'bg-orange-100 text-orange-700',
 'proof-address': 'bg-teal-100 text-teal-700',
 'insurance-card': 'bg-yellow-100 text-yellow-700',
 'medical-history': 'bg-pink-100 text-pink-700',
 'medical-degree': 'bg-indigo-100 text-indigo-700',
 'medical-license': 'bg-indigo-100 text-indigo-700',
 'nursing-degree': 'bg-cyan-100 text-cyan-700',
 'nursing-license': 'bg-cyan-100 text-cyan-700',
 'registration-cert': 'bg-violet-100 text-violet-700',
 'work-certificate': 'bg-amber-100 text-amber-700',
 other: 'bg-gray-100 text-gray-700',
}

/* ─── Helper: format file size ───────────────────────────────────────────── */

function formatFileSize(bytes?: number): string {
 if (!bytes) return 'Unknown size'
 if (bytes < 1024) return `${bytes} B`
 if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
 return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/* ─── Type-specific field definitions ────────────────────────────────────── */

interface EditableField {
 key: string
 label: string
 type: 'text' | 'number' | 'select' | 'tags' | 'readonly'
 options?: string[]
 profileField?: boolean // true = lives in profileData, false = top-level user field
 suffix?: string
}

// DB-driven profile field schema. Reads ProviderRole.profileFields (returned
// by /api/roles) so regional admins can add a new role + its form via CRUD
// without any code change. Hardcoded switches for DOCTOR/NURSE/etc. are gone.
function getEditableFieldsForType(
 userType: string,
 profileFieldsByCode: Record<string, EditableField[]>,
): EditableField[] {
 return profileFieldsByCode[userType] ?? []
}


/* ═══════════════════════════════════════════════════════════════════════════ */
/* Main component */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function UserProfile({ userId, userType }: UserProfileProps) {
 const { updateUser } = useUser()
 const searchParams = useSearchParams()
 const initialTab = (searchParams?.get('tab') as TabId) || 'overview'
 const validTabs: TabId[] = ['overview', 'documents', 'info', 'reviews', 'posts']
 const [userData, setUserData] = useState<UserData | null>(null)
 const [loading, setLoading] = useState(true)
 const [activeTab, setActiveTab] = useState<TabId>(
  validTabs.includes(initialTab) ? initialTab : 'overview'
 )

 // Documents state
 const [documents, setDocuments] = useState<DocumentData[]>([])
 const [docsLoading, setDocsLoading] = useState(false)
 const [docsFetched, setDocsFetched] = useState(false)
 const [requiredDocs, setRequiredDocs] = useState<Array<{ documentName: string; required: boolean }>>([])
 const [uploadOpen, setUploadOpen] = useState(false)
 const [uploadName, setUploadName] = useState('')
 const [uploadType, setUploadType] = useState<string>('other')
 const [uploading, setUploading] = useState(false)
 const [viewingDoc, setViewingDoc] = useState<DocumentData | null>(null)
 const [docError, setDocError] = useState('')

 // Info editing state
 const [isEditing, setIsEditing] = useState(false)
 const [editedProfile, setEditedProfile] = useState<Record<string, unknown>>({})
 const [editedGeneral, setEditedGeneral] = useState<{ firstName: string; lastName: string; email: string; phone: string; dateOfBirth: string; gender: string; address: string }>({
 firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '', gender: '', address: '',
 })
 const [editedEmergency, setEditedEmergency] = useState<{ name: string; relationship: string; phone: string }>({
 name: '',
 relationship: '',
 phone: '',
 })
 const [saving, setSaving] = useState(false)
 const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
 const [tagInput, setTagInput] = useState<Record<string, string>>({})

 // Profile image upload
 const [uploadingProfileImage, setUploadingProfileImage] = useState(false)
 const [profileImageError, setProfileImageError] = useState('')
 const [profileImageSuccess, setProfileImageSuccess] = useState(false)
 const profileImageInputRef = useRef<HTMLInputElement>(null)

 const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0]
 if (!file) return

 // Validate file before uploading
 const maxSize = 10 * 1024 * 1024 // 10MB
 if (file.size > maxSize) {
 setProfileImageError('File too large. Maximum size is 10MB.')
 return
 }
 if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
 setProfileImageError('Only JPG, PNG, and WebP images are allowed.')
 return
 }

 setUploadingProfileImage(true)
 setProfileImageError('')
 setProfileImageSuccess(false)
 try {
 const fd = new FormData()
 fd.append('file', file)
 const uploadRes = await fetch('/api/upload/local', { method: 'POST', body: fd, credentials: 'include' })
 const uploadResult = await uploadRes.json()
 if (!uploadResult.success) throw new Error(uploadResult.message || 'Upload failed')

 // Update user profile image in DB
 const patchRes = await fetch(`/api/users/${userId}`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ profileImage: uploadResult.data.url }),
 credentials: 'include',
 })
 const patchResult = await patchRes.json()
 if (!patchRes.ok || !patchResult.success) throw new Error(patchResult.message || 'Failed to update profile image')

 // Update local state
 setUserData(prev => prev ? { ...prev, profileImage: uploadResult.data.url } : prev)
 updateUser({ profileImage: uploadResult.data.url })
 setProfileImageSuccess(true)
 setTimeout(() => setProfileImageSuccess(false), 3000)
 } catch (err) {
 console.error('Profile image upload failed:', err)
 setProfileImageError(err instanceof Error ? err.message : 'Failed to update profile picture')
 } finally {
 setUploadingProfileImage(false)
 if (profileImageInputRef.current) profileImageInputRef.current.value = ''
 }
 }

 // Document file upload handler - name and type included so the backend creates
 // the document record with the correct metadata in a single request.
 const handleDocumentFileUpload = async (file: File, name?: string, type?: string) => {
 const fd = new FormData()
 fd.append('file', file)
 if (name) fd.append('name', name)
 if (type) fd.append('type', type)
 const uploadRes = await fetch('/api/upload/local', { method: 'POST', body: fd, credentials: 'include' })
 const uploadResult = await uploadRes.json()
 if (!uploadResult.success) throw new Error(uploadResult.message)
 return uploadResult.data
 }

 const tabs = getTabsForUserType(userType)

 // Editable profile fields are DB-driven: ProviderRole.profileFields.
 // Fetched once from /api/roles and looked up by userType code.
 const [profileFieldsByCode, setProfileFieldsByCode] = useState<Record<string, EditableField[]>>({})

 /* ─── Fetch user data + role profile-field schema ─────────────────────── */

 useEffect(() => {
 async function fetchUser() {
 try {
 const res = await fetch(`/api/users/${userId}`, { credentials: 'include' })
 const json = await res.json()
 if (json.data) {
 setUserData(json.data)
 }
 } catch (err) {
 console.error('Failed to fetch user profile:', err)
 } finally {
 setLoading(false)
 }
 }
 fetchUser()
 }, [userId])

 useEffect(() => {
 // Include legacy codes (PATIENT, CORPORATE_ADMIN, INSURANCE_REP, …)
 // so users with any historical userType still get their form.
 fetch('/api/roles?all=true&includeLegacy=true', { credentials: 'include' })
 .then(r => r.json())
 .then(j => {
 if (!j?.success || !Array.isArray(j.data)) return
 const map: Record<string, EditableField[]> = {}
 for (const role of j.data) {
 if (role?.code && Array.isArray(role?.profileFields)) {
 map[role.code] = role.profileFields as EditableField[]
 }
 }
 setProfileFieldsByCode(map)
 })
 .catch(() => { /* fall back to empty - form shows user-level fields only */ })
 }, [])

 /* ─── Initialize edit state when entering edit mode ────────────────────── */

 const startEditing = useCallback(() => {
 if (!userData) return
 const profile = userData.profile
 const fields = getEditableFieldsForType(userType, profileFieldsByCode)
 const values: Record<string, unknown> = {}
 for (const f of fields) {
 values[f.key] = (profile as Record<string, unknown> | null)?.[f.key] ?? (f.type === 'tags' ? [] : '')
 }
 setEditedProfile(values)

 setEditedGeneral({
 firstName: userData.firstName || '',
 lastName: userData.lastName || '',
 email: userData.email || '',
 phone: userData.phone || '',
 dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth).toISOString().split('T')[0] : '',
 gender: userData.gender || '',
 address: userData.address || '',
 })

 if (userType === 'MEMBER' && profile?.emergencyContact) {
 setEditedEmergency({
 name: profile.emergencyContact.name || '',
 relationship: profile.emergencyContact.relationship || '',
 phone: profile.emergencyContact.phone || '',
 })
 } else {
 setEditedEmergency({ name: '', relationship: '', phone: '' })
 }
 setIsEditing(true)
 setSaveMsg(null)
 }, [userData, userType, profileFieldsByCode])

 /* ─── Save edits ───────────────────────────────────────────────────────── */

 const handleSave = async () => {
 setSaving(true)
 setSaveMsg(null)
 try {
 const body: Record<string, unknown> = {
 firstName: editedGeneral.firstName,
 lastName: editedGeneral.lastName,
 email: editedGeneral.email,
 phone: editedGeneral.phone,
 dateOfBirth: editedGeneral.dateOfBirth || undefined,
 gender: editedGeneral.gender || undefined,
 address: editedGeneral.address || undefined,
 profileData: editedProfile,
 }
 if (userType === 'MEMBER' && editedEmergency.name) {
 body.emergencyContact = editedEmergency
 }
 const res = await fetch(`/api/users/${userId}`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(body),
 credentials: 'include',
 })
 if (!res.ok) {
 const json = await res.json()
 throw new Error(json.message || 'Failed to save')
 }
 // Re-fetch profile
 const profileRes = await fetch(`/api/users/${userId}`, { credentials: 'include' })
 const profileJson = await profileRes.json()
 if (profileJson.success && profileJson.data) {
 setUserData(profileJson.data)
 // Update cached user so sidebar/header reflect changes
 updateUser({
 firstName: profileJson.data.firstName,
 lastName: profileJson.data.lastName,
 email: profileJson.data.email,
 })
 }
 setIsEditing(false)
 setSaveMsg({ type: 'success', text: 'Profile updated successfully' })
 setTimeout(() => setSaveMsg(null), 3000)
 } catch (err) {
 setSaveMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save' })
 } finally {
 setSaving(false)
 }
 }

 /* ─── Fetch documents ──────────────────────────────────────────────────── */

 const fetchDocuments = useCallback(async () => {
 setDocsLoading(true)
 try {
 const res = await fetch(`/api/users/${userId}/documents`, { credentials: 'include' })
 const json = await res.json()
 if (json.data) setDocuments(json.data)
 } catch (err) {
 console.error('Failed to fetch documents:', err)
 } finally {
 setDocsLoading(false)
 setDocsFetched(true)
 }
 }, [userId])

 useEffect(() => {
 if ((activeTab === 'documents' || activeTab === 'overview') && !docsFetched) {
 fetchDocuments()
 }
 }, [activeTab, docsFetched, fetchDocuments])

 /* ─── Fetch required documents for this user type ───────────────────────── */
 useEffect(() => {
 if (!userType) return
 fetch(`/api/required-documents?userType=${encodeURIComponent(userType)}`)
 .then(r => r.json())
 .then(json => {
 if (json.success && Array.isArray(json.data)) setRequiredDocs(json.data)
 })
 .catch(() => {})
 }, [userType])

 /* ─── Upload document ──────────────────────────────────────────────────── */

 const handleDocUpload = async (file: File) => {
 setUploading(true)
 setDocError('')
 try {
 const name = uploadName.trim() || file.name.replace(/\.[^.]+$/, '')
 await handleDocumentFileUpload(file, name, uploadType)
 setUploadName('')
 setUploadType('other')
 setUploadOpen(false)
 await fetchDocuments()
 } catch (err) {
 setDocError(err instanceof Error ? err.message : 'Upload failed')
 } finally {
 setUploading(false)
 }
 }

 /* ─── Delete document ──────────────────────────────────────────────────── */

 const handleDeleteDoc = async (docId: string) => {
 try {
 const res = await fetch(`/api/users/${userId}/documents`, {
 method: 'DELETE',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ documentId: docId }),
 credentials: 'include',
 })
 if (res.ok) {
 setDocuments((prev) => prev.filter((d) => d.id !== docId))
 }
 } catch (err) {
 console.error('Failed to delete document:', err)
 }
 }

 /* ─── Tag helpers ──────────────────────────────────────────────────────── */

 const addTag = (fieldKey: string) => {
 const value = (tagInput[fieldKey] || '').trim()
 if (!value) return
 const current = (editedProfile[fieldKey] as string[]) || []
 if (!current.includes(value)) {
 setEditedProfile((prev) => ({ ...prev, [fieldKey]: [...current, value] }))
 }
 setTagInput((prev) => ({ ...prev, [fieldKey]: '' }))
 }

 const removeTag = (fieldKey: string, index: number) => {
 const current = (editedProfile[fieldKey] as string[]) || []
 setEditedProfile((prev) => ({ ...prev, [fieldKey]: current.filter((_, i) => i !== index) }))
 }

 /* ═══════════════════════════════════════════════════════════════════════ */
 /* Render */
 /* ═══════════════════════════════════════════════════════════════════════ */

 if (loading) {
 return (
 <div className="flex items-center justify-center py-20">
 <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
 </div>
 )
 }

 if (!userData) {
 return <div className="text-center py-20 text-gray-500">Failed to load profile</div>
 }

 /* ─── Tab: Overview ────────────────────────────────────────────────────── */

 const renderOverview = () => (
 <div className="space-y-6">
 {/* Contact info */}
 <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
 <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="flex items-center gap-3">
 <FaEnvelope className="text-gray-400" />
 <div>
 <p className="text-sm text-gray-500">Email</p>
 <p className="text-gray-900">{userData.email}</p>
 </div>
 </div>
 {userData.phone && (
 <div className="flex items-center gap-3">
 <FaPhone className="text-gray-400" />
 <div>
 <p className="text-sm text-gray-500">Phone</p>
 <p className="text-gray-900">{userData.phone}</p>
 </div>
 </div>
 )}
 {userData.dateOfBirth && (
 <div className="flex items-center gap-3">
 <FaBirthdayCake className="text-gray-400" />
 <div>
 <p className="text-sm text-gray-500">Date of Birth</p>
 <p className="text-gray-900">{new Date(userData.dateOfBirth).toLocaleDateString()}</p>
 </div>
 </div>
 )}
 {userData.gender && (
 <div className="flex items-center gap-3">
 <FaVenusMars className="text-gray-400" />
 <div>
 <p className="text-sm text-gray-500">Gender</p>
 <p className="text-gray-900 capitalize">{userData.gender}</p>
 </div>
 </div>
 )}
 {userData.address && (
 <div className="flex items-center gap-3">
 <FaMapMarkerAlt className="text-gray-400" />
 <div>
 <p className="text-sm text-gray-500">Address</p>
 <p className="text-gray-900">{userData.address}</p>
 </div>
 </div>
 )}
 {userData.createdAt && (
 <div className="flex items-center gap-3">
 <FaClock className="text-gray-400" />
 <div>
 <p className="text-sm text-gray-500">Member Since</p>
 <p className="text-gray-900">{new Date(userData.createdAt).toLocaleDateString()}</p>
 </div>
 </div>
 )}
 </div>
 </div>

 {/* Required documents checklist - always visible */}
 {(() => {
  const uploadedNames = new Set(documents.map(d => d.name.toLowerCase().trim()))
  const checklist = requiredDocs.map(rd => ({
   ...rd,
   uploaded: uploadedNames.has(rd.documentName.toLowerCase().trim()),
  }))
  const missingCount = checklist.filter(c => c.required && !c.uploaded).length
  return (
   <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <div className="flex items-center justify-between mb-3">
     <div>
      <h3 className="text-lg font-semibold text-gray-900">Required Documents</h3>
      <p className="text-xs text-gray-500 mt-0.5">
       {checklist.length === 0
        ? 'No required documents for your account type'
        : missingCount === 0
         ? 'All required documents uploaded ✓'
         : `${missingCount} required document${missingCount > 1 ? 's' : ''} still needed`}
      </p>
     </div>
     <button
      onClick={() => setActiveTab('documents')}
      className="text-xs px-3 py-1.5 bg-[#0C6780]/10 text-[#0C6780] rounded-lg hover:bg-[#0C6780]/20 font-medium"
     >
      Manage →
     </button>
    </div>
    {checklist.length === 0 ? (
     <p className="text-sm text-gray-400 italic py-2">No required documents are configured for your account type.</p>
    ) : (
     <ul className="divide-y divide-gray-100">
      {checklist.map(item => (
       <li key={item.documentName} className="flex items-center justify-between py-2.5">
        <div className="flex items-center gap-2 min-w-0">
         <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs ${
          item.uploaded ? 'bg-green-100 text-green-700' : item.required ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
         }`}>
          {item.uploaded ? '✓' : item.required ? '!' : '•'}
         </span>
         <span className="text-sm text-gray-800 truncate">{item.documentName}</span>
         {!item.required && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-50 text-gray-500">Optional</span>
         )}
        </div>
        <span className={`text-xs font-medium ${item.uploaded ? 'text-green-600' : item.required ? 'text-amber-600' : 'text-gray-400'}`}>
         {item.uploaded ? 'Uploaded' : item.required ? 'Missing' : 'Not uploaded'}
        </span>
       </li>
      ))}
     </ul>
    )}
   </div>
  )
 })()}

 {/* Type-specific overview (read-only summary) */}
 {renderTypeSpecificSummary(userType, userData.profile)}
 </div>
 )

 /* ─── Tab: Documents ───────────────────────────────────────────────────── */

 const renderDocuments = () => {
 // Compare required docs vs uploaded docs (by name, case-insensitive)
 const uploadedNames = new Set(documents.map(d => d.name.toLowerCase().trim()))
 const checklist = requiredDocs.map(rd => ({
  ...rd,
  uploaded: uploadedNames.has(rd.documentName.toLowerCase().trim()),
 }))
 const missingRequired = checklist.filter(c => c.required && !c.uploaded).length

 return (
 <div className="space-y-6">
 {/* Required documents checklist - always visible */}
 <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
  <div className="flex items-center justify-between mb-3">
   <div>
    <h3 className="text-lg font-semibold text-gray-900">Required Documents</h3>
    <p className="text-xs text-gray-500 mt-0.5">
     {checklist.length === 0
      ? 'No required documents for your role'
      : missingRequired === 0
       ? 'All required documents uploaded ✓'
       : `${missingRequired} required document${missingRequired > 1 ? 's' : ''} still needed`}
    </p>
   </div>
   <button
    onClick={() => setUploadOpen(true)}
    className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium"
   >
    Upload
   </button>
   </div>
   {checklist.length === 0 ? (
    <p className="text-sm text-gray-400 italic py-2">No required documents are configured for your account type.</p>
   ) : (
    <ul className="divide-y divide-gray-100">
     {checklist.map(item => (
      <li key={item.documentName} className="flex items-center justify-between py-2.5">
       <div className="flex items-center gap-2 min-w-0">
        <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs ${
         item.uploaded ? 'bg-green-100 text-green-700' : item.required ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
        }`}>
         {item.uploaded ? '✓' : item.required ? '!' : '•'}
        </span>
        <span className="text-sm text-gray-800 truncate">{item.documentName}</span>
        {item.required && !item.uploaded && (
         <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">Required</span>
        )}
        {!item.required && (
         <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-50 text-gray-500">Optional</span>
        )}
       </div>
       <span className={`text-xs font-medium ${item.uploaded ? 'text-green-600' : item.required ? 'text-amber-600' : 'text-gray-400'}`}>
        {item.uploaded ? 'Uploaded' : item.required ? 'Missing' : 'Not uploaded'}
       </span>
      </li>
     ))}
    </ul>
   )}
  </div>

 {/* Upload section */}
 <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
 <div className="flex items-center justify-between mb-4">
 <h3 className="text-lg font-semibold text-gray-900">My Documents</h3>
 <button
 onClick={() => setUploadOpen(!uploadOpen)}
 className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
 >
 <FaUpload className="text-xs" />
 <span className="hidden sm:inline">Upload Document</span>
 <span className="sm:hidden">Upload</span>
 </button>
 </div>

 {/* Per-required-document upload slots */}
 {checklist.filter(c => !c.uploaded).length > 0 && (
 <div className="mb-5 space-y-3">
 <p className="text-sm font-medium text-gray-700">Upload required documents:</p>
 {checklist.filter(c => !c.uploaded).map(item => (
 <RequiredDocUploadSlot
 key={item.documentName}
 documentName={item.documentName}
 required={item.required}
 userId={userId}
 onUploaded={async () => {
 await fetchDocuments()
 }}
 />
 ))}
 </div>
 )}

 {uploadOpen && (
 <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200 space-y-3">
 <p className="text-sm font-semibold text-gray-700">Upload additional document</p>
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">Document Name</label>
 <input
 type="text"
 value={uploadName}
 onChange={(e) => setUploadName(e.target.value)}
 className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder="e.g. Blood Test Results"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
 <select
 value={uploadType}
 onChange={(e) => setUploadType(e.target.value)}
 className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 >
 {Object.entries(DOCUMENT_TYPE_LABELS).map(([val, label]) => (
 <option key={val} value={val}>
 {label}
 </option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
 <input
 type="file"
 accept="image/jpeg,image/png,image/webp,application/pdf"
 disabled={uploading}
 onChange={async (e) => {
 const file = e.target.files?.[0]
 if (file) handleDocUpload(file)
 }}
 className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 />
 {uploading && (
 <p className="text-xs text-blue-600 mt-1 flex items-center gap-1"><FaSpinner className="animate-spin text-[10px]" /> Uploading…</p>
 )}
 </div>
 {docError && (
 <p className="text-sm text-red-600 flex items-center gap-1">
 <FaExclamationTriangle className="text-xs" /> {docError}
 </p>
 )}
 <div className="flex gap-2">
 <button
 onClick={() => {
 setUploadOpen(false)
 setDocError('')
 }}
 className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
 >
 Cancel
 </button>
 </div>
 </div>
 )}

 {/* Document list */}
 {docsLoading ? (
 <div className="flex items-center justify-center py-12">
 <div className="animate-spin h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full" />
 </div>
 ) : documents.length === 0 ? (
 <div className="text-center py-12 text-gray-400">
 <FaFileAlt className="mx-auto text-3xl mb-2" />
 <p className="text-sm">No documents uploaded yet</p>
 </div>
 ) : (
 <div className="space-y-3">
 {documents.map((doc: DocumentData) => (
 <div
 key={doc.id}
 className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
 >
 <div className="flex items-center gap-3 min-w-0">
 <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
 <FaFileAlt className="text-blue-600" />
 </div>
 <div className="min-w-0">
 <h4 className="font-medium text-gray-900 text-sm truncate">{doc.name}</h4>
 <div className="flex flex-wrap items-center gap-2 mt-1">
 <span
 className={`px-2 py-0.5 rounded-full text-xs font-medium ${
 DOCUMENT_TYPE_COLORS[doc.type] || 'bg-gray-100 text-gray-700'
 }`}
 >
 {DOCUMENT_TYPE_LABELS[doc.type] || doc.type}
 </span>
 <span className="text-xs text-gray-500">{formatFileSize(doc.size)}</span>
 <span className="text-xs text-gray-500">
 {new Date(doc.uploadedAt).toLocaleDateString()}
 </span>
 </div>
 </div>
 </div>
 <div className="flex items-center gap-1 flex-shrink-0 ml-2">
 <button
 onClick={() => setViewingDoc(doc)}
 className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm"
 title="View document"
 >
 View
 </button>
 <a
 href={doc.url}
 download
 className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-sm"
 title="Download document"
 >
 Download
 </a>
 <button
 onClick={() => handleDeleteDoc(doc.id)}
 className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
 title="Delete document"
 >
 <FaTrash className="text-xs" />
 </button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 )
 }

 /* ─── Tab: Medical / Professional Info (editable) ──────────────────────── */

 const renderInfo = () => {
 const fields = getEditableFieldsForType(userType, profileFieldsByCode)
 const profile = userData.profile

 if (!profile && fields.length === 0) {
 return (
 <div className="text-center py-12 text-gray-400">
 <FaBriefcaseMedical className="mx-auto text-3xl mb-2" />
 <p className="text-sm">No additional information available</p>
 </div>
 )
 }

 return (
 <div className="space-y-6">
 <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
 <div className="flex items-center justify-between mb-6">
 <h3 className="text-lg font-semibold text-gray-900">
 Personal Information
 </h3>
 {!isEditing ? (
 <button
 onClick={startEditing}
 className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
 >
 <FaEdit className="text-xs" /> Edit
 </button>
 ) : (
 <div className="flex gap-2">
 <button
 onClick={handleSave}
 disabled={saving}
 className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
 >
 {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
 Save
 </button>
 <button
 onClick={() => {
 setIsEditing(false)
 setSaveMsg(null)
 }}
 className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
 >
 <FaTimes /> Cancel
 </button>
 </div>
 )}
 </div>

 {saveMsg && (
 <div
 className={`mb-4 px-4 py-3 rounded-lg text-sm ${
 saveMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
 }`}
 >
 {saveMsg.text}
 </div>
 )}

 {/* General Information (name, email, phone, etc.) */}
 {isEditing ? (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
 <div>
 <label className="block text-sm font-medium text-gray-600 mb-1">First Name</label>
 <input
 type="text"
 value={editedGeneral.firstName}
 onChange={(e) => setEditedGeneral((prev) => ({ ...prev, firstName: e.target.value }))}
 className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-600 mb-1">Last Name</label>
 <input
 type="text"
 value={editedGeneral.lastName}
 onChange={(e) => setEditedGeneral((prev) => ({ ...prev, lastName: e.target.value }))}
 className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
 <input
 type="email"
 value={editedGeneral.email}
 onChange={(e) => setEditedGeneral((prev) => ({ ...prev, email: e.target.value }))}
 className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
 <input
 type="tel"
 value={editedGeneral.phone}
 onChange={(e) => setEditedGeneral((prev) => ({ ...prev, phone: e.target.value }))}
 className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-600 mb-1">Date of Birth</label>
 <input
 type="date"
 value={editedGeneral.dateOfBirth}
 onChange={(e) => setEditedGeneral((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
 className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-600 mb-1">Gender</label>
 <select
 value={editedGeneral.gender}
 onChange={(e) => setEditedGeneral((prev) => ({ ...prev, gender: e.target.value }))}
 className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
 >
 <option value="">Select gender</option>
 <option value="male">Male</option>
 <option value="female">Female</option>
 <option value="other">Other</option>
 </select>
 </div>
 <div className="md:col-span-2">
 <label className="block text-sm font-medium text-gray-600 mb-1">Address</label>
 <input
 type="text"
 value={editedGeneral.address}
 onChange={(e) => setEditedGeneral((prev) => ({ ...prev, address: e.target.value }))}
 className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 />
 </div>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
 {[
 { label: 'First Name', value: userData.firstName, icon: FaUser },
 { label: 'Last Name', value: userData.lastName, icon: FaUser },
 { label: 'Email', value: userData.email, icon: FaEnvelope },
 { label: 'Phone', value: userData.phone, icon: FaPhone },
 { label: 'Date of Birth', value: userData.dateOfBirth ? new Date(userData.dateOfBirth).toLocaleDateString() : null, icon: FaBirthdayCake },
 { label: 'Gender', value: userData.gender, icon: FaVenusMars },
 { label: 'Address', value: userData.address, icon: FaMapMarkerAlt },
 ].filter(f => f.value).map((f) => (
 <div key={f.label} className="flex items-center gap-3">
 <f.icon className="text-gray-400 flex-shrink-0" />
 <div>
 <p className="text-sm text-gray-500">{f.label}</p>
 <p className="text-gray-900 capitalize">{f.value}</p>
 </div>
 </div>
 ))}
 </div>
 )}

 {/* Type-specific fields */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
 {fields.map((field) => {
 const rawValue = isEditing
 ? editedProfile[field.key]
 : (profile as Record<string, unknown> | null)?.[field.key]

 /* ── Tags field ── */
 if (field.type === 'tags') {
 const tags = (isEditing ? (editedProfile[field.key] as string[]) : (rawValue as string[])) || []
 return (
 <div key={field.key} className="md:col-span-2">
 <label className="block text-sm font-medium text-gray-600 mb-1">{field.label}</label>
 <div className="flex flex-wrap gap-2 mb-2">
 {tags.map((tag, idx) => (
 <span
 key={`${tag}-${idx}`}
 className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200"
 >
 {tag}
 {isEditing && (
 <button
 onClick={() => removeTag(field.key, idx)}
 className="text-blue-400 hover:text-red-500 ml-1"
 >
 <FaTimes className="text-xs" />
 </button>
 )}
 </span>
 ))}
 {tags.length === 0 && !isEditing && (
 <span className="text-sm text-gray-400">None specified</span>
 )}
 </div>
 {isEditing && (
 <div className="flex gap-2">
 <input
 type="text"
 value={tagInput[field.key] || ''}
 onChange={(e) => setTagInput((prev) => ({ ...prev, [field.key]: e.target.value }))}
 onKeyDown={(e) => {
 if (e.key === 'Enter') {
 e.preventDefault()
 addTag(field.key)
 }
 }}
 className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder={`Add ${field.label.toLowerCase()}...`}
 />
 <button
 onClick={() => addTag(field.key)}
 className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
 >
 Add
 </button>
 </div>
 )}
 </div>
 )
 }

 /* ── Select field ── */
 if (field.type === 'select' && isEditing) {
 return (
 <div key={field.key}>
 <label className="block text-sm font-medium text-gray-600 mb-1">{field.label}</label>
 <select
 value={(editedProfile[field.key] as string) || ''}
 onChange={(e) => setEditedProfile((prev) => ({ ...prev, [field.key]: e.target.value }))}
 className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 >
 <option value="">Select...</option>
 {field.options?.map((opt) => (
 <option key={opt} value={opt}>
 {opt}
 </option>
 ))}
 </select>
 </div>
 )
 }

 /* ── Readonly field ── */
 if (field.type === 'readonly') {
 return (
 <div key={field.key}>
 <label className="block text-sm font-medium text-gray-600 mb-1">{field.label}</label>
 <p className="text-gray-900 font-medium px-3 py-2">
 {field.suffix && rawValue ? `${field.suffix} ` : ''}
 {rawValue != null ? String(rawValue) : 'N/A'}
 </p>
 </div>
 )
 }

 /* ── Text / Number field ── */
 return (
 <div key={field.key}>
 <label className="block text-sm font-medium text-gray-600 mb-1">{field.label}</label>
 {isEditing ? (
 <input
 type={field.type === 'number' ? 'number' : 'text'}
 value={editedProfile[field.key] != null ? String(editedProfile[field.key]) : ''}
 onChange={(e) =>
 setEditedProfile((prev) => ({
 ...prev,
 [field.key]: field.type === 'number' ? (e.target.value ? Number(e.target.value) : '') : e.target.value,
 }))
 }
 className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 />
 ) : (
 <p className="text-gray-900 font-medium px-3 py-2">
 {field.suffix && rawValue ? `${field.suffix} ` : ''}
 {rawValue != null && rawValue !== '' ? String(rawValue) : 'N/A'}
 </p>
 )}
 </div>
 )
 })}
 </div>
 </div>

 {/* Emergency Contact (Patient only) */}
 {userType === 'MEMBER' && (
 <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
 <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
 <FaExclamationTriangle className="text-orange-500" />
 Emergency Contact
 </h3>
 {isEditing ? (
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div>
 <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
 <input
 type="text"
 value={editedEmergency.name}
 onChange={(e) => setEditedEmergency((prev) => ({ ...prev, name: e.target.value }))}
 className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder="Contact name"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-600 mb-1">Relationship</label>
 <input
 type="text"
 value={editedEmergency.relationship}
 onChange={(e) => setEditedEmergency((prev) => ({ ...prev, relationship: e.target.value }))}
 className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder="e.g. Spouse, Parent"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
 <input
 type="tel"
 value={editedEmergency.phone}
 onChange={(e) => setEditedEmergency((prev) => ({ ...prev, phone: e.target.value }))}
 className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
 placeholder="+230 5xxx xxxx"
 />
 </div>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div>
 <p className="text-sm text-gray-500">Name</p>
 <p className="text-gray-900 font-medium">{userData.profile?.emergencyContact?.name || 'N/A'}</p>
 </div>
 <div>
 <p className="text-sm text-gray-500">Relationship</p>
 <p className="text-gray-900 font-medium">{userData.profile?.emergencyContact?.relationship || 'N/A'}</p>
 </div>
 <div>
 <p className="text-sm text-gray-500">Phone</p>
 <p className="text-gray-900 font-medium">{userData.profile?.emergencyContact?.phone || 'N/A'}</p>
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 )
 }

 /* ═══════════════════════════════════════════════════════════════════════ */
 /* Full layout */
 /* ═══════════════════════════════════════════════════════════════════════ */

 return (
 <div className="space-y-6">
 {/* Header card */}
 <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
 <div
 className="relative w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 cursor-pointer group overflow-hidden"
 onClick={() => profileImageInputRef.current?.click()}
 title="Click to change profile picture"
 >
 {userData.profileImage ? (
 <Image src={userData.profileImage} alt={`${userData.firstName || ''} ${userData.lastName || ''} profile photo`} width={80} height={80} className="w-20 h-20 rounded-full object-cover" />
 ) : (
 `${userData.firstName?.[0] || ''}${userData.lastName?.[0] || ''}`
 )}
 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
 {uploadingProfileImage ? (
 <FaSpinner className="animate-spin text-white text-lg" />
 ) : (
 <FaCamera className="text-white text-lg" />
 )}
 </div>
 <input
 ref={profileImageInputRef}
 type="file"
 accept="image/jpeg,image/png,image/webp"
 className="hidden"
 onChange={handleProfileImageUpload}
 />
 </div>
 {profileImageError && (
 <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
 <FaExclamationTriangle className="text-[10px]" /> {profileImageError}
 </p>
 )}
 {profileImageSuccess && (
 <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
 <FaCheckCircle className="text-[10px]" /> Profile picture updated
 </p>
 )}
 <div className="flex-1">
 <div className="flex items-center gap-2">
 <h2 className="text-2xl font-bold text-gray-900">
 {userData.firstName} {userData.lastName}
 </h2>
 {userData.verified && <FaCheckCircle className="text-blue-500" title="Verified" />}
 </div>
 <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
 {USER_TYPE_LABELS[userType] || userType}
 </span>
 {userData.accountStatus && (
 <span
 className={`inline-block ml-2 mt-1 px-3 py-0.5 rounded-full text-sm font-medium ${
 userData.accountStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
 }`}
 >
 {userData.accountStatus}
 </span>
 )}
 </div>
 </div>
 </div>

 {/* Tab navigation */}
 <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
 <div className="border-b border-gray-200">
 <div className="flex">
 {tabs.map((tab) => {
 const Icon = tab.icon
 const isActive = activeTab === tab.id
 return (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`flex-1 sm:flex-initial flex items-center justify-center sm:justify-start gap-0 sm:gap-2 px-3 sm:px-5 py-3 text-center font-medium transition-all border-b-2 ${
 isActive
 ? 'text-blue-600 border-blue-600 bg-blue-50/50'
 : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
 }`}
 >
 <Icon className={`text-base sm:text-sm ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
 <span className="hidden sm:inline text-sm">{tab.label}</span>
 </button>
 )
 })}
 </div>
 </div>

 {/* Tab content */}
 <div className="p-4 sm:p-6">
 {activeTab === 'overview' && renderOverview()}
 {activeTab === 'documents' && renderDocuments()}
 {activeTab === 'info' && renderInfo()}
 {activeTab === 'reviews' && !NON_PROVIDER_TYPES.has(userType) && (
 <ProviderReviews
 providerUserId={userId}
 providerLabel={USER_TYPE_LABELS[userType] || userType}
 isOwner
 />
 )}
 {activeTab === 'posts' && !NON_PROVIDER_TYPES.has(userType) && (
 <div className="space-y-6">
 <CreatePostForm />
 <PostFeed currentUserId={userId} currentUserType={userType} />
 </div>
 )}
 </div>
 </div>

 {/* Document Viewer overlay */}
 {viewingDoc && (
 viewingDoc.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
 <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={() => setViewingDoc(null)}>
 <div className="bg-white rounded-xl max-w-3xl max-h-[90vh] overflow-auto p-4" onClick={(e) => e.stopPropagation()}>
 <div className="flex items-center justify-between mb-3">
 <h3 className="font-semibold text-gray-900">{viewingDoc.name}</h3>
 <div className="flex items-center gap-2">
 <a href={viewingDoc.url} download className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Download</a>
 <button onClick={() => setViewingDoc(null)} className="p-2 text-gray-500 hover:text-gray-700"><FaTimes /></button>
 </div>
 </div>
 <Image src={viewingDoc.url} alt={viewingDoc.name} width={800} height={600} className="max-w-full rounded-lg" />
 </div>
 </div>
 ) : (
 <PdfViewer
 url={viewingDoc.url}
 title={viewingDoc.name}
 onClose={() => setViewingDoc(null)}
 />
 )
 )}
 </div>
 )
}

/* ─── Helper: type-specific read-only summary (used in Overview tab) ─────── */

function renderTypeSpecificSummary(userType: string, profile: UserProfileData | null | undefined) {
 if (!profile) return null

 const sections: Record<string, { label: string; value: string | number | string[] | null | undefined }[]> = {
 PATIENT: [
 { label: 'Blood Type', value: profile.bloodType },
 { label: 'Allergies', value: profile.allergies },
 { label: 'Chronic Conditions', value: profile.chronicConditions },
 { label: 'Health Score', value: profile.healthScore },
 ...(profile.emergencyContact
 ? [
 {
 label: 'Emergency Contact',
 value: `${profile.emergencyContact.name} (${profile.emergencyContact.relationship}) - ${profile.emergencyContact.phone}`,
 },
 ]
 : []),
 ],
 DOCTOR: [
 { label: 'Specialty', value: profile.specialty },
 { label: 'License Number', value: profile.licenseNumber },
 { label: 'Clinic Affiliation', value: profile.clinicAffiliation },
 { label: 'Consultation Fee', value: profile.consultationFee ? `Rs ${profile.consultationFee}` : null },
 { label: 'Rating', value: profile.rating ? `${profile.rating}/5` : null },
 { label: 'Bio', value: profile.bio },
 ],
 NURSE: [
 { label: 'License Number', value: profile.licenseNumber },
 { label: 'Experience', value: profile.experience ? `${profile.experience} years` : null },
 { label: 'Specializations', value: profile.specializations },
 ],
 NANNY: [
 { label: 'Experience', value: profile.experience ? `${profile.experience} years` : null },
 { label: 'Certifications', value: profile.certifications },
 ],
 PHARMACIST: [
 { label: 'License Number', value: profile.licenseNumber },
 { label: 'Pharmacy Name', value: profile.pharmacyName },
 ],
 LAB_TECHNICIAN: [
 { label: 'License Number', value: profile.licenseNumber },
 { label: 'Lab Name', value: profile.labName },
 { label: 'Specializations', value: profile.specializations },
 ],
 EMERGENCY_WORKER: [
 { label: 'Certifications', value: profile.certifications },
 { label: 'Vehicle Type', value: profile.vehicleType },
 { label: 'Response Zone', value: profile.responseZone },
 { label: 'EMT Level', value: profile.emtLevel },
 ],
 INSURANCE_REP: [
 { label: 'Company Name', value: profile.companyName },
 { label: 'Coverage Types', value: profile.coverageTypes },
 ],
 CORPORATE_ADMIN: [
 { label: 'Company Name', value: profile.companyName },
 { label: 'Employee Count', value: profile.employeeCount },
 ],
 REFERRAL_PARTNER: [
 { label: 'Business Type', value: profile.businessType },
 { label: 'Commission Rate', value: profile.commissionRate ? `${profile.commissionRate}%` : null },
 { label: 'Referral Code', value: profile.referralCode },
 ],
 REGIONAL_ADMIN: [
 { label: 'Region', value: profile.region },
 { label: 'Country', value: profile.country },
 ],
 }

 const fields = sections[userType]
 if (!fields || fields.length === 0) return null

 const validFields = fields.filter((f) => f.value !== null && f.value !== undefined && f.value !== '')
 if (validFields.length === 0) return null

 return (
 <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
 <h3 className="text-lg font-semibold text-gray-900 mb-4">
 {userType === 'MEMBER' ? 'Medical Summary' : 'Professional Details'}
 </h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {validFields.map((field) => (
 <div key={field.label}>
 <p className="text-sm text-gray-500">{field.label}</p>
 <p className="text-gray-900 font-medium">
 {Array.isArray(field.value) ? field.value.join(', ') : String(field.value)}
 </p>
 </div>
 ))}
 </div>
 </div>
 )
}

/* ─── Per-required-document upload slot ─────────────────────────────────── */

function RequiredDocUploadSlot({
 documentName,
 required,
 onUploaded,
}: {
 documentName: string
 required: boolean
 userId: string
 onUploaded: () => Promise<void>
}) {
 const [uploading, setUploading] = useState(false)
 const [done, setDone] = useState(false)
 const [error, setError] = useState('')

 const handleFile = async (file: File) => {
  setUploading(true)
  setError('')
  try {
   const fd = new FormData()
   fd.append('file', file)
   fd.append('type', 'id_proof')
   fd.append('name', documentName)
   // /api/upload/local already creates the document DB record internally
   const uploadRes = await fetch('/api/upload/local', { method: 'POST', body: fd, credentials: 'include' })
   const uploadResult = await uploadRes.json()
   if (!uploadResult.success) throw new Error(uploadResult.message || 'Upload failed')
   setDone(true)
   await onUploaded()
  } catch (err) {
   setError(err instanceof Error ? err.message : 'Upload failed')
  } finally {
   setUploading(false)
  }
 }

 if (done) return null

 return (
  <div className="border border-dashed border-gray-300 rounded-lg p-3 bg-gray-50">
   <p className="text-sm font-medium text-gray-800 mb-1.5">
    {documentName}
    {required && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">Required</span>}
   </p>
   <label className="cursor-pointer">
    <input
     type="file"
     accept="image/jpeg,image/png,image/webp,application/pdf"
     className="hidden"
     disabled={uploading}
     onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
    />
    <div className={`flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors ${uploading ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}>
     {uploading ? <FaSpinner className="animate-spin text-xs" /> : <FaUpload className="text-xs" />}
     <span>{uploading ? 'Uploading…' : 'Choose file (JPG, PNG, PDF)'}</span>
    </div>
   </label>
   {error && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><FaExclamationTriangle className="text-[10px]" /> {error}</p>}
  </div>
 )
}

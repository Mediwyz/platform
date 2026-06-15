import { ChangeEvent, useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FaEye, FaEyeSlash, FaUsers, FaCamera, FaBuilding } from 'react-icons/fa'
import { SignupFormData, UserType } from './types'

interface Company {
 id: string
 companyName: string
}

interface Region {
 id: string
 name: string
 countryCode: string
 language: string
 flag: string | null
}

interface BasicInfoStepProps {
 formData: SignupFormData;
 selectedType: UserType | undefined;
 showPassword: boolean;
 showConfirmPassword: boolean;
 onFormChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
 onPasswordToggle: () => void;
 onConfirmPasswordToggle: () => void;
 onProfileImageChange?: (url: string) => void;
}

export default function BasicInfoStep({
 formData,
 selectedType,
 showPassword,
 showConfirmPassword,
 onFormChange,
 onPasswordToggle,
 onConfirmPasswordToggle,
 onProfileImageChange,
}: BasicInfoStepProps) {
 const SelectedIcon = selectedType?.icon
 const [regions, setRegions] = useState<Region[]>([])
 const [companies, setCompanies] = useState<Company[]>([])
 const [profilePreview, setProfilePreview] = useState<string | null>(formData.profileImageUrl || null)
 const [uploadingImage, setUploadingImage] = useState(false)
 const fileInputRef = useRef<HTMLInputElement>(null)

 useEffect(() => {
 fetch('/api/regions')
 .then(res => res.json())
 .then(result => {
 if (result.success) setRegions(result.data)
 })
 .catch(() => {})
 }, [])

 // Fetch companies for patient corporate enrollment
 useEffect(() => {
 if (formData.userType !== 'patient') return
 fetch('/api/corporate/companies')
 .then(res => res.json())
 .then(result => {
 if (result.success) setCompanies(result.data)
 })
 .catch(() => {})
 }, [formData.userType])

 const handleProfileImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0]
 if (!file) return

 // Show preview immediately
 const reader = new FileReader()
 reader.onload = (ev) => setProfilePreview(ev.target?.result as string)
 reader.readAsDataURL(file)

 // Upload to server
 setUploadingImage(true)
 try {
 const fd = new FormData()
 fd.append('file', file)
 const res = await fetch('/api/upload/registration', { method: 'POST', body: fd })
 const result = await res.json()
 if (result.success) {
 onProfileImageChange?.(result.data.url)
 }
 } catch {
 // Silently fail - user can try again
 } finally {
 setUploadingImage(false)
 }
 }

 return (
 <div>
 <div className="flex items-center gap-4 mb-6">
 {/* Profile Picture Upload */}
 <div
 className={`relative w-16 h-16 rounded-full flex items-center justify-center cursor-pointer group overflow-hidden ${selectedType?.color}`}
 onClick={() => fileInputRef.current?.click()}
 >
 {profilePreview ? (
 <Image src={profilePreview} alt="Profile" width={64} height={64} className="w-full h-full object-cover rounded-full" />
 ) : (
 SelectedIcon && <SelectedIcon className="text-3xl" />
 )}
 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
 {uploadingImage ? (
 <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
 ) : (
 <FaCamera className="text-white text-lg" />
 )}
 </div>
 <input
 ref={fileInputRef}
 type="file"
 accept="image/jpeg,image/png,image/webp"
 className="hidden"
 onChange={handleProfileImageUpload}
 />
 </div>
 <div>
 <h2 className="text-2xl font-bold text-gray-900">{selectedType?.label} Registration</h2>
 <p className="text-gray-600">Please provide your basic information</p>
 <p className="text-xs text-blue-500 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
 Click avatar to upload profile picture
 </p>
 </div>
 </div>

 <form className="space-y-6">
 {/* Region Selection */}
 {regions.length > 0 && (
 <div className=" border border-green-200 rounded-xl p-6">
 <h3 className="text-lg font-bold text-gray-900 mb-3">Select Your Region</h3>
 <select
 name="regionId"
 className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-green-600"
 value={formData.regionId || ''}
 onChange={onFormChange}
 >
 <option value="">Select your country/region</option>
 {regions.map(r => (
 <option key={r.id} value={r.id}>
 {r.flag ? `${r.flag} ` : ''}{r.name}
 </option>
 ))}
 </select>
 <p className="text-gray-500 text-sm mt-2">
 This helps connect you with healthcare providers in your area.
 </p>
 </div>
 )}

 {/* Referral Code Section - Universal for all user types */}
 <div className=" border border-blue-200 rounded-xl p-6">
 <div className="flex items-center gap-3 mb-4">
 <FaUsers className="text-brand-teal text-xl" />
 <h3 className="text-lg font-bold text-gray-900">Referral Information</h3>
 <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
 Optional
 </span>
 </div>
 <div>
 <label className="block text-gray-700 font-medium mb-2">Referral Code or Email</label>
 <input
 type="text"
 name="referralCode"
 placeholder="Enter referral code or email of person who referred you"
 className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-600"
 value={formData.referralCode || ''}
 onChange={onFormChange}
 />
 <p className="text-gray-500 text-sm mt-2">
 If someone referred you to MediWyz, please enter their referral code or email address to give them credit.
 </p>
 </div>
 </div>

 <div className="grid md:grid-cols-2 gap-6">
 <div>
 <label className="block text-gray-700 font-medium mb-2">Full Name *</label>
 <input
 type="text"
 name="fullName"
 required
 placeholder="Enter your full legal name"
 className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-600"
 value={formData.fullName}
 onChange={onFormChange}
 />
 </div>

 <div>
 <label className="block text-gray-700 font-medium mb-2">Email Address *</label>
 <input
 type="email"
 name="email"
 required
 placeholder="Enter your email"
 className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-600"
 value={formData.email}
 onChange={onFormChange}
 />
 </div>

 <div>
 <label className="block text-gray-700 font-medium mb-2">Password *</label>
 <div className="relative">
 <input
 type={showPassword ? "text" : "password"}
 name="password"
 required
 placeholder="Create a strong password"
 className="w-full px-4 py-3 pr-12 border rounded-xl focus:outline-none focus:border-blue-600"
 value={formData.password}
 onChange={onFormChange}
 />
 <button
 type="button"
 onClick={onPasswordToggle}
 className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
 >
 {showPassword ? <FaEyeSlash /> : <FaEye />}
 </button>
 </div>
 </div>

 <div>
 <label className="block text-gray-700 font-medium mb-2">Confirm Password *</label>
 <div className="relative">
 <input
 type={showConfirmPassword ? "text" : "password"}
 name="confirmPassword"
 required
 placeholder="Confirm your password"
 className="w-full px-4 py-3 pr-12 border rounded-xl focus:outline-none focus:border-blue-600"
 value={formData.confirmPassword}
 onChange={onFormChange}
 />
 <button
 type="button"
 onClick={onConfirmPasswordToggle}
 className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
 >
 {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
 </button>
 </div>
 </div>

 <div>
 <label className="block text-gray-700 font-medium mb-2">Phone Number *</label>
 <input
 type="tel"
 name="phone"
 required
 placeholder="+230 5xxx xxxx"
 className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-600"
 value={formData.phone}
 onChange={onFormChange}
 />
 </div>

 <div>
 <label className="block text-gray-700 font-medium mb-2">Date of Birth *</label>
 <input
 type="date"
 name="dateOfBirth"
 required
 className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-600"
 value={formData.dateOfBirth}
 onChange={onFormChange}
 />
 </div>

 <div>
 <label className="block text-gray-700 font-medium mb-2">Gender *</label>
 <select
 name="gender"
 required
 className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-600"
 value={formData.gender}
 onChange={onFormChange}
 >
 <option value="">Select Gender</option>
 <option value="male">Male</option>
 <option value="female">Female</option>
 <option value="other">Other</option>
 <option value="prefer-not-to-say">Prefer not to say</option>
 </select>
 </div>

 {/* Doctor category selector */}
 {formData.userType === 'doctor' && (
 <div className="md:col-span-2">
 <label className="block text-gray-700 font-medium mb-2">Doctor Category *</label>
 <div className="grid grid-cols-2 gap-4">
 <button
 type="button"
 onClick={() => onFormChange({ target: { name: 'doctorCategory', value: 'general_practitioner', type: 'text' } } as ChangeEvent<HTMLInputElement>)}
 className={`p-4 border-2 rounded-xl text-center transition-all ${
 formData.doctorCategory === 'general_practitioner'
 ? 'border-green-500 bg-green-50 text-green-700'
 : 'border-gray-200 hover:border-gray-300'
 }`}
 >
 <p className="font-semibold">General Practitioner</p>
 <p className="text-sm text-gray-500 mt-1">Family medicine, general consultations</p>
 </button>
 <button
 type="button"
 onClick={() => onFormChange({ target: { name: 'doctorCategory', value: 'specialist', type: 'text' } } as ChangeEvent<HTMLInputElement>)}
 className={`p-4 border-2 rounded-xl text-center transition-all ${
 formData.doctorCategory === 'specialist'
 ? 'border-blue-500 bg-blue-50 text-blue-700'
 : 'border-gray-200 hover:border-gray-300'
 }`}
 >
 <p className="font-semibold">Specialist</p>
 <p className="text-sm text-gray-500 mt-1">Cardiology, dermatology, etc.</p>
 </button>
 </div>
 </div>
 )}

 {/* Patient corporate enrollment */}
 {formData.userType === 'patient' && companies.length > 0 && (
 <div className="md:col-span-2">
 <div className=" border border-slate-200 rounded-xl p-6">
 <div className="flex items-center gap-3 mb-4">
 <FaBuilding className="text-slate-600 text-xl" />
 <h3 className="text-lg font-bold text-gray-900">Corporate Enrollment</h3>
 <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-full font-medium">
 Optional
 </span>
 </div>
 <label className="flex items-center gap-3 cursor-pointer mb-4">
 <input
 type="checkbox"
 name="enrolledInCompany"
 checked={formData.enrolledInCompany || false}
 onChange={onFormChange}
 className="w-5 h-5 rounded border-gray-300 text-brand-teal focus:ring-brand-teal"
 />
 <span className="text-gray-700">I am enrolling through my company&apos;s wellness program</span>
 </label>
 {formData.enrolledInCompany && (
 <select
 name="companyId"
 className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-600"
 value={formData.companyId || ''}
 onChange={onFormChange}
 >
 <option value="">Select your company</option>
 {companies.map(c => (
 <option key={c.id} value={c.id}>{c.companyName}</option>
 ))}
 </select>
 )}
 <p className="text-gray-500 text-sm mt-2">
 Your account will require corporate admin approval before activation.
 </p>
 </div>
 </div>
 )}
 </div>

 <div>
 <label className="block text-gray-700 font-medium mb-2">Full Address *</label>
 <textarea
 name="address"
 required
 rows={3}
 placeholder="Enter your complete address"
 className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-600"
 value={formData.address}
 onChange={onFormChange}
 />
 </div>

 {/* Terms and Conditions Agreement */}
 <div className="border-t pt-6">
 <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
 <h3 className="font-bold text-lg text-gray-900 mb-4">Terms and Conditions</h3>
 <div className="space-y-4 text-sm text-gray-700">
 <div className="flex items-start gap-3">
 <input type="checkbox" id="agreeToTerms" name="agreeToTerms" className="mt-1" checked={formData.agreeToTerms} onChange={onFormChange} required />
 <label htmlFor="agreeToTerms" className="flex-1">
 I agree to the <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link> and
 <Link href="/privacy" className="text-blue-600 hover:underline ml-1">Privacy Policy</Link>
 </label>
 </div>

 <div className="flex items-start gap-3">
 <input type="checkbox" id="agreeToPrivacy" name="agreeToPrivacy" className="mt-1" checked={formData.agreeToPrivacy} onChange={onFormChange} required />
 <label htmlFor="agreeToPrivacy" className="flex-1">
 I certify that all information provided is accurate and complete. I understand that false information may result in account suspension.
 </label>
 </div>

 <div className="flex items-start gap-3">
 <input type="checkbox" id="agreeToDisclaimer" name="agreeToDisclaimer" className="mt-1" checked={formData.agreeToDisclaimer} onChange={onFormChange} required />
 <label htmlFor="agreeToDisclaimer" className="flex-1">
 I consent to the verification of my documents and credentials by MediWyz and relevant regulatory bodies.
 </label>
 </div>
 </div>
 </div>

 {formData.userType !== 'patient' && (
 <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
 <p className="text-blue-700 text-sm">
 After registration, you will need to upload your professional documents from your account settings to unlock all features.
 </p>
 </div>
 )}
 </div>
 </form>
 </div>
 )
}

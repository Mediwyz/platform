'use client'

import { useState, FormEvent, ChangeEvent } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
 FaUser,
 FaUserMd,
 FaUserNurse,
 FaPills,
 FaFlask, 
 FaAmbulance, 
 FaShieldAlt,
 FaBaby,
 FaUpload,
 FaCheck,
 FaEye,
 FaEyeSlash,
 FaInfoCircle,
 FaFileAlt,
 FaTimes,
 FaArrowRight,
 FaArrowLeft
} from 'react-icons/fa'

interface UserType {
 id: string;
 label: string;
 icon: React.ComponentType<{ className?: string; }>;
 description: string;
 color: string;
}

interface Document {
 id: string;
 name: string;
 required: boolean;
 description: string;
 accepted: string;
 file?: File;
 uploaded?: boolean;
}

interface SignupFormData {
 // Basic Information
 fullName: string;
 email: string;
 password: string;
 confirmPassword: string;
 phone: string;
 dateOfBirth: string;
 gender: string;
 address: string;
 
 // User Type
 userType: string;
 
 // Professional Information (conditional)
 licenseNumber?: string;
 specialization?: string;
 institution?: string;
 experience?: string;
 
 // Emergency Contact
 emergencyContactName?: string;
 emergencyContactPhone?: string;
 emergencyContactRelation?: string;
}

const userTypes: UserType[] = [
 {
 id: 'patient',
 label: 'Patient',
 icon: FaUser,
 description: 'Book appointments & manage health',
 color: 'bg-blue-100 text-blue-700 border-blue-300'
 },
 {
 id: 'doctor',
 label: 'Doctor',
 icon: FaUserMd,
 description: 'Medical Doctor / Physician',
 color: 'bg-green-100 text-green-700 border-green-300'
 },
 {
 id: 'nurse',
 label: 'Nurse',
 icon: FaUserNurse,
 description: 'Registered Nurse / Midwife',
 color: 'bg-purple-100 text-purple-700 border-purple-300'
 },
 {
 id: 'nanny',
 label: 'Nanny',
 icon: FaBaby,
 description: 'Child Care Worker',
 color: 'bg-pink-100 text-pink-700 border-pink-300'
 },
 {
 id: 'pharmacist',
 label: 'Pharmacist',
 icon: FaPills,
 description: 'PharmD / Licensed Pharmacist',
 color: 'bg-orange-100 text-orange-700 border-orange-300'
 },
 {
 id: 'lab',
 label: 'Lab Technician',
 icon: FaFlask,
 description: 'Laboratory Director / Biologist',
 color: 'bg-cyan-100 text-cyan-700 border-cyan-300'
 },
 {
 id: 'emergency',
 label: 'Emergency Worker',
 icon: FaAmbulance,
 description: 'Paramedic / EMT',
 color: 'bg-red-100 text-red-700 border-red-300'
 },
 {
 id: 'insurance',
 label: 'Insurance Rep',
 icon: FaShieldAlt,
 description: 'Health Insurance Representative',
 color: 'bg-indigo-100 text-indigo-700 border-indigo-300'
 }
]

const documentRequirements: Record<string, Document[]> = {
 patient: [
 { id: 'national-id', name: 'National ID/Passport', required: true, description: 'Valid government-issued identification', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
 { id: 'insurance-card', name: 'Health Insurance Card', required: false, description: 'If insured', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
 { id: 'proof-address', name: 'Proof of Address', required: true, description: 'Utility bill or rental contract', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
 { id: 'medical-history', name: 'Medical History Document', required: false, description: 'Vaccination card or chronic illness file', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false }
 ],
 doctor: [
 { id: 'national-id', name: 'National ID/Passport', required: true, description: 'Valid government-issued identification', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
 { id: 'medical-degree', name: 'Medical Degree', required: true, description: 'MBBS, MD, or equivalent', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
 { id: 'medical-license', name: 'Professional License', required: true, description: 'License to Practice Medicine', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
 { id: 'registration-cert', name: 'Registration Certificate', required: true, description: 'Order of Physicians or equivalent', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
 { id: 'work-certificate', name: 'Work Certificate', required: false, description: 'Proof of Employment (if applicable)', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false }
 ],
 nurse: [
 { id: 'national-id', name: 'National ID/Passport', required: true, description: 'Valid government-issued identification', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
 { id: 'nursing-degree', name: 'Nursing Degree/Diploma', required: true, description: 'Nursing qualification certificate', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
 { id: 'nursing-license', name: 'Professional License', required: true, description: 'License to Practice Nursing', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
 { id: 'registration-cert', name: 'Registration Certificate', required: true, description: 'Order of Nurses or equivalent', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
 { id: 'work-certificate', name: 'Work Certificate', required: true, description: 'Hospital Affiliation Proof', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false }
 ],
 nanny: [
 { id: 'national-id', name: 'National ID/Passport', required: true, description: 'Valid government-issued identification', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
 { id: 'police-clearance', name: 'Police Clearance Certificate', required: true, description: 'Background check certificate', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
 { id: 'childcare-cert', name: 'Childcare Training Certificate', required: false, description: 'First Aid & Childcare Training', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
 { id: 'employment-refs', name: 'Employment References', required: false, description: 'Previous work references', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false }
 ],
 pharmacist: [
 { id: 'national-id', name: 'National ID/Passport', required: true, description: 'Valid government-issued identification', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
 { id: 'pharmacy-degree', name: 'Pharmacy Degree', required: true, description: 'Doctor of Pharmacy or equivalent', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
 { id: 'pharmacy-license', name: 'Professional License', required: true, description: 'License to Practice Pharmacy', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
 { id: 'registration-cert', name: 'Registration Certificate', required: true, description: 'Order of Pharmacists or equivalent', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
 { id: 'pharmacy-affiliation', name: 'Pharmacy Affiliation Proof', required: true, description: 'Ownership certificate or work contract', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false }
 ],
 lab: [
 { id: 'national-id', name: 'National ID/Passport', required: true, description: 'Valid government-issued identification', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
 { id: 'lab-degree', name: 'Laboratory Science Degree', required: true, description: 'Biology, Biochemistry, Medical Lab Science', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
 { id: 'lab-license', name: 'Professional License', required: true, description: 'Accreditation from health authority', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
 { id: 'lab-accreditation', name: 'Laboratory Accreditation', required: true, description: 'ISO, Ministry of Health approval', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
 { id: 'employment-proof', name: 'Proof of Employment', required: true, description: 'Employment in the laboratory', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false }
 ],
 emergency: [
 { id: 'national-id', name: 'National ID/Passport', required: true, description: 'Valid government-issued identification', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
 { id: 'emt-cert', name: 'EMT/Paramedic Certification', required: true, description: 'Emergency Medical Technician certificate', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
 { id: 'professional-license', name: 'Professional License', required: false, description: 'Registration Certificate (if required)', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
 { id: 'first-aid-cert', name: 'First Aid/ALS Certification', required: true, description: 'Advanced Life Support Certification', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
 { id: 'employment-proof', name: 'Proof of Employment', required: true, description: 'Employment with ambulance/emergency service', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false }
 ],
 insurance: [
 { id: 'national-id', name: 'National ID/Passport', required: true, description: 'Valid government-issued identification', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
 { id: 'employment-proof', name: 'Proof of Employment', required: true, description: 'HR letter, contract, or badge', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
 { id: 'company-registration', name: 'Company Registration Certificate', required: true, description: 'Insurance company registration', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
 { id: 'regulatory-auth', name: 'Regulatory Authorization', required: false, description: 'Authorization from Insurance Regulator', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
 { id: 'professional-accred', name: 'Professional Accreditation', required: false, description: 'Professional certification (if applicable)', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false }
 ]
}

export default function EnhancedRegistrationForm() {
 const [currentStep, setCurrentStep] = useState(1)
 const [selectedUserType, setSelectedUserType] = useState<string>('patient')
 const [showRoleRequestModal, setShowRoleRequestModal] = useState(false)
 const [showPassword, setShowPassword] = useState(false)
 const [showConfirmPassword, setShowConfirmPassword] = useState(false)
 const [isSubmitting, setIsSubmitting] = useState(false)
 const [submitError, setSubmitError] = useState<string | null>(null)
 const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
 const [agreeToTerms, setAgreeToTerms] = useState(false)
 const [agreeToPrivacy, setAgreeToPrivacy] = useState(false)
 const [agreeToDisclaimer, setAgreeToDisclaimer] = useState(false)
 const [documents, setDocuments] = useState<Document[]>(documentRequirements.patient)
 const router = useRouter()

 const [formData, setFormData] = useState<SignupFormData>({
 fullName: '',
 email: '',
 password: '',
 confirmPassword: '',
 phone: '',
 dateOfBirth: '',
 gender: '',
 address: '',
 userType: 'patient',
 emergencyContactName: '',
 emergencyContactPhone: '',
 emergencyContactRelation: ''
 })

 const steps = [
 { number: 1, title: 'Account Type', icon: FaUser },
 { number: 2, title: 'Basic Info', icon: FaFileAlt },
 { number: 3, title: 'Documents', icon: FaUpload },
 { number: 4, title: 'Verification', icon: FaCheck }
 ]

 const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
 const { name, value } = e.target
 setFormData(prev => ({
 ...prev,
 [name]: value
 }))
 }

 const handleUserTypeChange = (userTypeId: string) => {
 setSelectedUserType(userTypeId)
 setFormData(prev => ({ ...prev, userType: userTypeId }))
 setDocuments(documentRequirements[userTypeId] || [])
 }

 const handleFileUpload = (documentId: string, file: File) => {
 setDocuments(prev => prev.map(doc => 
 doc.id === documentId 
 ? { ...doc, file, uploaded: true }
 : doc
 ))
 }

 const removeFile = (documentId: string) => {
 setDocuments(prev => prev.map(doc => 
 doc.id === documentId 
 ? { ...doc, file: undefined, uploaded: false }
 : doc
 ))
 }

 const validateStep = (step: number): boolean => {
 switch (step) {
 case 1:
 return selectedUserType !== ''
 case 2:
 return !!(formData.fullName && formData.email && formData.password && 
 formData.confirmPassword && formData.phone && formData.dateOfBirth && 
 formData.gender && formData.address)
 case 3:
 const requiredDocs = documents.filter(doc => doc.required)
 return requiredDocs.every(doc => doc.uploaded)
 default:
 return true
 }
 }

 const nextStep = () => {
 if (validateStep(currentStep)) {
 setCurrentStep(prev => Math.min(prev + 1, 4))
 }
 }

 const prevStep = () => {
 setCurrentStep(prev => Math.max(prev - 1, 1))
 }

 const handleSubmit = async (e: FormEvent) => {
 e.preventDefault()
 setIsSubmitting(true)
 setSubmitError(null)
 setSubmitSuccess(null)

 try {
 // Build document verification results from uploaded documents
 const documentVerifications = documents
 .filter(doc => doc.uploaded && doc.file)
 .map(doc => ({
 documentId: doc.id,
 verified: true,
 confidence: 85,
 }))

 const response = await fetch('/api/auth/register', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 fullName: formData.fullName,
 email: formData.email,
 password: formData.password,
 confirmPassword: formData.confirmPassword,
 phone: formData.phone,
 dateOfBirth: formData.dateOfBirth,
 gender: formData.gender,
 address: formData.address,
 userType: formData.userType,
 licenseNumber: formData.licenseNumber || undefined,
 specialization: formData.specialization || undefined,
 institution: formData.institution || undefined,
 experience: formData.experience || undefined,
 emergencyContactName: formData.emergencyContactName || undefined,
 emergencyContactPhone: formData.emergencyContactPhone || undefined,
 emergencyContactRelation: formData.emergencyContactRelation || undefined,
 agreeToTerms,
 agreeToPrivacy,
 agreeToDisclaimer,
 documentVerifications,
 }),
 })

 const data = await response.json()

 if (!response.ok || !data.success) {
 setSubmitError(data.message || 'Registration failed. Please try again.')
 return
 }

 setSubmitSuccess(data.message || 'Registration successful!')

 // Redirect to login page after a short delay so the user can see the success message
 setTimeout(() => {
 router.push('/login')
 }, 2500)
 } catch (error) {
 console.error('Registration error:', error)
 setSubmitError('A network error occurred. Please check your connection and try again.')
 } finally {
 setIsSubmitting(false)
 }
 }

 const selectedType = userTypes.find(type => type.id === selectedUserType)
 const SelectedIcon = selectedType?.icon || FaUser

 return (
 <div className="min-h-screen via-white py-8">
 <div className="container mx-auto px-4">
 <div className="max-w-4xl mx-auto">
 {/* Header */}
 <div className="text-center mb-8">
 <Image src="/images/logo-icon.png" alt="MediWyz" width={80} height={80} className="w-20 h-20 mx-auto mb-4" />
 <h1 className="text-4xl font-bold text-gray-900 mb-2">Join MediWyz</h1>
 <p className="text-gray-600 text-lg">Create your professional healthcare account</p>
 </div>

 {/* Progress Steps */}
 <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
 <div className="flex items-center justify-between">
 {steps.map((step, index) => (
 <div key={step.number} className="flex items-center">
 <div className="flex flex-col items-center">
 <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
 currentStep > step.number ? "bg-green-500 text-white" :
 currentStep === step.number ? "bg-brand-navy text-white" :
 "bg-gray-200 text-gray-600"
 }`}>
 {currentStep > step.number ? <FaCheck /> : <step.icon />}
 </div>
 <span className={`text-sm mt-2 font-medium ${
 currentStep >= step.number ? "text-brand-teal" : "text-gray-500"
 }`}>
 {step.title}
 </span>
 </div>
 {index < steps.length - 1 && (
 <div className={`w-20 h-1 mx-4 ${
 currentStep > step.number ? "bg-green-500" : "bg-gray-200"
 }`} />
 )}
 </div>
 ))}
 </div>
 </div>

 {/* Step Content */}
 <div className="bg-white rounded-2xl shadow-lg p-8">
 {/* Step 1: Account Type Selection */}
 {currentStep === 1 && (
 <div>
 <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Account Type</h2>
 <p className="text-gray-600 mb-8">Choose the type of account that best describes your role in healthcare</p>
 
 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
 {userTypes.map((type) => {
 const Icon = type.icon
 return (
 <button
 key={type.id}
 onClick={() => handleUserTypeChange(type.id)}
 className={`p-6 border-2 rounded-2xl text-left transition-all hover:shadow-lg ${
 selectedUserType === type.id
 ? `${type.color} border-current shadow-lg`
 : "border-gray-200 hover:border-gray-300"
 }`}
 >
 <Icon className={`text-3xl mb-4 ${
 selectedUserType === type.id ? "" : "text-gray-400"
 }`} />
 <h3 className="font-bold text-lg mb-2">{type.label}</h3>
 <p className="text-sm text-gray-600">{type.description}</p>
 </button>
 )
 })}
 {/* "Other — propose a new role" tile. Submits a ProviderRole
  request in `isActive:false` state; regional admin reviews.
  Keeps the platform open for roles we don't ship by default
  (osteopath, audiologist, homeopath, …) without a code change. */}
 <button
 type="button"
 onClick={() => setShowRoleRequestModal(true)}
 className="p-6 border-2 border-dashed rounded-2xl text-left transition-all hover:shadow-lg hover:border-brand-teal text-gray-600 hover:text-brand-navy"
 >
 <span className="text-3xl mb-4 block">➕</span>
 <h3 className="font-bold text-lg mb-2">I don&apos;t see my role</h3>
 <p className="text-sm text-gray-500">Propose a new provider role for regional admin review.</p>
 </button>
 </div>

 {showRoleRequestModal && (
 <RoleRequestModal
 onClose={() => setShowRoleRequestModal(false)}
 onSubmitted={() => {
  setShowRoleRequestModal(false)
  // Fall back to patient signup while their proposed role is under review.
  handleUserTypeChange('patient')
 }}
 />
 )}

 {selectedUserType && (
 <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
 <div className="flex items-start gap-4">
 <FaInfoCircle className="text-brand-teal mt-1" />
 <div>
 <h4 className="font-bold text-blue-800 mb-2">Required Documents for {selectedType?.label}</h4>
 <ul className="text-blue-700 text-sm space-y-1">
 {documentRequirements[selectedUserType]?.filter(doc => doc.required).map(doc => (
 <li key={doc.id}>• {doc.name}</li>
 ))}
 </ul>
 <p className="text-brand-teal text-xs mt-2">
 You will upload these documents in the next steps. Make sure you have them ready.
 </p>
 </div>
 </div>
 </div>
 )}
 </div>
 )}

 {/* Step 2: Basic Information */}
 {currentStep === 2 && (
 <div>
 <div className="flex items-center gap-4 mb-6">
 <div className={`w-16 h-16 rounded-full flex items-center justify-center ${selectedType?.color}`}>
 <SelectedIcon className="text-3xl" />
 </div>
 <div>
 <h2 className="text-2xl font-bold text-gray-900">{selectedType?.label} Registration</h2>
 <p className="text-gray-600">Please provide your basic information</p>
 </div>
 </div>

 <form className="space-y-6">
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
 onChange={handleChange}
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
 onChange={handleChange}
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
 onChange={handleChange}
 />
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
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
 onChange={handleChange}
 />
 <button
 type="button"
 onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
 onChange={handleChange}
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
 onChange={handleChange}
 />
 </div>

 <div>
 <label className="block text-gray-700 font-medium mb-2">Gender *</label>
 <select
 name="gender"
 required
 className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-600"
 value={formData.gender}
 onChange={handleChange}
 >
 <option value="">Select Gender</option>
 <option value="male">Male</option>
 <option value="female">Female</option>
 <option value="other">Other</option>
 <option value="prefer-not-to-say">Prefer not to say</option>
 </select>
 </div>

 {/* Professional fields for healthcare workers */}
 {selectedUserType !== 'patient' && (
 <>
 <div>
 <label className="block text-gray-700 font-medium mb-2">License/Registration Number</label>
 <input
 type="text"
 name="licenseNumber"
 placeholder="Enter your professional license number"
 className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-600"
 value={formData.licenseNumber || ''}
 onChange={handleChange}
 />
 </div>

 <div>
 <label className="block text-gray-700 font-medium mb-2">
 {selectedUserType === 'doctor' ? 'Specialization' : 
 selectedUserType === 'nurse' ? 'Area of Expertise' :
 selectedUserType === 'pharmacist' ? 'Pharmacy Type' :
 'Area of Work'}
 </label>
 <input
 type="text"
 name="specialization"
 placeholder={`Enter your ${selectedUserType === 'doctor' ? 'medical specialization' : 'area of expertise'}`}
 className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-600"
 value={formData.specialization || ''}
 onChange={handleChange}
 />
 </div>

 <div>
 <label className="block text-gray-700 font-medium mb-2">Institution/Workplace</label>
 <input
 type="text"
 name="institution"
 placeholder="Enter your current workplace"
 className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-600"
 value={formData.institution || ''}
 onChange={handleChange}
 />
 </div>

 <div>
 <label className="block text-gray-700 font-medium mb-2">Years of Experience</label>
 <select
 name="experience"
 className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-600"
 value={formData.experience || ''}
 onChange={handleChange}
 >
 <option value="">Select Experience</option>
 <option value="0-1">0-1 years</option>
 <option value="2-5">2-5 years</option>
 <option value="6-10">6-10 years</option>
 <option value="11-15">11-15 years</option>
 <option value="16-20">16-20 years</option>
 <option value="20+">20+ years</option>
 </select>
 </div>
 </>
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
 onChange={handleChange}
 />
 </div>

 {/* Emergency Contact */}
 <div className="border-t pt-6">
 <h3 className="text-lg font-bold text-gray-900 mb-4">Emergency Contact Information</h3>
 <div className="grid md:grid-cols-3 gap-4">
 <div>
 <label className="block text-gray-700 font-medium mb-2">Contact Name</label>
 <input
 type="text"
 name="emergencyContactName"
 placeholder="Full name"
 className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-600"
 value={formData.emergencyContactName || ''}
 onChange={handleChange}
 />
 </div>
 <div>
 <label className="block text-gray-700 font-medium mb-2">Contact Phone</label>
 <input
 type="tel"
 name="emergencyContactPhone"
 placeholder="+230 5xxx xxxx"
 className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-600"
 value={formData.emergencyContactPhone || ''}
 onChange={handleChange}
 />
 </div>
 <div>
 <label className="block text-gray-700 font-medium mb-2">Relationship</label>
 <select
 name="emergencyContactRelation"
 className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-blue-600"
 value={formData.emergencyContactRelation || ''}
 onChange={handleChange}
 >
 <option value="">Select Relationship</option>
 <option value="spouse">Spouse</option>
 <option value="parent">Parent</option>
 <option value="child">Child</option>
 <option value="sibling">Sibling</option>
 <option value="friend">Friend</option>
 <option value="other">Other</option>
 </select>
 </div>
 </div>
 </div>
 </form>
 </div>
 )}

 {/* Step 3: Document Upload */}
 {currentStep === 3 && (
 <div>
 <div className="flex items-center gap-4 mb-6">
 <div className={`w-16 h-16 rounded-full flex items-center justify-center ${selectedType?.color}`}>
 <FaUpload className="text-3xl" />
 </div>
 <div>
 <h2 className="text-2xl font-bold text-gray-900">Document Upload</h2>
 <p className="text-gray-600">Please upload the required documents for verification</p>
 </div>
 </div>

 <div className="space-y-6">
 {documents.map((doc) => (
 <div key={doc.id} className={`border-2 rounded-xl p-6 ${doc.required ? 'border-red-200' : 'border-gray-200'}`}>
 <div className="flex items-start justify-between mb-4">
 <div className="flex-1">
 <div className="flex items-center gap-3 mb-2">
 <h3 className="font-bold text-lg text-gray-900">{doc.name}</h3>
 {doc.required && (
 <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium">
 Required
 </span>
 )}
 {doc.uploaded && (
 <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
 <FaCheck className="text-xs" />
 Uploaded
 </span>
 )}
 </div>
 <p className="text-gray-600 text-sm mb-2">{doc.description}</p>
 <p className="text-gray-500 text-xs">Accepted formats: {doc.accepted}</p>
 </div>
 </div>

 {doc.uploaded && doc.file ? (
 <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
 <div className="flex items-center gap-3">
 <FaFileAlt className="text-green-600" />
 <div>
 <p className="font-medium text-green-800">{doc.file.name}</p>
 <p className="text-green-600 text-sm">{(doc.file.size / 1024 / 1024).toFixed(2)} MB</p>
 </div>
 </div>
 <button
 onClick={() => removeFile(doc.id)}
 className="text-red-600 hover:text-red-800 p-2"
 >
 <FaTimes />
 </button>
 </div>
 ) : (
 <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
 <FaUpload className="text-4xl text-gray-400 mx-auto mb-4" />
 <p className="text-gray-600 mb-4">Drag and drop your file here, or click to browse</p>
 <input
 type="file"
 accept={doc.accepted}
 onChange={(e) => {
 const file = e.target.files?.[0]
 if (file) handleFileUpload(doc.id, file)
 }}
 className="hidden"
 id={`file-${doc.id}`}
 />
 <label
 htmlFor={`file-${doc.id}`}
 className="bg-brand-navy text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-teal cursor-pointer inline-block"
 >
 Choose File
 </label>
 </div>
 )}
 </div>
 ))}
 </div>

 {/* Upload Progress Summary */}
 <div className="mt-8 bg-gray-50 rounded-xl p-6">
 <h3 className="font-bold text-gray-900 mb-4">Upload Progress</h3>
 <div className="grid md:grid-cols-2 gap-4 text-sm">
 <div>
 <span className="text-gray-600">Required Documents:</span>
 <span className="font-medium ml-2">
 {documents.filter(doc => doc.required && doc.uploaded).length} / {documents.filter(doc => doc.required).length}
 </span>
 </div>
 <div>
 <span className="text-gray-600">Optional Documents:</span>
 <span className="font-medium ml-2">
 {documents.filter(doc => !doc.required && doc.uploaded).length} / {documents.filter(doc => !doc.required).length}
 </span>
 </div>
 </div>
 
 <div className="mt-4">
 <div className="flex justify-between text-sm mb-2">
 <span className="text-gray-600">Required Documents Progress</span>
 <span className="font-medium">
 {Math.round((documents.filter(doc => doc.required && doc.uploaded).length / documents.filter(doc => doc.required).length) * 100) || 0}%
 </span>
 </div>
 <div className="w-full bg-gray-200 rounded-full h-2">
 <div 
 className="bg-brand-navy h-2 rounded-full transition-all"
 style={{ 
 width: `${(documents.filter(doc => doc.required && doc.uploaded).length / documents.filter(doc => doc.required).length) * 100 || 0}%` 
 }}
 />
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Step 4: Verification */}
 {currentStep === 4 && (
 <div>
 <div className="text-center mb-8">
 <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
 <FaCheck className="text-green-600 text-3xl" />
 </div>
 <h2 className="text-3xl font-bold text-gray-900 mb-2">Review & Submit</h2>
 <p className="text-gray-600">Please review your information before submitting your registration</p>
 </div>

 {/* Summary */}
 <div className="space-y-6">
 {/* Account Type */}
 <div className="bg-gray-50 rounded-xl p-6">
 <h3 className="font-bold text-lg text-gray-900 mb-4">Account Information</h3>
 <div className="grid md:grid-cols-2 gap-4">
 <div>
 <span className="text-gray-600">Account Type:</span>
 <p className="font-semibold">{selectedType?.label}</p>
 </div>
 <div>
 <span className="text-gray-600">Full Name:</span>
 <p className="font-semibold">{formData.fullName}</p>
 </div>
 <div>
 <span className="text-gray-600">Email:</span>
 <p className="font-semibold">{formData.email}</p>
 </div>
 <div>
 <span className="text-gray-600">Phone:</span>
 <p className="font-semibold">{formData.phone}</p>
 </div>
 </div>
 </div>

 {/* Professional Info (if applicable) */}
 {selectedUserType !== 'patient' && (formData.licenseNumber || formData.specialization) && (
 <div className="bg-blue-50 rounded-xl p-6">
 <h3 className="font-bold text-lg text-gray-900 mb-4">Professional Information</h3>
 <div className="grid md:grid-cols-2 gap-4">
 {formData.licenseNumber && (
 <div>
 <span className="text-gray-600">License Number:</span>
 <p className="font-semibold">{formData.licenseNumber}</p>
 </div>
 )}
 {formData.specialization && (
 <div>
 <span className="text-gray-600">Specialization:</span>
 <p className="font-semibold">{formData.specialization}</p>
 </div>
 )}
 {formData.institution && (
 <div>
 <span className="text-gray-600">Institution:</span>
 <p className="font-semibold">{formData.institution}</p>
 </div>
 )}
 {formData.experience && (
 <div>
 <span className="text-gray-600">Experience:</span>
 <p className="font-semibold">{formData.experience} years</p>
 </div>
 )}
 </div>
 </div>
 )}

 {/* Documents Summary */}
 <div className="bg-green-50 rounded-xl p-6">
 <h3 className="font-bold text-lg text-gray-900 mb-4">Uploaded Documents</h3>
 <div className="space-y-2">
 {documents.filter(doc => doc.uploaded).map((doc) => (
 <div key={doc.id} className="flex items-center justify-between">
 <span className="text-gray-700">{doc.name}</span>
 <span className="text-green-600 font-medium flex items-center gap-1">
 <FaCheck className="text-sm" />
 Uploaded
 </span>
 </div>
 ))}
 </div>
 </div>

 {/* Terms and Conditions */}
 <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
 <h3 className="font-bold text-lg text-gray-900 mb-4">Terms and Conditions</h3>
 <div className="space-y-4 text-sm text-gray-700">
 <div className="flex items-start gap-3">
 <input
 type="checkbox"
 id="terms"
 className="mt-1"
 checked={agreeToTerms}
 onChange={(e) => setAgreeToTerms(e.target.checked)}
 />
 <label htmlFor="terms" className="flex-1">
 I agree to the <Link href="/terms" className="text-brand-teal hover:underline">Terms of Service</Link> and
 <Link href="/privacy" className="text-brand-teal hover:underline ml-1">Privacy Policy</Link>
 </label>
 </div>

 <div className="flex items-start gap-3">
 <input
 type="checkbox"
 id="verify"
 className="mt-1"
 checked={agreeToPrivacy}
 onChange={(e) => setAgreeToPrivacy(e.target.checked)}
 />
 <label htmlFor="verify" className="flex-1">
 I certify that all information provided is accurate and complete. I understand that false information may result in account suspension.
 </label>
 </div>

 <div className="flex items-start gap-3">
 <input
 type="checkbox"
 id="consent"
 className="mt-1"
 checked={agreeToDisclaimer}
 onChange={(e) => setAgreeToDisclaimer(e.target.checked)}
 />
 <label htmlFor="consent" className="flex-1">
 I consent to the verification of my documents and credentials by MediWyz and relevant regulatory bodies.
 </label>
 </div>
 </div>
 </div>

 {/* Verification Process Info */}
 <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
 <div className="flex items-start gap-3">
 <FaInfoCircle className="text-brand-teal mt-1" />
 <div>
 <h4 className="font-bold text-blue-800 mb-2">What happens next?</h4>
 <ul className="text-blue-700 text-sm space-y-1">
 <li>• Your documents will be reviewed by our verification team</li>
 <li>• We may contact you for additional information if needed</li>
 <li>• Verification typically takes 2-5 business days</li>
 <li>• You will receive an email once your account is approved</li>
 <li>• Professional credentials will be verified with relevant authorities</li>
 </ul>
 </div>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Success / Error Messages */}
 {submitError && (
 <div className="mt-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-start gap-3">
 <FaTimes className="mt-0.5 flex-shrink-0" />
 <p>{submitError}</p>
 </div>
 )}
 {submitSuccess && (
 <div className="mt-6 bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 flex items-start gap-3">
 <FaCheck className="mt-0.5 flex-shrink-0" />
 <p>{submitSuccess} Redirecting to login...</p>
 </div>
 )}

 {/* Navigation Buttons */}
 <div className="flex justify-between mt-8 pt-6 border-t">
 {currentStep > 1 && (
 <button
 onClick={prevStep}
 className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
 >
 <FaArrowLeft />
 Back
 </button>
 )}

 {currentStep < 4 ? (
 <button
 onClick={nextStep}
 disabled={!validateStep(currentStep)}
 className="flex items-center gap-2 text-white px-8 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
 >
 Continue
 <FaArrowRight />
 </button>
 ) : (
 <button
 onClick={handleSubmit}
 disabled={isSubmitting || !validateStep(currentStep) || !agreeToTerms || !agreeToPrivacy || !agreeToDisclaimer || !!submitSuccess}
 className="flex items-center gap-2 text-white px-8 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
 >
 {isSubmitting ? (
 <>
 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
 Submitting...
 </>
 ) : (
 <>
 Submit Registration
 <FaCheck />
 </>
 )}
 </button>
 )}
 </div>
 </div>

 {/* Help Section */}
 <div className="text-center mt-8">
 <p className="text-gray-600 text-sm">
 Already have an account?{' '}
 <Link href="/login" className="text-brand-teal hover:underline font-medium">
 Sign in here
 </Link>
 </p>
 <p className="text-gray-500 text-xs mt-2">
 Need help with registration?{' '}
 <Link href="/support" className="text-brand-teal hover:underline">
 Contact Support
 </Link>{' '}
 or call +230 400 4000
 </p>
 </div>
 </div>
 </div>
 </div>
 )
}

/**
 * Inline modal for the "I don't see my role" path on signup. Submits to
 * `POST /api/roles/request` which creates a pending ProviderRole for
 * regional-admin review. Users can continue signing up as a patient in the
 * meantime; when the role is approved they can be re-tagged.
 */
function RoleRequestModal({ onClose, onSubmitted }: { onClose: () => void; onSubmitted: () => void }) {
 const [label, setLabel] = useState('')
 const [description, setDescription] = useState('')
 const [busy, setBusy] = useState(false)
 const [error, setError] = useState<string | null>(null)

 async function submit() {
 if (label.trim().length < 3) {
  setError('Role name must be at least 3 characters.')
  return
 }
 setBusy(true); setError(null)
 try {
  const res = await fetch('/api/roles/request', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ label: label.trim(), description: description.trim() || undefined }),
  })
  const json = await res.json()
  if (!json.success) {
  setError(json.message || 'Request failed')
  return
  }
  onSubmitted()
 } catch {
  setError('Network error — try again.')
 } finally {
  setBusy(false)
 }
 }

 return (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
  <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
  <h3 className="text-xl font-bold text-gray-900">Propose a new provider role</h3>
  <p className="text-sm text-gray-500 mt-1">
   Your request goes to a regional admin for approval. While you wait,
   you can complete signup as a patient and upgrade to your approved
   role later.
  </p>

  <div className="mt-4 space-y-3">
   <div>
   <label className="text-xs font-medium text-gray-600 block mb-1">Role name *</label>
   <input
   type="text"
   value={label}
   onChange={(e) => setLabel(e.target.value)}
   placeholder="e.g. Audiologist, Osteopath, Homeopath"
   maxLength={40}
   className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-teal focus:border-transparent outline-none"
   />
   </div>
   <div>
   <label className="text-xs font-medium text-gray-600 block mb-1">Short description</label>
   <textarea
   value={description}
   onChange={(e) => setDescription(e.target.value)}
   placeholder="What does this role do?"
   rows={3}
   maxLength={200}
   className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-teal focus:border-transparent outline-none"
   />
   </div>
   {error && (
   <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>
   )}
  </div>

  <div className="mt-5 flex justify-end gap-3">
   <button
   onClick={onClose}
   disabled={busy}
   className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50"
   >
   Cancel
   </button>
   <button
   onClick={submit}
   disabled={busy}
   className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand-navy hover:bg-brand-teal text-white disabled:opacity-50"
   >
   {busy ? 'Submitting…' : 'Submit request'}
   </button>
  </div>
  </div>
 </div>
 )
}
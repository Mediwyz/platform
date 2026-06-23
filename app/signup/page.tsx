'use client'

import { useState, FormEvent, ChangeEvent, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { userTypes, documentRequirements } from './constants'
import { SignupFormData } from './types'
import ProgressSteps from './ProgressSteps'
import AccountTypeStep from './AccountTypeStep'
import BasicInfoStep from './BasicInfoStep'
import NavigationButtons from './NavigationButtons'
import LegalModals from './LegalModals'
import WorkplaceStep from './WorkplaceStep'
import { captureReferralParams, getTrackingId, setTrackingId, clearReferralTracking } from '@/lib/referral-tracking'

// User types that are providers (not patients/members)
const MEMBER_TYPES = new Set(['patient', 'member', 'referral-partner'])

interface WorkplaceSelection {
 entityId: string
 entityName: string
 role: string
}

export default function RegistrationForm() {
 const [currentStep, setCurrentStep] = useState(1)
 // Sub-step: 'basic' = step 2 form, 'workplace' = workplace picker (providers only)
 const [subStep, setSubStep] = useState<'basic' | 'workplace'>('basic')
 const [selectedUserType, setSelectedUserType] = useState<string>('patient')
 const [showPassword, setShowPassword] = useState(false)
 const [showConfirmPassword, setShowConfirmPassword] = useState(false)
 const [isSubmitting, setIsSubmitting] = useState(false)
 const [submissionSuccess, setSubmissionSuccess] = useState(false)
 const [submissionError, setSubmissionError] = useState<string | null>(null)
 const [workplaceSelection, setWorkplaceSelection] = useState<WorkplaceSelection | null>(null)

 // Modal states
 const [disclaimerOpen, setDisclaimerOpen] = useState(false)
 const [termsOpen, setTermsOpen] = useState(false)
 const [privacyOpen, setPrivacyOpen] = useState(false)

 const router = useRouter()
 const searchParams = useSearchParams()

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
 regionId: '',
 profileImageUrl: '',
 referralCode: searchParams.get('promo') || '',
 emergencyContactName: '',
 emergencyContactPhone: '',
 emergencyContactRelation: '',
 agreeToTerms: false,
 agreeToPrivacy: false,
 agreeToDisclaimer: false
 })

 // Listen for custom events to open modals
 useEffect(() => {
 const handleOpenTerms = () => setTermsOpen(true)
 const handleOpenPrivacy = () => setPrivacyOpen(true)
 const handleOpenDisclaimer = () => setDisclaimerOpen(true)

 window.addEventListener('openTerms', handleOpenTerms)
 window.addEventListener('openPrivacy', handleOpenPrivacy)
 window.addEventListener('openDisclaimer', handleOpenDisclaimer)

 return () => {
 window.removeEventListener('openTerms', handleOpenTerms)
 window.removeEventListener('openPrivacy', handleOpenPrivacy)
 window.removeEventListener('openDisclaimer', handleOpenDisclaimer)
 }
 }, [])

 // Capture referral params from URL and record click
 useEffect(() => {
 const params = captureReferralParams()
 if (params?.promo) {
 fetch('/api/referral-tracking', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 referralCode: params.promo,
 utmSource: params.utm_source,
 utmMedium: params.utm_medium,
 utmCampaign: params.utm_campaign,
 location: params.location,
 landingPage: params.landing_page,
 }),
 })
 .then(res => res.json())
 .then(json => {
 if (json.success && json.data?.trackingId) {
 setTrackingId(json.data.trackingId)
 }
 })
 .catch(() => { /* silent */ })
 }
 }, [])

 const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
 const { name, value, type } = e.target
 if (type === 'checkbox') {
 const checked = (e.target as HTMLInputElement).checked
 setFormData(prev => ({
 ...prev,
 [name]: checked
 }))
 } else {
 setFormData(prev => ({
 ...prev,
 [name]: value
 }))
 }
 }

 const handleUserTypeChange = (userTypeId: string) => {
 setSelectedUserType(userTypeId)
 setFormData(prev => ({ ...prev, userType: userTypeId }))
 }

 const isProviderType = (userType: string) => !MEMBER_TYPES.has(userType)

 const validateStep = (step: number): boolean => {
 switch (step) {
 case 1:
 return selectedUserType !== ''
 case 2:
 // Base validation for all users
 const baseValid = !!(formData.fullName && formData.email && formData.password &&
 formData.confirmPassword && formData.phone && formData.dateOfBirth &&
 formData.gender && formData.address)

 if (!baseValid) return false

 // Agreement checkboxes must be checked
 if (!formData.agreeToTerms || !formData.agreeToPrivacy || !formData.agreeToDisclaimer) return false

 return true
 default:
 return true
 }
 }

 const nextStep = () => {
 if (!validateStep(currentStep)) return

 if (currentStep === 2) {
 // If provider  show workplace step before submitting
 if (isProviderType(selectedUserType) && subStep === 'basic') {
 setSubStep('workplace')
 return
 }
 // Otherwise (member, or already done workplace step)  go to step 3 (submit)
 setCurrentStep(3)
 handleSubmit(new Event('submit') as unknown as FormEvent)
 return
 }

 setCurrentStep(prev => Math.min(prev + 1, 3))
 }

 const prevStep = () => {
 if (currentStep === 2 && subStep === 'workplace') {
 // Go back to basic info within step 2
 setSubStep('basic')
 return
 }
 setCurrentStep(prev => Math.max(prev - 1, 1))
 }

 // Called from WorkplaceStep when user picks a workplace or skips
 const handleWorkplaceComplete = (selection: WorkplaceSelection | null) => {
 setWorkplaceSelection(selection)
 setCurrentStep(3)
 handleSubmitWithWorkplace(selection)
 }

 const handleSubmitWithWorkplace = async (workplace: WorkplaceSelection | null) => {
 setIsSubmitting(true)
 setSubmissionError(null)

 try {
 const requiredDocs = documentRequirements[formData.userType] || []
 const skippedDocuments = requiredDocs.filter(doc => doc.required).map(doc => doc.id)

 const response = await fetch('/api/auth/register', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 ...formData,
 profileImage: formData.profileImageUrl || undefined,
 documentUrls: [],
 documentVerifications: [],
 skippedDocuments,
 trackingId: getTrackingId() || undefined,
 }),
 })

 const result = await response.json()

 if (!response.ok || !result.success) {
 throw new Error(result.message || 'Registration failed')
 }

 clearReferralTracking()

 if (result.user) {
   localStorage.setItem('mediwyz_user', JSON.stringify(result.user))
 }

 // If user selected a workplace, link them (best-effort, non-blocking)
 if (workplace && result.user?.id) {
   fetch(`/api/providers/${result.user.id}/workplaces`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     credentials: 'include',
     body: JSON.stringify({
       healthcareEntityId: workplace.entityId,
       role: workplace.role || undefined,
       isPrimary: true,
     }),
   }).catch(() => { /* non-fatal */ })
 }

 setSubmissionSuccess(true)

 if (result.redirectPath) {
   router.push(result.redirectPath)
 } else {
   setTimeout(() => { router.push('/login?registration=success') }, 2000)
 }

 } catch (error) {
 console.error('Registration error:', error)
 const message = error instanceof Error ? error.message : 'Registration failed. Please try again later or contact support.'
 setSubmissionError(message)
 // Go back to step 2 / basic info so user can fix and retry
 setCurrentStep(2)
 setSubStep('basic')
 } finally {
 setIsSubmitting(false)
 }
 }

 const handleSubmit = async (e: FormEvent) => {
 e.preventDefault()
 await handleSubmitWithWorkplace(workplaceSelection)
 }

 const selectedType = userTypes.find(type => type.id === selectedUserType)

 return (
 <div className="min-h-screen via-white py-4 sm:py-8">
 <div className="container mx-auto px-3 sm:px-4">
 <div className="max-w-4xl mx-auto">
 {/* Header */}
 <div className="text-center mb-4 sm:mb-8">
 <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-fg mb-1 sm:mb-2">Join MediWyz</h1>
 <p className="text-soft text-sm sm:text-base md:text-lg">Create your healthcare account in under a minute</p>
 </div>

 {/* Progress Steps */}
 <ProgressSteps currentStep={currentStep} />

 {/* Step Content */}
 <div className="bg-surface rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8">
 {/* Success Display */}
 {submissionSuccess && (
 <div className="text-center py-12">
 <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
 <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
 </svg>
 </div>
 <h2 className="text-3xl font-bold text-green-600 mb-4">Account Created Successfully!</h2>
 <div className="max-w-md mx-auto">
 <p className="text-soft mb-4">
 Your account has been created. You can log in immediately.
 </p>
 {formData.userType !== 'patient' && (
 <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
 <p className="text-amber-800 text-sm">
 To unlock all features, please upload your required documents from your account settings after logging in.
 </p>
 </div>
 )}
 {workplaceSelection && (
 <div className="bg-[#9AE1FF]/20 border border-[#9AE1FF]/40 rounded-lg p-4 mb-4">
 <p className="text-fg text-sm">
 Your workplace link to <strong>{workplaceSelection.entityName}</strong> is pending admin approval.
 </p>
 </div>
 )}
 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
 <p className="text-blue-800 text-sm">
 Taking you to your dashboard...
 </p>
 </div>
 <div className="mt-4">
 <div className="flex justify-center">
 <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Regular Form Steps */}
 {!submissionSuccess && (
 <>
 {/* Step 1: Account Type Selection */}
 {currentStep === 1 && (
 <AccountTypeStep
 selectedUserType={selectedUserType}
 onUserTypeChange={handleUserTypeChange}
 />
 )}

 {/* Step 2: Basic Information + Agreement */}
 {currentStep === 2 && subStep === 'basic' && (
 <BasicInfoStep
 formData={formData}
 selectedType={selectedType}
 showPassword={showPassword}
 showConfirmPassword={showConfirmPassword}
 onFormChange={handleChange}
 onPasswordToggle={() => setShowPassword(!showPassword)}
 onConfirmPasswordToggle={() => setShowConfirmPassword(!showConfirmPassword)}
 onProfileImageChange={(url) => setFormData(prev => ({ ...prev, profileImageUrl: url }))}
 />
 )}

 {/* Step 2 (provider sub-step): Workplace selection */}
 {currentStep === 2 && subStep === 'workplace' && (
 <WorkplaceStep
 onContinue={handleWorkplaceComplete}
 onSkip={() => handleWorkplaceComplete(null)}
 />
 )}

 {/* Step 3: Creating Account (auto-submit in progress) */}
 {currentStep === 3 && !submissionError && (
 <div className="text-center py-12">
 <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
 <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
 </div>
 <h2 className="text-2xl font-bold text-fg mb-2">Creating Your Account...</h2>
 <p className="text-soft">Please wait while we set up your account.</p>
 </div>
 )}

 {/* Inline submission error */}
 {submissionError && (
 <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
 <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
 </svg>
 <div className="flex-1">
 <p className="text-red-700 text-sm font-medium">Registration failed</p>
 <p className="text-red-600 text-sm mt-0.5">{submissionError}</p>
 </div>
 <button
 type="button"
 onClick={() => setSubmissionError(null)}
 className="text-red-400 hover:text-red-600 text-lg leading-none flex-shrink-0"
 aria-label="Dismiss error"
 >
 &times;
 </button>
 </div>
 )}

 {/* Navigation Buttons - only on step 1 and step 2 basic info */}
 {currentStep <= 2 && subStep === 'basic' && (
 <NavigationButtons
 currentStep={currentStep}
 isSubmitting={isSubmitting}
 canProceed={validateStep(currentStep)}
 onPrevious={prevStep}
 onNext={nextStep}
 onSubmit={handleSubmit}
 />
 )}
 </>
 )}
 </div>

 {/* Help Section */}
 {!submissionSuccess && (
 <>
 <div className="text-center mt-8">
 <p className="text-soft text-sm">
 Already have an account?{' '}
 <Link href="/login" className="text-brand-teal hover:underline font-medium">
 Sign in here
 </Link>
 </p>
 <p className="text-soft text-xs mt-2">
 Need help with registration?{' '}
 <Link href="/support" className="text-brand-teal hover:underline">
 Contact Support
 </Link>{' '}
 or call +230 400 4000
 </p>
 </div>

 {/* Legal Information Preview Buttons */}
 <div className="mt-6 text-center">
 <p className="text-soft text-sm mb-3">Review our legal documents before registration:</p>
 <div className="flex justify-center gap-4 flex-wrap">
 <button
 type="button"
 onClick={() => setDisclaimerOpen(true)}
 className="text-red-600 hover:text-red-800 text-sm font-medium underline"
 >
 Medical Disclaimer
 </button>
 <button
 type="button"
 onClick={() => setTermsOpen(true)}
 className="text-brand-teal hover:text-blue-800 text-sm font-medium underline"
 >
 Terms of Service
 </button>
 <button
 type="button"
 onClick={() => setPrivacyOpen(true)}
 className="text-green-600 hover:text-green-800 text-sm font-medium underline"
 >
 Privacy Policy
 </button>
 </div>
 </div>
 </>
 )}
 </div>
 </div>

 {/* Legal Modals */}
 <LegalModals
 disclaimerOpen={disclaimerOpen}
 termsOpen={termsOpen}
 privacyOpen={privacyOpen}
 onCloseDisclaimer={() => setDisclaimerOpen(false)}
 onCloseTerms={() => setTermsOpen(false)}
 onClosePrivacy={() => setPrivacyOpen(false)}
 />
 </div>
 )
}

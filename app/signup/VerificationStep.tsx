import Link from 'next/link'
import { FaCheck, FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaSpinner, FaClock } from 'react-icons/fa'
import { SignupFormData, UserType, Document } from './types'
import type { DocumentVerificationStatus } from './hooks/useDocumentVerification'

interface VerificationStepProps {
 formData: SignupFormData;
 selectedType: UserType | undefined;
 documents: Document[];
 verificationResults?: Record<string, DocumentVerificationStatus>;
 onFormChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function VerificationStep({ formData, selectedType, documents, verificationResults = {}, onFormChange }: VerificationStepProps) {
 const verifiedCount = Object.values(verificationResults).filter(v => v.status === 'verified').length
 const failedCount = Object.values(verificationResults).filter(v => v.status === 'failed').length
 const errorCount = Object.values(verificationResults).filter(v => v.status === 'error').length
 const verifyingCount = Object.values(verificationResults).filter(v => v.status === 'verifying').length
 const allVerified = documents.filter(d => d.required && d.uploaded).length > 0 &&
 documents.filter(d => d.required && d.uploaded).every(d => verificationResults[d.id]?.status === 'verified')
 const requiresManualApproval = ['corporate', 'regional-admin'].includes(formData.userType)
 return (
 <div>
 <div className="text-center mb-8">
 <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
 <FaCheck className="text-green-600 text-3xl" />
 </div>
 <h2 className="text-3xl font-bold text-fg mb-2">Review & Submit</h2>
 <p className="text-soft">Please review your information before submitting your registration</p>
 </div>

 {/* Summary */}
 <div className="space-y-6">
 {/* Account Type */}
 <div className="bg-subtle rounded-xl p-6">
 <h3 className="font-bold text-lg text-fg mb-4">Account Information</h3>
 <div className="grid md:grid-cols-2 gap-4">
 <div>
 <span className="text-soft">Account Type:</span>
 <p className="font-semibold">{selectedType?.label}</p>
 </div>
 <div>
 <span className="text-soft">Full Name:</span>
 <p className="font-semibold">{formData.fullName}</p>
 </div>
 <div>
 <span className="text-soft">Email:</span>
 <p className="font-semibold">{formData.email}</p>
 </div>
 <div>
 <span className="text-soft">Phone:</span>
 <p className="font-semibold">{formData.phone}</p>
 </div>
 </div>
 </div>

 {/* Professional Info (if applicable) */}
 {formData.userType !== 'patient' && (formData.licenseNumber || formData.specialization) && (
 <div className="bg-blue-50 rounded-xl p-6">
 <h3 className="font-bold text-lg text-fg mb-4">Professional Information</h3>
 <div className="grid md:grid-cols-2 gap-4">
 {formData.licenseNumber && (
 <div>
 <span className="text-soft">License Number:</span>
 <p className="font-semibold">{formData.licenseNumber}</p>
 </div>
 )}
 {formData.specialization && (
 <div>
 <span className="text-soft">Specialization:</span>
 <p className="font-semibold">{formData.specialization}</p>
 </div>
 )}
 {formData.institution && (
 <div>
 <span className="text-soft">Institution:</span>
 <p className="font-semibold">{formData.institution}</p>
 </div>
 )}
 {formData.experience && (
 <div>
 <span className="text-soft">Experience:</span>
 <p className="font-semibold">{formData.experience} years</p>
 </div>
 )}
 </div>
 </div>
 )}

 {/* Documents Summary with Verification */}
 <div className="bg-green-50 rounded-xl p-6">
 <h3 className="font-bold text-lg text-fg mb-4">Document Verification</h3>
 {/* Overall status */}
 {verifyingCount > 0 && (
 <div className="flex items-center gap-2 text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm">
 <FaSpinner className="animate-spin" />
 <span>Verifying {verifyingCount} document{verifyingCount > 1 ? 's' : ''}...</span>
 </div>
 )}
 {allVerified && !requiresManualApproval && verifyingCount === 0 && documents.filter(d => d.skipped).length === 0 && (
 <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4 text-sm">
 <FaCheckCircle />
 <span>All required documents verified - your account will be activated immediately!</span>
 </div>
 )}
 {(failedCount > 0 || errorCount > 0) && verifyingCount === 0 && (
 <div className="flex items-center gap-2 text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm">
 <FaExclamationTriangle />
 <span>Some documents could not be verified automatically and will require manual review.</span>
 </div>
 )}
 {documents.filter(d => d.skipped).length > 0 && (
 <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm">
 <FaClock />
 <span>
 {documents.filter(d => d.skipped).length} document{documents.filter(d => d.skipped).length > 1 ? 's' : ''} deferred.
 Your account will be in pending status until all required documents are provided.
 </span>
 </div>
 )}
 <div className="space-y-3">
 {documents.filter(doc => doc.uploaded).map((doc) => {
 const vr = verificationResults[doc.id]
 return (
 <div key={doc.id} className="flex items-center justify-between">
 <span className="text-soft">{doc.name}</span>
 <span className={`font-medium flex items-center gap-1 text-sm ${
 !vr ? 'text-green-600' :
 vr.status === 'verified' ? 'text-emerald-600' :
 vr.status === 'verifying' ? 'text-blue-600' :
 vr.status === 'failed' ? 'text-yellow-600' :
 'text-red-600'
 }`}>
 {!vr && <><FaCheck className="text-sm" /> Uploaded</>}
 {vr?.status === 'verified' && <><FaCheckCircle className="text-sm" /> Verified ({vr.confidence}%)</>}
 {vr?.status === 'verifying' && <><FaSpinner className="text-sm animate-spin" /> Verifying...</>}
 {vr?.status === 'failed' && <><FaExclamationTriangle className="text-sm" /> Manual review</>}
 {vr?.status === 'error' && <><FaTimesCircle className="text-sm" /> Check failed</>}
 </span>
 </div>
 )
 })}
 {/* Show skipped/deferred documents */}
 {documents.filter(doc => doc.skipped).map((doc) => (
 <div key={doc.id} className="flex items-center justify-between">
 <span className="text-faint">{doc.name}</span>
 <span className="font-medium flex items-center gap-1 text-sm text-amber-500">
 <FaClock className="text-sm" /> Provide later
 </span>
 </div>
 ))}
 </div>
 {/* Counts */}
 <div className="mt-4 pt-4 border-t border-green-200 flex gap-4 text-xs text-soft">
 <span>Verified: {verifiedCount}</span>
 <span>Manual review: {failedCount + errorCount}</span>
 <span>Total uploaded: {documents.filter(d => d.uploaded).length}</span>
 {documents.filter(d => d.skipped).length > 0 && (
 <span className="text-amber-600">Deferred: {documents.filter(d => d.skipped).length}</span>
 )}
 </div>
 </div>

 {/* Terms and Conditions */}
 <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
 <h3 className="font-bold text-lg text-fg mb-4">Terms and Conditions</h3>
 <div className="space-y-4 text-sm text-soft">
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

 {/* Verification Process Info */}
 <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
 <div className="flex items-start gap-3">
 <FaInfoCircle className="text-blue-600 mt-1" />
 <div>
 <h4 className="font-bold text-blue-800 mb-2">What happens next?</h4>
 {documents.filter(d => d.skipped).length > 0 ? (
 <ul className="text-blue-700 text-sm space-y-1">
 <li>• Your account will be created with pending status</li>
 <li>• You can upload deferred documents from your account settings</li>
 <li>• Your account will be fully activated once all required documents are provided and verified</li>
 <li>• You will receive a confirmation email with instructions</li>
 </ul>
 ) : allVerified && !requiresManualApproval ? (
 <ul className="text-blue-700 text-sm space-y-1">
 <li>• All your documents have been verified automatically</li>
 <li>• Your account will be activated immediately upon submission</li>
 <li>• You will receive a confirmation email shortly</li>
 <li>• You can start using MediWyz right away</li>
 </ul>
 ) : requiresManualApproval ? (
 <ul className="text-blue-700 text-sm space-y-1">
 <li>• Your account type requires administrator approval</li>
 <li>• Your documents and application will be reviewed within 2-5 business days</li>
 <li>• You will receive an email once your account is approved</li>
 <li>• We may contact you for additional information if needed</li>
 </ul>
 ) : (
 <ul className="text-blue-700 text-sm space-y-1">
 <li>• Some documents require manual verification by our team</li>
 <li>• Verification typically takes 2-5 business days</li>
 <li>• You will receive an email once your account is approved</li>
 <li>• Professional credentials will be verified with relevant authorities</li>
 </ul>
 )}
 </div>
 </div>
 </div>
 </div>
 </div>
 )
}
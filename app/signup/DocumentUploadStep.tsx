import { FaUpload, FaCheck, FaFileAlt, FaTimes, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaClock, FaRobot } from 'react-icons/fa'
import { Document } from './types'
import type { DocumentVerificationStatus } from './hooks/useDocumentVerification'

interface DocumentUploadStepProps {
 documents: Document[];
 onFileUpload: (documentId: string, file: File) => void;
 onRemoveFile: (documentId: string) => void;
 onSkipDocument: (documentId: string, skipped: boolean) => void;
 verificationResults?: Record<string, DocumentVerificationStatus>;
}

export default function DocumentUploadStep({ documents, onFileUpload, onRemoveFile, onSkipDocument, verificationResults = {} }: DocumentUploadStepProps) {
 return (
 <div>
 <div className="flex items-center gap-4 mb-6">
 <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center">
 <FaUpload className="text-3xl" />
 </div>
 <div>
 <h2 className="text-2xl font-bold text-fg">Document Upload</h2>
 <p className="text-soft">Please upload the required documents for verification</p>
 </div>
 </div>

 <div className="space-y-6">
 {documents.map((doc) => (
 <div key={doc.id} className={`border-2 rounded-xl p-6 transition-colors ${
 doc.skipped
 ? 'border-line bg-subtle/50'
 : doc.required
 ? 'border-red-200'
 : 'border-line'
 }`}>
 <div className="flex items-start justify-between mb-4">
 <div className="flex-1">
 <div className="flex items-center gap-3 mb-2">
 <h3 className={`font-bold text-lg ${doc.skipped ? 'text-faint' : 'text-fg'}`}>{doc.name}</h3>
 {doc.required && !doc.skipped && (
 <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium">
 Required
 </span>
 )}
 {doc.skipped && (
 <span className="bg-amber-50 text-amber-600 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
 <FaClock className="text-xs" />
 Deferred
 </span>
 )}
 {doc.uploaded && !doc.skipped && (
 <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
 <FaCheck className="text-xs" />
 Uploaded
 </span>
 )}
 </div>
 <p className={`text-sm mb-2 ${doc.skipped ? 'text-faint' : 'text-soft'}`}>{doc.description}</p>
 <p className={`text-xs ${doc.skipped ? 'text-faint' : 'text-soft'}`}>Accepted formats: {doc.accepted}</p>
 </div>
 </div>

 {/* "I'll provide this later" option for required documents */}
 {doc.required && (
 <label className="flex items-center gap-2 mb-4 cursor-pointer group select-none">
 <input
 type="checkbox"
 checked={doc.skipped || false}
 onChange={(e) => onSkipDocument(doc.id, e.target.checked)}
 className="w-3.5 h-3.5 rounded border-line text-amber-500 focus:ring-amber-400 focus:ring-offset-0 cursor-pointer"
 />
 <span className="text-xs text-faint group-hover:text-soft transition-colors">
 I&apos;ll provide this later
 </span>
 </label>
 )}

 {doc.skipped ? (
 <div className="border border-dashed border-line rounded-lg p-4 text-center">
 <p className="text-faint text-sm">
 You can upload this document from your account settings after registration.
 </p>
 </div>
 ) : doc.uploaded && doc.file ? (
 <div>
 <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
 <div className="flex items-center gap-3">
 <FaFileAlt className="text-green-600" />
 <div>
 <p className="font-medium text-green-800">{doc.file.name}</p>
 <p className="text-green-600 text-sm">{(doc.file.size / 1024 / 1024).toFixed(2)} MB</p>
 </div>
 </div>
 <button
 onClick={() => onRemoveFile(doc.id)}
 className="text-red-600 hover:text-red-800 p-2"
 >
 <FaTimes />
 </button>
 </div>
 {/* Document Verification Status */}
 {verificationResults[doc.id] && (
 <div className="mt-3 space-y-2">
 {/* Status badge */}
 <div className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg ${
 verificationResults[doc.id].status === 'verifying'
 ? 'bg-blue-50 text-blue-700'
 : verificationResults[doc.id].status === 'verified'
 ? 'bg-emerald-50 text-emerald-700'
 : verificationResults[doc.id].status === 'failed'
 ? 'bg-yellow-50 text-yellow-700'
 : 'bg-red-50 text-red-700'
 }`}>
 {verificationResults[doc.id].status === 'verifying' && (
 <FaSpinner className="animate-spin" />
 )}
 {verificationResults[doc.id].status === 'verified' && (
 <FaCheckCircle />
 )}
 {verificationResults[doc.id].status === 'failed' && (
 <FaExclamationTriangle />
 )}
 {verificationResults[doc.id].status === 'error' && (
 <FaTimes />
 )}
 <span>{verificationResults[doc.id].message}</span>
 </div>

 {/* AI Analysis Report */}
 {verificationResults[doc.id].status !== 'verifying' && verificationResults[doc.id].analysisReport && (
 <div className={`rounded-lg border p-4 ${
 verificationResults[doc.id].status === 'verified'
 ? 'bg-emerald-50/50 border-emerald-200'
 : verificationResults[doc.id].status === 'failed'
 ? 'bg-amber-50/50 border-amber-200'
 : 'bg-subtle border-line'
 }`}>
 <div className="flex items-center gap-2 mb-2">
 <FaRobot className={`text-sm ${
 verificationResults[doc.id].status === 'verified' ? 'text-emerald-600' : 'text-amber-600'
 }`} />
 <span className={`text-xs font-semibold uppercase tracking-wide ${
 verificationResults[doc.id].status === 'verified' ? 'text-emerald-700' : 'text-amber-700'
 }`}>
 AI Automated Analysis
 </span>
 <span className="text-xs text-faint ml-auto">
 Powered by MediWyz AI
 </span>
 </div>
 <p className={`text-sm leading-relaxed ${
 verificationResults[doc.id].status === 'verified' ? 'text-emerald-800' : 'text-amber-800'
 }`}>
 {verificationResults[doc.id].analysisReport}
 </p>
 <p className="text-[10px] text-faint mt-2 italic">
 This analysis was performed automatically by AI. No human has reviewed this document yet.
 </p>
 </div>
 )}

 {/* Scanning animation */}
 {verificationResults[doc.id].status === 'verifying' && (
 <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
 <div className="flex items-center gap-2 mb-2">
 <FaRobot className="text-sm text-blue-600 animate-pulse" />
 <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">
 AI Scanning in Progress
 </span>
 </div>
 <p className="text-sm text-blue-700">
 Our AI is analyzing your document, extracting text, and verifying it against your registration information. This usually takes a few seconds...
 </p>
 </div>
 )}
 </div>
 )}
 </div>
 ) : (
 <div className="border-2 border-dashed border-line rounded-lg p-8 text-center">
 <FaUpload className="text-4xl text-faint mx-auto mb-4" />
 <p className="text-soft mb-4">Drag and drop your file here, or click to browse</p>
 <input
 type="file"
 accept={doc.accepted}
 onChange={(e) => {
 const file = e.target.files?.[0]
 if (file) onFileUpload(doc.id, file)
 }}
 className="hidden"
 id={`file-${doc.id}`}
 />
 <label
 htmlFor={`file-${doc.id}`}
 className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 cursor-pointer inline-block"
 >
 Choose File
 </label>
 </div>
 )}
 </div>
 ))}
 </div>

 {/* Upload Progress Summary */}
 <div className="mt-8 bg-subtle rounded-xl p-6">
 <h3 className="font-bold text-fg mb-4">Upload Progress</h3>
 <div className="grid md:grid-cols-3 gap-4 text-sm">
 <div>
 <span className="text-soft">Required Documents:</span>
 <span className="font-medium ml-2">
 {documents.filter(doc => doc.required && doc.uploaded && !doc.skipped).length} / {documents.filter(doc => doc.required).length}
 </span>
 </div>
 <div>
 <span className="text-soft">Optional Documents:</span>
 <span className="font-medium ml-2">
 {documents.filter(doc => !doc.required && doc.uploaded).length} / {documents.filter(doc => !doc.required).length}
 </span>
 </div>
 {documents.some(doc => doc.skipped) && (
 <div>
 <span className="text-amber-600">Deferred:</span>
 <span className="font-medium text-amber-600 ml-2">
 {documents.filter(doc => doc.skipped).length}
 </span>
 </div>
 )}
 </div>

 <div className="mt-4">
 <div className="flex justify-between text-sm mb-2">
 <span className="text-soft">Required Documents Progress</span>
 <span className="font-medium">
 {Math.round(
 (documents.filter(doc => doc.required && (doc.uploaded || doc.skipped)).length /
 Math.max(documents.filter(doc => doc.required).length, 1)) * 100
 )}%
 </span>
 </div>
 <div className="w-full bg-line rounded-full h-2">
 <div
 className="bg-blue-600 h-2 rounded-full transition-all"
 style={{
 width: `${(documents.filter(doc => doc.required && (doc.uploaded || doc.skipped)).length / Math.max(documents.filter(doc => doc.required).length, 1)) * 100}%`
 }}
 />
 </div>
 </div>

 {/* Info about deferred documents */}
 {documents.some(doc => doc.skipped) && (
 <div className="mt-4 flex items-start gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg p-3">
 <FaClock className="mt-0.5 flex-shrink-0" />
 <span>
 Deferred documents can be uploaded from your account settings after registration.
 Your account will remain in pending status until all required documents are provided.
 </span>
 </div>
 )}
 </div>
 </div>
 )
}
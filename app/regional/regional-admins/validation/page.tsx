// app/regional/regional-admins/validation/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
 FaCheckCircle, FaTimesCircle, FaClock, FaFileAlt, 
 FaUserCheck, FaExclamationTriangle, FaDownload,
 FaStar, FaChartBar, FaMoneyBillWave, FaGavel
} from 'react-icons/fa'

interface ValidationRequest {
 id: string
 applicant: {
 name: string
 email: string
 phone: string
 company: string
 targetRegion: string
 targetCountry: string
 }
 submittedDate: string
 stages: {
 backgroundCheck: ValidationStage
 businessPlan: ValidationStage
 financialAssessment: ValidationStage
 marketResearch: ValidationStage
 legalCompliance: ValidationStage
 references: ValidationStage
 }
 overallScore: number
 risk: 'low' | 'medium' | 'high'
 status: 'pending' | 'in_review' | 'approved' | 'rejected'
}

interface ValidationStage {
 status: 'pending' | 'passed' | 'failed' | 'in_review'
 score: number
 maxScore: number
 notes: string
 reviewer?: string
 reviewDate?: string
}

export default function ValidationPage() {
 const [requests] = useState<ValidationRequest[]>([
 {
 id: 'VAL001',
 applicant: {
 name: 'Ahmed Hassan',
 email: 'ahmed.hassan@healthtech.ng',
 phone: '+234 803 123 4567',
 company: 'HealthTech Nigeria Ltd',
 targetRegion: 'Nigeria',
 targetCountry: 'NG'
 },
 submittedDate: '2025-08-15',
 stages: {
 backgroundCheck: { status: 'passed', score: 95, maxScore: 100, notes: 'Clean record, verified credentials' },
 businessPlan: { status: 'passed', score: 88, maxScore: 100, notes: 'Strong market analysis and growth strategy' },
 financialAssessment: { status: 'in_review', score: 0, maxScore: 100, notes: 'Reviewing financial statements' },
 marketResearch: { status: 'passed', score: 92, maxScore: 100, notes: 'Excellent understanding of local market' },
 legalCompliance: { status: 'pending', score: 0, maxScore: 100, notes: 'Awaiting legal clearance documents' },
 references: { status: 'passed', score: 90, maxScore: 100, notes: 'Strong professional references' }
 },
 overallScore: 73,
 risk: 'medium',
 status: 'in_review'
 },
 {
 id: 'VAL002',
 applicant: {
 name: 'Thandiwe Ndlovu',
 email: 'thandiwe@medconnect.za',
 phone: '+27 11 234 5678',
 company: 'MedConnect South Africa',
 targetRegion: 'South Africa',
 targetCountry: 'ZA'
 },
 submittedDate: '2025-08-18',
 stages: {
 backgroundCheck: { status: 'passed', score: 98, maxScore: 100, notes: 'Excellent background' },
 businessPlan: { status: 'passed', score: 94, maxScore: 100, notes: 'Innovative approach to healthcare delivery' },
 financialAssessment: { status: 'passed', score: 91, maxScore: 100, notes: 'Strong financial backing' },
 marketResearch: { status: 'passed', score: 89, maxScore: 100, notes: 'Good market penetration strategy' },
 legalCompliance: { status: 'passed', score: 100, maxScore: 100, notes: 'All legal requirements met' },
 references: { status: 'passed', score: 95, maxScore: 100, notes: 'Outstanding references from industry leaders' }
 },
 overallScore: 94,
 risk: 'low',
 status: 'pending'
 }
 ])

 const [selectedRequest, setSelectedRequest] = useState<ValidationRequest | null>(null)
 const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'scoring' | 'decision'>('overview')

 const getStageIcon = (stage: string) => {
 const icons = {
 backgroundCheck: FaUserCheck,
 businessPlan: FaFileAlt,
 financialAssessment: FaMoneyBillWave,
 marketResearch: FaChartBar,
 legalCompliance: FaGavel,
 references: FaStar
 }
 return icons[stage as keyof typeof icons] || FaFileAlt
 }

 const getStageColor = (status: string) => {
 switch (status) {
 case 'passed': return 'text-green-500 bg-green-50'
 case 'failed': return 'text-red-500 bg-red-50'
 case 'in_review': return 'text-yellow-500 bg-yellow-50'
 case 'pending': return 'text-soft bg-subtle'
 default: return 'text-soft bg-subtle'
 }
 }

 const getRiskBadge = (risk: string) => {
 switch (risk) {
 case 'low': return 'bg-green-100 text-green-800'
 case 'medium': return 'bg-yellow-100 text-yellow-800'
 case 'high': return 'bg-red-100 text-red-800'
 default: return 'bg-subtle text-fg'
 }
 }

 return (
 <div className="min-h-screen bg-subtle">
 {/* Header */}
 <div className="bg-surface border-b">
 <div className="container mx-auto px-6 py-4">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold text-fg">Regional Admin Validation</h1>
 <p className="text-soft mt-1">Multi-stage verification process for new administrators</p>
 </div>
 <Link 
 href="/regional/regional-admins"
 className="px-4 py-2 border rounded-lg hover:bg-subtle"
 >
 Back to Admins
 </Link>
 </div>
 </div>
 </div>

 <div className="container mx-auto px-6 py-6">
 {/* Validation Requests */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Requests List */}
 <div className="lg:col-span-1">
 <div className="bg-surface rounded-xl shadow-lg p-6">
 <h2 className="text-lg font-semibold mb-4">Pending Validations</h2>
 <div className="space-y-3">
 {requests.map(request => (
 <button
 key={request.id}
 onClick={() => setSelectedRequest(request)}
 className={`w-full text-left p-4 rounded-lg border-2 transition ${
 selectedRequest?.id === request.id 
 ? 'border-blue-500 bg-blue-50' 
 : 'border-line hover:border-line'
 }`}
 >
 <div className="flex items-center justify-between mb-2">
 <span className="font-medium">{request.applicant.name}</span>
 <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskBadge(request.risk)}`}>
 {request.risk} risk
 </span>
 </div>
 <p className="text-sm text-soft">{request.applicant.targetRegion}</p>
 <div className="mt-2 flex items-center justify-between">
 <span className="text-xs text-soft">{request.submittedDate}</span>
 <div className="flex items-center gap-1">
 <div className="w-20 h-2 bg-line rounded-full overflow-hidden">
 <div 
 className="h-full bg-blue-500 transition-all"
 style={{ width: `${request.overallScore}%` }}
 ></div>
 </div>
 <span className="text-xs font-medium">{request.overallScore}%</span>
 </div>
 </div>
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* Selected Request Details */}
 {selectedRequest && (
 <div className="lg:col-span-2">
 <div className="bg-surface rounded-xl shadow-lg">
 {/* Tabs */}
 <div className="border-b">
 <div className="flex">
 {(['overview', 'documents', 'scoring', 'decision'] as const).map(tab => (
 <button
 key={tab}
 onClick={() => setActiveTab(tab)}
 className={`px-6 py-3 font-medium capitalize transition ${
 activeTab === tab 
 ? 'border-b-2 border-blue-500 text-blue-600' 
 : 'text-soft hover:text-fg'
 }`}
 >
 {tab}
 </button>
 ))}
 </div>
 </div>

 <div className="p-6">
 {/* Overview Tab */}
 {activeTab === 'overview' && (
 <div>
 <h3 className="text-lg font-semibold mb-4">Application Overview</h3>
 
 {/* Applicant Info */}
 <div className="mb-6 p-4 bg-subtle rounded-lg">
 <h4 className="font-medium mb-3">Applicant Information</h4>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <p className="text-sm text-soft">Name</p>
 <p className="font-medium">{selectedRequest.applicant.name}</p>
 </div>
 <div>
 <p className="text-sm text-soft">Email</p>
 <p className="font-medium">{selectedRequest.applicant.email}</p>
 </div>
 <div>
 <p className="text-sm text-soft">Company</p>
 <p className="font-medium">{selectedRequest.applicant.company}</p>
 </div>
 <div>
 <p className="text-sm text-soft">Target Region</p>
 <p className="font-medium">{selectedRequest.applicant.targetRegion}</p>
 </div>
 </div>
 </div>

 {/* Validation Stages */}
 <h4 className="font-medium mb-3">Validation Progress</h4>
 <div className="space-y-3">
 {Object.entries(selectedRequest.stages).map(([key, stage]) => {
 const Icon = getStageIcon(key)
 return (
 <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
 <div className="flex items-center gap-3">
 <div className={`p-2 rounded-lg ${getStageColor(stage.status)}`}>
 <Icon className="text-xl" />
 </div>
 <div>
 <p className="font-medium capitalize">
 {key.replace(/([A-Z])/g, ' $1').trim()}
 </p>
 <p className="text-sm text-soft">{stage.notes}</p>
 </div>
 </div>
 <div className="text-right">
 <div className="flex items-center gap-2">
 {stage.status === 'passed' && <FaCheckCircle className="text-green-500" />}
 {stage.status === 'failed' && <FaTimesCircle className="text-red-500" />}
 {stage.status === 'in_review' && <FaClock className="text-yellow-500" />}
 {stage.status === 'pending' && <FaClock className="text-faint" />}
 <span className="font-medium">
 {stage.score}/{stage.maxScore}
 </span>
 </div>
 </div>
 </div>
 )
 })}
 </div>
 </div>
 )}

 {/* Documents Tab */}
 {activeTab === 'documents' && (
 <div>
 <h3 className="text-lg font-semibold mb-4">Submitted Documents</h3>
 <div className="space-y-3">
 {[
 { name: 'Business Plan', status: 'verified', size: '2.4 MB', type: 'PDF' },
 { name: 'Financial Statements', status: 'verified', size: '1.8 MB', type: 'PDF' },
 { name: 'Market Research Report', status: 'verified', size: '3.2 MB', type: 'PDF' },
 { name: 'Legal Clearance Certificate', status: 'pending', size: '856 KB', type: 'PDF' },
 { name: 'Professional References', status: 'verified', size: '1.2 MB', type: 'PDF' }
 ].map((doc, idx) => (
 <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
 <div className="flex items-center gap-3">
 <FaFileAlt className="text-2xl text-faint" />
 <div>
 <p className="font-medium">{doc.name}</p>
 <p className="text-sm text-soft">{doc.type} • {doc.size}</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <span className={`px-2 py-1 rounded text-xs font-medium ${
 doc.status === 'verified' 
 ? 'bg-green-100 text-green-800' 
 : 'bg-yellow-100 text-yellow-800'
 }`}>
 {doc.status}
 </span>
 <button className="p-2 hover:bg-subtle rounded">
 <FaDownload className="text-soft" />
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Scoring Tab */}
 {activeTab === 'scoring' && (
 <div>
 <h3 className="text-lg font-semibold mb-4">Evaluation Scoring</h3>
 
 {/* Overall Score */}
 <div className="mb-6 p-6 bg-brand-navy rounded-xl text-white">
 <p className="text-blue-100 mb-2">Overall Assessment Score</p>
 <div className="flex items-end gap-4">
 <span className="text-5xl font-bold">{selectedRequest.overallScore}%</span>
 <span className={`px-3 py-1 rounded-full text-sm font-medium bg-white/20`}>
 {selectedRequest.risk} risk
 </span>
 </div>
 <div className="mt-4 w-full h-3 bg-white/20 rounded-full overflow-hidden">
 <div 
 className="h-full bg-surface transition-all"
 style={{ width: `${selectedRequest.overallScore}%` }}
 ></div>
 </div>
 </div>

 {/* Detailed Scoring */}
 <div className="space-y-4">
 {Object.entries(selectedRequest.stages).map(([key, stage]) => (
 <div key={key} className="p-4 border rounded-lg">
 <div className="flex items-center justify-between mb-2">
 <p className="font-medium capitalize">
 {key.replace(/([A-Z])/g, ' $1').trim()}
 </p>
 <span className="font-bold text-lg">
 {stage.score}/{stage.maxScore}
 </span>
 </div>
 <div className="w-full h-2 bg-line rounded-full overflow-hidden">
 <div 
 className={`h-full transition-all ${
 stage.score >= 80 ? 'bg-green-500' :
 stage.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
 }`}
 style={{ width: `${(stage.score / stage.maxScore) * 100}%` }}
 ></div>
 </div>
 <p className="text-sm text-soft mt-2">{stage.notes}</p>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Decision Tab */}
 {activeTab === 'decision' && (
 <div>
 <h3 className="text-lg font-semibold mb-4">Final Decision</h3>
 
 <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
 <div className="flex items-start gap-3">
 <FaExclamationTriangle className="text-yellow-600 mt-1" />
 <div>
 <p className="font-medium text-yellow-900">Pending Decision</p>
 <p className="text-sm text-yellow-700 mt-1">
 This application requires final approval. Review all validation stages before making a decision.
 </p>
 </div>
 </div>
 </div>

 <div className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-soft mb-2">
 Decision Notes
 </label>
 <textarea
 className="w-full px-3 py-2 border rounded-lg resize-none"
 rows={4}
 placeholder="Enter your notes and reasoning for the decision..."
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-soft mb-2">
 Commission Structure
 </label>
 <input
 type="text"
 className="w-full px-3 py-2 border rounded-lg"
 placeholder="e.g., 15% of platform fees"
 />
 </div>

 <div className="flex gap-3 pt-4">
 <button className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
 Approve Application
 </button>
 <button className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">
 Reject Application
 </button>
 <button className="flex-1 px-4 py-3 border border-line rounded-lg hover:bg-subtle font-medium">
 Request More Info
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 )
}
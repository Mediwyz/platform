'use client'

import { FiFileText, FiActivity, FiClipboard, FiEye, FiHeart } from 'react-icons/fi'

interface ContentViewerProps {
 contentType: string
 contentData: Record<string, unknown>
}

const CONTENT_ICONS: Record<string, React.ReactNode> = {
 prescription: <FiFileText className="w-5 h-5 text-purple-600" />,
 lab_result: <FiActivity className="w-5 h-5 text-blue-600" />,
 care_notes: <FiClipboard className="w-5 h-5 text-green-600" />,
 report: <FiFileText className="w-5 h-5 text-orange-600" />,
 dental_chart: <FiHeart className="w-5 h-5 text-pink-600" />,
 eye_prescription: <FiEye className="w-5 h-5 text-indigo-600" />,
 meal_plan: <FiClipboard className="w-5 h-5 text-emerald-600" />,
 exercise_plan: <FiActivity className="w-5 h-5 text-cyan-600" />,
}

const CONTENT_LABELS: Record<string, string> = {
 prescription: 'Prescription',
 lab_result: 'Lab Results',
 care_notes: 'Care Notes',
 report: 'Medical Report',
 dental_chart: 'Dental Chart',
 eye_prescription: 'Eye Prescription',
 meal_plan: 'Meal Plan',
 exercise_plan: 'Exercise Plan',
}

export default function WorkflowContentViewer({ contentType, contentData }: ContentViewerProps) {
 const icon = CONTENT_ICONS[contentType] || <FiFileText className="w-5 h-5 text-gray-600" />
 const label = CONTENT_LABELS[contentType] || contentType.replace(/_/g, ' ')

 return (
 <div className="bg-white border border-gray-200 rounded-xl p-4">
 <div className="flex items-center gap-2 mb-3">
 {icon}
 <h4 className="font-semibold text-sm text-gray-900">{label}</h4>
 </div>

 {contentType === 'prescription' && renderPrescription(contentData)}
 {contentType === 'lab_result' && renderLabResult(contentData)}
 {!['prescription', 'lab_result'].includes(contentType) && renderGeneric(contentData)}
 </div>
 )
}

function renderPrescription(data: Record<string, unknown>) {
 const medications = (data.medications as Array<{ name: string; dosage?: string; frequency?: string; duration?: string }>) || []
 return (
 <div className="space-y-2">
 {medications.map((med, i) => (
 <div key={i} className="flex items-center justify-between bg-purple-50 rounded-lg p-3">
 <div>
 <p className="text-sm font-medium text-gray-900">{med.name}</p>
 <p className="text-xs text-gray-500">{[med.dosage, med.frequency, med.duration].filter(Boolean).join(' - ')}</p>
 </div>
 </div>
 ))}
 {data.notes ? <p className="text-xs text-gray-500 mt-2">Notes: {String(data.notes)}</p> : null}
 </div>
 )
}

function renderLabResult(data: Record<string, unknown>) {
 const values = (data.values as Array<{ name: string; value: string; unit?: string; normal?: string }>) || []
 return (
 <div>
 {data.findings ? <p className="text-sm text-gray-700 mb-2">{String(data.findings)}</p> : null}
 {values.length > 0 && (
 <div className="overflow-x-auto"><table className="w-full text-sm">
 <thead>
 <tr className="border-b">
 <th className="text-left py-1 text-gray-500 font-medium">Test</th>
 <th className="text-left py-1 text-gray-500 font-medium">Value</th>
 <th className="text-left py-1 text-gray-500 font-medium">Normal</th>
 </tr>
 </thead>
 <tbody>
 {values.map((v, i) => (
 <tr key={i} className="border-b border-gray-100">
 <td className="py-1 text-gray-900">{v.name}</td>
 <td className="py-1 font-medium">{v.value} {v.unit || ''}</td>
 <td className="py-1 text-gray-500">{v.normal || '-'}</td>
 </tr>
 ))}
 </tbody>
 </table></div>
 )}
 </div>
 )
}

function renderGeneric(data: Record<string, unknown>) {
 return (
 <div className="text-sm text-gray-700 space-y-1">
 {Object.entries(data).map(([key, value]) => (
 <div key={key}>
 <span className="font-medium text-gray-500">{key.replace(/_/g, ' ')}: </span>
 <span>{typeof value === 'string' ? value : JSON.stringify(value)}</span>
 </div>
 ))}
 </div>
 )
}

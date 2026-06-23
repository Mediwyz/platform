import { FaInfoCircle } from 'react-icons/fa'
import type { BookingData } from '@/types/booking'

interface ConsultationDetailsProps {
 bookingData: BookingData
 onUpdate: (updates: Partial<BookingData>) => void
 onNext: () => void
 onBack: () => void
}

export default function ConsultationDetails({
 bookingData,
 onUpdate,
 onNext,
 onBack
}: ConsultationDetailsProps) {
 const handleReasonChange = (reason: string) => {
 onUpdate({ reason })
 }

 const handleNotesChange = (notes: string) => {
 onUpdate({ notes })
 }

 return (
 <div className="max-w-2xl mx-auto">
 <div className="bg-surface rounded-2xl p-8 shadow-lg">
 <h2 className="text-2xl font-bold text-fg mb-6">Consultation Information</h2>
 
 <div className="space-y-6">
 <div>
 <label className="block text-soft text-sm font-medium mb-2">
 Reason for Consultation *
 </label>
 <select
 value={bookingData.reason}
 onChange={(e) => handleReasonChange(e.target.value)}
 className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-600"
 required
 >
 <option value="">Select reason</option>
 <option value="routine-checkup">Routine Checkup</option>
 <option value="follow-up">Follow-up Consultation</option>
 <option value="chest-pain">Chest Pain/Discomfort</option>
 <option value="heart-palpitations">Heart Palpitations</option>
 <option value="high-blood-pressure">High Blood Pressure</option>
 <option value="shortness-breath">Shortness of Breath</option>
 <option value="preventive-screening">Preventive Screening</option>
 <option value="second-opinion">Second Opinion</option>
 <option value="skin-condition">Skin Condition/Rash</option>
 <option value="headache-migraine">Headache/Migraine</option>
 <option value="digestive-issues">Digestive Issues</option>
 <option value="joint-pain">Joint/Muscle Pain</option>
 <option value="mental-health">Mental Health Concern</option>
 <option value="pediatric-care">Pediatric Care</option>
 <option value="eye-problems">Eye Problems</option>
 <option value="dental-issues">Dental Issues</option>
 <option value="other">Other</option>
 </select>
 </div>

 <div>
 <label className="block text-soft text-sm font-medium mb-2">
 Additional Notes (Optional)
 </label>
 <textarea
 value={bookingData.notes}
 onChange={(e) => handleNotesChange(e.target.value)}
 rows={4}
 placeholder="Please describe your symptoms, concerns, or any relevant medical history..."
 className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-blue-600"
 />
 <p className="text-xs text-soft mt-1">
 This information helps the doctor prepare for your consultation
 </p>
 </div>

 {/* Appointment Summary */}
 <div className=" rounded-xl p-6 border border-blue-100">
 <h3 className="font-bold text-fg mb-4 flex items-center gap-2">
 <FaInfoCircle className="text-blue-600" />
 Appointment Summary
 </h3>
 <div className="grid md:grid-cols-2 gap-4 text-sm">
 <div>
 <span className="text-soft">Doctor:</span>
 <p className="font-semibold">Dr. {bookingData.doctor.firstName} {bookingData.doctor.lastName}</p>
 </div>
 <div>
 <span className="text-soft">Specialty:</span>
 <p className="font-semibold">{bookingData.doctor.specialty.join(', ')}</p>
 </div>
 <div>
 <span className="text-soft">Date:</span>
 <p className="font-semibold">
 {bookingData.date ? new Date(bookingData.date).toLocaleDateString('en-US', {
 weekday: 'long',
 year: 'numeric',
 month: 'long',
 day: 'numeric'
 }) : 'Not selected'}
 </p>
 </div>
 <div>
 <span className="text-soft">Time:</span>
 <p className="font-semibold">{bookingData.time || 'Not selected'}</p>
 </div>
 <div>
 <span className="text-soft">Type:</span>
 <p className="font-semibold">
 {bookingData.type === "video" ? "Video Consultation" : "In-Person Visit"}
 </p>
 </div>
 <div>
 <span className="text-soft">Fee:</span>
 <p className="font-semibold text-green-600">
 Rs {(bookingData.type === 'video' 
 ? bookingData.doctor.videoConsultationFee 
 : bookingData.doctor.consultationFee
 ).toLocaleString()}
 </p>
 </div>
 <div>
 <span className="text-soft">Location:</span>
 <p className="font-semibold">
 {bookingData.type === "video" 
 ? "Online Video Call" 
 : bookingData.doctor.clinicAffiliation}
 </p>
 </div>
 <div>
 <span className="text-soft">Next Available:</span>
 <p className="font-semibold text-blue-600">{bookingData.doctor.nextAvailable}</p>
 </div>
 </div>
 </div>

 {/* Important Instructions */}
 <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
 <h4 className="font-semibold text-yellow-800 mb-2">Before Your Consultation</h4>
 <ul className="text-yellow-800 text-sm space-y-1">
 <li>• Prepare a list of your current medications</li>
 <li>• Note down specific symptoms and when they started</li>
 <li>• Bring any recent test results or medical reports</li>
 {bookingData.type === 'video' && (
 <>
 <li>• Ensure stable internet connection and quiet environment</li>
 <li>• Test your camera and microphone beforehand</li>
 </>
 )}
 {bookingData.type === 'in-person' && (
 <>
 <li>• Arrive 15 minutes early for check-in</li>
 <li>• Bring a valid ID and insurance card (if applicable)</li>
 </>
 )}
 </ul>
 </div>
 </div>

 <div className="flex justify-between mt-8">
 <button
 onClick={onBack}
 className="px-6 py-3 border border-line text-soft rounded-lg hover:bg-subtle"
 >
 Back
 </button>
 <button
 onClick={onNext}
 disabled={!bookingData.reason}
 className="bg-brand-navy text-white px-8 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
 >
 Proceed to Payment
 </button>
 </div>
 </div>
 </div>
 )
}
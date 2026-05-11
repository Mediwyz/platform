import Image from 'next/image'
import { FaStar, FaMapMarkerAlt, FaHospital, FaLanguage } from 'react-icons/fa'
import type { Doctor } from '@/lib/data'

interface DoctorInfoProps {
 doctor: Doctor
 onNext: () => void
}

export default function DoctorInfo({ doctor, onNext }: DoctorInfoProps) {
 return (
 <div className="max-w-4xl mx-auto">
 <div className="bg-white rounded-2xl p-8 shadow-lg">
 <h2 className="text-2xl font-bold text-gray-900 mb-6">Doctor Information</h2>
 
 <div className="flex flex-col lg:flex-row gap-8">
 <div className="lg:w-1/3">
 <div className="text-center">
 <Image
 src={doctor.profileImage}
 alt={`Dr. ${doctor.firstName} ${doctor.lastName}`}
 width={200}
 height={200}
 className="rounded-full object-cover border-4 border-blue-100 mx-auto mb-4"
 />
 <div className="flex items-center justify-center gap-1 text-yellow-500 mb-2">
 <FaStar />
 <span className="font-bold text-lg">{doctor.rating}</span>
 <span className="text-gray-600 text-sm">({doctor.reviews} reviews)</span>
 </div>
 </div>
 </div>
 
 <div className="lg:w-2/3">
 <h3 className="text-2xl font-bold text-gray-900 mb-2">
 Dr. {doctor.firstName} {doctor.lastName}
 </h3>
 <p className="text-lg text-blue-600 font-semibold mb-3">
 {doctor.specialty.join(', ')}
 </p>
 
 <div className="grid md:grid-cols-2 gap-4 mb-6">
 <div>
 <h4 className="font-semibold text-gray-900 mb-2">Experience</h4>
 <p className="text-gray-600">{doctor.experience}</p>
 </div>
 <div>
 <h4 className="font-semibold text-gray-900 mb-2">Consultation Fees</h4>
 <div className="space-y-1">
 <p className="text-lg font-bold text-green-600">
 In-Person: Rs {(doctor.consultationFee ?? 0).toLocaleString()}
 </p>
 {(doctor.videoConsultationFee ?? 0) > 0 && (
 <p className="text-lg font-bold text-green-600">
 Video: Rs {(doctor.videoConsultationFee ?? 0).toLocaleString()}
 </p>
 )}
 </div>
 </div>
 <div>
 <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
 <FaLanguage className="text-blue-500" />
 Languages
 </h4>
 <p className="text-gray-600">{doctor.languages.join(', ')}</p>
 </div>
 <div>
 <h4 className="font-semibold text-gray-900 mb-2">Category</h4>
 <span className={`px-3 py-1 rounded-full text-sm font-medium ${
 doctor.category === 'Specialist' 
 ? 'bg-purple-100 text-purple-700' 
 : doctor.category === 'General Practice'
 ? 'bg-green-100 text-green-700'
 : 'bg-red-100 text-red-700'
 }`}>
 {doctor.category}
 </span>
 </div>
 </div>
 
 <div className="mb-6">
 <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
 <FaHospital className="text-blue-500" />
 Clinic Affiliation
 </h4>
 <p className="text-gray-600">{doctor.clinicAffiliation}</p>
 </div>
 
 <div className="mb-6">
 <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
 <FaMapMarkerAlt className="text-blue-500" />
 Location
 </h4>
 <p className="text-gray-600">{doctor.address}</p>
 </div>
 
 <div className="mb-6">
 <h4 className="font-semibold text-gray-900 mb-2">Sub-specialties</h4>
 <div className="flex flex-wrap gap-2">
 {doctor.subSpecialties.map((subSpecialty, index) => (
 <span key={index} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
 {subSpecialty}
 </span>
 ))}
 </div>
 </div>
 
 <div>
 <h4 className="font-semibold text-gray-900 mb-2">About</h4>
 <p className="text-gray-600 leading-relaxed">{doctor.bio}</p>
 </div>
 </div>
 </div>
 
 <div className="flex justify-end mt-8">
 <button
 onClick={onNext}
 className="bg-brand-navy text-white px-8 py-3 rounded-lg font-semibold transition-all"
 >
 Continue to Schedule
 </button>
 </div>
 </div>
 </div>
 )
}
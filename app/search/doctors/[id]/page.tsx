'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { useParams } from 'next/navigation'
import { type Doctor } from '@/lib/data'
import {
 FaArrowLeft, FaStar, FaMapMarkerAlt, FaCalendarAlt,
 FaPhone, FaEnvelope, FaVideo, FaHome, FaLanguage, FaCheckCircle,
 FaCertificate, FaGraduationCap, FaBriefcase,
 FaUserMd, FaExclamationCircle, FaComments,
 FaHospital, FaShieldAlt,
 FaChevronDown, FaChevronUp
} from 'react-icons/fa'
import AuthBookingLink from '@/components/booking/AuthBookingLink'
import ConnectButton from '@/components/search/ConnectButton'
import MessageButton from '@/components/search/MessageButton'

export default function DoctorDetailsPage() {
 const params = useParams()
 const doctorId = params.id as string

 const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'availability'>('overview')
 const [activeAccordion, setActiveAccordion] = useState<string>('overview')
 const [doctor, setDoctor] = useState<Doctor | null>(null)
 const [isLoading, setIsLoading] = useState(true)

 useEffect(() => {
 fetch('/api/search/providers?type=DOCTOR')
 .then(res => res.json())
 .then(json => {
 if (json.success) {
 const found = json.data.find((d: Doctor) => d.id === doctorId)
 setDoctor(found || null)
 }
 setIsLoading(false)
 })
 .catch(() => setIsLoading(false))
 }, [doctorId])

 if (isLoading) {
 return (
 <div className="min-h-screen bg-subtle flex items-center justify-center p-4">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
 <span className="ml-3 text-soft">Loading doctor profile...</span>
 </div>
 )
 }

 if (!doctor) {
 return (
 <div className="min-h-screen bg-subtle flex items-center justify-center p-4">
 <div className="text-center">
 <FaUserMd className="text-4xl sm:text-6xl text-faint mx-auto mb-4" />
 <h1 className="text-xl sm:text-2xl font-bold text-fg mb-2">Doctor Not Found</h1>
 <p className="text-sm sm:text-base text-soft mb-6">The doctor you are looking for does not exist.</p>
 <Link href="/search/doctors" className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base">
 Back to Search
 </Link>
 </div>
 </div>
 )
 }

 const toggleAccordion = (section: string) => {
 setActiveAccordion(activeAccordion === section ? '' : section)
 }

 return (
 <div className="min-h-screen bg-subtle">
 {/* Header */}
 <div className="bg-surface shadow-sm">
 <div className="container mx-auto px-4 py-3 sm:py-4">
 <Link href="/search/doctors" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm sm:text-base">
 <FaArrowLeft className="text-xs sm:text-sm" />
 Back to Search
 </Link>
 </div>
 </div>

 <div className="container mx-auto px-4 py-4 sm:py-8">
 {/* Mobile: Single Column, Desktop: Grid */}
 <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
 {/* Main Content */}
 <div className="lg:col-span-2 space-y-4 sm:space-y-6">
 {/* Doctor Profile Header */}
 <div className="bg-surface rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6">
 <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
 <div className="relative">
 <Image
 src={doctor.profileImage}
 alt={`Dr. ${doctor.firstName} ${doctor.lastName}`}
 width={100}
 height={100}
 className="rounded-full object-cover border-4 border-blue-100 w-20 h-20 sm:w-[120px] sm:h-[120px]"
 />
 {doctor.verified && (
 <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-green-500 text-white rounded-full p-1.5 sm:p-2">
 <FaCheckCircle className="text-xs sm:text-sm" />
 </div>
 )}
 </div>
 <div className="flex-1 text-center sm:text-left">
 <div className="mb-3 sm:mb-4">
 <h1 className="text-xl sm:text-3xl font-bold text-fg mb-1 sm:mb-2">
 Dr. {doctor.firstName} {doctor.lastName}
 </h1>
 <p className="text-base sm:text-xl text-blue-600 font-medium mb-1 sm:mb-2">
 {doctor.specialty.join(', ')}
 </p>
 <p className="text-sm sm:text-base text-soft">{doctor.experience} experience</p>
 
 {/* Category Badge */}
 <div className="mt-2 flex justify-center sm:justify-start">
 <span className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full font-medium ${
 doctor.category === 'Specialist' 
 ? 'bg-purple-100 text-purple-700' 
 : doctor.category === 'General Practice'
 ? 'bg-green-100 text-green-700'
 : doctor.category === 'Emergency'
 ? 'bg-red-100 text-red-700'
 : doctor.category === 'Surgeon'
 ? 'bg-orange-100 text-orange-700'
 : doctor.category === 'Mental Health'
 ? 'bg-blue-100 text-blue-700'
 : doctor.category === 'Dentist'
 ? 'bg-teal-100 text-teal-700'
 : 'bg-subtle text-soft'
 }`}>
 {doctor.category}
 </span>
 {doctor.emergencyAvailable && (
 <span className="ml-2 bg-red-100 text-red-700 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
 Emergency
 </span>
 )}
 </div>
 </div>
 
 {/* Rating */}
 <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 mb-3 sm:mb-4">
 <div className="flex items-center text-yellow-500">
 {[...Array(Math.floor(doctor.rating))].map((_, i) => (
 <FaStar key={i} className="text-sm sm:text-lg" />
 ))}
 {doctor.rating % 1 !== 0 && <FaStar className="text-sm sm:text-lg opacity-50" />}
 </div>
 <span className="text-base sm:text-lg font-semibold text-soft">{doctor.rating}</span>
 <span className="text-sm sm:text-base text-soft">({doctor.reviews} reviews)</span>
 </div>

 {/* Info Grid - Mobile Responsive */}
 <div className="space-y-2 sm:space-y-3">
 {/* Languages */}
 <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
 <div className="flex items-center gap-2">
 <FaLanguage className="text-blue-500 text-sm" />
 <span className="text-xs sm:text-sm text-soft">Languages:</span>
 </div>
 <span className="text-xs sm:text-sm font-medium ml-6 sm:ml-0">{doctor.languages.join(', ')}</span>
 </div>

 {/* Clinic */}
 <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
 <div className="flex items-center gap-2">
 <FaHospital className="text-blue-500 text-sm" />
 <span className="text-xs sm:text-sm text-soft">Clinic:</span>
 </div>
 <span className="text-xs sm:text-sm font-medium ml-6 sm:ml-0">{doctor.clinicAffiliation}</span>
 </div>

 {/* Location */}
 <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
 <div className="flex items-center gap-2">
 <FaMapMarkerAlt className="text-blue-500 text-sm" />
 <span className="text-xs sm:text-sm text-soft">Location:</span>
 </div>
 <span className="text-xs sm:text-sm text-soft ml-6 sm:ml-0">{doctor.address}</span>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Desktop Tabs / Mobile Accordion */}
 <div className="bg-surface rounded-lg sm:rounded-xl shadow-lg">
 {/* Desktop Tabs - Hidden on Mobile */}
 <div className="hidden lg:block border-b border-line">
 <div className="flex">
 {[
 { id: 'overview', label: 'Overview', icon: FaUserMd },
 { id: 'reviews', label: 'Reviews', icon: FaComments },
 { id: 'availability', label: 'Availability', icon: FaCalendarAlt }
 ].map(({ id, label, icon: Icon }) => (
 <button
 key={id}
 onClick={() => setActiveTab(id as 'overview' | 'reviews' | 'availability')}
 className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors ${
 activeTab === id
 ? 'border-blue-500 text-blue-600'
 : 'border-transparent text-soft hover:text-fg'
 }`}
 >
 <Icon />
 {label}
 </button>
 ))}
 </div>
 </div>

 {/* Desktop Tab Content */}
 <div className="hidden lg:block p-6">
 {activeTab === 'overview' && <OverviewContent doctor={doctor} />}
 {activeTab === 'reviews' && <ReviewsContent doctor={doctor} />}
 {activeTab === 'availability' && <AvailabilityContent doctor={doctor} />}
 </div>

 {/* Mobile Accordion */}
 <div className="lg:hidden">
 {/* Overview Accordion */}
 <div className="border-b border-line">
 <button
 onClick={() => toggleAccordion('overview')}
 className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-subtle"
 >
 <div className="flex items-center gap-2">
 <FaUserMd className="text-blue-600" />
 <span className="font-medium text-fg">Overview</span>
 </div>
 {activeAccordion === 'overview' ? <FaChevronUp className="text-soft" /> : <FaChevronDown className="text-soft" />}
 </button>
 {activeAccordion === 'overview' && (
 <div className="p-4 border-t border-line">
 <OverviewContent doctor={doctor} mobile={true} />
 </div>
 )}
 </div>

 {/* Reviews Accordion */}
 <div className="border-b border-line">
 <button
 onClick={() => toggleAccordion('reviews')}
 className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-subtle"
 >
 <div className="flex items-center gap-2">
 <FaComments className="text-blue-600" />
 <span className="font-medium text-fg">Reviews</span>
 </div>
 {activeAccordion === 'reviews' ? <FaChevronUp className="text-soft" /> : <FaChevronDown className="text-soft" />}
 </button>
 {activeAccordion === 'reviews' && (
 <div className="p-4 border-t border-line">
 <ReviewsContent doctor={doctor} mobile={true} />
 </div>
 )}
 </div>

 {/* Availability Accordion */}
 <div>
 <button
 onClick={() => toggleAccordion('availability')}
 className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-subtle"
 >
 <div className="flex items-center gap-2">
 <FaCalendarAlt className="text-blue-600" />
 <span className="font-medium text-fg">Availability</span>
 </div>
 {activeAccordion === 'availability' ? <FaChevronUp className="text-soft" /> : <FaChevronDown className="text-soft" />}
 </button>
 {activeAccordion === 'availability' && (
 <div className="p-4 border-t border-line">
 <AvailabilityContent doctor={doctor} mobile={true} />
 </div>
 )}
 </div>
 </div>
 </div>
 </div>

 {/* Sidebar - Mobile First Responsive */}
 <div className="space-y-4 sm:space-y-6">
 {/* Booking Card */}
 <div className="bg-surface rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 lg:sticky lg:top-4">
 <h3 className="text-base sm:text-lg font-semibold text-fg mb-3 sm:mb-4">Book Consultation</h3>
 
 {/* Pricing */}
 <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
 <div className="flex items-center justify-between">
 <span className="text-sm sm:text-base text-soft">In-Person</span>
 <span className="text-base sm:text-lg font-bold text-green-600">Rs {(doctor.consultationFee ?? 0).toLocaleString()}</span>
 </div>
 {(doctor.videoConsultationFee ?? 0) > 0 && (
 <div className="flex items-center justify-between">
 <span className="text-sm sm:text-base text-soft">Video Call</span>
 <span className="text-base sm:text-lg font-bold text-green-600">Rs {(doctor.videoConsultationFee ?? 0).toLocaleString()}</span>
 </div>
 )}
 {(doctor.emergencyConsultationFee ?? 0) > 0 && (
 <div className="flex items-center justify-between">
 <span className="text-sm sm:text-base text-soft">Emergency</span>
 <span className="text-base sm:text-lg font-bold text-red-600">Rs {(doctor.emergencyConsultationFee ?? 0).toLocaleString()}</span>
 </div>
 )}
 </div>

 {/* Contact Info */}
 <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
 <div className="flex items-center gap-2 sm:gap-3">
 <FaPhone className="text-blue-500 text-sm" />
 <a href={`tel:${doctor.phone}`} className="text-blue-600 hover:text-blue-700 text-sm sm:text-base">
 {doctor.phone}
 </a>
 </div>
 <div className="flex items-center gap-2 sm:gap-3">
 <FaEnvelope className="text-blue-500 text-sm" />
 <a href={`mailto:${doctor.email}`} className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm break-all">
 {doctor.email}
 </a>
 </div>
 </div>

 {/* Action Buttons - 2x2 Grid */}
 <div className="grid grid-cols-2 gap-2 sm:gap-3">
 <AuthBookingLink
 type="doctor"
 providerId={doctor.id}
 className="bg-blue-600 text-white py-2.5 sm:py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm"
 >
 <FaCalendarAlt />
 Book
 </AuthBookingLink>

 <AuthBookingLink
 type="doctor"
 providerId={doctor.id}
 className="bg-purple-600 text-white py-2.5 sm:py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm"
 >
 <FaVideo />
 Video Call
 </AuthBookingLink>

 <ConnectButton providerId={doctor.id} className="w-full justify-center text-xs sm:text-sm" />

 <MessageButton providerId={doctor.id} className="w-full justify-center text-xs sm:text-sm" />
 </div>

 {/* Verification Badge */}
 {doctor.verified && (
 <div className="mt-3 sm:mt-4 flex items-center justify-center gap-2 text-green-600">
 <FaShieldAlt className="text-sm" />
 <span className="text-xs sm:text-sm font-medium">Verified Doctor</span>
 </div>
 )}
 </div>

 {/* Quick Stats */}
 <div className="bg-surface rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6">
 <h3 className="text-base sm:text-lg font-semibold text-fg mb-3 sm:mb-4">Quick Facts</h3>
 <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-3">
 <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
 <span className="text-xs sm:text-sm text-soft">Experience</span>
 <span className="font-medium text-sm sm:text-base">{doctor.experience}</span>
 </div>
 <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
 <span className="text-xs sm:text-sm text-soft">Age</span>
 <span className="font-medium text-sm sm:text-base">{doctor.age} years</span>
 </div>
 <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
 <span className="text-xs sm:text-sm text-soft">Patients</span>
 <span className="font-medium text-sm sm:text-base">{doctor.reviews}+</span>
 </div>
 <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
 <span className="text-xs sm:text-sm text-soft">Specialties</span>
 <span className="font-medium text-sm sm:text-base">{doctor.specialty.length}</span>
 </div>
 {doctor.consultationDuration && (
 <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
 <span className="text-xs sm:text-sm text-soft">Duration</span>
 <span className="font-medium text-sm sm:text-base">{doctor.consultationDuration} min</span>
 </div>
 )}
 {doctor.telemedicineAvailable !== undefined && (
 <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
 <span className="text-xs sm:text-sm text-soft">Telemedicine</span>
 <span className={`font-medium text-sm sm:text-base ${doctor.telemedicineAvailable ? 'text-green-600' : 'text-red-600'}`}>
 {doctor.telemedicineAvailable ? 'Yes' : 'No'}
 </span>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 )
}

// Overview Content Component
function OverviewContent({ doctor, mobile = false }: { doctor: Doctor; mobile?: boolean }) {
 const textSize = mobile ? 'text-sm' : 'text-base'
 const headingSize = mobile ? 'text-base' : 'text-lg'
 const spacing = mobile ? 'space-y-4' : 'space-y-6'

 return (
 <div className={spacing}>
 {/* Bio */}
 <div>
 <h3 className={`${headingSize} font-semibold text-fg mb-2 sm:mb-3`}>About</h3>
 <p className={`${textSize} text-soft leading-relaxed`}>{doctor.bio}</p>
 </div>

 {/* Philosophy */}
 {doctor.philosophy && (
 <div>
 <h3 className={`${headingSize} font-semibold text-fg mb-2 sm:mb-3`}>Treatment Philosophy</h3>
 <p className={`${textSize} text-soft leading-relaxed italic`}>&quot;{doctor.philosophy}&quot;</p>
 </div>
 )}

 {/* Specializations */}
 <div>
 <h3 className={`${headingSize} font-semibold text-fg mb-2 sm:mb-3`}>Specializations</h3>
 <div className="space-y-3">
 <div>
 <h4 className="text-sm font-medium text-fg mb-2">Primary Specialties</h4>
 <div className="flex flex-wrap gap-1.5 sm:gap-2">
 {doctor.specialty.map((specialty, index) => (
 <span key={index} className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
 {specialty}
 </span>
 ))}
 </div>
 </div>
 <div>
 <h4 className="text-sm font-medium text-fg mb-2">Sub-specialties</h4>
 <div className="flex flex-wrap gap-1.5 sm:gap-2">
 {doctor.subSpecialties.map((subSpecialty, index) => (
 <span key={index} className="bg-purple-100 text-purple-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
 {subSpecialty}
 </span>
 ))}
 </div>
 </div>
 </div>
 </div>

 {/* Education */}
 <div>
 <h3 className={`${headingSize} font-semibold text-fg mb-2 sm:mb-3 flex items-center gap-2`}>
 <FaGraduationCap className="text-blue-500 text-sm sm:text-base" />
 Education
 </h3>
 <ul className="space-y-2">
 {doctor.education.map((edu, index) => (
 <li key={index} className="flex items-start gap-2">
 <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></span>
 <div className={textSize}>
 <span className="text-soft font-medium">{edu.degree}</span>
 <span className="text-soft"> - {edu.institution}</span>
 <span className="text-soft text-xs sm:text-sm"> ({edu.year})</span>
 </div>
 </li>
 ))}
 </ul>
 </div>

 {/* Work Experience */}
 <div>
 <h3 className={`${headingSize} font-semibold text-fg mb-2 sm:mb-3 flex items-center gap-2`}>
 <FaBriefcase className="text-blue-500 text-sm sm:text-base" />
 Work Experience
 </h3>
 <ul className="space-y-2">
 {doctor.workHistory.map((work, index) => (
 <li key={index} className="flex items-start gap-2">
 <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></span>
 <div className={textSize}>
 <span className="text-soft font-medium">{work.position}</span>
 <span className="text-soft"> at {work.organization}</span>
 <span className="text-soft text-xs sm:text-sm"> ({work.period})</span>
 {work.current && (
 <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
 Current
 </span>
 )}
 </div>
 </li>
 ))}
 </ul>
 </div>

 {/* Certifications */}
 <div>
 <h3 className={`${headingSize} font-semibold text-fg mb-2 sm:mb-3 flex items-center gap-2`}>
 <FaCertificate className="text-blue-500 text-sm sm:text-base" />
 Certifications
 </h3>
 <ul className="space-y-2">
 {doctor.certifications.map((cert, index) => (
 <li key={index} className="flex items-start gap-2">
 <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></span>
 <div className={`${textSize} break-words`}>
 <span className="text-soft font-medium">{cert.name}</span>
 <span className="text-soft"> - {cert.issuingBody}</span>
 <div className="text-soft text-xs sm:text-sm">
 {cert.dateObtained}
 {cert.expiryDate && <span> • Expires: {cert.expiryDate}</span>}
 </div>
 </div>
 </li>
 ))}
 </ul>
 </div>

 {/* Consultation Types */}
 <div>
 <h3 className={`${headingSize} font-semibold text-fg mb-2 sm:mb-3`}>Consultation Options</h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
 {doctor.consultationTypes.map((type, index) => (
 <div key={index} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border border-line rounded-lg">
 {type === 'Video Consultation' && <FaVideo className="text-blue-500 text-sm" />}
 {type === 'In-Person' && <FaHome className="text-green-500 text-sm" />}
 {type === 'Emergency' && <FaExclamationCircle className="text-red-500 text-sm" />}
 {type === 'Home Visit' && <FaHome className="text-purple-500 text-sm" />}
 <span className="text-xs sm:text-sm font-medium">{type}</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 )
}

// Reviews Content Component
function ReviewsContent({ doctor, mobile = false }: { doctor: Doctor; mobile?: boolean }) {
 const textSize = mobile ? 'text-sm' : 'text-base'
 const headingSize = mobile ? 'text-base' : 'text-lg'

 return (
 <div className="space-y-4 sm:space-y-6">
 <div className="text-center p-4 sm:p-6 bg-subtle rounded-lg">
 <div className="text-2xl sm:text-3xl font-bold text-fg mb-2">{doctor.rating}</div>
 <div className="flex items-center justify-center gap-1 text-yellow-500 mb-2">
 {[...Array(Math.floor(doctor.rating))].map((_, i) => (
 <FaStar key={i} className="text-sm sm:text-base" />
 ))}
 </div>
 <p className="text-sm sm:text-base text-soft">Based on {doctor.reviews} reviews</p>
 </div>
 
 <div>
 <h3 className={`${headingSize} font-semibold text-fg mb-3 sm:mb-4`}>Patient Feedback</h3>
 <div className="space-y-3 sm:space-y-4">
 {doctor.patientComments.map((comment) => (
 <div key={comment.id} className="p-3 sm:p-4 bg-subtle rounded-lg">
 <div className="flex items-start gap-3 sm:gap-4">
 <Image
 src={comment.patientProfileImage}
 alt={`${comment.patientFirstName} ${comment.patientLastName}`}
 width={32}
 height={32}
 className="rounded-full object-cover w-8 h-8 sm:w-10 sm:h-10"
 />
 <div className="flex-1">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
 <h4 className="font-medium text-fg text-sm sm:text-base">
 {comment.patientFirstName} {comment.patientLastName}
 </h4>
 <div className="flex items-center gap-2 text-xs sm:text-sm text-soft">
 <span>{comment.date}</span>
 <span>{comment.time}</span>
 </div>
 </div>
 <div className="flex items-center gap-1 text-yellow-500 mb-2">
 {[...Array(comment.starRating)].map((_, i) => (
 <FaStar key={i} className="text-xs sm:text-sm" />
 ))}
 {[...Array(5 - comment.starRating)].map((_, i) => (
 <FaStar key={i} className="text-xs sm:text-sm text-faint" />
 ))}
 </div>
 <p className={`${textSize} text-soft italic`}>&quot;{comment.comment}&quot;</p>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 )
}

// Availability Content Component
function AvailabilityContent({ doctor, mobile = false }: { doctor: Doctor; mobile?: boolean }) {
 const textSize = mobile ? 'text-sm' : 'text-base'
 const headingSize = mobile ? 'text-base' : 'text-lg'

 return (
 <div className="space-y-4 sm:space-y-6">
 <div>
 <h3 className={`${headingSize} font-semibold text-fg mb-2 sm:mb-3`}>Current Availability</h3>
 <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
 <div className="flex items-center gap-2">
 <FaCalendarAlt className="text-green-600 text-sm" />
 <span className={`font-medium text-green-800 ${textSize}`}>{doctor.nextAvailable}</span>
 </div>
 </div>
 </div>
 
 <div>
 <h3 className={`${headingSize} font-semibold text-fg mb-2 sm:mb-3`}>Working Hours</h3>
 <p className={`${textSize} text-soft`}>{doctor.availability}</p>
 </div>

 {/* Weekly Schedule */}
 {doctor.detailedAvailability && (() => {
 const avail = doctor.detailedAvailability!
 return (
 <div>
 <h3 className={`${headingSize} font-semibold text-fg mb-2 sm:mb-3`}>Weekly Schedule</h3>
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
 {Object.entries({
 monday: 'Mon',
 tuesday: 'Tue',
 wednesday: 'Wed',
 thursday: 'Thu',
 friday: 'Fri',
 saturday: 'Sat',
 sunday: 'Sun'
 }).map(([key, day]) => {
 const daySchedule = avail[key as keyof typeof avail]
 if (typeof daySchedule === 'object' && 'isAvailable' in daySchedule) {
 return (
 <div key={key} className={`p-2 sm:p-3 rounded-lg border text-center ${
 daySchedule.isAvailable 
 ? 'border-green-200 bg-green-50' 
 : 'border-line bg-subtle'
 }`}>
 <div className="font-medium text-fg text-xs sm:text-sm">{day}</div>
 <div className="text-xs sm:text-sm text-soft">
 {daySchedule.isAvailable 
 ? `${daySchedule.start}-${daySchedule.end}` 
 : 'Closed'}
 </div>
 </div>
 )
 }
 return null
 })}
 </div>
 </div>
 )
 })()}

 <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
 <h4 className={`font-medium text-blue-900 mb-2 ${textSize}`}>Quick Booking Tips</h4>
 <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
 <li>• Book in advance for regular consultations</li>
 <li>• Emergency appointments available for urgent cases</li>
 <li>• Video consultations available for follow-ups</li>
 </ul>
 </div>
 </div>
 )
}
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { useParams } from 'next/navigation'
import { type Nanny } from '@/lib/data'
import {
 FaArrowLeft, FaStar, FaMapMarkerAlt, FaClock, FaCalendarAlt,
 FaPhone, FaEnvelope, FaHome, FaLanguage, FaCheckCircle,
 FaCertificate, FaGraduationCap, FaBriefcase, FaHeart,
 FaBaby, FaExclamationCircle, FaComments,
 FaUsers, FaShieldAlt, FaVideo
} from 'react-icons/fa'
import AuthBookingLink from '@/components/booking/AuthBookingLink'
import ConnectButton from '@/components/search/ConnectButton'
import MessageButton from '@/components/search/MessageButton'

export default function NannyDetailsPage() {
 const params = useParams()
 const nannyId = params.id as string

 const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'availability'>('overview')
 const [nanny, setNanny] = useState<Nanny | null>(null)
 const [isLoading, setIsLoading] = useState(true)

 useEffect(() => {
 fetch('/api/search/providers?type=NANNY')
 .then(res => res.json())
 .then(json => {
 if (json.success) {
 const found = json.data.find((n: Nanny) => n.id === nannyId)
 setNanny(found || null)
 }
 setIsLoading(false)
 })
 .catch(() => setIsLoading(false))
 }, [nannyId])

 if (isLoading) {
 return (
 <div className="min-h-screen bg-gray-50 flex items-center justify-center">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
 <span className="ml-3 text-gray-600">Loading nanny profile...</span>
 </div>
 )
 }

 if (!nanny) {
 return (
 <div className="min-h-screen bg-gray-50 flex items-center justify-center">
 <div className="text-center">
 <FaBaby className="text-6xl text-gray-300 mx-auto mb-4" />
 <h1 className="text-2xl font-bold text-gray-900 mb-2">Nanny Not Found</h1>
 <p className="text-gray-600 mb-6">The nanny you are looking for does not exist.</p>
 <Link href="/search/nannies" className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
 Back to Search
 </Link>
 </div>
 </div>
 )
 }

 return (
 <div className="min-h-screen bg-gray-50">
 {/* Header */}
 <div className="bg-white shadow-sm">
 <div className="container mx-auto px-4 py-4">
 <Link href="/search/nannies" className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-4">
 <FaArrowLeft />
 Back to Search
 </Link>
 </div>
 </div>

 <div className="container mx-auto px-4 py-8">
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 {/* Main Content */}
 <div className="lg:col-span-2 space-y-6">
 {/* Nanny Profile Header */}
 <div className="bg-white rounded-xl shadow-lg p-6">
 <div className="flex items-start gap-6">
 <div className="relative">
 <Image
 src={nanny.profileImage}
 alt={`${nanny.firstName} ${nanny.lastName}`}
 width={120}
 height={120}
 className="rounded-full object-cover border-4 border-purple-100"
 onError={(e) => {
 const target = e.target as HTMLImageElement;
 target.src = `https://ui-avatars.com/api/?name=${nanny.firstName}+${nanny.lastName}&background=random&color=fff&size=120`;
 }}
 />
 {nanny.verified && (
 <div className="absolute -bottom-2 -right-2 bg-green-500 text-white rounded-full p-2">
 <FaCheckCircle className="text-sm" />
 </div>
 )}
 </div>
 <div className="flex-1">
 <div className="flex items-start justify-between mb-4">
 <div>
 <h1 className="text-3xl font-bold text-gray-900 mb-2">
 {nanny.firstName} {nanny.lastName}
 </h1>
 <p className="text-xl text-purple-600 font-medium mb-2">
 {nanny.specialization.join(', ')}
 </p>
 <p className="text-gray-600">{nanny.experience} experience</p>
 
 {/* Age Groups Badge */}
 <div className="mt-2">
 <span className="text-sm px-3 py-1 rounded-full font-medium bg-pink-100 text-pink-700">
 Ages: {nanny.ageGroups.slice(0, 2).join(', ')}
 {nanny.ageGroups.length > 2 && ` +${nanny.ageGroups.length - 2} more`}
 </span>
 </div>
 </div>
 {nanny.emergencyAvailable && (
 <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
 Emergency Available
 </span>
 )}
 </div>
 
 {/* Rating */}
 <div className="flex items-center gap-3 mb-4">
 <div className="flex items-center text-yellow-500">
 {[...Array(Math.floor(nanny.rating))].map((_, i) => (
 <FaStar key={i} className="text-lg" />
 ))}
 {nanny.rating % 1 !== 0 && <FaStar className="text-lg opacity-50" />}
 </div>
 <span className="text-lg font-semibold text-gray-700">{nanny.rating}</span>
 <span className="text-gray-500">({nanny.reviews} reviews)</span>
 </div>

 {/* Languages */}
 <div className="flex items-center gap-2 mb-4">
 <FaLanguage className="text-purple-500" />
 <span className="text-gray-600">Languages:</span>
 <span className="font-medium">{nanny.languages.join(', ')}</span>
 </div>

 {/* Max Children */}
 <div className="flex items-center gap-2 mb-4">
 <FaUsers className="text-purple-500" />
 <span className="text-gray-600">Capacity:</span>
 <span className="font-medium">Maximum {nanny.maxChildren} children</span>
 </div>

 {/* Location */}
 <div className="flex items-center gap-2">
 <FaMapMarkerAlt className="text-purple-500" />
 <span className="text-gray-700">{nanny.address}</span>
 </div>
 </div>
 </div>
 </div>

 {/* Tabs */}
 <div className="bg-white rounded-xl shadow-lg">
 <div className="border-b border-gray-200">
 <div className="flex">
 {[
 { id: 'overview', label: 'Overview', icon: FaBaby },
 { id: 'reviews', label: 'Reviews', icon: FaComments },
 { id: 'availability', label: 'Availability', icon: FaCalendarAlt }
 ].map(({ id, label, icon: Icon }) => (
 <button
 key={id}
 onClick={() => setActiveTab(id as 'overview' | 'reviews' | 'availability')}
 className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors ${
 activeTab === id
 ? 'border-purple-500 text-purple-600'
 : 'border-transparent text-gray-600 hover:text-gray-900'
 }`}
 >
 <Icon />
 {label}
 </button>
 ))}
 </div>
 </div>

 <div className="p-6">
 {/* Overview Tab */}
 {activeTab === 'overview' && (
 <div className="space-y-6">
 {/* Bio */}
 <div>
 <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
 <p className="text-gray-700 leading-relaxed">{nanny.bio}</p>
 </div>

 {/* Specializations & Age Groups */}
 <div>
 <h3 className="text-lg font-semibold text-gray-900 mb-3">Specializations</h3>
 <div className="space-y-3">
 <div>
 <h4 className="text-md font-medium text-gray-800 mb-2">Primary Specializations</h4>
 <div className="flex flex-wrap gap-2">
 {nanny.specialization.map((specialization, index) => (
 <span key={index} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
 {specialization}
 </span>
 ))}
 </div>
 </div>
 <div>
 <h4 className="text-md font-medium text-gray-800 mb-2">Sub-specialties</h4>
 <div className="flex flex-wrap gap-2">
 {nanny.subSpecialties.map((subSpecialty, index) => (
 <span key={index} className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm font-medium">
 {subSpecialty}
 </span>
 ))}
 </div>
 </div>
 <div>
 <h4 className="text-md font-medium text-gray-800 mb-2">Age Groups Served</h4>
 <div className="flex flex-wrap gap-2">
 {nanny.ageGroups.map((ageGroup, index) => (
 <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
 {ageGroup}
 </span>
 ))}
 </div>
 </div>
 </div>
 </div>

 {/* Services */}
 <div>
 <h3 className="text-lg font-semibold text-gray-900 mb-3">Services Offered</h3>
 <div className="flex flex-wrap gap-2">
 {nanny.services.map((service, index) => (
 <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
 {service}
 </span>
 ))}
 </div>
 </div>

 {/* Education */}
 <div>
 <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
 <FaGraduationCap className="text-purple-500" />
 Education
 </h3>
 <ul className="space-y-2">
 {nanny.education.map((edu, index) => (
 <li key={index} className="flex items-start gap-2">
 <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
 <span className="text-gray-700">{edu}</span>
 </li>
 ))}
 </ul>
 </div>

 {/* Work History */}
 <div>
 <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
 <FaBriefcase className="text-purple-500" />
 Work Experience
 </h3>
 <ul className="space-y-2">
 {nanny.workHistory.map((work, index) => (
 <li key={index} className="flex items-start gap-2">
 <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
 <span className="text-gray-700">{work}</span>
 </li>
 ))}
 </ul>
 </div>

 {/* Certifications */}
 <div>
 <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
 <FaCertificate className="text-purple-500" />
 Certifications & Awards
 </h3>
 <ul className="space-y-2">
 {nanny.certifications.map((cert, index) => (
 <li key={index} className="flex items-start gap-2">
 <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></span>
 <span className="text-gray-700">{cert}</span>
 </li>
 ))}
 </ul>
 </div>

 {/* Care Types */}
 <div>
 <h3 className="text-lg font-semibold text-gray-900 mb-3">Care Options</h3>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {nanny.careTypes.map((type, index) => (
 <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
 {type.includes('Full-time') && <FaHome className="text-green-500" />}
 {type.includes('Part-time') && <FaClock className="text-blue-500" />}
 {type.includes('Night') && <FaClock className="text-purple-500" />}
 {type.includes('Emergency') && <FaExclamationCircle className="text-red-500" />}
 {!type.includes('Full-time') && !type.includes('Part-time') && !type.includes('Night') && !type.includes('Emergency') && <FaHeart className="text-pink-500" />}
 <span className="font-medium">{type}</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}

 {/* Reviews Tab */}
 {activeTab === 'reviews' && (
 <div className="space-y-6">
 <div className="text-center p-6 bg-gray-50 rounded-lg">
 <div className="text-3xl font-bold text-gray-900 mb-2">{nanny.rating}</div>
 <div className="flex items-center justify-center gap-1 text-yellow-500 mb-2">
 {[...Array(Math.floor(nanny.rating))].map((_, i) => (
 <FaStar key={i} />
 ))}
 </div>
 <p className="text-gray-600">Based on {nanny.reviews} reviews</p>
 </div>
 
 <div>
 <h3 className="text-lg font-semibold text-gray-900 mb-4">Family Feedback</h3>
 <div className="space-y-4">
 {nanny.patientComments.map((comment) => (
 <div key={comment.id} className="p-4 bg-gray-50 rounded-lg">
 <div className="flex items-start gap-4">
 <Image
 src={comment.patientProfileImage}
 alt={`${comment.patientFirstName} ${comment.patientLastName}`}
 width={40}
 height={40}
 className="rounded-full object-cover"
 onError={(e) => {
 const target = e.target as HTMLImageElement;
 target.src = `https://ui-avatars.com/api/?name=${comment.patientFirstName}+${comment.patientLastName}&background=random&color=fff&size=40`;
 }}
 />
 <div className="flex-1">
 <div className="flex items-center justify-between mb-2">
 <h4 className="font-medium text-gray-900">
 {comment.patientFirstName} {comment.patientLastName}
 </h4>
 <div className="flex items-center gap-2 text-sm text-gray-500">
 <span>{comment.date}</span>
 <span>{comment.time}</span>
 </div>
 </div>
 <div className="flex items-center gap-1 text-yellow-500 mb-2">
 {[...Array(comment.starRating)].map((_, i) => (
 <FaStar key={i} className="text-sm" />
 ))}
 {[...Array(5 - comment.starRating)].map((_, i) => (
 <FaStar key={i} className="text-sm text-gray-300" />
 ))}
 </div>
 <p className="text-gray-700 italic">&quot;{comment.comment}&quot;</p>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}

 {/* Availability Tab */}
 {activeTab === 'availability' && (
 <div className="space-y-6">
 <div>
 <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Availability</h3>
 <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
 <div className="flex items-center gap-2">
 <FaCalendarAlt className="text-green-600" />
 <span className="font-medium text-green-800">{nanny.nextAvailable}</span>
 </div>
 </div>
 </div>
 
 <div>
 <h3 className="text-lg font-semibold text-gray-900 mb-3">Working Hours</h3>
 <p className="text-gray-700">{nanny.availability}</p>
 </div>

 <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
 <h4 className="font-medium text-purple-900 mb-2">Quick Booking Tips</h4>
 <ul className="text-sm text-purple-800 space-y-1">
 <li>• Book in advance for regular childcare</li>
 <li>• Emergency services available for urgent needs</li>
 <li>• Discuss specific requirements during booking</li>
 <li>• Background-checked nannies for peace of mind</li>
 </ul>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Sidebar */}
 <div className="space-y-6">
 {/* Booking Card */}
 <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
 <h3 className="text-lg font-semibold text-gray-900 mb-4">Book Childcare Service</h3>
 
 {/* Pricing */}
 <div className="space-y-3 mb-6">
 <div className="flex items-center justify-between">
 <span className="text-gray-600">Hourly Rate</span>
 <span className="text-lg font-bold text-green-600">Rs {(nanny.hourlyRate ?? 0).toLocaleString()}/hr</span>
 </div>
 {(nanny.overnightRate ?? 0) > 0 && (
 <div className="flex items-center justify-between">
 <span className="text-gray-600">Overnight Rate</span>
 <span className="text-lg font-bold text-green-600">Rs {(nanny.overnightRate ?? 0).toLocaleString()}</span>
 </div>
 )}
 </div>

 {/* Contact Info */}
 <div className="space-y-3 mb-6">
 <div className="flex items-center gap-3">
 <FaPhone className="text-purple-500" />
 <a href={`tel:${nanny.phone}`} className="text-purple-600 hover:text-purple-700">
 {nanny.phone}
 </a>
 </div>
 <div className="flex items-center gap-3">
 <FaEnvelope className="text-purple-500" />
 <a href={`mailto:${nanny.email}`} className="text-purple-600 hover:text-purple-700 text-sm">
 {nanny.email}
 </a>
 </div>
 </div>

 {/* Action Buttons - 2x2 Grid */}
 <div className="grid grid-cols-2 gap-2 sm:gap-3">
 <AuthBookingLink
 type="nanny"
 providerId={nanny.id}
 className="bg-purple-600 text-white py-2.5 sm:py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm"
 >
 <FaCalendarAlt />
 Book
 </AuthBookingLink>

 <AuthBookingLink
 type="nanny"
 providerId={nanny.id}
 className="bg-blue-600 text-white py-2.5 sm:py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm"
 >
 <FaVideo />
 Video Call
 </AuthBookingLink>

 <ConnectButton providerId={nanny.id} className="w-full justify-center text-xs sm:text-sm" />

 <MessageButton providerId={nanny.id} className="w-full justify-center text-xs sm:text-sm" />
 </div>

 {/* Verification Badge */}
 {nanny.verified && (
 <div className="mt-4 flex items-center gap-2 text-green-600">
 <FaShieldAlt />
 <span className="text-sm font-medium">Verified Nanny</span>
 </div>
 )}
 </div>

 {/* Quick Stats */}
 <div className="bg-white rounded-xl shadow-lg p-6">
 <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Facts</h3>
 <div className="space-y-3">
 <div className="flex items-center justify-between">
 <span className="text-gray-600">Experience</span>
 <span className="font-medium">{nanny.experience}</span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-gray-600">Age</span>
 <span className="font-medium">{nanny.age} years</span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-gray-600">Families Served</span>
 <span className="font-medium">{nanny.reviews}+</span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-gray-600">Max Children</span>
 <span className="font-medium">{nanny.maxChildren}</span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-gray-600">Languages</span>
 <span className="font-medium">{nanny.languages.length}</span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-gray-600">Background Check</span>
 <span className={`font-medium ${nanny.backgroundCheck ? 'text-green-600' : 'text-orange-600'}`}>
 {nanny.backgroundCheck ? 'Verified' : 'Pending'}
 </span>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 )
}
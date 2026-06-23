// app/patient/nanny-booking/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { 
 FaArrowLeft,
 FaStar,
 FaLanguage,
 FaGraduationCap,
 FaShieldAlt,
 FaCertificate,
 FaSearch,
 FaFilter,
 FaCheckCircle,
 FaUserCheck
} from "react-icons/fa"

interface NannyProfile {
 id: string;
 name: string;
 avatar: string;
 age: number;
 experience: string;
 rating: number;
 reviews: number;
 specializations: string[];
 languages: string[];
 education: string;
 hourlyRate: number;
 dailyRate: number;
 monthlyRate: number;
 availability: string[];
 verified: boolean;
 backgroundCheck: boolean;
 bio: string;
 certifications: string[];
 skills: string[];
 preferredAgeGroup: string[];
}

interface ServiceType {
 id: string;
 name: string;
 description: string;
 icon: string;
 priceType: "hourly" | "daily" | "monthly";
}

interface BookingDetails {
 nanny: NannyProfile | null;
 serviceType: ServiceType | null;
 startDate: string;
 endDate: string;
 startTime: string;
 endTime: string;
 duration: "hourly" | "daily" | "weekly" | "monthly";
 numberOfChildren: number;
 childrenAges: number[];
 address: string;
 specialRequirements: string;
 emergencyContact: {
 name: string;
 phone: string;
 relationship: string;
 };
 totalAmount: number;
}

interface Review {
 id: string;
 parentName: string;
 rating: number;
 comment: string;
 date: string;
}

const fallbackServiceTypes: ServiceType[] = [
 { id: "ST001", name: "Regular Childcare", description: "Daily childcare during working hours", icon: "", priceType: "daily" },
 { id: "ST002", name: "Night Nanny", description: "Overnight childcare support", icon: "", priceType: "hourly" },
 { id: "ST003", name: "Weekend Care", description: "Weekend babysitting services", icon: "", priceType: "hourly" },
 { id: "ST004", name: "Full-Time Nanny", description: "Full-time live-in or live-out nanny", icon: "", priceType: "monthly" },
 { id: "ST005", name: "Emergency Care", description: "Last-minute childcare services", icon: "", priceType: "hourly" },
 { id: "ST006", name: "Special Needs Care", description: "Specialized care for children with special needs", icon: "", priceType: "hourly" },
]

// Map service name keywords to icons
function getServiceIcon(name: string): string {
 const lower = name.toLowerCase()
 if (lower.includes('night')) return ''
 if (lower.includes('weekend')) return ''
 if (lower.includes('full-time') || lower.includes('full time') || lower.includes('live')) return ''
 if (lower.includes('emergency') || lower.includes('urgent')) return ''
 if (lower.includes('special need')) return ''
 return ''
}

// Map service duration to price type
function getPriceType(duration: number | null): "hourly" | "daily" | "monthly" {
 if (!duration) return 'hourly'
 if (duration >= 480) return 'monthly' // 8+ hours  monthly rate
 if (duration >= 240) return 'daily'   // 4+ hours  daily rate
 return 'hourly'
}

export default function NannyBookingPage() {
 const [nannies, setNannies] = useState<NannyProfile[]>([])
 const [serviceTypes, setServiceTypes] = useState<ServiceType[]>(fallbackServiceTypes)
 const [selectedNanny, setSelectedNanny] = useState<NannyProfile | null>(null)
 const [selectedService, setSelectedService] = useState<ServiceType | null>(null)
 const [searchQuery, setSearchQuery] = useState("")
 const [filterAgeGroup, setFilterAgeGroup] = useState("all")
 const [showBookingForm, setShowBookingForm] = useState(false)
 const [showNannyDetails, setShowNannyDetails] = useState(false)

 // Fetch nannies from API
 const fetchNannies = useCallback(async () => {
 try {
 const res = await fetch('/api/search/providers?type=NANNY')
 const data = await res.json()
 if (data.data) {
  
 setNannies(data.data.map((n: any) => ({
 id: n.id,
 name: `${n.firstName} ${n.lastName}`,
 avatar: n.profileImage || '',
 age: n.age || 28,
 experience: n.experience || '2+ years',
 rating: n.rating || 4.5,
 reviews: n.reviews || 0,
 specializations: n.specialization || ['Child Care'],
 languages: n.languages || ['English', 'French'],
 education: n.education?.[0] || 'Early Childhood Education',
 hourlyRate: n.hourlyRate || 300,
 dailyRate: (n.hourlyRate || 300) * 8,
 monthlyRate: (n.hourlyRate || 300) * 8 * 22,
 availability: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
 verified: n.verified || false,
 backgroundCheck: n.backgroundCheck || false,
 bio: n.bio || '',
 certifications: n.certifications || [],
 skills: n.services || [],
 preferredAgeGroup: n.ageGroups || ['0-1 year', '1-3 years'],
 })))
 }
 } catch { /* silent */ }
 }, [])

 useEffect(() => { fetchNannies() }, [fetchNannies])

 // Fetch nanny service types from catalog API, fall back to hardcoded
 useEffect(() => {
 async function fetchServiceTypes() {
 try {
 const res = await fetch('/api/services/catalog?providerType=NANNY')
 const data = await res.json()
 if (data.success && Array.isArray(data.data)) {
 const apiTypes: ServiceType[] = []
 for (const group of data.data) {
  
 for (const svc of group.services as any[]) {
 apiTypes.push({
 id: svc.id,
 name: svc.serviceName,
 description: svc.description || '',
 icon: getServiceIcon(svc.serviceName),
 priceType: getPriceType(svc.duration),
 })
 }
 }
 if (apiTypes.length > 0) {
 setServiceTypes(apiTypes)
 }
 }
 } catch {
 // Keep fallback service types
 }
 }
 fetchServiceTypes()
 }, [])

 const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
 nanny: null,
 serviceType: null,
 startDate: "",
 endDate: "",
 startTime: "",
 endTime: "",
 duration: "daily",
 numberOfChildren: 1,
 childrenAges: [0],
 address: "",
 specialRequirements: "",
 emergencyContact: {
 name: "",
 phone: "",
 relationship: ""
 },
 totalAmount: 0
 })

 const ageGroups = ["all", "0-1 year", "1-3 years", "3-6 years", "6-10 years", "10+ years"]

 const filteredNannies = nannies.filter(nanny => {
 const matchesSearch = nanny.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
 nanny.bio.toLowerCase().includes(searchQuery.toLowerCase())
 const matchesAge = filterAgeGroup === "all" || nanny.preferredAgeGroup.includes(filterAgeGroup)
 return matchesSearch && matchesAge
 })

 const handleSelectNanny = (nanny: NannyProfile) => {
 setSelectedNanny(nanny)
 setShowNannyDetails(true)
 }

 const handleBookNanny = () => {
 if (selectedNanny && selectedService) {
 setBookingDetails({
 ...bookingDetails,
 nanny: selectedNanny,
 serviceType: selectedService
 })
 setShowBookingForm(true)
 setShowNannyDetails(false)
 }
 }

 const calculateTotal = () => {
 if (!selectedNanny || !selectedService) return 0
 
 switch (selectedService.priceType) {
 case "hourly":
 return selectedNanny.hourlyRate * 8 // Assuming 8 hours
 case "daily":
 return selectedNanny.dailyRate
 case "monthly":
 return selectedNanny.monthlyRate
 default:
 return 0
 }
 }

 return (
 <div className="min-h-screen bg-subtle">
 {/* Header */}
 <div className="bg-surface shadow-sm border-b">
 <div className="container mx-auto px-4 py-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 <Link href="/patient" className="text-soft hover:text-primary-blue">
 <FaArrowLeft className="text-xl" />
 </Link>
 <div>
 <h1 className="text-2xl font-bold text-fg">Nanny Services</h1>
 <p className="text-soft">Find trusted nannies for your children</p>
 </div>
 </div>
 </div>
 </div>
 </div>

 <div className="container mx-auto px-4 py-8">
 {!showBookingForm ? (
 <>
 {/* Service Types */}
 <div className="mb-8">
 <h2 className="text-lg font-semibold mb-4">What type of care do you need?</h2>
 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
 {serviceTypes.map((service) => (
 <button
 key={service.id}
 onClick={() => setSelectedService(service)}
 className={`p-4 bg-surface rounded-lg shadow-lg text-center hover:shadow-xl transition ${
 selectedService?.id === service.id ? "border-2 border-primary-blue" : ""
 }`}
 >
 <div className="text-3xl mb-2">{service.icon}</div>
 <p className="text-sm font-medium">{service.name}</p>
 </button>
 ))}
 </div>
 </div>

 {/* Search and Filters */}
 <div className="bg-surface rounded-2xl p-6 shadow-lg mb-6">
 <div className="flex flex-col md:flex-row gap-4">
 <div className="flex-1 relative">
 <input
 type="text"
 placeholder="Search nannies by name or skills..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full px-4 py-3 pl-10 border rounded-lg focus:outline-none focus:border-primary-blue"
 />
 <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-faint" />
 </div>
 <select
 value={filterAgeGroup}
 onChange={(e) => setFilterAgeGroup(e.target.value)}
 className="px-4 py-3 border rounded-lg focus:outline-none focus:border-primary-blue"
 >
 <option value="all">All Age Groups</option>
 {ageGroups.slice(1).map(age => (
 <option key={age} value={age}>{age}</option>
 ))}
 </select>
 <button className="px-6 py-3 border border-line text-soft rounded-lg hover:bg-subtle flex items-center gap-2">
 <FaFilter />
 More Filters
 </button>
 </div>
 </div>

 {/* Nanny Profiles */}
 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
 {filteredNannies.map((nanny) => (
 <div key={nanny.id} className="bg-surface rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition">
 <div className="p-6">
 <div className="flex items-start justify-between mb-4">
 <div className="flex items-center gap-3">
 <div className="text-4xl">{nanny.avatar}</div>
 <div>
 <h3 className="font-semibold text-lg">{nanny.name}</h3>
 <p className="text-soft text-sm">{nanny.age} years  {nanny.experience}</p>
 </div>
 </div>
 <div className="text-right">
 <div className="flex items-center gap-1 mb-1">
 <FaStar className="text-yellow-500" />
 <span className="font-semibold">{nanny.rating}</span>
 </div>
 <p className="text-xs text-soft">({nanny.reviews} reviews)</p>
 </div>
 </div>

 {/* Verification Badges */}
 <div className="flex gap-2 mb-3">
 {nanny.verified && (
 <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1">
 <FaShieldAlt />
 Verified
 </span>
 )}
 {nanny.backgroundCheck && (
 <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex items-center gap-1">
 <FaUserCheck />
 Background Check
 </span>
 )}
 </div>

 <p className="text-soft text-sm mb-3 line-clamp-2">{nanny.bio}</p>

 {/* Skills */}
 <div className="flex flex-wrap gap-2 mb-3">
 {nanny.skills.slice(0, 3).map((skill, idx) => (
 <span key={idx} className="px-2 py-1 bg-subtle text-soft rounded text-xs">
 {skill}
 </span>
 ))}
 </div>

 {/* Languages */}
 <div className="flex items-center gap-2 text-sm text-soft mb-3">
 <FaLanguage />
 <span>{nanny.languages.join(", ")}</span>
 </div>

 {/* Pricing */}
 <div className="border-t pt-3 mb-3">
 <div className="flex justify-between text-sm">
 <span className="text-soft">Hourly</span>
 <span className="font-semibold">Rs {nanny.hourlyRate}/hr</span>
 </div>
 <div className="flex justify-between text-sm">
 <span className="text-soft">Daily</span>
 <span className="font-semibold">Rs {nanny.dailyRate}/day</span>
 </div>
 </div>

 <button
 onClick={() => handleSelectNanny(nanny)}
 className="w-full btn-gradient py-2"
 >
 View Profile
 </button>
 </div>
 </div>
 ))}
 </div>
 </>
 ) : (
 /* Booking Form */
 <div className="max-w-3xl mx-auto">
 <div className="bg-surface rounded-2xl p-6 shadow-lg">
 <h2 className="text-xl font-bold mb-6">Complete Your Booking</h2>
 
 {/* Selected Nanny and Service */}
 <div className="bg-subtle rounded-lg p-4 mb-6">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="text-3xl">{selectedNanny?.avatar}</div>
 <div>
 <p className="font-semibold">{selectedNanny?.name}</p>
 <p className="text-sm text-soft">{selectedService?.name}</p>
 </div>
 </div>
 <button
 onClick={() => setShowBookingForm(false)}
 className="text-primary-blue hover:underline text-sm"
 >
 Change
 </button>
 </div>
 </div>

 {/* Booking Dates */}
 <div className="grid md:grid-cols-2 gap-4 mb-6">
 <div>
 <label className="block text-soft text-sm font-medium mb-2">Start Date</label>
 <input
 type="date"
 value={bookingDetails.startDate}
 onChange={(e) => setBookingDetails({ ...bookingDetails, startDate: e.target.value })}
 className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary-blue"
 />
 </div>
 <div>
 <label className="block text-soft text-sm font-medium mb-2">End Date</label>
 <input
 type="date"
 value={bookingDetails.endDate}
 onChange={(e) => setBookingDetails({ ...bookingDetails, endDate: e.target.value })}
 className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary-blue"
 />
 </div>
 <div>
 <label className="block text-soft text-sm font-medium mb-2">Start Time</label>
 <input
 type="time"
 value={bookingDetails.startTime}
 onChange={(e) => setBookingDetails({ ...bookingDetails, startTime: e.target.value })}
 className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary-blue"
 />
 </div>
 <div>
 <label className="block text-soft text-sm font-medium mb-2">End Time</label>
 <input
 type="time"
 value={bookingDetails.endTime}
 onChange={(e) => setBookingDetails({ ...bookingDetails, endTime: e.target.value })}
 className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary-blue"
 />
 </div>
 </div>

 {/* Children Information */}
 <div className="mb-6">
 <h3 className="font-semibold mb-3">Children Information</h3>
 <div className="grid md:grid-cols-2 gap-4">
 <div>
 <label className="block text-soft text-sm font-medium mb-2">Number of Children</label>
 <input
 type="number"
 min="1"
 value={bookingDetails.numberOfChildren}
 onChange={(e) => setBookingDetails({ 
 ...bookingDetails, 
 numberOfChildren: parseInt(e.target.value),
 childrenAges: new Array(parseInt(e.target.value)).fill(0)
 })}
 className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary-blue"
 />
 </div>
 <div>
 <label className="block text-soft text-sm font-medium mb-2">Ages</label>
 <input
 type="text"
 placeholder="e.g., 2, 5, 8"
 className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary-blue"
 />
 </div>
 </div>
 </div>

 {/* Service Address */}
 <div className="mb-6">
 <label className="block text-soft text-sm font-medium mb-2">Service Address</label>
 <textarea
 value={bookingDetails.address}
 onChange={(e) => setBookingDetails({ ...bookingDetails, address: e.target.value })}
 rows={2}
 className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary-blue"
 placeholder="Enter your complete address"
 />
 </div>

 {/* Emergency Contact */}
 <div className="mb-6">
 <h3 className="font-semibold mb-3">Emergency Contact</h3>
 <div className="grid md:grid-cols-3 gap-4">
 <div>
 <label className="block text-soft text-sm font-medium mb-2">Name</label>
 <input
 type="text"
 value={bookingDetails.emergencyContact.name}
 onChange={(e) => setBookingDetails({
 ...bookingDetails,
 emergencyContact: { ...bookingDetails.emergencyContact, name: e.target.value }
 })}
 className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary-blue"
 />
 </div>
 <div>
 <label className="block text-soft text-sm font-medium mb-2">Phone</label>
 <input
 type="tel"
 value={bookingDetails.emergencyContact.phone}
 onChange={(e) => setBookingDetails({
 ...bookingDetails,
 emergencyContact: { ...bookingDetails.emergencyContact, phone: e.target.value }
 })}
 className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary-blue"
 />
 </div>
 <div>
 <label className="block text-soft text-sm font-medium mb-2">Relationship</label>
 <input
 type="text"
 value={bookingDetails.emergencyContact.relationship}
 onChange={(e) => setBookingDetails({
 ...bookingDetails,
 emergencyContact: { ...bookingDetails.emergencyContact, relationship: e.target.value }
 })}
 className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary-blue"
 />
 </div>
 </div>
 </div>

 {/* Special Requirements */}
 <div className="mb-6">
 <label className="block text-soft text-sm font-medium mb-2">Special Requirements (Optional)</label>
 <textarea
 value={bookingDetails.specialRequirements}
 onChange={(e) => setBookingDetails({ ...bookingDetails, specialRequirements: e.target.value })}
 rows={3}
 className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-primary-blue"
 placeholder="Any allergies, medical conditions, or special instructions..."
 />
 </div>

 {/* Total Amount */}
 <div className="bg-blue-50 rounded-lg p-4 mb-6">
 <div className="flex justify-between items-center">
 <span className="text-soft">Estimated Total</span>
 <span className="text-2xl font-bold text-primary-blue">Rs {calculateTotal()}</span>
 </div>
 <p className="text-xs text-soft mt-2">Final amount will be calculated based on actual hours</p>
 </div>

 {/* Actions */}
 <div className="flex gap-4">
 <button
 onClick={() => setShowBookingForm(false)}
 className="flex-1 px-6 py-3 border border-line text-soft rounded-lg hover:bg-subtle"
 >
 Back
 </button>
 <button className="flex-1 btn-gradient py-3">
 Confirm Booking
 </button>
 </div>
 </div>

 {/* Safety Guidelines */}
 <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
 <FaShieldAlt className="text-green-500 mb-2" />
 <h4 className="font-semibold text-green-900 mb-2">Safety & Trust</h4>
 <ul className="text-sm text-green-800 space-y-1">
 <li> All nannies undergo thorough background checks</li>
 <li> Regular training on child safety and first aid</li>
 <li> 24/7 support available for any concerns</li>
 <li> Insurance coverage for all bookings</li>
 </ul>
 </div>
 </div>
 )}

 {/* Nanny Details Modal */}
 {showNannyDetails && selectedNanny && (
 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
 <div className="bg-surface rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
 <div className="flex justify-between items-start mb-6">
 <div className="flex items-center gap-4">
 <div className="text-5xl">{selectedNanny.avatar}</div>
 <div>
 <h2 className="text-2xl font-bold">{selectedNanny.name}</h2>
 <p className="text-soft">{selectedNanny.age} years  {selectedNanny.experience}</p>
 </div>
 </div>
 <button
 onClick={() => setShowNannyDetails(false)}
 className="text-soft hover:text-soft text-2xl"
 >
 
 </button>
 </div>

 {/* Profile Content */}
 <div className="space-y-6">
 {/* Bio */}
 <div>
 <h3 className="font-semibold mb-2">About</h3>
 <p className="text-soft">{selectedNanny.bio}</p>
 </div>

 {/* Qualifications */}
 <div>
 <h3 className="font-semibold mb-2">Qualifications</h3>
 <div className="flex flex-wrap gap-2">
 <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
 <FaGraduationCap className="inline mr-1" />
 {selectedNanny.education}
 </span>
 {selectedNanny.certifications.map((cert, idx) => (
 <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
 <FaCertificate className="inline mr-1" />
 {cert}
 </span>
 ))}
 </div>
 </div>

 {/* Specializations */}
 <div>
 <h3 className="font-semibold mb-2">Specializations</h3>
 <div className="flex flex-wrap gap-2">
 {selectedNanny.specializations.map((spec, idx) => (
 <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
 {spec}
 </span>
 ))}
 </div>
 </div>

 {/* Skills */}
 <div>
 <h3 className="font-semibold mb-2">Skills</h3>
 <div className="grid grid-cols-2 gap-2">
 {selectedNanny.skills.map((skill, idx) => (
 <div key={idx} className="flex items-center gap-2">
 <FaCheckCircle className="text-green-500" />
 <span className="text-soft">{skill}</span>
 </div>
 ))}
 </div>
 </div>

 {/* Availability */}
 <div>
 <h3 className="font-semibold mb-2">Availability</h3>
 <div className="flex gap-2">
 {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
 <span
 key={day}
 className={`px-3 py-1 rounded ${
 selectedNanny.availability.includes(day)
 ? "bg-green-100 text-green-800"
 : "bg-subtle text-faint"
 }`}
 >
 {day}
 </span>
 ))}
 </div>
 </div>

 {/* Reviews */}
 <div>
 <h3 className="font-semibold mb-2">Recent Reviews</h3>
 <div className="space-y-3">
 {([] as Review[]).map((review) => (
 <div key={review.id} className="border-b pb-3">
 <div className="flex items-center justify-between mb-1">
 <p className="font-medium">{review.parentName}</p>
 <div className="flex items-center gap-1">
 {[...Array(5)].map((_, i) => (
 <FaStar key={i} className={i < review.rating ? "text-yellow-500" : "text-faint"} />
 ))}
 </div>
 </div>
 <p className="text-soft text-sm">{review.comment}</p>
 <p className="text-soft text-xs mt-1">{review.date}</p>
 </div>
 ))}
 </div>
 </div>

 {/* Action Buttons */}
 <div className="flex gap-4">
 <button
 onClick={() => setShowNannyDetails(false)}
 className="flex-1 px-6 py-3 border border-line text-soft rounded-lg hover:bg-subtle"
 >
 Close
 </button>
 <button
 onClick={handleBookNanny}
 className="flex-1 btn-gradient py-3"
 disabled={!selectedService}
 >
 Book Now
 </button>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 )
}
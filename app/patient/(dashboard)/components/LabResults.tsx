import React, { useState, useEffect, useCallback } from 'react'
import { Patient } from '@/lib/data/patients'
import BookingsList, { BookingItem } from '@/components/booking/BookingsList'
import ProviderPageHeader from '@/components/booking/ProviderPageHeader'
import ProviderSearchSelect, { ProviderOption } from '@/components/booking/ProviderSearchSelect'
import {
 FaFlask,
 FaCheckCircle,
 FaSearch,
 FaFilter,
 FaPlus,
 FaHome,
 FaHospital,
 FaStar,
 FaChevronDown,
 FaChevronUp,
 FaPercent,
 FaTimes,
 FaSpinner,
 FaEye,
 FaClipboardCheck,
} from 'react-icons/fa'

interface Props {
 patientData: Patient
}

interface LabTest {
 id: string
 name: string
 category: string
 price: number
 duration: string
 preparation: string
 description: string
 popular: boolean
 discount?: number
 requirements: string[]
 sampleType: string
 methodology: string
 accuracy: number
}

// availableTests fetched from API in component

interface LabBookingData {
 id: string
 testName: string
 date: string
 facility: string
 status: string
 notes?: string
 resultFindings?: string
 resultNotes?: string
 resultDate?: string
}

const LabResults: React.FC<Props> = () => {
 const [showBookingForm, setShowBookingForm] = useState(false)
 const [labBookings, setLabBookings] = useState<LabBookingData[]>([])
 const [loadingBookings, setLoadingBookings] = useState(true)
 const [availableTests, setAvailableTests] = useState<LabTest[]>([])
 const [loadingTests, setLoadingTests] = useState(false)
 const [availableLabTechs, setAvailableLabTechs] = useState<ProviderOption[]>([])
 const [selectedLabTechId, setSelectedLabTechId] = useState('')
 const [loadingLabTechs, setLoadingLabTechs] = useState(false)

 // Booking form state
 const [selectedTests, setSelectedTests] = useState<string[]>([])
 const [collectionType, setCollectionType] = useState<'home' | 'clinic'>('clinic')
 const [scheduledDate, setScheduledDate] = useState('')
 const [scheduledTime, setScheduledTime] = useState('')
 const [notes, setNotes] = useState('')
 const [isSubmitting, setIsSubmitting] = useState(false)
 const [submitError, setSubmitError] = useState('')
 const [submitSuccess, setSubmitSuccess] = useState(false)
 const [searchQuery, setSearchQuery] = useState('')
 const [selectedCategory, setSelectedCategory] = useState('all')
 const [showFilters, setShowFilters] = useState(false)
 const [expandedTest, setExpandedTest] = useState<string | null>(null)
 const [viewResultModal, setViewResultModal] = useState(false)
 const [viewResultData, setViewResultData] = useState<LabBookingData | null>(null)

 // Fetch available lab techs when booking form opens
 useEffect(() => {
 if (!showBookingForm) return
 const fetchLabTechs = async () => {
 setLoadingLabTechs(true)
 try {
 const res = await fetch('/api/search/providers?type=LAB_TECHNICIAN')
 if (res.ok) {
 const json = await res.json()
 if (json.success && json.data) {
  
 setAvailableLabTechs(json.data.map((lt: any) => ({
 id: lt.id,
 userId: lt.id,
 name: `${lt.firstName} ${lt.lastName}`,
 subtitle: `${lt.testCount || 0} tests available`,
 tags: lt.specializations?.slice(0, 3) || [],
 })))
 }
 }
 } catch (error) {
 console.error('Failed to fetch lab techs:', error)
 } finally {
 setLoadingLabTechs(false)
 }
 }
 fetchLabTechs()
 }, [showBookingForm])

 // Fetch tests for selected lab tech
 useEffect(() => {
 if (!selectedLabTechId) {
 setAvailableTests([])
 return
 }
 const fetchTests = async () => {
 setLoadingTests(true)
 try {
 const res = await fetch(`/api/providers/${selectedLabTechId}/tests`, { credentials: 'include' })
 if (res.ok) {
 const json = await res.json()
 if (json.success && json.data) {
  
 setAvailableTests(json.data.map((t: any) => ({
 id: t.id,
 name: t.testName,
 category: t.category,
 price: t.price,
 duration: t.turnaroundTime || '24 hours',
 preparation: t.preparation || 'No special preparation',
 description: t.description,
 sampleType: t.sampleType,
 requirements: t.preparation ? [t.preparation] : [],
 methodology: '',
 accuracy: 0,
 })))
 }
 }
 } catch (error) {
 console.error('Failed to fetch lab tests:', error)
 } finally {
 setLoadingTests(false)
 }
 }
 fetchTests()
 }, [selectedLabTechId])

 // Fetch lab test bookings for this patient
 const fetchBookings = useCallback(async () => {
 try {
 const res = await fetch('/api/bookings/unified?role=patient', { credentials: 'include' })
 if (res.ok) {
 const json = await res.json()
 if (json.success && json.data) {
  
 const labItems = json.data.filter((b: any) => b.type === 'lab-test').map((b: any) => ({
 id: b.id,
 testName: b.detail || b.testName || 'Lab Test',
 date: new Date(b.scheduledAt).toISOString().split('T')[0],
 facility: b.providerName || 'Lab',
 status: b.status,
 resultFindings: b.resultFindings,
 resultNotes: b.resultNotes,
 resultDate: b.resultDate,
 }))
 setLabBookings(labItems)
 }
 }
 } catch (error) {
 console.error('Failed to fetch lab bookings:', error)
 } finally {
 setLoadingBookings(false)
 }
 }, [])

 useEffect(() => {
 fetchBookings()
 }, [fetchBookings])

 const categories = ['all', ...Array.from(new Set(availableTests.map(t => t.category)))]

 const filteredTests = availableTests.filter(test => {
 const matchesSearch = test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
 test.category.toLowerCase().includes(searchQuery.toLowerCase())
 const matchesCategory = selectedCategory === 'all' || test.category === selectedCategory
 return matchesSearch && matchesCategory
 })

 const calculateTotal = () => {
 let total = selectedTests.reduce((sum, testId) => {
 const test = availableTests.find(t => t.id === testId)
 const price = test?.price || 0
 const discount = test?.discount || 0
 return sum + (price * (1 - discount / 100))
 }, 0)
 if (collectionType === 'home') total += 200
 return Math.round(total)
 }

 const resetBookingForm = () => {
 setSelectedLabTechId('')
 setSelectedTests([])
 setCollectionType('clinic')
 setScheduledDate('')
 setScheduledTime('')
 setNotes('')
 setSubmitError('')
 setSubmitSuccess(false)
 setSearchQuery('')
 setSelectedCategory('all')
 setExpandedTest(null)
 }

 const handleBookingSubmit = async () => {
 if (selectedTests.length === 0 || !scheduledDate || !scheduledTime) return
 setIsSubmitting(true)
 setSubmitError('')

 const testNames = selectedTests.map(id => availableTests.find(t => t.id === id)?.name).filter(Boolean).join(', ')
 const sampleTypes = selectedTests.map(id => availableTests.find(t => t.id === id)?.sampleType).filter(Boolean).join(', ')

 try {
 const res = await fetch('/api/bookings', {
 method: 'POST',
 credentials: 'include',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 providerType: 'LAB_TECHNICIAN',
 labTechId: selectedLabTechId,
 testName: testNames,
 scheduledDate,
 scheduledTime,
 sampleType: sampleTypes || 'Blood',
 notes: `Collection: ${collectionType === 'home' ? 'Home Collection' : 'Lab Visit'}${notes ? '. ' + notes : ''}`,
 price: calculateTotal(),
 }),
 })
 const data = await res.json()
 if (data.success) {
 setSubmitSuccess(true)
 setTimeout(() => {
 setShowBookingForm(false)
 resetBookingForm()
 fetchBookings()
 }, 1500)
 } else {
 setSubmitError(data.message || 'Booking failed. Please try again.')
 }
 } catch {
 setSubmitError('Network error. Please try again.')
 } finally {
 setIsSubmitting(false)
 }
 }

 const canSubmit = selectedTests.length > 0 && scheduledDate && scheduledTime && !isSubmitting

 // Map lab test bookings to BookingItem format
 const bookingItems: BookingItem[] = labBookings.map((b) => ({
 id: b.id,
 providerName: b.facility,
 date: b.date,
 time: '',
 status: b.status,
 service: b.testName,
 notes: b.notes,
 details: [
 { label: 'Test Name', value: b.testName },
 { label: 'Facility', value: b.facility },
 ...(b.resultDate ? [{ label: 'Result Date', value: new Date(b.resultDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) }] : []),
 ],
 }))

 // Separate completed bookings with results
 const completedWithResults = labBookings.filter(b => b.status === 'completed' && b.resultFindings)

 // Generate available dates (next 14 days)
 const getAvailableDates = () => {
 const dates: { date: string; label: string }[] = []
 const today = new Date()
 for (let i = 1; i <= 14; i++) {
 const d = new Date(today)
 d.setDate(today.getDate() + i)
 if (d.getDay() !== 0) { // Skip Sundays
 dates.push({
 date: d.toISOString().split('T')[0],
 label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
 })
 }
 }
 return dates
 }

 const timeSlots = ['07:00', '08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00']

 const renderBookingForm = () => (
 <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
 <div className="bg-surface rounded-xl sm:rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
 <div className="p-4 sm:p-5 md:p-6 border-b border-cyan-200">
 <div className="flex items-center justify-between">
 <h3 className="text-lg sm:text-xl font-bold text-fg">Book Lab Test</h3>
 <button
 onClick={() => { setShowBookingForm(false); resetBookingForm() }}
 className="p-1.5 sm:p-2 text-faint hover:text-soft rounded-lg hover:bg-subtle"
 >
 <FaTimes className="text-lg sm:text-xl" />
 </button>
 </div>
 </div>

 <div className="p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 md:space-y-6">
 {submitSuccess ? (
 <div className="text-center py-8">
 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
 <FaCheckCircle className="text-green-500 text-3xl" />
 </div>
 <h4 className="text-lg font-semibold text-fg mb-2">Booking Submitted!</h4>
 <p className="text-soft text-sm">Your lab test booking has been confirmed. You will receive details shortly.</p>
 </div>
 ) : (
 <>
 {/* Step 1: Select Lab */}
 <ProviderSearchSelect
 providers={availableLabTechs}
 selectedId={selectedLabTechId}
 onSelect={(id) => { setSelectedLabTechId(id); setSelectedTests([]) }}
 loading={loadingLabTechs}
 label="Select Laboratory"
 placeholder="Search labs by name, specialization..."
 accentColor="cyan"
 avatarGradient=" "
 />

 {/* Step 2: Select Tests */}
 <div>
 <h4 className="font-semibold text-fg mb-3 text-sm sm:text-base">
 Select Tests <span className="text-red-500">*</span>
 </h4>

 {!selectedLabTechId ? (
 <p className="text-sm text-faint py-3">Select a laboratory first to see available tests</p>
 ) : loadingTests ? (
 <div className="flex items-center justify-center py-6">
 <FaSpinner className="animate-spin text-cyan-500 mr-2" />
 <span className="text-sm text-soft">Loading available tests...</span>
 </div>
 ) : availableTests.length === 0 ? (
 <p className="text-sm text-soft py-3">No tests available from this laboratory</p>
 ) : (
 <>
 {/* Search & Filter */}
 <div className="flex gap-2 mb-3">
 <div className="flex-1 relative">
 <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-faint text-sm" />
 <input
 type="text"
 placeholder="Search tests..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-9 pr-3 py-2 border border-line rounded-lg focus:outline-none focus:border-cyan-500 text-sm"
 />
 </div>
 <button
 onClick={() => setShowFilters(!showFilters)}
 className="px-3 py-2 bg-subtle text-soft rounded-lg hover:bg-line transition flex items-center gap-1.5 text-sm"
 >
 <FaFilter />
 {showFilters ? <FaChevronUp /> : <FaChevronDown />}
 </button>
 </div>
 {showFilters && (
 <div className="mb-3">
 <select
 value={selectedCategory}
 onChange={(e) => setSelectedCategory(e.target.value)}
 className="w-full px-3 py-2 border border-line rounded-lg text-sm"
 >
 {categories.map(cat => (
 <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
 ))}
 </select>
 </div>
 )}

 <div className="space-y-2 max-h-64 overflow-y-auto">
 {filteredTests.map((test) => {
 const isSelected = selectedTests.includes(test.id)
 const discountedPrice = test.discount ? Math.round(test.price * (1 - test.discount / 100)) : test.price
 return (
 <div key={test.id} className="border rounded-lg overflow-hidden">
 <button
 onClick={() => setSelectedTests(prev =>
 prev.includes(test.id) ? prev.filter(id => id !== test.id) : [...prev, test.id]
 )}
 className={`w-full p-3 text-left transition ${
 isSelected
 ? 'bg-cyan-100 border-cyan-500 ring-1 ring-cyan-300'
 : 'bg-surface'
 }`}
 >
 <div className="flex items-center gap-3">
 <div className={`w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0 ${
 isSelected ? 'bg-cyan-600 border-cyan-600' : 'border-line'
 }`}>
 {isSelected && <FaCheckCircle className="text-white text-xs" />}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 flex-wrap">
 <h5 className="font-semibold text-fg text-sm">{test.name}</h5>
 {test.popular && (
 <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs flex items-center gap-0.5">
 <FaStar className="text-xs" /> Popular
 </span>
 )}
 {test.discount && (
 <span className="px-1.5 py-0.5 bg-green-100 text-green-800 rounded text-xs flex items-center gap-0.5">
 <FaPercent className="text-xs" /> {test.discount}% Off
 </span>
 )}
 </div>
 <div className="flex items-center gap-3 text-xs text-soft mt-1">
 <span>{test.category}</span>
 <span>{test.duration}</span>
 <span>{test.sampleType}</span>
 </div>
 </div>
 <div className="text-right flex-shrink-0">
 {test.discount ? (
 <>
 <p className="font-bold text-green-600 text-sm">Rs {discountedPrice}</p>
 <p className="text-xs text-faint line-through">Rs {test.price}</p>
 </>
 ) : (
 <p className="font-bold text-fg text-sm">Rs {test.price}</p>
 )}
 </div>
 </div>
 </button>
 {isSelected && (
 <button
 onClick={() => setExpandedTest(expandedTest === test.id ? null : test.id)}
 className="w-full px-3 py-1.5 bg-cyan-50 text-cyan-700 text-xs hover:bg-cyan-100 flex items-center gap-1 justify-center"
 >
 {expandedTest === test.id ? 'Hide details' : 'Show details'}
 {expandedTest === test.id ? <FaChevronUp /> : <FaChevronDown />}
 </button>
 )}
 {expandedTest === test.id && (
 <div className="px-3 py-2 bg-subtle border-t text-xs space-y-1">
 <p className="text-soft">{test.description}</p>
 <p><span className="font-medium">Preparation:</span> {test.preparation}</p>
 <p><span className="font-medium">Methodology:</span> {test.methodology} ({test.accuracy}% accuracy)</p>
 </div>
 )}
 </div>
 )
 })}
 </div>
 {selectedTests.length > 0 && (
 <p className="text-sm text-cyan-700 mt-2 font-medium">{selectedTests.length} test(s) selected</p>
 )}
 </>
 )}
 </div>

 {/* Step 3: Collection Type */}
 <div>
 <h4 className="font-semibold text-fg mb-3 text-sm sm:text-base">Collection Type</h4>
 <div className="grid grid-cols-2 gap-2 sm:gap-3">
 <button
 onClick={() => setCollectionType('clinic')}
 className={`p-3 border rounded-lg text-center transition ${
 collectionType === 'clinic'
 ? 'bg-cyan-100 border-cyan-500 ring-2 ring-cyan-300'
 : 'border-line hover:border-cyan-300 hover:bg-cyan-50'
 }`}
 >
 <FaHospital className={`mx-auto text-lg mb-1 ${collectionType === 'clinic' ? 'text-cyan-600' : 'text-faint'}`} />
 <p className="text-xs sm:text-sm font-medium">Visit Lab</p>
 <p className="text-xs text-green-600">No extra charge</p>
 </button>
 <button
 onClick={() => setCollectionType('home')}
 className={`p-3 border rounded-lg text-center transition ${
 collectionType === 'home'
 ? 'bg-cyan-100 border-cyan-500 ring-2 ring-cyan-300'
 : 'border-line hover:border-cyan-300 hover:bg-cyan-50'
 }`}
 >
 <FaHome className={`mx-auto text-lg mb-1 ${collectionType === 'home' ? 'text-cyan-600' : 'text-faint'}`} />
 <p className="text-xs sm:text-sm font-medium">Home Collection</p>
 <p className="text-xs text-orange-600">+Rs 200</p>
 </button>
 </div>
 </div>

 {/* Step 3: Date & Time */}
 <div>
 <h4 className="font-semibold text-fg mb-3 text-sm sm:text-base">
 Select Date & Time <span className="text-red-500">*</span>
 </h4>
 <div className="space-y-3">
 <div className="flex flex-wrap gap-2">
 {getAvailableDates().slice(0, 7).map((d) => (
 <button
 key={d.date}
 onClick={() => setScheduledDate(d.date)}
 className={`px-3 py-2 border-2 rounded-lg text-xs sm:text-sm font-medium transition ${
 scheduledDate === d.date
 ? 'bg-cyan-600 text-white border-cyan-600 shadow-md'
 : 'border-line text-soft hover:border-cyan-400 hover:bg-cyan-50'
 }`}
 >
 {d.label}
 </button>
 ))}
 </div>
 {scheduledDate && (
 <div className="flex flex-wrap gap-1.5">
 {timeSlots.map((time) => (
 <button
 key={time}
 onClick={() => setScheduledTime(time)}
 className={`px-2.5 py-1.5 border-2 rounded-lg text-xs sm:text-sm font-medium transition ${
 scheduledTime === time
 ? 'bg-cyan-600 text-white border-cyan-600 shadow-md'
 : 'border-line text-soft hover:border-cyan-400 hover:bg-cyan-50'
 }`}
 >
 {(() => {
 const h = parseInt(time.split(':')[0], 10)
 const amPm = h >= 12 ? 'PM' : 'AM'
 return `${h % 12 || 12}:${time.split(':')[1]} ${amPm}`
 })()}
 </button>
 ))}
 </div>
 )}
 </div>
 </div>

 {/* Notes */}
 <div>
 <label className="block text-xs sm:text-sm font-medium text-soft mb-2">Additional Notes (optional)</label>
 <textarea
 rows={2}
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 className="w-full px-3 sm:px-4 py-2 border border-line rounded-lg focus:outline-none focus:border-cyan-500 text-sm"
 placeholder="Any specific requirements or medical conditions..."
 />
 </div>

 {/* Summary */}
 {canSubmit && (
 <div className="bg-surface rounded-lg p-4 border border-cyan-200">
 <h4 className="font-semibold text-fg mb-2 text-sm">Booking Summary</h4>
 <div className="space-y-1 text-xs sm:text-sm">
 <div><span className="text-soft">Tests:</span> <span className="font-medium">{selectedTests.map(id => availableTests.find(t => t.id === id)?.name).join(', ')}</span></div>
 <div className="grid grid-cols-2 gap-2">
 <div><span className="text-soft">Date:</span> <span className="font-medium">{new Date(scheduledDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span></div>
 <div><span className="text-soft">Time:</span> <span className="font-medium">{scheduledTime}</span></div>
 <div><span className="text-soft">Collection:</span> <span className="font-medium capitalize">{collectionType === 'home' ? 'Home Collection' : 'Lab Visit'}</span></div>
 <div><span className="text-soft">Total:</span> <span className="font-bold text-cyan-700">Rs {calculateTotal()}</span></div>
 </div>
 </div>
 </div>
 )}

 {/* Error */}
 {submitError && (
 <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
 {submitError}
 </div>
 )}

 {/* Actions */}
 <div className="flex gap-3 sm:gap-4">
 <button
 onClick={() => { setShowBookingForm(false); resetBookingForm() }}
 className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-sky-50 text-soft rounded-lg transition text-sm sm:text-base"
 >
 Cancel
 </button>
 <button
 onClick={handleBookingSubmit}
 disabled={!canSubmit}
 className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-surface transition text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
 >
 {isSubmitting ? (
 <>
 <FaSpinner className="animate-spin" />
 Booking...
 </>
 ) : (
 'Book Lab Test'
 )}
 </button>
 </div>
 </>
 )}
 </div>
 </div>
 </div>
 )

 if (loadingBookings) {
 return (
 <div className="flex items-center justify-center py-12">
 <FaSpinner className="animate-spin text-cyan-500 text-2xl" />
 </div>
 )
 }

 if (labBookings.length === 0) {
 return (
 <div className="space-y-4">
 <div className="bg-surface rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg text-center border border-cyan-200">
 <div className="bg-sky-50 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4">
 <FaFlask className="text-cyan-500 text-2xl sm:text-3xl" />
 </div>
 <h3 className="text-lg sm:text-xl font-semibold text-soft mb-2">No Lab Tests Yet</h3>
 <p className="text-soft mb-6 text-sm sm:text-base">Book your first lab test to start tracking your health</p>
 <button
 onClick={() => setShowBookingForm(true)}
 className="bg-surface transition-all transform hover:scale-105 flex items-center gap-2 mx-auto text-sm sm:text-base w-fit"
 >
 <FaPlus />
 Book Your First Lab Test
 </button>
 </div>
 {showBookingForm && renderBookingForm()}
 </div>
 )
 }

 return (
 <div className="space-y-4 sm:space-y-5 md:space-y-6">
 <ProviderPageHeader
 icon={FaFlask}
 title="Laboratory Testing"
 subtitle="Comprehensive lab testing and health screening"
 gradient=" "
 onBook={() => setShowBookingForm(true)}
 bookLabel="Book Lab Test"
 />

 {/* Bookings List (Reusable Component) */}
 <BookingsList
 bookings={bookingItems}
 providerLabel="Lab"
 accentColor="cyan"
 emptyMessage="No lab test bookings yet."
 />

 {/* Lab Results Section */}
 {completedWithResults.length > 0 && (
 <div className="bg-surface rounded-xl shadow-sm border border-line overflow-hidden">
 <div className="p-4 border-b border-line flex items-center gap-2">
 <FaClipboardCheck className="text-green-600" />
 <h3 className="font-semibold text-fg">Lab Test Results</h3>
 <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{completedWithResults.length}</span>
 </div>
 <div className="divide-y divide-line">
 {completedWithResults.map((b) => (
 <div key={b.id} className="p-4 flex items-center justify-between hover:bg-subtle transition">
 <div className="flex-1 min-w-0">
 <p className="font-medium text-fg text-sm">{b.testName}</p>
 <div className="flex items-center gap-3 text-xs text-soft mt-1">
 <span>{b.facility}</span>
 <span>{new Date(b.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
 {b.resultDate && (
 <span className="text-green-600">
 Result: {new Date(b.resultDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
 </span>
 )}
 </div>
 </div>
 <button
 onClick={() => { setViewResultData(b); setViewResultModal(true) }}
 className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-50 text-cyan-700 text-xs font-medium rounded-lg hover:bg-cyan-100 transition border border-cyan-200"
 >
 <FaEye className="text-[10px]" />
 See Result
 </button>
 </div>
 ))}
 </div>
 </div>
 )}

 {showBookingForm && renderBookingForm()}

 {/* View Result Modal */}
 {viewResultModal && viewResultData && (
 <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
 <div className="bg-surface rounded-xl max-w-lg w-full shadow-2xl">
 <div className="p-5 border-b border-line flex items-center justify-between">
 <div>
 <h3 className="text-lg font-bold text-fg">Test Result</h3>
 <p className="text-sm text-soft mt-0.5">{viewResultData.testName}</p>
 </div>
 <button
 onClick={() => setViewResultModal(false)}
 className="p-2 text-faint hover:text-soft rounded-lg hover:bg-subtle"
 >
 <FaTimes />
 </button>
 </div>
 <div className="p-5 space-y-4">
 <div className="grid grid-cols-2 gap-3 text-sm">
 <div>
 <span className="text-soft">Laboratory:</span>{' '}
 <span className="font-medium">{viewResultData.facility}</span>
 </div>
 <div>
 <span className="text-soft">Test Date:</span>{' '}
 <span className="font-medium">{new Date(viewResultData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
 </div>
 {viewResultData.resultDate && (
 <div className="col-span-2">
 <span className="text-soft">Result Date:</span>{' '}
 <span className="font-medium">{new Date(viewResultData.resultDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
 </div>
 )}
 </div>

 <div>
 <h4 className="text-sm font-semibold text-soft mb-1.5">Findings</h4>
 <div className="bg-subtle rounded-lg p-4 text-sm text-fg whitespace-pre-wrap border">
 {viewResultData.resultFindings}
 </div>
 </div>

 {viewResultData.resultNotes && (
 <div>
 <h4 className="text-sm font-semibold text-soft mb-1.5">Notes</h4>
 <div className="bg-blue-50 rounded-lg p-4 text-sm text-fg whitespace-pre-wrap border border-blue-100">
 {viewResultData.resultNotes}
 </div>
 </div>
 )}

 <button
 onClick={() => setViewResultModal(false)}
 className="w-full px-4 py-2.5 bg-subtle text-soft rounded-lg hover:bg-line transition text-sm font-medium"
 >
 Close
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 )
}

export default LabResults

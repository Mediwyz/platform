'use client'

import { useState, useEffect, useCallback } from 'react'
import { FaSearch, FaShieldAlt, FaStar, FaClock, FaCheckCircle, FaShoppingCart, FaExclamationTriangle, FaHeart, FaBaby, FaHandHoldingMedical, FaPercent, FaAmbulance, FaBuilding, FaUsers, FaMoneyBillWave, FaUserShield, FaCreditCard } from 'react-icons/fa'

// Insurance type icons mapping
const typeIcons = {
 "Individual": FaUserShield,
 "Family": FaUsers,
 "Senior": FaHeart,
 "Corporate": FaBuilding,
 "Specialized": FaBaby,
 "Group": FaHandHoldingMedical
}

// Insurance Plan interface (mapped from API response)
interface InsurancePlan {
 id: string
 name: string
 provider: string
 type: string
 coverage: string
 monthlyPremium: string
 annualPremium: string
 originalPrice: string
 discount: string
 rating: number
 reviews: number
 available: boolean
 description: string
 maxCoverage: string
 deductible: string
 copay: string
 networkHospitals: number
 waitingPeriod: string
 claimSettlement: string
 renewalBonus: string
 location: string
 features: string[]
 benefits: { name: string; coverage: string }[]
 exclusions: string[]
 ageLimit: string
 familyDiscount: string
 verified: boolean
 fastProcessing: boolean
 onlineQuote: boolean
 customerService: string
}

// Insurance Plan Card Component
interface InsurancePlanProps {
 plan: InsurancePlan
}

const InsurancePlanCard = ({ plan }: InsurancePlanProps) => {
 const TypeIcon = typeIcons[plan.type as keyof typeof typeIcons] || FaShieldAlt

 return (
 <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 overflow-hidden">
 <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-3">
 {/* Left: Icon + Info */}
 <div className="flex items-start gap-3 flex-1 min-w-0">
 <div className="relative flex-shrink-0">
 <div className="w-12 h-12 rounded-lg border-2 border-blue-100 flex items-center justify-center">
 <TypeIcon className="text-xl text-blue-600" />
 </div>
 {plan.verified && (
 <div className="absolute -bottom-0.5 -right-0.5 bg-blue-500 text-white rounded-full p-0.5">
 <FaCheckCircle className="text-[10px]" />
 </div>
 )}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-0.5 flex-wrap">
 <h3 className="text-sm font-bold text-gray-900 truncate">{plan.name}</h3>
 <span className="text-[10px] px-2 py-0.5 rounded-full font-medium border whitespace-nowrap bg-blue-50 text-blue-700 border-blue-200">
 {plan.type}
 </span>
 </div>
 <p className="text-xs text-blue-600 font-medium truncate mb-1">
 {plan.provider} &middot; {plan.coverage} Coverage
 </p>

 {/* Meta row */}
 <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mb-1.5">
 <span className="flex items-center gap-1">
 <FaStar className="text-yellow-500 text-[10px]" />
 <span className="font-semibold text-gray-700">{plan.rating}</span>
 <span className="text-gray-400">({plan.reviews})</span>
 </span>
 <span className="flex items-center gap-1">
 <FaMoneyBillWave className="text-[10px] text-gray-400" />
 <span>Max: {plan.maxCoverage}</span>
 </span>
 <span className="flex items-center gap-1">
 <FaBuilding className="text-[10px] text-gray-400" />
 <span>{plan.networkHospitals} Hospitals</span>
 </span>
 </div>

 {/* Tags */}
 <div className="flex flex-wrap items-center gap-1.5">
 {plan.available ? (
 <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
 <FaCheckCircle className="text-[8px]" /> Available
 </span>
 ) : (
 <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
 <FaExclamationTriangle className="text-[8px]" /> Unavailable
 </span>
 )}
 <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
 {plan.claimSettlement} Claims
 </span>
 {plan.fastProcessing && (
 <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
 <FaClock className="text-[8px]" /> Fast Processing
 </span>
 )}
 <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
 <FaPercent className="text-[8px]" /> {plan.discount}
 </span>
 </div>
 </div>
 </div>

 {/* Right: Price + Buttons */}
 <div className="flex flex-col items-stretch sm:items-end gap-2 flex-shrink-0 sm:border-l sm:border-gray-100 sm:pl-4 border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0">
 <div className="sm:text-right">
 <p className="text-sm font-bold text-gray-900 whitespace-nowrap">{plan.monthlyPremium}<span className="text-[10px] font-normal text-gray-400">/mo</span></p>
 <p className="text-[10px] text-gray-400 line-through whitespace-nowrap">{plan.originalPrice}/yr</p>
 </div>
 <div className="flex items-center gap-2">
 <button className="flex-1 sm:flex-none bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs font-medium transition-colors">
 Compare
 </button>
 <button className="flex-1 sm:flex-none bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-1">
 <FaShoppingCart className="text-[10px]" /> Get Quote
 </button>
 </div>
 </div>
 </div>
 </div>
 )
}

// Loading Animation Component
const LoadingAnimation = () => {
 return (
 <div className="flex flex-col items-center justify-center py-12">
 <div className="relative">
 <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-pulse"></div>
 <div className="absolute top-0 left-0 w-20 h-20 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
 <FaShieldAlt className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-600 text-2xl" />
 </div>
 <p className="mt-4 text-gray-600 font-medium animate-pulse">AI is finding the best insurance plans for you...</p>
 <div className="flex gap-1 mt-2">
 <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
 <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
 <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
 </div>
 </div>
 )
}

// Empty State Component
interface EmptyStateProps {
 onClear: () => void
}

const EmptyState = ({ onClear }: EmptyStateProps) => {
 return (
 <div className="text-center py-12">
 <FaShieldAlt className="text-6xl text-gray-300 mx-auto mb-4" />
 <h3 className="text-xl font-semibold text-gray-700 mb-2">No insurance plans found</h3>
 <p className="text-gray-500 mb-6">Try adjusting your search criteria or browse all available plans</p>
 <button 
 onClick={onClear}
 className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
 >
 Clear Filters
 </button>
 </div>
 )
}

// Main Component
export default function InsurancePage() {
 const [searchQuery, setSearchQuery] = useState('')
 const [insuranceType, setInsuranceType] = useState('all')
 const [budget, setBudget] = useState('all')
 const [isSearching, setIsSearching] = useState(false)
 const [allPlans, setAllPlans] = useState<InsurancePlan[]>([])
 const [searchResults, setSearchResults] = useState<InsurancePlan[]>([])
 const [hasSearched, setHasSearched] = useState(false)
 const [isLoading, setIsLoading] = useState(true)
 const [searchExamples] = useState([
 "Family health insurance",
 "Senior citizen coverage",
 "Maternity insurance plan",
 "Corporate group health",
 "Affordable health cover",
 "Comprehensive medical insurance"
 ])

 const formatCurrency = (amount: number) => {
 return `Rs ${amount.toLocaleString('en-US')}`
 }

 const fetchPlans = useCallback(async () => {
 try {
 setIsLoading(true)
 const res = await fetch('/api/search/providers?type=INSURANCE_REP')
 if (!res.ok) throw new Error('Failed to fetch insurance plans')
 const data = await res.json()
 interface ApiInsurancePlan {
 id: string
 planName?: string
 company?: string
 planType?: string
 monthlyPremium?: number
 annualPremium?: number
 coverageAmount?: number
 deductible?: number
 description?: string
 coverageDetails?: {
 type?: string
 copay?: number
 networkHospitals?: number
 waitingPeriod?: string
 claimSettlement?: string
 renewalBonus?: string
 features?: string[]
 benefits?: { name: string; coverage: string }[]
 exclusions?: string[]
 familyDiscount?: string
 }
 eligibility?: { ageLimit?: string }
 representative?: { verified?: boolean }
 }
 const mapped = (data || []).map((p: ApiInsurancePlan) => {
 const monthly = p.monthlyPremium || 0
 const annual = p.annualPremium || (monthly * 12)
 const originalPrice = Math.round(annual * 1.2)
 const discountPct = originalPrice > 0 ? Math.round(((originalPrice - annual) / originalPrice) * 100) : 0

 return {
 id: p.id,
 name: p.planName,
 provider: p.company || 'Insurance Provider',
 type: p.planType || 'Individual',
 coverage: p.coverageDetails?.type || 'Standard',
 monthlyPremium: formatCurrency(monthly),
 annualPremium: formatCurrency(annual),
 originalPrice: formatCurrency(originalPrice),
 discount: `${discountPct}% OFF`,
 rating: 4.7,
 reviews: Math.floor(Math.random() * 2000) + 100,
 available: true,
 description: p.description || '',
 maxCoverage: formatCurrency(p.coverageAmount || 0),
 deductible: formatCurrency(p.deductible || 0),
 copay: formatCurrency(p.coverageDetails?.copay || 500),
 networkHospitals: p.coverageDetails?.networkHospitals || 50,
 waitingPeriod: p.coverageDetails?.waitingPeriod || '30 days',
 claimSettlement: p.coverageDetails?.claimSettlement || '96%',
 renewalBonus: p.coverageDetails?.renewalBonus || '10% annually',
 location: 'Mauritius',
 features: p.coverageDetails?.features || [],
 benefits: p.coverageDetails?.benefits || [],
 exclusions: p.coverageDetails?.exclusions || [],
 ageLimit: p.eligibility?.ageLimit || '18-65 years',
 familyDiscount: p.coverageDetails?.familyDiscount || '20%',
 verified: p.representative?.verified || false,
 fastProcessing: true,
 onlineQuote: true,
 customerService: '24/7'
 }
 })
 setAllPlans(mapped)
 setSearchResults(mapped)
 } catch (err) {
 console.error('Error fetching insurance plans:', err)
 setAllPlans([])
 setSearchResults([])
 } finally {
 setIsLoading(false)
 }
 }, [])

 useEffect(() => {
 fetchPlans()
 }, [fetchPlans])

 const handleSearch = async () => {
 setIsSearching(true)
 setHasSearched(true)

 let results = [...allPlans]

 if (insuranceType !== 'all') {
 results = results.filter(plan =>
 plan.type.toLowerCase().includes(insuranceType.toLowerCase())
 )
 }

 if (budget !== 'all') {
 results = results.filter(plan => {
 const premium = parseInt(plan.monthlyPremium.replace(/[^\d]/g, ''))
 if (budget === '2000') return premium <= 2000
 if (budget === '5000') return premium > 2000 && premium <= 5000
 if (budget === '10000') return premium > 5000 && premium <= 10000
 return premium > 10000
 })
 }

 if (searchQuery) {
 const lowerQuery = searchQuery.toLowerCase()
 results = results.filter(plan =>
 plan.name.toLowerCase().includes(lowerQuery) ||
 plan.provider.toLowerCase().includes(lowerQuery) ||
 plan.description.toLowerCase().includes(lowerQuery) ||
 (plan.features || []).some((f: string) => f.toLowerCase().includes(lowerQuery)) ||
 (plan.benefits || []).some((b: { name: string; coverage: string }) => (b.name || '').toLowerCase().includes(lowerQuery)) ||
 plan.coverage.toLowerCase().includes(lowerQuery)
 )
 }

 setSearchResults(results)
 setIsSearching(false)
 }

 const handleClearFilters = () => {
 setSearchQuery('')
 setInsuranceType('all')
 setBudget('all')
 setSearchResults(allPlans)
 setHasSearched(false)
 }

 const handleExampleClick = (example: string) => {
 setSearchQuery(example)
 }

 return (
 <div className="min-h-screen to-white">
 <div className="container mx-auto px-4 py-8">
 <div>
 <div className="bg-white rounded-xl shadow-xl p-4">
 <div>
 <div className="flex flex-col gap-4">
 <div className="relative">
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Search insurance plans (e.g., 'family health insurance', 'senior citizen plan', 'maternity cover')"
 className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-base"
 />
 <FaSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
 </div>
 
 {/* Example Searches */}
 {!hasSearched && (
 <div className="flex flex-wrap gap-2">
 <span className="text-sm text-gray-500">Popular searches:</span>
 {searchExamples.map((example, index) => (
 <button
 key={index}
 type="button"
 onClick={() => handleExampleClick(example)}
 className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
 >
 {example}
 </button>
 ))}
 </div>
 )}
 
 <div className="flex flex-col md:flex-row gap-4">
 <select 
 value={insuranceType}
 onChange={(e) => setInsuranceType(e.target.value)}
 className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
 >
 <option value="all">All Insurance Types</option>
 <option value="individual">Individual Plans</option>
 <option value="family">Family Plans</option>
 <option value="senior">Senior Citizen</option>
 <option value="corporate">Corporate Group</option>
 <option value="specialized">Specialized Plans</option>
 </select>
 
 <select 
 value={budget}
 onChange={(e) => setBudget(e.target.value)}
 className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
 >
 <option value="all">All Budgets</option>
 <option value="2000">Under Rs 2,000/month</option>
 <option value="5000">Rs 2,000 - 5,000/month</option>
 <option value="10000">Rs 5,000 - 10,000/month</option>
 <option value="above">Above Rs 10,000/month</option>
 </select>
 
 <button 
 type="button"
 onClick={handleSearch}
 className="bg-brand-navy text-white px-8 py-2.5 rounded-xl transition-all duration-200 font-medium flex items-center justify-center gap-2 min-w-[150px]"
 >
 <FaSearch />
 Find Plans
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>
 
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 mb-8">
 <div className="bg-white rounded-lg shadow p-4 text-center">
 <FaShieldAlt className="text-3xl text-blue-600 mx-auto mb-2" />
 <p className="text-lg font-bold text-gray-900">200+</p>
 <p className="text-sm text-gray-600">Insurance Plans</p>
 </div>
 <div className="bg-white rounded-lg shadow p-4 text-center">
 <FaBuilding className="text-3xl text-green-600 mx-auto mb-2" />
 <p className="text-lg font-bold text-gray-900">500+</p>
 <p className="text-sm text-gray-600">Network Hospitals</p>
 </div>
 <div className="bg-white rounded-lg shadow p-4 text-center">
 <FaCheckCircle className="text-3xl text-purple-600 mx-auto mb-2" />
 <p className="text-lg font-bold text-gray-900">98%</p>
 <p className="text-sm text-gray-600">Claim Settlement</p>
 </div>
 <div className="bg-white rounded-lg shadow p-4 text-center">
 <FaUsers className="text-3xl text-orange-600 mx-auto mb-2" />
 <p className="text-lg font-bold text-gray-900">50,000+</p>
 <p className="text-sm text-gray-600">Happy Customers</p>
 </div>
 </div>
 
 <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
 <div className="flex items-start gap-3">
 <FaExclamationTriangle className="text-yellow-600 text-xl mt-1 flex-shrink-0" />
 <div>
 <h4 className="font-semibold text-yellow-800 mb-1">Important Insurance Advisory</h4>
 <p className="text-sm text-yellow-700">
 Health insurance is a crucial financial protection. Compare plans carefully, understand terms and conditions, 
 and consider your specific health needs of family . Consult with our insurance experts for personalized advice.
 </p>
 </div>
 </div>
 </div>
 
 <div className="mt-12">
 {isLoading || isSearching ? (
 <LoadingAnimation />
 ) : searchResults.length > 0 ? (
 <>
 {hasSearched && (
 <div className="mb-6 flex items-center justify-between">
 <p className="text-gray-600">
 Found <span className="font-semibold text-gray-900">{searchResults.length}</span> insurance plans matching your search
 </p>
 <button
 onClick={handleClearFilters}
 className="text-blue-600 hover:text-blue-700 font-medium"
 >
 Clear filters
 </button>
 </div>
 )}
 
 <div className="flex flex-col gap-4">
 {searchResults.map((plan) => (
 <InsurancePlanCard key={plan.id} plan={plan} />
 ))}
 </div>
 </>
 ) : hasSearched ? (
 <EmptyState onClear={handleClearFilters} />
 ) : null}
 </div>
 
 <div className="mt-16">
 <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Types of Health Insurance</h2>
 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
 <div className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer text-center">
 <FaUserShield className="text-3xl text-blue-500 mx-auto mb-2" />
 <h3 className="font-semibold text-sm">Individual</h3>
 </div>
 <div className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer text-center">
 <FaUsers className="text-3xl text-green-500 mx-auto mb-2" />
 <h3 className="font-semibold text-sm">Family</h3>
 </div>
 <div className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer text-center">
 <FaHeart className="text-3xl text-red-500 mx-auto mb-2" />
 <h3 className="font-semibold text-sm">Senior Citizen</h3>
 </div>
 <div className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer text-center">
 <FaBuilding className="text-3xl text-purple-500 mx-auto mb-2" />
 <h3 className="font-semibold text-sm">Corporate</h3>
 </div>
 <div className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer text-center">
 <FaBaby className="text-3xl text-pink-500 mx-auto mb-2" />
 <h3 className="font-semibold text-sm">Maternity</h3>
 </div>
 <div className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer text-center">
 <FaHandHoldingMedical className="text-3xl text-orange-500 mx-auto mb-2" />
 <h3 className="font-semibold text-sm">Critical Illness</h3>
 </div>
 </div>
 </div>
 
 {/* Popular Insurance Packages */}
 <div className="mt-16">
 <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Compare Popular Plans</h2>
 <div className="overflow-x-auto">
 <table className="w-full bg-white rounded-lg shadow-lg overflow-hidden">
 <thead className="bg-blue-50">
 <tr>
 <th className="px-6 py-4 text-left font-semibold text-gray-900">Features</th>
 <th className="px-6 py-4 text-center font-semibold text-gray-900">Basic Plan</th>
 <th className="px-6 py-4 text-center font-semibold text-gray-900 bg-blue-100">Premium Plan</th>
 <th className="px-6 py-4 text-center font-semibold text-gray-900">Family Plan</th>
 </tr>
 </thead>
 <tbody>
 <tr className="border-b">
 <td className="px-6 py-4 font-medium">Monthly Premium</td>
 <td className="px-6 py-4 text-center">Rs 1,800</td>
 <td className="px-6 py-4 text-center bg-blue-50">Rs 3,500</td>
 <td className="px-6 py-4 text-center">Rs 6,800</td>
 </tr>
 <tr className="border-b">
 <td className="px-6 py-4 font-medium">Sum Insured</td>
 <td className="px-6 py-4 text-center">Rs 5,00,000</td>
 <td className="px-6 py-4 text-center bg-blue-50">Rs 20,00,000</td>
 <td className="px-6 py-4 text-center">Rs 50,00,000</td>
 </tr>
 <tr className="border-b">
 <td className="px-6 py-4 font-medium">Hospitalization</td>
 <td className="px-6 py-4 text-center"><FaCheckCircle className="text-green-500 mx-auto" /></td>
 <td className="px-6 py-4 text-center bg-blue-50"><FaCheckCircle className="text-green-500 mx-auto" /></td>
 <td className="px-6 py-4 text-center"><FaCheckCircle className="text-green-500 mx-auto" /></td>
 </tr>
 <tr className="border-b">
 <td className="px-6 py-4 font-medium">OPD Coverage</td>
 <td className="px-6 py-4 text-center">-</td>
 <td className="px-6 py-4 text-center bg-blue-50"><FaCheckCircle className="text-green-500 mx-auto" /></td>
 <td className="px-6 py-4 text-center"><FaCheckCircle className="text-green-500 mx-auto" /></td>
 </tr>
 <tr className="border-b">
 <td className="px-6 py-4 font-medium">Maternity Cover</td>
 <td className="px-6 py-4 text-center">-</td>
 <td className="px-6 py-4 text-center bg-blue-50">-</td>
 <td className="px-6 py-4 text-center"><FaCheckCircle className="text-green-500 mx-auto" /></td>
 </tr>
 <tr>
 <td className="px-6 py-4 font-medium">Network Hospitals</td>
 <td className="px-6 py-4 text-center">45+</td>
 <td className="px-6 py-4 text-center bg-blue-50">85+</td>
 <td className="px-6 py-4 text-center">120+</td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>
 
 {/* How Insurance Works */}
 <div className="mt-16 rounded-2xl p-8">
 <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">How Health Insurance Works</h2>
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <div className="text-center">
 <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
 <span className="text-2xl font-bold text-blue-600">1</span>
 </div>
 <h3 className="font-semibold mb-2">Choose Plan</h3>
 <p className="text-sm text-gray-600">Select the right insurance plan based on your needs and budget</p>
 </div>
 <div className="text-center">
 <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
 <span className="text-2xl font-bold text-blue-600">2</span>
 </div>
 <h3 className="font-semibold mb-2">Pay Premium</h3>
 <p className="text-sm text-gray-600">Make regular premium payments to keep your policy active</p>
 </div>
 <div className="text-center">
 <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
 <span className="text-2xl font-bold text-blue-600">3</span>
 </div>
 <h3 className="font-semibold mb-2">Get Treatment</h3>
 <p className="text-sm text-gray-600">Receive cashless treatment at network hospitals or get reimbursed</p>
 </div>
 <div className="text-center">
 <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
 <span className="text-2xl font-bold text-blue-600">4</span>
 </div>
 <h3 className="font-semibold mb-2">File Claims</h3>
 <p className="text-sm text-gray-600">Submit required documents for claim settlement if needed</p>
 </div>
 </div>
 </div>
 
 {/* Insurance Benefits */}
 <div className="mt-16">
 <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Why Choose Health Insurance</h2>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="bg-white rounded-lg p-6 shadow-lg">
 <FaMoneyBillWave className="text-4xl text-green-600 mb-4" />
 <h3 className="text-lg font-semibold mb-2">Financial Protection</h3>
 <p className="text-gray-600 text-sm mb-4">Protect yourself from high medical costs and unexpected health expenses</p>
 <button className="text-green-600 font-medium text-sm">Learn More →</button>
 </div>
 <div className="bg-white rounded-lg p-6 shadow-lg">
 <FaBuilding className="text-4xl text-blue-600 mb-4" />
 <h3 className="text-lg font-semibold mb-2">Cashless Treatment</h3>
 <p className="text-gray-600 text-sm mb-4">Get treatment at network hospitals without paying upfront</p>
 <button className="text-blue-600 font-medium text-sm">Find Hospitals →</button>
 </div>
 <div className="bg-white rounded-lg p-6 shadow-lg">
 <FaCreditCard className="text-4xl text-purple-600 mb-4" />
 <h3 className="text-lg font-semibold mb-2">Tax Benefits</h3>
 <p className="text-gray-600 text-sm mb-4">Save taxes up to Rs 75,000 under Section 80D of Income Tax Act</p>
 <button className="text-purple-600 font-medium text-sm">Calculate Tax →</button>
 </div>
 </div>
 </div>
 
 {/* Customer Testimonials */}
 <div className="mt-16">
 <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Customer Reviews</h2>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="bg-white rounded-lg p-6 shadow-lg">
 <div className="flex items-center gap-1 text-yellow-500 mb-3">
 {[...Array(5)].map((_, i) => (
 <FaStar key={i} className="text-sm" />
 ))}
 </div>
 <p className="text-gray-600 text-sm mb-4">Excellent service! Got my claim settled within 3 days. The cashless treatment at Apollo was seamless.</p>
 <p className="font-semibold text-gray-900">- Rajesh M.</p>
 <p className="text-xs text-gray-500">Port Louis</p>
 </div>
 <div className="bg-white rounded-lg p-6 shadow-lg">
 <div className="flex items-center gap-1 text-yellow-500 mb-3">
 {[...Array(5)].map((_, i) => (
 <FaStar key={i} className="text-sm" />
 ))}
 </div>
 <p className="text-gray-600 text-sm mb-4">Great family coverage. The maternity benefits covered all our expenses during childbirth.</p>
 <p className="font-semibold text-gray-900">- Kavita S.</p>
 <p className="text-xs text-gray-500">Curepipe</p>
 </div>
 <div className="bg-white rounded-lg p-6 shadow-lg">
 <div className="flex items-center gap-1 text-yellow-500 mb-3">
 {[...Array(5)].map((_, i) => (
 <FaStar key={i} className="text-sm" />
 ))}
 </div>
 <p className="text-gray-600 text-sm mb-4">Affordable premiums with comprehensive coverage. Customer support is very helpful and responsive.</p>
 <p className="font-semibold text-gray-900">- David L.</p>
 <p className="text-xs text-gray-500">Rose Hill</p>
 </div>
 </div>
 </div>
 
 {/* Emergency Claims Banner */}
 <div className="mt-16 rounded-2xl p-8 text-white">
 <h2 className="text-2xl font-bold mb-4">Need to File an Emergency Claim?</h2>
 <p className="text-red-100 mb-6">
 Our 24/7 claims assistance ensures you get help when you need it most. 
 Immediate support for emergency hospitalizations and urgent medical situations.
 </p>
 <div className="flex gap-4">
 <button className="bg-white text-red-700 px-6 py-3 rounded-lg font-medium hover:bg-red-50 transition-colors flex items-center gap-2">
 <FaAmbulance />
 Emergency Claims
 </button>
 <button className="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-red-700 transition-colors">
 Call Helpline
 </button>
 </div>
 </div>
 
 <div className="mt-16 rounded-2xl p-8 text-white">
 <h2 className="text-2xl font-bold mb-4">Are you an insurance provider?</h2>
 <p className="text-green-100 mb-6">
 Partner with us to reach more customers and provide better healthcare access across Mauritius. 
 Join our network of trusted insurance providers.
 </p>
 <div className="flex gap-4">
 <button className="bg-white text-green-700 px-6 py-3 rounded-lg font-medium hover:bg-green-50 transition-colors">
 Become a Partner →
 </button>
 <button className="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-green-700 transition-colors">
 Learn More
 </button>
 </div>
 </div>
 </div>
 </div>
 )
}
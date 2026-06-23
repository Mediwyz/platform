'use client'

import { useState, useEffect } from 'react'
import { FaSearch, FaShieldAlt, FaStar, FaClock, FaCheckCircle, FaStarHalfAlt, FaShoppingCart, FaLock, FaExclamationTriangle, FaHeadset, FaHeart, FaBaby, FaHandHoldingMedical, FaPercent, FaAmbulance, FaBuilding, FaUsers, FaMoneyBillWave, FaUserShield, FaCreditCard, FaCalculator, FaGift, FaSpinner } from 'react-icons/fa'

interface InsurancePlan {
 id: number
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
 benefits: { name: string; coverage: string; limit: string }[]
 exclusions: string[]
 ageLimit: string
 familyDiscount: string
 verified: boolean
 fastProcessing: boolean
 onlineQuote: boolean
 customerService: string
}

// Insurance plans loaded from API

// Insurance type icons mapping
const typeIcons = {
 "Individual": FaUserShield,
 "Family": FaUsers,
 "Senior": FaHeart,
 "Corporate": FaBuilding,
 "Specialized": FaBaby,
 "Group": FaHandHoldingMedical
}

// Search/filter function for insurance plans
const filterInsurancePlans = (allPlans: InsurancePlan[], query: string, type: string, budget: string): InsurancePlan[] => {
 let results = [...allPlans]

 if (type !== 'all') {
 results = results.filter(plan =>
 plan.type.toLowerCase().includes(type.toLowerCase())
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

 if (query) {
 const lowerQuery = query.toLowerCase()
 results = results.filter(plan =>
 plan.name.toLowerCase().includes(lowerQuery) ||
 plan.provider.toLowerCase().includes(lowerQuery) ||
 plan.description.toLowerCase().includes(lowerQuery) ||
 plan.features.some(f => f.toLowerCase().includes(lowerQuery)) ||
 plan.benefits.some(b => b.name.toLowerCase().includes(lowerQuery)) ||
 plan.coverage.toLowerCase().includes(lowerQuery)
 )
 }

 return results
}

// Insurance Plan Card Component
interface InsurancePlanProps {
 plan: InsurancePlan
}

const InsurancePlanCard = ({ plan }: InsurancePlanProps) => {
 const TypeIcon = typeIcons[plan.type as keyof typeof typeIcons] || FaShieldAlt
 
 return (
 <div className="bg-surface rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-line">
 <div className="p-6">
 {/* Header with Icon and Basic Info */}
 <div className="flex items-start gap-4 mb-4">
 <div className="relative">
 <div className="w-20 h-20 rounded-lg border-2 border-blue-100 bg-surface flex items-center justify-center">
 <TypeIcon className="text-3xl text-blue-600" />
 </div>
 {plan.fastProcessing && (
 <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
 <FaClock className="text-white text-xs" />
 </div>
 )}
 {plan.verified && (
 <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
 <FaCheckCircle className="text-white text-xs" />
 </div>
 )}
 </div>
 
 <div className="flex-1">
 <h3 className="text-lg font-bold text-fg">{plan.name}</h3>
 <p className="text-blue-600 font-medium flex items-center gap-2">
 <TypeIcon className="text-sm" />
 {plan.provider}
 </p>
 <p className="text-soft text-sm">{plan.type}  {plan.coverage}</p>
 
 {/* Rating */}
 <div className="flex items-center gap-2 mt-2">
 <div className="flex items-center text-yellow-500">
 {[...Array(Math.floor(plan.rating))].map((_, i) => (
 <FaStar key={i} className="text-sm" />
 ))}
 {plan.rating % 1 !== 0 && <FaStarHalfAlt className="text-sm" />}
 </div>
 <span className="text-sm font-medium text-soft">{plan.rating}</span>
 <span className="text-sm text-soft">({plan.reviews})</span>
 </div>
 </div>
 </div>
 
 {/* Type and Coverage Badges */}
 <div className="flex flex-wrap gap-2 mb-3">
 <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
 {plan.type}
 </span>
 <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
 {plan.coverage} Coverage
 </span>
 <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
 {plan.claimSettlement} Claims Settled
 </span>
 </div>
 
 {/* Description */}
 <p className="text-soft text-sm mb-4 line-clamp-2">{plan.description}</p>
 
 {/* Key Benefits */}
 <div className="mb-3">
 <span className="text-xs text-soft block mb-1">Key Benefits:</span>
 <div className="flex flex-wrap gap-1">
 {plan.benefits.slice(0, 3).map((benefit, index) => (
 <span key={index} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
 {benefit.name} ({benefit.coverage})
 </span>
 ))}
 {plan.benefits.length > 3 && (
 <span className="text-xs text-soft">+{plan.benefits.length - 3} more</span>
 )}
 </div>
 </div>
 
 {/* Key Information Grid */}
 <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
 <div className="flex items-center gap-2 text-soft">
 <FaMoneyBillWave className="text-green-500" />
 <span>Max: {plan.maxCoverage}</span>
 </div>
 <div className="flex items-center gap-2 text-soft">
 <FaBuilding className="text-blue-500" />
 <span>{plan.networkHospitals} Hospitals</span>
 </div>
 <div className="flex items-center gap-2 text-soft">
 <FaClock className="text-purple-500" />
 <span>{plan.waitingPeriod} waiting</span>
 </div>
 <div className="flex items-center gap-2 text-soft">
 <FaGift className="text-orange-500" />
 <span>{plan.renewalBonus} bonus</span>
 </div>
 </div>
 
 {/* Service Features */}
 <div className="flex flex-wrap gap-2 mb-4">
 {plan.fastProcessing && (
 <div className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
 <FaClock />
 <span>Fast Processing</span>
 </div>
 )}
 {plan.verified && (
 <div className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
 <FaCheckCircle />
 <span>Verified</span>
 </div>
 )}
 {plan.onlineQuote && (
 <div className="flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
 <FaCalculator />
 <span>Online Quote</span>
 </div>
 )}
 <div className="flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded">
 <FaPercent />
 <span>{plan.discount}</span>
 </div>
 </div>
 
 {/* Availability Status */}
 <div className="mb-4">
 {plan.available ? (
 <span className="text-sm text-green-600 font-medium flex items-center gap-1">
 <FaCheckCircle className="text-xs" />
 Available for Enrollment
 </span>
 ) : (
 <span className="text-sm text-red-600 font-medium flex items-center gap-1">
 <FaExclamationTriangle className="text-xs" />
 Currently Unavailable
 </span>
 )}
 </div>
 
 {/* Footer with Price and CTA */}
 <div className="flex items-center justify-between pt-4 border-t border-line">
 <div>
 <div className="flex items-center gap-2">
 <p className="text-2xl font-bold text-fg">{plan.monthlyPremium}</p>
 <span className="text-xs text-soft">/month</span>
 </div>
 <div className="flex items-center gap-2">
 <span className="text-sm text-soft line-through">{plan.originalPrice}</span>
 <span className="text-xs text-green-600 font-medium">{plan.discount}</span>
 </div>
 </div>
 <div className="flex gap-2">
 <button className="bg-subtle hover:bg-line text-soft px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm">
 Compare
 </button>
 <button className="bg-brand-navy transition-all duration-200 font-medium flex items-center gap-2 text-sm">
 <FaShoppingCart />
 Get Quote
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
 <p className="mt-4 text-soft font-medium animate-pulse">AI is finding the best insurance plans for you...</p>
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
 <FaShieldAlt className="text-6xl text-faint mx-auto mb-4" />
 <h3 className="text-xl font-semibold text-soft mb-2">No insurance plans found</h3>
 <p className="text-soft mb-6">Try adjusting your search criteria or browse all available plans</p>
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
 const [loading, setLoading] = useState(true)

 useEffect(() => {
 const fetchPlans = async () => {
 try {
 const res = await fetch('/api/insurance/plans')
 if (res.ok) {
 const json = await res.json()
 if (json.success && json.data) {
 setAllPlans(json.data)
 setSearchResults(json.data)
 }
 }
 } catch {
 // Failed to fetch plans
 } finally {
 setLoading(false)
 }
 }
 fetchPlans()
 }, [])
 const [searchExamples] = useState([
 "Family health insurance",
 "Senior citizen coverage",
 "Maternity insurance plan",
 "Corporate group health",
 "Affordable health cover",
 "Comprehensive medical insurance"
 ])

 const handleSearch = async () => {
 setIsSearching(true)
 setHasSearched(true)

 const results = filterInsurancePlans(allPlans, searchQuery, insuranceType, budget)

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

 if (loading) {
 return (
 <div className="min-h-screen to-white flex items-center justify-center">
 <FaSpinner className="animate-spin text-3xl text-blue-600" />
 </div>
 )
 }

 return (
 <div className="min-h-screen to-white">
 {/* Header */}
 <div className="bg-brand-navy text-white py-16">
 <div className="container mx-auto px-4">
 <h1 className="text-4xl font-bold mb-4">Health Insurance Plans</h1>
 <p className="text-xl text-blue-100">
 AI-powered search to find the perfect health insurance coverage for you and your family
 </p>
 <div className="mt-6 flex flex-wrap gap-4">
 <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
 <FaCheckCircle className="text-green-300" />
 <span>IRDAI Approved</span>
 </div>
 <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
 <FaLock className="text-yellow-300" />
 <span>Secure Platform</span>
 </div>
 <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
 <FaCalculator className="text-blue-300" />
 <span>Instant Quotes</span>
 </div>
 <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
 <FaHeadset className="text-orange-300" />
 <span>Expert Guidance</span>
 </div>
 </div>
 </div>
 </div>
 
 <div className="container mx-auto px-4 py-8">
 {/* Search Form */}
 <div className="max-w-4xl mx-auto -mt-8 relative z-10">
 <div className="bg-surface rounded-2xl shadow-xl p-6 mt-10">
 <div>
 <div className="flex flex-col gap-4">
 <div className="relative">
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Search insurance plans (e.g., 'family health insurance', 'senior citizen plan', 'maternity cover')"
 className="w-full px-5 py-4 pr-12 border-2 border-line rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-lg"
 />
 <FaSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-faint" />
 </div>
 
 {/* Example Searches */}
 {!hasSearched && (
 <div className="flex flex-wrap gap-2">
 <span className="text-sm text-soft">Popular searches:</span>
 {searchExamples.map((example, index) => (
 <button
 key={index}
 type="button"
 onClick={() => handleExampleClick(example)}
 className="text-sm bg-subtle hover:bg-line text-soft px-3 py-1 rounded-full transition-colors"
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
 className="flex-1 px-4 py-3 border-2 border-line rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
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
 className="flex-1 px-4 py-3 border-2 border-line rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
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
 className="bg-brand-navy transition-all duration-200 font-medium flex items-center justify-center gap-2 min-w-[150px]"
 >
 <FaSearch />
 Find Plans
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>
 
 {/* Trust Statistics */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 mb-8">
 <div className="bg-surface rounded-lg shadow p-4 text-center">
 <FaShieldAlt className="text-3xl text-blue-600 mx-auto mb-2" />
 <p className="text-lg font-bold text-fg">200+</p>
 <p className="text-sm text-soft">Insurance Plans</p>
 </div>
 <div className="bg-surface rounded-lg shadow p-4 text-center">
 <FaBuilding className="text-3xl text-green-600 mx-auto mb-2" />
 <p className="text-lg font-bold text-fg">500+</p>
 <p className="text-sm text-soft">Network Hospitals</p>
 </div>
 <div className="bg-surface rounded-lg shadow p-4 text-center">
 <FaCheckCircle className="text-3xl text-purple-600 mx-auto mb-2" />
 <p className="text-lg font-bold text-fg">98%</p>
 <p className="text-sm text-soft">Claim Settlement</p>
 </div>
 <div className="bg-surface rounded-lg shadow p-4 text-center">
 <FaUsers className="text-3xl text-orange-600 mx-auto mb-2" />
 <p className="text-lg font-bold text-fg">50,000+</p>
 <p className="text-sm text-soft">Happy Customers</p>
 </div>
 </div>
 
 {/* Insurance Advisory */}
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
 {isSearching ? (
 <LoadingAnimation />
 ) : searchResults.length > 0 ? (
 <>
 {hasSearched && (
 <div className="mb-6 flex items-center justify-between">
 <p className="text-soft">
 Found <span className="font-semibold text-fg">{searchResults.length}</span> insurance plans matching your search
 </p>
 <button
 onClick={handleClearFilters}
 className="text-blue-600 hover:text-blue-700 font-medium"
 >
 Clear filters
 </button>
 </div>
 )}
 
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {searchResults.map((plan) => (
 <InsurancePlanCard key={plan.id} plan={plan} />
 ))}
 </div>
 </>
 ) : hasSearched ? (
 <EmptyState onClear={handleClearFilters} />
 ) : null}
 </div>
 
 {/* Insurance Types */}
 <div className="mt-16">
 <h2 className="text-2xl font-bold text-fg mb-8 text-center">Types of Health Insurance</h2>
 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
 <div className="bg-surface rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer text-center">
 <FaUserShield className="text-3xl text-blue-500 mx-auto mb-2" />
 <h3 className="font-semibold text-sm">Individual</h3>
 </div>
 <div className="bg-surface rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer text-center">
 <FaUsers className="text-3xl text-green-500 mx-auto mb-2" />
 <h3 className="font-semibold text-sm">Family</h3>
 </div>
 <div className="bg-surface rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer text-center">
 <FaHeart className="text-3xl text-red-500 mx-auto mb-2" />
 <h3 className="font-semibold text-sm">Senior Citizen</h3>
 </div>
 <div className="bg-surface rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer text-center">
 <FaBuilding className="text-3xl text-purple-500 mx-auto mb-2" />
 <h3 className="font-semibold text-sm">Corporate</h3>
 </div>
 <div className="bg-surface rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer text-center">
 <FaBaby className="text-3xl text-pink-500 mx-auto mb-2" />
 <h3 className="font-semibold text-sm">Maternity</h3>
 </div>
 <div className="bg-surface rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer text-center">
 <FaHandHoldingMedical className="text-3xl text-orange-500 mx-auto mb-2" />
 <h3 className="font-semibold text-sm">Critical Illness</h3>
 </div>
 </div>
 </div>
 
 {/* Popular Insurance Packages */}
 <div className="mt-16">
 <h2 className="text-2xl font-bold text-fg mb-8 text-center">Compare Popular Plans</h2>
 <div className="overflow-x-auto">
 <table className="w-full bg-surface rounded-lg shadow-lg overflow-hidden">
 <thead className="bg-blue-50">
 <tr>
 <th className="px-6 py-4 text-left font-semibold text-fg">Features</th>
 <th className="px-6 py-4 text-center font-semibold text-fg">Basic Plan</th>
 <th className="px-6 py-4 text-center font-semibold text-fg bg-blue-100">Premium Plan</th>
 <th className="px-6 py-4 text-center font-semibold text-fg">Family Plan</th>
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
 <div className="mt-16 bg-surface rounded-2xl p-8">
 <h2 className="text-2xl font-bold text-fg mb-8 text-center">How Health Insurance Works</h2>
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <div className="text-center">
 <div className="bg-surface rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
 <span className="text-2xl font-bold text-blue-600">1</span>
 </div>
 <h3 className="font-semibold mb-2">Choose Plan</h3>
 <p className="text-sm text-soft">Select the right insurance plan based on your needs and budget</p>
 </div>
 <div className="text-center">
 <div className="bg-surface rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
 <span className="text-2xl font-bold text-blue-600">2</span>
 </div>
 <h3 className="font-semibold mb-2">Pay Premium</h3>
 <p className="text-sm text-soft">Make regular premium payments to keep your policy active</p>
 </div>
 <div className="text-center">
 <div className="bg-surface rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
 <span className="text-2xl font-bold text-blue-600">3</span>
 </div>
 <h3 className="font-semibold mb-2">Get Treatment</h3>
 <p className="text-sm text-soft">Receive cashless treatment at network hospitals or get reimbursed</p>
 </div>
 <div className="text-center">
 <div className="bg-surface rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
 <span className="text-2xl font-bold text-blue-600">4</span>
 </div>
 <h3 className="font-semibold mb-2">File Claims</h3>
 <p className="text-sm text-soft">Submit required documents for claim settlement if needed</p>
 </div>
 </div>
 </div>
 
 {/* Insurance Benefits */}
 <div className="mt-16">
 <h2 className="text-2xl font-bold text-fg mb-8 text-center">Why Choose Health Insurance</h2>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="bg-surface rounded-lg p-6 shadow-lg">
 <FaMoneyBillWave className="text-4xl text-green-600 mb-4" />
 <h3 className="text-lg font-semibold mb-2">Financial Protection</h3>
 <p className="text-soft text-sm mb-4">Protect yourself from high medical costs and unexpected health expenses</p>
 <button className="text-green-600 font-medium text-sm">Learn More </button>
 </div>
 <div className="bg-surface rounded-lg p-6 shadow-lg">
 <FaBuilding className="text-4xl text-blue-600 mb-4" />
 <h3 className="text-lg font-semibold mb-2">Cashless Treatment</h3>
 <p className="text-soft text-sm mb-4">Get treatment at network hospitals without paying upfront</p>
 <button className="text-blue-600 font-medium text-sm">Find Hospitals </button>
 </div>
 <div className="bg-surface rounded-lg p-6 shadow-lg">
 <FaCreditCard className="text-4xl text-purple-600 mb-4" />
 <h3 className="text-lg font-semibold mb-2">Tax Benefits</h3>
 <p className="text-soft text-sm mb-4">Save taxes up to Rs 75,000 under Section 80D of Income Tax Act</p>
 <button className="text-purple-600 font-medium text-sm">Calculate Tax </button>
 </div>
 </div>
 </div>
 
 {/* Customer Testimonials */}
 <div className="mt-16">
 <h2 className="text-2xl font-bold text-fg mb-8 text-center">Customer Reviews</h2>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="bg-surface rounded-lg p-6 shadow-lg">
 <div className="flex items-center gap-1 text-yellow-500 mb-3">
 {[...Array(5)].map((_, i) => (
 <FaStar key={i} className="text-sm" />
 ))}
 </div>
 <p className="text-soft text-sm mb-4">Excellent service! Got my claim settled within 3 days. The cashless treatment at Apollo was seamless.</p>
 <p className="font-semibold text-fg">- Rajesh M.</p>
 <p className="text-xs text-soft">Port Louis</p>
 </div>
 <div className="bg-surface rounded-lg p-6 shadow-lg">
 <div className="flex items-center gap-1 text-yellow-500 mb-3">
 {[...Array(5)].map((_, i) => (
 <FaStar key={i} className="text-sm" />
 ))}
 </div>
 <p className="text-soft text-sm mb-4">Great family coverage. The maternity benefits covered all our expenses during childbirth.</p>
 <p className="font-semibold text-fg">- Kavita S.</p>
 <p className="text-xs text-soft">Curepipe</p>
 </div>
 <div className="bg-surface rounded-lg p-6 shadow-lg">
 <div className="flex items-center gap-1 text-yellow-500 mb-3">
 {[...Array(5)].map((_, i) => (
 <FaStar key={i} className="text-sm" />
 ))}
 </div>
 <p className="text-soft text-sm mb-4">Affordable premiums with comprehensive coverage. Customer support is very helpful and responsive.</p>
 <p className="font-semibold text-fg">- David L.</p>
 <p className="text-xs text-soft">Rose Hill</p>
 </div>
 </div>
 </div>
 
 {/* Emergency Claims Banner */}
 <div className="mt-16 bg-red-500 rounded-2xl p-8 text-white">
 <h2 className="text-2xl font-bold mb-4">Need to File an Emergency Claim?</h2>
 <p className="text-red-100 mb-6">
 Our 24/7 claims assistance ensures you get help when you need it most. 
 Immediate support for emergency hospitalizations and urgent medical situations.
 </p>
 <div className="flex gap-4">
 <button className="bg-surface text-red-700 px-6 py-3 rounded-lg font-medium hover:bg-red-50 transition-colors flex items-center gap-2">
 <FaAmbulance />
 Emergency Claims
 </button>
 <button className="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-surface hover:text-red-700 transition-colors">
 Call Helpline
 </button>
 </div>
 </div>
 
 {/* Insurance Partner Banner */}
 <div className="mt-16 bg-brand-teal rounded-2xl p-8 text-white">
 <h2 className="text-2xl font-bold mb-4">Are you an insurance provider?</h2>
 <p className="text-green-100 mb-6">
 Partner with us to reach more customers and provide better healthcare access across Mauritius. 
 Join our network of trusted insurance providers.
 </p>
 <div className="flex gap-4">
 <button className="bg-surface text-green-700 px-6 py-3 rounded-lg font-medium hover:bg-green-50 transition-colors">
 Become a Partner 
 </button>
 <button className="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-surface hover:text-green-700 transition-colors">
 Learn More
 </button>
 </div>
 </div>
 </div>
 </div>
 )
}
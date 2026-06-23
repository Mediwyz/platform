'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
 FaStar, FaStarHalfAlt, FaSearch, FaFilter,
 FaComment, FaCalendarAlt, FaQuoteLeft,
 FaChevronDown, FaChevronUp, FaCheckCircle,
 FaThumbsUp, FaReply, FaSpinner
} from 'react-icons/fa'

interface Review {
 id: string
 reviewerName: string
 reviewerImage: string | null
 rating: number
 comment: string
 verified: boolean
 helpfulCount: number
 response: string | null
 respondedAt: string | null
 createdAt: string
}

interface ProviderReviewsProps {
 /** The provider's User.id */
 providerUserId: string
 /** Display label e.g. 'Doctor', 'Nurse', 'Nanny' */
 providerLabel?: string
 /** Gradient color scheme for header */
 headerGradient?: string
 /** Whether this is the provider viewing their own reviews (enables reply) */
 isOwner?: boolean
}

type RatingFilter = 'all' | '5' | '4' | '3' | '2' | '1'

/**
 * Shared reviews/ratings component for any provider type.
 * Fetches reviews from /api/providers/{id}/reviews.
 */
export default function ProviderReviews({
 providerUserId,
 providerLabel = 'Provider',
 headerGradient = ' ',
 isOwner = false,
}: ProviderReviewsProps) {
 const [reviews, setReviews] = useState<Review[]>([])
 const [averageRating, setAverageRating] = useState(0)
 const [totalReviews, setTotalReviews] = useState(0)
 const [ratingDistribution, setRatingDistribution] = useState<Record<number, number>>({})
 const [loading, setLoading] = useState(true)
 const [searchQuery, setSearchQuery] = useState('')
 const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all')
 const [showFilters, setShowFilters] = useState(false)
 const [replyingTo, setReplyingTo] = useState<string | null>(null)
 const [replyText, setReplyText] = useState('')
 const [submittingReply, setSubmittingReply] = useState(false)

 const fetchReviews = useCallback(async () => {
 try {
 const res = await fetch(`/api/providers/${providerUserId}/reviews?limit=50`, { credentials: 'include' })
 const json = await res.json()
 if (json.success) {
 setReviews(json.data)
 setAverageRating(json.averageRating)
 setTotalReviews(json.total)
 setRatingDistribution(json.ratingDistribution || {})
 }
 } catch {
 // Keep empty state
 } finally {
 setLoading(false)
 }
 }, [providerUserId])

 useEffect(() => {
 if (providerUserId) fetchReviews()
 }, [providerUserId, fetchReviews])

 const handleReply = async (reviewId: string) => {
 if (!replyText.trim()) return
 setSubmittingReply(true)
 try {
 const res = await fetch(`/api/providers/${providerUserId}/reviews/${reviewId}`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ response: replyText }),
 credentials: 'include',
 })
 if (res.ok) {
 setReplyingTo(null)
 setReplyText('')
 fetchReviews()
 }
 } catch {
 // Keep state
 } finally {
 setSubmittingReply(false)
 }
 }

 const handleHelpful = async (reviewId: string) => {
 try {
 await fetch(`/api/providers/${providerUserId}/reviews/${reviewId}`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ helpful: true }),
 credentials: 'include',
 })
 fetchReviews()
 } catch {
 // Silently fail
 }
 }

 const renderStars = (rating: number, size = 'text-base') => {
 const nodes: React.ReactNode[] = []
 const full = Math.floor(rating)
 const half = rating % 1 >= 0.5

 for (let i = 0; i < full; i++) nodes.push(<FaStar key={`s${i}`} className={`${size} text-yellow-500`} />)
 if (half) nodes.push(<FaStarHalfAlt key="half" className={`${size} text-yellow-500`} />)
 for (let i = nodes.length; i < 5; i++) nodes.push(<FaStar key={`e${i}`} className={`${size} text-faint`} />)
 return nodes
 }

 const filteredReviews = reviews
 .filter(r => {
 if (ratingFilter !== 'all' && r.rating.toString() !== ratingFilter) return false
 if (searchQuery) {
 const q = searchQuery.toLowerCase()
 return r.reviewerName.toLowerCase().includes(q) || r.comment.toLowerCase().includes(q)
 }
 return true
 })
 .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

 if (loading) {
 return (
 <div className="flex items-center justify-center py-20">
 <FaSpinner className="animate-spin text-3xl text-teal-600" />
 </div>
 )
 }

 return (
 <div className="space-y-6">
 {/* Header */}
 <div className={` ${headerGradient} rounded-2xl p-5 sm:p-6 text-white`}>
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div>
 <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
 <FaStar />
 Reviews & Ratings
 </h1>
 <p className="text-white/80 text-sm mt-1">
 {isOwner ? 'Patient feedback on your services' : `Reviews for this ${providerLabel.toLowerCase()}`}
 </p>
 </div>
 <div className="text-center">
 <p className="text-4xl font-bold">{averageRating.toFixed(1)}</p>
 <div className="flex justify-center mt-1">{renderStars(averageRating, 'text-sm')}</div>
 <p className="text-white/80 text-xs mt-1">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</p>
 </div>
 </div>
 </div>

 {/* Rating Distribution */}
 <div className="bg-surface rounded-2xl p-6 shadow-lg border border-line">
 <h2 className="text-lg font-bold text-fg mb-4">Rating Summary</h2>
 <div className="space-y-2">
 {[5, 4, 3, 2, 1].map(star => {
 const count = ratingDistribution[star] ?? 0
 const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0
 return (
 <div key={star} className="flex items-center gap-3">
 <span className="text-sm font-medium w-3 text-soft">{star}</span>
 <FaStar className="text-yellow-500 text-sm" />
 <div className="flex-1 bg-line rounded-full h-2.5">
 <div
 className=" h-2.5 rounded-full transition-all"
 style={{ width: `${pct}%` }}
 />
 </div>
 <span className="text-sm text-soft w-8 text-right">{count}</span>
 </div>
 )
 })}
 </div>
 </div>

 {/* Search and Filters */}
 <div className="bg-surface rounded-2xl p-4 sm:p-6 shadow-lg border border-line">
 <div className="flex flex-col sm:flex-row gap-3">
 <div className="relative flex-1">
 <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-faint" />
 <input
 type="text"
 placeholder="Search reviews..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-10 pr-4 py-2.5 border border-line rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition text-sm"
 />
 </div>
 <button
 onClick={() => setShowFilters(!showFilters)}
 className="px-4 py-2.5 bg-subtle text-soft rounded-lg hover:bg-line transition flex items-center justify-center gap-2 text-sm"
 >
 <FaFilter />
 Filters
 {showFilters ? <FaChevronUp /> : <FaChevronDown />}
 </button>
 </div>

 {showFilters && (
 <div className="mt-4 pt-4 border-t border-line">
 <label className="text-sm font-medium text-soft mb-2 block">Filter by Rating</label>
 <div className="flex gap-2 flex-wrap">
 {(['all', '5', '4', '3', '2', '1'] as RatingFilter[]).map(f => (
 <button
 key={f}
 onClick={() => setRatingFilter(f)}
 className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
 ratingFilter === f
 ? 'bg-teal-600 text-white'
 : 'bg-subtle text-soft hover:bg-line'
 }`}
 >
 {f === 'all' ? 'All' : `${f} Stars`}
 </button>
 ))}
 </div>
 </div>
 )}
 </div>

 {/* Reviews List */}
 {filteredReviews.length === 0 ? (
 <div className="bg-surface rounded-2xl p-12 text-center shadow-sm border border-line">
 <FaComment className="text-4xl text-faint mx-auto mb-4" />
 <h3 className="text-lg font-semibold text-soft mb-2">
 {reviews.length === 0 ? 'No Reviews Yet' : 'No matching reviews'}
 </h3>
 <p className="text-soft text-sm">
 {reviews.length === 0
 ? 'Reviews from patients will appear here after they complete their appointments.'
 : 'Try adjusting your search or filter criteria.'}
 </p>
 </div>
 ) : (
 <div className="space-y-4">
 {filteredReviews.map(review => (
 <div
 key={review.id}
 className="bg-surface rounded-2xl p-5 shadow-sm border border-line hover:shadow-md transition-shadow"
 >
 <div className="flex items-start gap-4">
 <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
 {review.reviewerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between mb-1">
 <div>
 <h4 className="font-semibold text-fg text-sm sm:text-base">
 {review.reviewerName}
 {review.verified && (
 <FaCheckCircle className="inline ml-1 text-blue-500 text-xs" />
 )}
 </h4>
 <div className="flex items-center gap-2 text-xs text-soft mt-0.5">
 <FaCalendarAlt className="text-faint" />
 {new Date(review.createdAt).toLocaleDateString('en-US', {
 month: 'long',
 day: 'numeric',
 year: 'numeric',
 })}
 </div>
 </div>
 <div className="text-right">
 <div className="flex">{renderStars(review.rating, 'text-sm')}</div>
 <span className="text-xs text-soft">{review.rating}/5</span>
 </div>
 </div>

 <p className="text-sm text-soft mt-2">
 <FaQuoteLeft className="inline mr-1 text-faint text-xs" />
 {review.comment}
 </p>

 {/* Provider Response */}
 {review.response && (
 <div className="bg-blue-50 rounded-lg p-3 mt-3 border border-blue-200">
 <p className="text-xs font-semibold text-blue-800 mb-1">{providerLabel}&apos;s Response</p>
 <p className="text-sm text-soft">{review.response}</p>
 </div>
 )}

 {/* Reply Form */}
 {replyingTo === review.id && isOwner && (
 <div className="bg-subtle rounded-lg p-3 mt-3 border border-line">
 <textarea
 value={replyText}
 onChange={(e) => setReplyText(e.target.value)}
 placeholder="Write your response..."
 className="w-full px-3 py-2 border border-line rounded-lg text-sm resize-none"
 rows={3}
 />
 <div className="flex gap-2 mt-2">
 <button
 onClick={() => handleReply(review.id)}
 disabled={submittingReply}
 className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 transition"
 >
 {submittingReply ? 'Sending...' : 'Send Reply'}
 </button>
 <button
 onClick={() => { setReplyingTo(null); setReplyText('') }}
 className="px-3 py-1.5 bg-gray-300 text-soft rounded text-xs hover:bg-gray-400 transition"
 >
 Cancel
 </button>
 </div>
 </div>
 )}

 {/* Action Buttons */}
 <div className="flex items-center gap-4 mt-3">
 <button
 onClick={() => handleHelpful(review.id)}
 className="flex items-center gap-1 text-soft hover:text-green-600 transition text-xs"
 >
 <FaThumbsUp />
 Helpful ({review.helpfulCount})
 </button>
 {isOwner && !review.response && (
 <button
 onClick={() => setReplyingTo(review.id)}
 className="flex items-center gap-1 text-soft hover:text-blue-600 transition text-xs"
 >
 <FaReply />
 Reply
 </button>
 )}
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 )
}

'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  FaArrowLeft, FaStar, FaMapMarkerAlt, FaCalendarAlt,
  FaPhone, FaEnvelope, FaVideo, FaHome, FaLanguage, FaCheckCircle,
  FaCertificate, FaGraduationCap, FaBriefcase,
  FaUserMd, FaExclamationCircle, FaComments,
  FaHospital, FaShieldAlt, FaChevronDown, FaChevronUp,
} from 'react-icons/fa'
import AuthBookingLink from '@/components/booking/AuthBookingLink'
import ConnectButton from '@/components/search/ConnectButton'
import MessageButton from '@/components/search/MessageButton'
import type { BookingType } from '@/lib/booking/types'

type Provider = any // dynamic-role providers: shape varies, every field defaulted below

// Provider role code → the booking flow's BookingType (others fall back to the
// generic doctor flow, which books by provider id regardless of category).
const BOOKING_TYPE: Record<string, BookingType> = {
  DOCTOR: 'doctor', NURSE: 'nurse', NANNY: 'nanny', LAB_TECHNICIAN: 'lab-test', EMERGENCY_WORKER: 'emergency',
}

/**
 * Generic provider detail page — works for EVERY provider category (doctors,
 * nurses, childcare, dentists, …). The category is resolved from the `slug`
 * via the CRUD roles API, so there's one reusable page instead of a hardcoded
 * file per category. Rendered by app/search/[slug]/[id]/page.tsx.
 */
export default function ProviderDetailPage({ slug }: { slug: string }) {
  const params = useParams()
  const id = params.id as string

  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'availability'>('overview')
  const [activeAccordion, setActiveAccordion] = useState<string>('overview')
  const [provider, setProvider] = useState<Provider | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [roleLabel, setRoleLabel] = useState<string>('Provider')
  const [typeCode, setTypeCode] = useState<string | null>(null)

  // 1) slug → provider role code (DOCTOR, NURSE, NANNY, …) via the CRUD roles API.
  useEffect(() => {
    fetch('/api/roles?searchEnabled=true')
      .then(r => r.json())
      .then(json => {
        const role = json?.success ? (json.data || []).find((r: any) => r.slug === slug) : null
        setTypeCode(role?.code || slug.toUpperCase().replace(/-/g, '_'))
        setRoleLabel(role?.singularLabel || 'Provider')
      })
      .catch(() => setTypeCode(slug.toUpperCase().replace(/-/g, '_')))
  }, [slug])

  // 2) Fetch providers of that type, find this one, default every optional field.
  useEffect(() => {
    if (!typeCode) return
    fetch(`/api/search/providers?type=${encodeURIComponent(typeCode)}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          const found: any = (json.data || []).find((d: any) => d.id === id)
          if (found) {
            found.specialty = found.specialty ?? found.specializations ?? []
            found.subSpecialties = found.subSpecialties ?? []
            found.languages = found.languages ?? []
            found.education = found.education ?? []
            found.workHistory = found.workHistory ?? []
            found.certifications = found.certifications ?? []
            found.consultationTypes = found.consultationTypes ?? []
            found.patientComments = found.patientComments ?? []
            found.profileImage = found.profileImage || '/images/avatars/m/1.jpg'
            found.rating = found.rating ?? 0
            found.reviews = found.reviews ?? 0
          }
          setProvider(found || null)
        }
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [typeCode, id])

  const namePrefix = typeCode === 'DOCTOR' ? 'Dr. ' : ''
  const bookingType: BookingType = BOOKING_TYPE[typeCode || ''] || 'doctor'

  if (isLoading) {
    return (
      <div className="min-h-screen bg-subtle flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-soft">Loading {roleLabel.toLowerCase()} profile...</span>
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-subtle flex items-center justify-center p-4">
        <div className="text-center">
          <FaUserMd className="text-4xl sm:text-6xl text-faint mx-auto mb-4" />
          <h1 className="text-xl sm:text-2xl font-bold text-fg mb-2">{roleLabel} Not Found</h1>
          <p className="text-sm sm:text-base text-soft mb-6">The {roleLabel.toLowerCase()} you are looking for does not exist.</p>
          <Link href={`/search/${slug}`} className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base">
            Back to Search
          </Link>
        </div>
      </div>
    )
  }

  const toggleAccordion = (section: string) => setActiveAccordion(activeAccordion === section ? '' : section)

  return (
    <div className="min-h-screen bg-subtle">
      {/* Header */}
      <div className="bg-surface shadow-sm">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <Link href={`/search/${slug}`} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm sm:text-base">
            <FaArrowLeft className="text-xs sm:text-sm" />
            Back to Search
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Profile Header */}
            <div className="bg-surface rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                <div className="relative">
                  <Image
                    src={provider.profileImage}
                    alt={`${namePrefix}${provider.firstName} ${provider.lastName}`}
                    width={100}
                    height={100}
                    className="rounded-full object-cover border-4 border-blue-100 w-20 h-20 sm:w-[120px] sm:h-[120px]"
                  />
                  {provider.verified && (
                    <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-green-500 text-white rounded-full p-1.5 sm:p-2">
                      <FaCheckCircle className="text-xs sm:text-sm" />
                    </div>
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="mb-3 sm:mb-4">
                    <h1 className="text-xl sm:text-3xl font-bold text-fg mb-1 sm:mb-2">
                      {namePrefix}{provider.firstName} {provider.lastName}
                    </h1>
                    {provider.specialty.length > 0 && (
                      <p className="text-base sm:text-xl text-blue-600 font-medium mb-1 sm:mb-2">
                        {provider.specialty.join(', ')}
                      </p>
                    )}
                    {provider.experience && <p className="text-sm sm:text-base text-soft">{provider.experience} experience</p>}

                    {provider.category && (
                      <div className="mt-2 flex justify-center sm:justify-start">
                        <span className="text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full font-medium bg-subtle text-soft">
                          {provider.category}
                        </span>
                        {provider.emergencyAvailable && (
                          <span className="ml-2 bg-red-100 text-red-700 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                            Emergency
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="flex items-center text-yellow-500">
                      {[...Array(Math.floor(provider.rating))].map((_, i) => (
                        <FaStar key={i} className="text-sm sm:text-lg" />
                      ))}
                      {provider.rating % 1 !== 0 && <FaStar className="text-sm sm:text-lg opacity-50" />}
                    </div>
                    <span className="text-base sm:text-lg font-semibold text-soft">{provider.rating}</span>
                    <span className="text-sm sm:text-base text-soft">({provider.reviews} reviews)</span>
                  </div>

                  {/* Info Grid */}
                  <div className="space-y-2 sm:space-y-3">
                    {provider.languages.length > 0 && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <div className="flex items-center gap-2">
                          <FaLanguage className="text-blue-500 text-sm" />
                          <span className="text-xs sm:text-sm text-soft">Languages:</span>
                        </div>
                        <span className="text-xs sm:text-sm font-medium ml-6 sm:ml-0">{provider.languages.join(', ')}</span>
                      </div>
                    )}
                    {provider.clinicAffiliation && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <div className="flex items-center gap-2">
                          <FaHospital className="text-blue-500 text-sm" />
                          <span className="text-xs sm:text-sm text-soft">Affiliation:</span>
                        </div>
                        <span className="text-xs sm:text-sm font-medium ml-6 sm:ml-0">{provider.clinicAffiliation}</span>
                      </div>
                    )}
                    {provider.address && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <div className="flex items-center gap-2">
                          <FaMapMarkerAlt className="text-blue-500 text-sm" />
                          <span className="text-xs sm:text-sm text-soft">Location:</span>
                        </div>
                        <span className="text-xs sm:text-sm text-soft ml-6 sm:ml-0">{provider.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs (desktop) / Accordion (mobile) */}
            <div className="bg-surface rounded-lg sm:rounded-xl shadow-lg">
              <div className="hidden lg:block border-b border-line">
                <div className="flex">
                  {[
                    { id: 'overview', label: 'Overview', icon: FaUserMd },
                    { id: 'reviews', label: 'Reviews', icon: FaComments },
                    { id: 'availability', label: 'Availability', icon: FaCalendarAlt },
                  ].map(({ id: tid, label, icon: Icon }) => (
                    <button
                      key={tid}
                      onClick={() => setActiveTab(tid as 'overview' | 'reviews' | 'availability')}
                      className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                        activeTab === tid ? 'border-blue-500 text-blue-600' : 'border-transparent text-soft hover:text-fg'
                      }`}
                    >
                      <Icon />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="hidden lg:block p-6">
                {activeTab === 'overview' && <OverviewContent provider={provider} />}
                {activeTab === 'reviews' && <ReviewsContent provider={provider} />}
                {activeTab === 'availability' && <AvailabilityContent provider={provider} />}
              </div>

              <div className="lg:hidden">
                {([
                  { key: 'overview', label: 'Overview', icon: FaUserMd, Comp: OverviewContent },
                  { key: 'reviews', label: 'Reviews', icon: FaComments, Comp: ReviewsContent },
                  { key: 'availability', label: 'Availability', icon: FaCalendarAlt, Comp: AvailabilityContent },
                ] as const).map(({ key, label, icon: Icon, Comp }, idx, arr) => (
                  <div key={key} className={idx < arr.length - 1 ? 'border-b border-line' : ''}>
                    <button
                      onClick={() => toggleAccordion(key)}
                      className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-subtle"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="text-blue-600" />
                        <span className="font-medium text-fg">{label}</span>
                      </div>
                      {activeAccordion === key ? <FaChevronUp className="text-soft" /> : <FaChevronDown className="text-soft" />}
                    </button>
                    {activeAccordion === key && (
                      <div className="p-4 border-t border-line">
                        <Comp provider={provider} mobile={true} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-surface rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 lg:sticky lg:top-4">
              <h3 className="text-base sm:text-lg font-semibold text-fg mb-3 sm:mb-4">Book Consultation</h3>

              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                {(provider.consultationFee ?? 0) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-base text-soft">In-Person</span>
                    <span className="text-base sm:text-lg font-bold text-green-600">Rs {(provider.consultationFee ?? 0).toLocaleString()}</span>
                  </div>
                )}
                {(provider.videoConsultationFee ?? 0) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-base text-soft">Video Call</span>
                    <span className="text-base sm:text-lg font-bold text-green-600">Rs {(provider.videoConsultationFee ?? 0).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                {provider.phone && (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FaPhone className="text-blue-500 text-sm" />
                    <a href={`tel:${provider.phone}`} className="text-blue-600 hover:text-blue-700 text-sm sm:text-base">{provider.phone}</a>
                  </div>
                )}
                {provider.email && (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FaEnvelope className="text-blue-500 text-sm" />
                    <a href={`mailto:${provider.email}`} className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm break-all">{provider.email}</a>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <AuthBookingLink type={bookingType} providerId={provider.id} className="bg-blue-600 text-white py-2.5 sm:py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm">
                  <FaCalendarAlt />
                  Book
                </AuthBookingLink>
                <AuthBookingLink type={bookingType} providerId={provider.id} className="bg-purple-600 text-white py-2.5 sm:py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm">
                  <FaVideo />
                  Video Call
                </AuthBookingLink>
                <ConnectButton providerId={provider.id} className="w-full justify-center text-xs sm:text-sm" />
                <MessageButton providerId={provider.id} className="w-full justify-center text-xs sm:text-sm" />
              </div>

              {provider.verified && (
                <div className="mt-3 sm:mt-4 flex items-center justify-center gap-2 text-green-600">
                  <FaShieldAlt className="text-sm" />
                  <span className="text-xs sm:text-sm font-medium">Verified {roleLabel}</span>
                </div>
              )}
            </div>

            {/* Quick Facts */}
            <div className="bg-surface rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-fg mb-3 sm:mb-4">Quick Facts</h3>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-3">
                {provider.experience && (
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <span className="text-xs sm:text-sm text-soft">Experience</span>
                    <span className="font-medium text-sm sm:text-base">{provider.experience}</span>
                  </div>
                )}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <span className="text-xs sm:text-sm text-soft">Patients</span>
                  <span className="font-medium text-sm sm:text-base">{provider.reviews}+</span>
                </div>
                {provider.specialty.length > 0 && (
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <span className="text-xs sm:text-sm text-soft">Specialties</span>
                    <span className="font-medium text-sm sm:text-base">{provider.specialty.length}</span>
                  </div>
                )}
                {provider.telemedicineAvailable !== undefined && (
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <span className="text-xs sm:text-sm text-soft">Telemedicine</span>
                    <span className={`font-medium text-sm sm:text-base ${provider.telemedicineAvailable ? 'text-green-600' : 'text-red-600'}`}>
                      {provider.telemedicineAvailable ? 'Yes' : 'No'}
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

function OverviewContent({ provider, mobile = false }: { provider: Provider; mobile?: boolean }) {
  const textSize = mobile ? 'text-sm' : 'text-base'
  const headingSize = mobile ? 'text-base' : 'text-lg'
  const spacing = mobile ? 'space-y-4' : 'space-y-6'
  return (
    <div className={spacing}>
      {provider.bio && (
        <div>
          <h3 className={`${headingSize} font-semibold text-fg mb-2 sm:mb-3`}>About</h3>
          <p className={`${textSize} text-soft leading-relaxed`}>{provider.bio}</p>
        </div>
      )}
      {provider.philosophy && (
        <div>
          <h3 className={`${headingSize} font-semibold text-fg mb-2 sm:mb-3`}>Philosophy</h3>
          <p className={`${textSize} text-soft leading-relaxed italic`}>&quot;{provider.philosophy}&quot;</p>
        </div>
      )}
      {provider.specialty.length > 0 && (
        <div>
          <h3 className={`${headingSize} font-semibold text-fg mb-2 sm:mb-3`}>Specializations</h3>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {provider.specialty.map((s: string, i: number) => (
              <span key={i} className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">{s}</span>
            ))}
          </div>
        </div>
      )}
      {provider.education.length > 0 && (
        <div>
          <h3 className={`${headingSize} font-semibold text-fg mb-2 sm:mb-3 flex items-center gap-2`}>
            <FaGraduationCap className="text-blue-500 text-sm sm:text-base" /> Education
          </h3>
          <ul className="space-y-2">
            {provider.education.map((edu: any, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></span>
                <div className={textSize}>
                  <span className="text-soft font-medium">{edu.degree}</span>
                  <span className="text-soft"> - {edu.institution}</span>
                  {edu.year && <span className="text-soft text-xs sm:text-sm"> ({edu.year})</span>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {provider.workHistory.length > 0 && (
        <div>
          <h3 className={`${headingSize} font-semibold text-fg mb-2 sm:mb-3 flex items-center gap-2`}>
            <FaBriefcase className="text-blue-500 text-sm sm:text-base" /> Work Experience
          </h3>
          <ul className="space-y-2">
            {provider.workHistory.map((work: any, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></span>
                <div className={textSize}>
                  <span className="text-soft font-medium">{work.position}</span>
                  <span className="text-soft"> at {work.organization}</span>
                  {work.period && <span className="text-soft text-xs sm:text-sm"> ({work.period})</span>}
                  {work.current && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Current</span>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {provider.certifications.length > 0 && (
        <div>
          <h3 className={`${headingSize} font-semibold text-fg mb-2 sm:mb-3 flex items-center gap-2`}>
            <FaCertificate className="text-blue-500 text-sm sm:text-base" /> Certifications
          </h3>
          <ul className="space-y-2">
            {provider.certifications.map((cert: any, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></span>
                <div className={`${textSize} break-words`}>
                  <span className="text-soft font-medium">{cert.name}</span>
                  {cert.issuingBody && <span className="text-soft"> - {cert.issuingBody}</span>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {provider.consultationTypes.length > 0 && (
        <div>
          <h3 className={`${headingSize} font-semibold text-fg mb-2 sm:mb-3`}>Consultation Options</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
            {provider.consultationTypes.map((type: string, i: number) => (
              <div key={i} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border border-line rounded-lg">
                {type === 'Video Consultation' && <FaVideo className="text-blue-500 text-sm" />}
                {type === 'In-Person' && <FaHome className="text-green-500 text-sm" />}
                {type === 'Emergency' && <FaExclamationCircle className="text-red-500 text-sm" />}
                {type === 'Home Visit' && <FaHome className="text-purple-500 text-sm" />}
                <span className="text-xs sm:text-sm font-medium">{type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ReviewsContent({ provider, mobile = false }: { provider: Provider; mobile?: boolean }) {
  const textSize = mobile ? 'text-sm' : 'text-base'
  const headingSize = mobile ? 'text-base' : 'text-lg'
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center p-4 sm:p-6 bg-subtle rounded-lg">
        <div className="text-2xl sm:text-3xl font-bold text-fg mb-2">{provider.rating}</div>
        <div className="flex items-center justify-center gap-1 text-yellow-500 mb-2">
          {[...Array(Math.floor(provider.rating))].map((_, i) => (<FaStar key={i} className="text-sm sm:text-base" />))}
        </div>
        <p className="text-sm sm:text-base text-soft">Based on {provider.reviews} reviews</p>
      </div>
      {provider.patientComments.length > 0 && (
        <div>
          <h3 className={`${headingSize} font-semibold text-fg mb-3 sm:mb-4`}>Patient Feedback</h3>
          <div className="space-y-3 sm:space-y-4">
            {provider.patientComments.map((comment: any) => (
              <div key={comment.id} className="p-3 sm:p-4 bg-subtle rounded-lg">
                <div className="flex items-start gap-3 sm:gap-4">
                  {comment.patientProfileImage && (
                    <Image src={comment.patientProfileImage} alt={`${comment.patientFirstName} ${comment.patientLastName}`} width={32} height={32} className="rounded-full object-cover w-8 h-8 sm:w-10 sm:h-10" />
                  )}
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                      <h4 className="font-medium text-fg text-sm sm:text-base">{comment.patientFirstName} {comment.patientLastName}</h4>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-soft"><span>{comment.date}</span></div>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500 mb-2">
                      {[...Array(comment.starRating || 0)].map((_, i) => (<FaStar key={i} className="text-xs sm:text-sm" />))}
                    </div>
                    <p className={`${textSize} text-soft italic`}>&quot;{comment.comment}&quot;</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AvailabilityContent({ provider, mobile = false }: { provider: Provider; mobile?: boolean }) {
  const textSize = mobile ? 'text-sm' : 'text-base'
  const headingSize = mobile ? 'text-base' : 'text-lg'
  return (
    <div className="space-y-4 sm:space-y-6">
      {provider.nextAvailable && (
        <div>
          <h3 className={`${headingSize} font-semibold text-fg mb-2 sm:mb-3`}>Current Availability</h3>
          <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-green-600 text-sm" />
              <span className={`font-medium text-green-800 ${textSize}`}>{provider.nextAvailable}</span>
            </div>
          </div>
        </div>
      )}
      {provider.availability && (
        <div>
          <h3 className={`${headingSize} font-semibold text-fg mb-2 sm:mb-3`}>Working Hours</h3>
          <p className={`${textSize} text-soft`}>{provider.availability}</p>
        </div>
      )}
      <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className={`font-medium text-blue-900 mb-2 ${textSize}`}>Quick Booking Tips</h4>
        <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
          <li>• Book in advance for regular consultations</li>
          <li>• Video consultations available for follow-ups</li>
        </ul>
      </div>
    </div>
  )
}

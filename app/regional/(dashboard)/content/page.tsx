'use client'

import { useState, useEffect, useCallback } from 'react'
import { FaSpinner, FaHome, FaChartBar, FaCogs, FaListUl, FaStar, FaCheckCircle, FaBullhorn, FaImages, FaQuoteRight } from 'react-icons/fa'
import type { IconType } from 'react-icons'
import HeroSectionEditor from './HeroSectionEditor'
import SectionItemsEditor from './SectionItemsEditor'
import DetailedServicesEditor from './DetailedServicesEditor'
import CtaBannerEditor from './CtaBannerEditor'
import HeroSlidesManager from './HeroSlidesManager'
import TestimonialsManager from './TestimonialsManager'

const TABS = [
 { id: 'hero', label: 'Hero', icon: FaHome as IconType },
 { id: 'stats', label: 'Stats', icon: FaChartBar as IconType },
 { id: 'services', label: 'Services', icon: FaCogs as IconType },
 { id: 'detailed_services', label: 'Detailed Services', icon: FaListUl as IconType },
 { id: 'specialties', label: 'Specialties', icon: FaStar as IconType },
 { id: 'why_choose', label: 'Why Choose', icon: FaCheckCircle as IconType },
 { id: 'cta_banner', label: 'CTA Banner', icon: FaBullhorn as IconType },
 { id: 'hero_slides', label: 'Hero Slides', icon: FaImages as IconType },
 { id: 'testimonials', label: 'Testimonials', icon: FaQuoteRight as IconType },
] as const

type TabId = (typeof TABS)[number]['id']

const STATS_FIELDS = [
 { key: 'number', label: 'Number', type: 'text' as const },
 { key: 'label', label: 'Label', type: 'text' as const },
 { key: 'color', label: 'Color', type: 'select' as const, options: ['text-blue-500', 'text-green-500', 'text-purple-500', 'text-orange-500', 'text-red-500', 'text-cyan-500', 'text-yellow-500', 'text-pink-500', 'text-indigo-500'] },
]

const SERVICES_FIELDS = [
 { key: 'title', label: 'Title', type: 'text' as const },
 { key: 'description', label: 'Description', type: 'textarea' as const },
 { key: 'icon', label: 'Icon', type: 'select' as const, options: ['FaVideo', 'FaCalendarCheck', 'FaTruck', 'FaRobot', 'FaStethoscope', 'FaHeart', 'FaPills', 'FaHospital', 'FaShieldAlt', 'FaClock', 'FaAward'] },
 { key: 'gradient', label: 'Gradient', type: 'select' as const, options: ['bg-gradient-blue', 'bg-gradient-green', 'bg-gradient-purple', 'bg-gradient-orange'] },
]

const SPECIALTIES_FIELDS = [
 { key: 'name', label: 'Name', type: 'text' as const },
 { key: 'icon', label: 'Icon', type: 'select' as const, options: ['FaStethoscope', 'FaHeart', 'FaBrain', 'FaBaby', 'FaFemale', 'FaBone', 'FaLeaf', 'FaHeartbeat', 'FaWeight'] },
 { key: 'color', label: 'Color', type: 'select' as const, options: ['text-blue-500', 'text-red-500', 'text-cyan-500', 'text-yellow-500', 'text-pink-500', 'text-green-500', 'text-purple-500', 'text-green-600', 'text-red-600', 'text-blue-600', 'text-orange-500', 'text-indigo-500'] },
]

const WHY_CHOOSE_FIELDS = [
 { key: 'title', label: 'Title', type: 'text' as const },
 { key: 'description', label: 'Description', type: 'textarea' as const },
 { key: 'icon', label: 'Icon', type: 'select' as const, options: ['FaShieldAlt', 'FaClock', 'FaAward', 'FaHeart', 'FaUserMd', 'FaStethoscope'] },
]

export default function ContentManagementPage() {
 const [activeTab, setActiveTab] = useState<TabId>('hero')
 const [countryCode, setCountryCode] = useState<string | null>(null)
 interface CmsSection {
 sectionType: string
 content: Record<string, unknown>
 }
 interface CmsHeroSlide {
 id: string
 title: string
 subtitle: string
 imageUrl: string
 sortOrder: number
 isActive: boolean
 }
 interface CmsTestimonial {
 id: string
 name: string
 role: string
 content: string
 rating: number
 imageUrl: string
 isActive: boolean
 }
 const [sections, setSections] = useState<Record<string, CmsSection>>({})
 const [heroSlides, setHeroSlides] = useState<CmsHeroSlide[]>([])
 const [testimonials, setTestimonials] = useState<CmsTestimonial[]>([])
 const [loading, setLoading] = useState(true)
 const [saving, setSaving] = useState(false)
 const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

 const showMessage = useCallback((type: 'success' | 'error', text: string) => {
 setMessage({ type, text })
 setTimeout(() => setMessage(null), 4000)
 }, [])

 // Load the regional admin's countryCode from their profile
 useEffect(() => {
 fetch('/api/auth/me', { credentials: 'include' })
 .then(res => res.json())
 .then(json => {
 const code = json?.user?.regionalAdminProfile?.countryCode
 if (code) setCountryCode(code)
 })
 .catch(() => {})
 }, [])

 const fetchAllData = useCallback(async () => {
 setLoading(true)
 const cc = countryCode ? `&countryCode=${countryCode}` : ''
 try {
 const [sectionsRes, slidesRes, testimonialsRes] = await Promise.all([
 fetch(`/api/cms/sections?includeHidden=true${cc}`, { credentials: 'include' }),
 fetch(`/api/cms/hero-slides?includeInactive=true${cc}`, { credentials: 'include' }),
 fetch(`/api/cms/testimonials?includeInactive=true${cc}`, { credentials: 'include' }),
 ])

 if (sectionsRes.ok) {
 const sectionsData = await sectionsRes.json()
 const indexed: Record<string, CmsSection> = {}
 const items = sectionsData.data || sectionsData
 if (Array.isArray(items)) {
 items.forEach((s: CmsSection) => {
 indexed[s.sectionType] = s
 })
 }
 setSections(indexed)
 }

 if (slidesRes.ok) {
 const slidesData = await slidesRes.json()
 setHeroSlides(slidesData.data || slidesData || [])
 }

 if (testimonialsRes.ok) {
 const testimonialsData = await testimonialsRes.json()
 setTestimonials(testimonialsData.data || testimonialsData || [])
 }
 } catch (err) {
 console.error('Failed to fetch CMS data:', err)
 showMessage('error', 'Failed to load CMS data')
 } finally {
 setLoading(false)
 }
 }, [showMessage, countryCode])

 useEffect(() => {
 if (countryCode !== null) fetchAllData()
 }, [fetchAllData, countryCode])

 const handleSaveSection = useCallback(async (sectionType: string, content: object) => {
 setSaving(true)
 try {
 const res = await fetch(`/api/cms/sections/${sectionType}`, {
 method: 'PUT',
 credentials: 'include',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ content, countryCode }),
 })

 if (res.ok) {
 const updated = await res.json()
 setSections((prev) => ({
 ...prev,
 [sectionType]: updated.data || updated,
 }))
 showMessage('success', `${sectionType.replace(/_/g, ' ')} section saved successfully!`)
 } else {
 const err = await res.json().catch(() => ({}))
 showMessage('error', err.message || 'Failed to save section')
 }
 } catch (err) {
 console.error('Save error:', err)
 showMessage('error', 'Network error while saving')
 } finally {
 setSaving(false)
 }
 }, [showMessage, countryCode])

 const refreshSlides = useCallback(async () => {
 const cc = countryCode ? `&countryCode=${countryCode}` : ''
 try {
 const res = await fetch(`/api/cms/hero-slides?includeInactive=true${cc}`, { credentials: 'include' })
 if (res.ok) {
 const data = await res.json()
 setHeroSlides(data.data || data || [])
 }
 } catch (err) {
 console.error('Failed to refresh slides:', err)
 }
 }, [countryCode])

 const refreshTestimonials = useCallback(async () => {
 const cc = countryCode ? `&countryCode=${countryCode}` : ''
 try {
 const res = await fetch(`/api/cms/testimonials?includeInactive=true${cc}`, { credentials: 'include' })
 if (res.ok) {
 const data = await res.json()
 setTestimonials(data.data || data || [])
 }
 } catch (err) {
 console.error('Failed to refresh testimonials:', err)
 }
 }, [countryCode])

 const renderTabContent = () => {
 if (loading) {
 return (
 <div className="flex items-center justify-center py-20">
 <FaSpinner className="animate-spin text-blue-600 text-3xl" />
 <span className="ml-3 text-gray-600 text-lg">Loading CMS data...</span>
 </div>
 )
 }

 switch (activeTab) {
 case 'hero':
 return (
 <HeroSectionEditor
 data={sections.hero?.content || {}}
 onSave={(content) => handleSaveSection('hero', content)}
 />
 )
 case 'stats':
 return (
 <SectionItemsEditor
 sectionType="stats"
 data={sections.stats?.content || {}}
 fields={STATS_FIELDS}
 onSave={(content) => handleSaveSection('stats', content)}
 />
 )
 case 'services':
 return (
 <SectionItemsEditor
 sectionType="services"
 data={sections.services?.content || {}}
 fields={SERVICES_FIELDS}
 onSave={(content) => handleSaveSection('services', content)}
 />
 )
 case 'detailed_services':
 return (
 <DetailedServicesEditor
 data={sections.detailed_services?.content || {}}
 onSave={(content) => handleSaveSection('detailed_services', content)}
 />
 )
 case 'specialties':
 return (
 <SectionItemsEditor
 sectionType="specialties"
 data={sections.specialties?.content || {}}
 fields={SPECIALTIES_FIELDS}
 onSave={(content) => handleSaveSection('specialties', content)}
 />
 )
 case 'why_choose':
 return (
 <SectionItemsEditor
 sectionType="why_choose"
 data={sections.why_choose?.content || {}}
 fields={WHY_CHOOSE_FIELDS}
 onSave={(content) => handleSaveSection('why_choose', content)}
 />
 )
 case 'cta_banner':
 return (
 <CtaBannerEditor
 data={sections.cta_banner?.content || {}}
 onSave={(content) => handleSaveSection('cta_banner', content)}
 />
 )
 case 'hero_slides':
 return <HeroSlidesManager slides={heroSlides} onRefresh={refreshSlides} />
 case 'testimonials':
 return <TestimonialsManager testimonials={testimonials} onRefresh={refreshTestimonials} />
 default:
 return null
 }
 }

 return (
 <>
 {/* Header */}
 <div className="mb-6">
 <h1 className="text-2xl font-bold text-gray-900">Content Management {countryCode && <span className="text-blue-600">({countryCode})</span>}</h1>
 <p className="text-gray-600 mt-1">Manage your region&apos;s landing page sections, hero slides, and testimonials{countryCode && <> &mdash; visible at <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">/{countryCode}</code></>}</p>
 </div>

 {/* Toast Message */}
 {message && (
 <div
 className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
 message.type === 'success'
 ? 'bg-green-50 text-green-800 border border-green-200'
 : 'bg-red-50 text-red-800 border border-red-200'
 }`}
 >
 {message.text}
 </div>
 )}

 {/* Tab Navigation */}
 <div className="bg-white rounded-xl p-1.5 shadow mb-6">
 <div className="flex gap-1 overflow-x-auto">
 {TABS.map((tab) => {
 const Icon = tab.icon
 return (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`px-2 sm:px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition flex items-center justify-center gap-1.5 ${
 activeTab === tab.id
 ? 'bg-blue-600 text-white shadow-sm'
 : 'text-gray-600 hover:bg-gray-100'
 }`}
 title={tab.label}
 >
 <Icon className="text-sm" />
 <span className="hidden sm:inline">{tab.label}</span>
 </button>
 )
 })}
 </div>
 </div>

 {/* Saving Overlay */}
 {saving && (
 <div className="mb-4 flex items-center gap-2 text-blue-600">
 <FaSpinner className="animate-spin" />
 <span className="text-sm font-medium">Saving changes...</span>
 </div>
 )}

 {/* Tab Content */}
 {renderTabContent()}
 </>
 )
}

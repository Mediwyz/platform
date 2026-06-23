'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
 FaNewspaper, FaImage, FaStar, FaChartBar, FaPlus,
 FaArrowUp, FaArrowDown, FaToggleOn, FaToggleOff, FaEdit, FaTrash, FaEye,
 FaInfoCircle
} from 'react-icons/fa'
import type { IconType } from 'react-icons'

interface Slider {
 id: string
 title: string
 description: string
 link: string
 order: number
 isActive: boolean
}

interface NewsArticle {
 id: string
 title: string
 content: string
 author: string
 date: string
 category: string
 isPublished: boolean
}

interface Testimonial {
 id: string
 name: string
 role: string
 content: string
 rating: number
 isActive: boolean
}

export default function CMSManagement() {
 const [activeTab, setActiveTab] = useState<'slider' | 'news' | 'testimonials' | 'statistics'>('slider')
 const [sliders, setSliders] = useState<Slider[]>([])
 const [news, setNews] = useState<NewsArticle[]>([])
 const [testimonials, setTestimonials] = useState<Testimonial[]>([])

 const moveSlider = (id: string, direction: 'up' | 'down') => {
 const index = sliders.findIndex(s => s.id === id)
 if ((direction === 'up' && index > 0) || (direction === 'down' && index < sliders.length - 1)) {
 const newSliders = [...sliders]
 const targetIndex = direction === 'up' ? index - 1 : index + 1
 ;[newSliders[index], newSliders[targetIndex]] = [newSliders[targetIndex], newSliders[index]]
 newSliders.forEach((s, i) => { s.order = i + 1 })
 setSliders(newSliders)
 }
 }

 const toggleSliderStatus = (id: string) =>
 setSliders(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s))

 const toggleNewsPublish = (id: string) =>
 setNews(prev => prev.map(n => n.id === id ? { ...n, isPublished: !n.isPublished } : n))

 const toggleTestimonialStatus = (id: string) =>
 setTestimonials(prev => prev.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t))

 return (
 <div className="min-h-screen bg-subtle">
 {/* Header */}
 <div className="bg-surface shadow-sm border-b">
 <div className="container mx-auto px-4 py-4">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold text-fg">Content Management System</h1>
 <p className="text-soft">Manage landing page content and appearance</p>
 </div>
 <Link href="/admin" className="px-4 py-2 border rounded-lg hover:bg-subtle">
 Back to Dashboard
 </Link>
 </div>
 </div>
 </div>

 <div className="container mx-auto px-4 py-8">
 {/* Notice */}
 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
 <div className="flex gap-3">
 <FaInfoCircle className="text-blue-600 text-xl flex-shrink-0 mt-0.5" />
 <div>
 <h3 className="font-semibold text-blue-900">CMS is managed via the admin dashboard</h3>
 <p className="text-sm text-blue-800 mt-1">
 Content such as news articles, testimonials, and featured sliders are managed through the
 platform dashboard. Use the tabs below to preview and reorder content locally.
 Changes will reflect once the CMS API is connected.
 </p>
 </div>
 </div>
 </div>

 {/* Tab Navigation */}
 <div className="bg-surface rounded-xl p-1 shadow mb-6">
 <div className="flex gap-1">
 {([
 { id: 'slider' as const, label: 'Slider', icon: FaImage as IconType },
 { id: 'news' as const, label: 'News', icon: FaNewspaper as IconType },
 { id: 'testimonials' as const, label: 'Testimonials', icon: FaStar as IconType },
 { id: 'statistics' as const, label: 'Statistics', icon: FaChartBar as IconType },
 ]).map(tab => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`flex-1 p-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
 activeTab === tab.id
 ? 'bg-blue-600 text-white'
 : 'text-soft hover:bg-subtle'
 }`}
 aria-label={tab.label}
 >
 <tab.icon className="text-lg" />
 <span className="hidden sm:inline text-sm">{tab.label}</span>
 </button>
 ))}
 </div>
 </div>

 {/* Slider Management */}
 {activeTab === 'slider' && (
 <div className="space-y-6">
 <div className="flex justify-between items-center mb-4">
 <h2 className="text-xl font-bold">Image Slider / Carousel</h2>
 <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
 <FaPlus /> Add Slide
 </button>
 </div>
 {sliders.length === 0 ? (
 <div className="text-center py-16 bg-surface rounded-xl shadow text-soft">
 <FaImage className="text-4xl mx-auto mb-3 text-faint" />
 <p className="text-lg font-medium">No slides configured</p>
 <p className="text-sm mt-1">Click &quot;Add Slide&quot; to create carousel slides</p>
 </div>
 ) : (
 sliders.map((slide, idx) => (
 <div key={slide.id} className="bg-surface rounded-xl p-6 shadow flex gap-6">
 <div className="w-48 h-24 bg-line rounded-lg flex items-center justify-center">
 <FaImage className="text-faint text-3xl" />
 </div>
 <div className="flex-1">
 <h3 className="font-semibold text-fg">{slide.title}</h3>
 <p className="text-soft text-sm mt-1">{slide.description}</p>
 <p className="text-xs text-soft mt-2">Link: {slide.link}</p>
 </div>
 <div className="flex items-center gap-3">
 <div className="flex flex-col gap-1">
 <button onClick={() => moveSlider(slide.id, 'up')} disabled={idx === 0} className="p-1 bg-subtle rounded disabled:opacity-50">
 <FaArrowUp />
 </button>
 <button onClick={() => moveSlider(slide.id, 'down')} disabled={idx === sliders.length - 1} className="p-1 bg-subtle rounded disabled:opacity-50">
 <FaArrowDown />
 </button>
 </div>
 <button onClick={() => toggleSliderStatus(slide.id)}>
 {slide.isActive
 ? <FaToggleOn className="text-3xl text-green-500" />
 : <FaToggleOff className="text-3xl text-faint" />}
 </button>
 <button className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"><FaEdit /></button>
 <button className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"><FaTrash /></button>
 </div>
 </div>
 ))
 )}
 </div>
 )}

 {/* News Management */}
 {activeTab === 'news' && (
 <div className="space-y-6">
 <div className="flex justify-between items-center mb-4">
 <h2 className="text-xl font-bold">News &amp; Updates</h2>
 <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
 <FaPlus /> Add Article
 </button>
 </div>
 {news.length === 0 ? (
 <div className="text-center py-16 bg-surface rounded-xl shadow text-soft">
 <FaNewspaper className="text-4xl mx-auto mb-3 text-faint" />
 <p className="text-lg font-medium">No news articles yet</p>
 <p className="text-sm mt-1">Click &quot;Add Article&quot; to create news content</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {news.map(article => (
 <div key={article.id} className="bg-surface rounded-xl shadow overflow-hidden">
 <div className="w-full h-48 bg-line flex items-center justify-center">
 <FaNewspaper className="text-faint text-4xl" />
 </div>
 <div className="p-4">
 <div className="flex justify-between items-start mb-2">
 <h3 className="font-semibold text-fg">{article.title}</h3>
 <span className={`px-2 py-1 rounded-full text-xs font-medium ${article.isPublished ? 'bg-green-100 text-green-800' : 'bg-subtle text-fg'}`}>
 {article.isPublished ? 'Published' : 'Draft'}
 </span>
 </div>
 <p className="text-soft text-sm line-clamp-2">{article.content}</p>
 <div className="flex justify-between items-center mt-4">
 <span className="text-xs text-soft">{article.date} • {article.author}</span>
 <div className="flex gap-2">
 <button onClick={() => toggleNewsPublish(article.id)} className="p-2 bg-subtle text-soft rounded hover:bg-line"><FaEye /></button>
 <button className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"><FaEdit /></button>
 <button className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"><FaTrash /></button>
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 )}

 {/* Testimonials Management */}
 {activeTab === 'testimonials' && (
 <div className="space-y-6">
 <div className="flex justify-between items-center mb-4">
 <h2 className="text-xl font-bold">Customer Testimonials</h2>
 <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
 <FaPlus /> Add Testimonial
 </button>
 </div>
 {testimonials.length === 0 ? (
 <div className="text-center py-16 bg-surface rounded-xl shadow text-soft">
 <FaStar className="text-4xl mx-auto mb-3 text-faint" />
 <p className="text-lg font-medium">No testimonials yet</p>
 <p className="text-sm mt-1">Click &quot;Add Testimonial&quot; to add customer reviews</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {testimonials.map(t => (
 <div key={t.id} className="bg-surface rounded-xl p-6 shadow">
 <div className="flex items-start gap-4">
 <div className="w-12 h-12 rounded-full bg-line flex items-center justify-center text-soft text-xl font-bold">
 {t.name[0]}
 </div>
 <div className="flex-1">
 <div className="flex justify-between items-start">
 <div>
 <h3 className="font-semibold text-fg">{t.name}</h3>
 <p className="text-sm text-soft">{t.role}</p>
 </div>
 <div className="flex">
 {[...Array(5)].map((_, i) => (
 <FaStar key={i} className={i < t.rating ? 'text-yellow-500' : 'text-faint'} />
 ))}
 </div>
 </div>
 <p className="text-soft mt-3 italic">{t.content}</p>
 <div className="flex justify-end gap-2 mt-4">
 <button onClick={() => toggleTestimonialStatus(t.id)}>
 {t.isActive
 ? <FaToggleOn className="text-2xl text-green-500" />
 : <FaToggleOff className="text-2xl text-faint" />}
 </button>
 <button className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"><FaEdit /></button>
 <button className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"><FaTrash /></button>
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 )}

 {/* Statistics tab */}
 {activeTab === 'statistics' && (
 <div className="text-center py-16 bg-surface rounded-xl shadow text-soft">
 <FaChartBar className="text-4xl mx-auto mb-3 text-faint" />
 <p className="text-lg font-medium">Platform statistics</p>
 <p className="text-sm mt-1">
 View detailed platform statistics on the{' '}
 <Link href="/admin/statistics" className="text-blue-600 hover:underline">
 statistics page
 </Link>
 </p>
 </div>
 )}
 </div>
 </div>
 )
}

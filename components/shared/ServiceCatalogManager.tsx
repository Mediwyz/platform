'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Image from 'next/image'
import { useUser } from '@/hooks/useUser'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import {
  FaPlus, FaEdit, FaTrash, FaSearch, FaSpinner, FaTimes,
  FaCheckCircle, FaTimesCircle, FaFilter, FaExclamationTriangle,
  FaImage, FaIcons, FaUpload,
} from 'react-icons/fa'
import { FiLink } from 'react-icons/fi'
import ServiceWorkflowLinker from '@/components/workflow/ServiceWorkflowLinker'
import IconPicker from '@/components/shared/IconPicker'

export interface ServiceField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox'
  required?: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
  defaultValue?: string | number | boolean
}

export interface ServiceCatalogConfig {
  title: string
  apiBasePath: string
  categoryOptions: { value: string; label: string }[]
  fields: ServiceField[]
  accentColor?: string
  providerType?: string
  workflowCreateHref?: string
  createApiPath?: string
}

interface ServiceItem {
  id: string
  serviceName: string
  category: string
  description: string
  price: number
  currency?: string
  isActive: boolean
  platformServiceId?: string
  iconKey?: string | null
  emoji?: string | null
  imageUrl?: string | null
  createdByProviderId?: string | null
  [key: string]: unknown
}

interface WorkflowTemplate {
  id: string
  name: string
  slug: string
  serviceMode: string
  isDefault: boolean
  platformServiceId: string | null
  steps: { order: number; statusCode: string; label: string; flags: Record<string, boolean | string> }[]
}

const MODE_LABELS: Record<string, string> = { office: 'In-Person', home: 'Home Visit', video: 'Video' }
const MODE_COLORS: Record<string, string> = {
  office: 'bg-sky-100 text-sky-700',
  home: 'bg-orange-100 text-orange-700',
  video: 'bg-purple-100 text-purple-700',
}

type IllustrationTab = 'icon' | 'upload'

export default function ServiceCatalogManager({ config }: { config: ServiceCatalogConfig }) {
  const { user } = useUser()
  const [services, setServices] = useState<ServiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState<ServiceItem | null>(null)
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [cachedWorkflows, setCachedWorkflows] = useState<WorkflowTemplate[]>([])
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('')

  // Illustration state
  const [illustrationTab, setIllustrationTab] = useState<IllustrationTab>('icon')
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const accent = config.accentColor || 'teal'

  useEffect(() => {
    if (!config.providerType) return
    fetch(`/api/workflow/templates?providerType=${config.providerType}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => { if (data.success) setCachedWorkflows(data.data) })
      .catch(() => {})
  }, [config.providerType])

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch(config.apiBasePath, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch services')
      const data = await res.json()
      const items = (data.data || []).map((s: Record<string, unknown>) => {
        const ps = s.platformService as Record<string, unknown> | undefined
        return {
          ...s,
          id: s.id || s.configId || s.platformServiceId,
          serviceName: (s.serviceName as string) || (ps?.serviceName as string) || 'Unnamed Service',
          description: (s.description as string) || (ps?.description as string) || '',
          category: (s.category as string) || (ps?.category as string) || 'General',
          defaultPrice: s.defaultPrice ?? s.priceOverride ?? ps?.defaultPrice ?? 0,
          duration: s.duration ?? ps?.duration ?? 30,
          currency: (s.currency as string) || (ps?.currency as string) || 'MUR',
          iconKey: (s.iconKey as string | null) ?? (ps?.iconKey as string | null) ?? null,
          emoji: (s.emoji as string | null) ?? (ps?.emoji as string | null) ?? null,
          imageUrl: (s.imageUrl as string | null) ?? (ps?.imageUrl as string | null) ?? null,
          createdByProviderId: (s.createdByProviderId as string | null) ?? (ps?.createdByProviderId as string | null) ?? null,
          platformServiceId: (s.platformServiceId as string) ?? (ps?.id as string) ?? s.id,
        }
      })
      setServices(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load services')
    } finally {
      setLoading(false)
    }
  }, [config.apiBasePath])

  useEffect(() => {
    if (user?.id) fetchServices()
  }, [user?.id, fetchServices])

  const availableWorkflows = useMemo(
    () => cachedWorkflows.filter(w => !w.platformServiceId),
    [cachedWorkflows]
  )

  const openCreateModal = () => {
    setEditingService(null)
    const defaults: Record<string, unknown> = {}
    config.fields.forEach(f => {
      if (f.defaultValue !== undefined) defaults[f.key] = f.defaultValue
      else if (f.type === 'checkbox') defaults[f.key] = true
      else if (f.type === 'number') defaults[f.key] = ''
      else defaults[f.key] = ''
    })
    defaults.iconKey = null
    defaults.emoji = null
    defaults.imageUrl = null
    setFormData(defaults)
    setSelectedWorkflowId('')
    setShowIconPicker(false)
    setIllustrationTab('icon')
    setShowModal(true)
  }

  const openEditModal = (service: ServiceItem) => {
    setEditingService(service)
    const data: Record<string, unknown> = {}
    config.fields.forEach(f => {
      data[f.key] = service[f.key] ?? ''
    })
    data.iconKey = service.iconKey ?? null
    data.emoji = service.emoji ?? null
    data.imageUrl = service.imageUrl ?? null
    setFormData(data)
    setSelectedWorkflowId('')
    setShowIconPicker(false)
    setIllustrationTab(service.imageUrl ? 'upload' : 'icon')
    setShowModal(true)
  }

  const handleIconChange = (iconKey: string, isEmoji: boolean) => {
    if (!iconKey) {
      setFormData(prev => ({ ...prev, iconKey: null, emoji: null }))
    } else if (isEmoji) {
      setFormData(prev => ({ ...prev, emoji: iconKey, iconKey: null, imageUrl: null }))
    } else {
      setFormData(prev => ({ ...prev, iconKey, emoji: null, imageUrl: null }))
    }
    setShowIconPicker(false)
  }

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload/service-image', {
        method: 'POST',
        body: fd,
        credentials: 'include',
      })
      const json = await res.json()
      if (json.success) {
        setFormData(prev => ({ ...prev, imageUrl: json.data.url, iconKey: null, emoji: null }))
      } else {
        setMessage({ type: 'error', text: json.message || 'Upload failed' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Image upload failed - check your connection' })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSave = async () => {
    if (!editingService && config.providerType && !selectedWorkflowId) {
      setMessage({ type: 'error', text: 'Please select a workflow before creating this service. Services without a workflow cannot be booked.' })
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      let url: string
      let method: string

      if (editingService) {
        const isOwn = editingService.createdByProviderId === user?.id
        if (isOwn) {
          const psId = (editingService.platformServiceId as string) || editingService.id
          url = `/api/services/custom/${psId}`
          method = 'PATCH'
        } else {
          url = `${config.apiBasePath}/${editingService.id}`
          method = 'PATCH'
        }
      } else {
        url = config.createApiPath || config.apiBasePath
        method = 'POST'
      }

      const payload = {
        ...formData,
        iconKey: formData.iconKey || null,
        emoji: formData.emoji || null,
        imageUrl: formData.imageUrl || null,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Request failed' }))
        throw new Error(err.message || 'Request failed')
      }

      const result = await res.json()

      if (!editingService && selectedWorkflowId && result.data?.id) {
        const newServiceId = result.data.id
        await fetch(`/api/workflow/templates/${selectedWorkflowId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ platformServiceId: newServiceId }),
        })
        setCachedWorkflows(prev =>
          prev.map(w => w.id === selectedWorkflowId ? { ...w, platformServiceId: newServiceId } : w)
        )
      }

      setMessage({ type: 'success', text: editingService ? 'Service updated' : 'Service created and workflow linked' })
      setShowModal(false)
      fetchServices()
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (service: ServiceItem) => {
    if (!confirm('Are you sure you want to delete this service?')) return
    try {
      const isOwn = service.createdByProviderId === user?.id
      const url = isOwn
        ? `/api/services/custom/${(service.platformServiceId as string) || service.id}`
        : `${config.apiBasePath}/${service.id}`
      const res = await fetch(url, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) throw new Error('Delete failed')
      setMessage({ type: 'success', text: 'Service removed' })
      fetchServices()
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to delete' })
    }
  }

  const filtered = services.filter(s => {
    if (filterCategory && s.category !== filterCategory) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return s.serviceName.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
    }
    return true
  })

  // Illustration preview for modal
  const currentIconKey = formData.iconKey as string | null
  const currentEmoji = formData.emoji as string | null
  const currentImageUrl = formData.imageUrl as string | null

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FaSpinner className={`animate-spin text-3xl text-${accent}-600`} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{config.title}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {services.length} service{services.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className={`flex items-center gap-2 px-4 py-2.5 bg-${accent}-600 text-white rounded-lg hover:bg-${accent}-700 transition font-medium text-sm`}
        >
          <FaPlus /> Add Service
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}><FaTimesCircle /></button>
        </div>
      )}
      {message && (
        <div className={`${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'} border px-4 py-3 rounded-lg flex items-center justify-between`}>
          <span className="flex items-center gap-2">
            {message.type === 'success' ? <FaCheckCircle /> : <FaTimesCircle />}
            {message.text}
          </span>
          <button onClick={() => setMessage(null)}><FaTimes /></button>
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-${accent}-500 focus:ring-2 focus:ring-${accent}-200 transition text-sm`}
          />
        </div>
        <div className="relative">
          <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 text-sm appearance-none bg-white"
          >
            <option value="">All Categories</option>
            {config.categoryOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Service Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {services.length === 0 ? 'No Services Yet' : 'No matching services'}
          </h3>
          <p className="text-gray-500 text-sm">
            {services.length === 0
              ? 'Add your first service to start accepting bookings. You can pick a health icon or upload a custom illustration.'
              : 'Try adjusting your search or filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(service => {
            const psId = (service.platformServiceId as string) || service.id
            return (
              <div key={service.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden">
                {/* Illustration strip */}
                {(service.imageUrl || service.iconKey || service.emoji) && (
                  <div className="h-24 bg-gradient-to-r from-teal-50 to-sky-50 flex items-center justify-center">
                    {service.imageUrl ? (
                      <Image src={service.imageUrl} alt={service.serviceName} width={400} height={80} className="h-20 w-full object-contain px-4" />
                    ) : service.emoji ? (
                      <span className="text-5xl leading-none select-none">{service.emoji}</span>
                    ) : service.iconKey ? (
                      <Icon icon={service.iconKey} width={56} height={56} color="#0C6780" />
                    ) : null}
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{service.serviceName}</h3>
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 bg-${accent}-50 text-${accent}-700`}>
                        {service.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => openEditModal(service)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit"
                      >
                        <FaEdit className="text-sm" />
                      </button>
                      <button
                        onClick={() => handleDelete(service)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <FaTrash className="text-sm" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{service.description}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-lg font-bold text-gray-900">
                      {service.currency || 'MUR'} {((service.defaultPrice as number) ?? service.price ?? 0).toLocaleString()}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${service.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {service.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {config.providerType && (
                    <div className="pt-3 border-t border-gray-100 mt-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Linked Workflow</p>
                      <ServiceWorkflowLinker
                        serviceId={psId}
                        serviceName={service.serviceName}
                        providerType={config.providerType}
                        createWorkflowHref={config.workflowCreateHref || '#'}
                        workflows={cachedWorkflows as never[]}
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-900">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <FaTimes />
              </button>
            </div>

            <div className="p-5 space-y-4">

              {/* ── Illustration section ──────────────────────────────── */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Illustration</label>

                {/* Tab toggle */}
                <div className="flex gap-1 mb-3 bg-gray-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => { setIllustrationTab('icon'); setShowIconPicker(false) }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition
                      ${illustrationTab === 'icon' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <FaIcons className="text-[11px]" /> Icon Library
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIllustrationTab('upload'); setShowIconPicker(false) }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition
                      ${illustrationTab === 'upload' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <FaUpload className="text-[11px]" /> Upload Image
                  </button>
                </div>

                {illustrationTab === 'icon' ? (
                  <div>
                    {/* Current icon preview */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-14 h-14 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0 border border-teal-100">
                        {currentEmoji ? (
                          <span className="text-3xl leading-none">{currentEmoji}</span>
                        ) : currentIconKey ? (
                          <Icon icon={currentIconKey} width={36} height={36} color="#0C6780" />
                        ) : (
                          <FaIcons className="text-2xl text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-1">
                          {currentEmoji ? `Emoji: ${currentEmoji}` : currentIconKey ? `Icon: ${currentIconKey}` : 'No icon selected'}
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowIconPicker(v => !v)}
                            className="text-xs px-2.5 py-1 bg-[#0C6780] text-white rounded-lg hover:bg-[#0a5a6e] transition"
                          >
                            {showIconPicker ? 'Close picker' : (currentIconKey || currentEmoji) ? 'Change icon' : 'Choose icon'}
                          </button>
                          {(currentIconKey || currentEmoji) && (
                            <button
                              type="button"
                              onClick={() => setFormData(p => ({ ...p, iconKey: null, emoji: null }))}
                              className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {showIconPicker && (
                      <div className="mt-2">
                        <IconPicker
                          value={currentEmoji || currentIconKey || undefined}
                          onChange={handleIconChange}
                          onClose={() => setShowIconPicker(false)}
                          color="#0C6780"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {/* Image upload */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0]
                        if (f) handleImageUpload(f)
                      }}
                    />

                    {currentImageUrl ? (
                      <div className="flex items-center gap-3">
                        <Image src={currentImageUrl} alt="Service illustration" width={96} height={64} className="w-24 h-16 object-contain rounded-lg border border-gray-200 bg-gray-50" />
                        <div className="flex flex-col gap-1.5">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-xs px-2.5 py-1 bg-[#0C6780] text-white rounded-lg hover:bg-[#0a5a6e] transition"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, imageUrl: null }))}
                            className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="w-full flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-[#0C6780] hover:text-[#0C6780] transition-colors disabled:opacity-50"
                      >
                        {uploadingImage ? (
                          <>
                            <FaSpinner className="animate-spin text-xl" />
                            <span className="text-xs">Uploading…</span>
                          </>
                        ) : (
                          <>
                            <FaImage className="text-2xl" />
                            <span className="text-xs font-medium">Click to upload image</span>
                            <span className="text-[10px]">PNG, JPG, WebP - max 5MB</span>
                          </>
                        )}
                      </button>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1.5">Upload a custom illustration for this service. Use a square or landscape image for best results.</p>
                  </div>
                )}
              </div>

              {/* ── Standard form fields ──────────────────────────────── */}
              {config.fields.map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      value={String(formData[field.key] || '')}
                      onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 text-sm"
                    >
                      <option value="">Select {field.label}</option>
                      {field.options?.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      value={String(formData[field.key] || '')}
                      onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      rows={3}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 text-sm resize-none"
                    />
                  ) : field.type === 'checkbox' ? (
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!formData[field.key]}
                        onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.checked }))}
                        className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-sm text-gray-600">Enabled</span>
                    </label>
                  ) : (
                    <input
                      type={field.type}
                      value={String(formData[field.key] ?? '')}
                      onChange={e => setFormData(prev => ({ ...prev, [field.key]: field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 text-sm"
                    />
                  )}
                </div>
              ))}

              {/* ── Workflow Assignment ───────────────────────────────── */}
              {config.providerType && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <FiLink className="w-3.5 h-3.5" />
                      Linked Workflow
                      {!editingService && <span className="text-red-500">*</span>}
                    </span>
                  </label>

                  {editingService ? (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
                      Workflow is managed from the service card. Close this dialog and use the
                      &ldquo;Linked Workflow&rdquo; section on the card to assign or change it.
                    </div>
                  ) : availableWorkflows.length === 0 ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
                      <div className="flex items-center gap-2 text-amber-800 text-sm font-medium">
                        <FaExclamationTriangle className="w-4 h-4 flex-shrink-0" />
                        No workflows available to assign
                      </div>
                      <p className="text-xs text-amber-700">
                        All existing workflows are already linked to other services, or none have been created yet.
                        Create a new workflow first, then come back to add this service.
                      </p>
                      {config.workflowCreateHref && (
                        <Link
                          href={config.workflowCreateHref}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 underline underline-offset-2"
                        >
                          Create a workflow
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <select
                        value={selectedWorkflowId}
                        onChange={e => setSelectedWorkflowId(e.target.value)}
                        className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:border-teal-500 text-sm ${!selectedWorkflowId ? 'border-amber-300 bg-amber-50' : 'border-gray-300'}`}
                      >
                        <option value="">Select a workflow...</option>
                        {availableWorkflows.map(w => (
                          <option key={w.id} value={w.id}>
                            {w.name} - {MODE_LABELS[w.serviceMode] || w.serviceMode}
                          </option>
                        ))}
                      </select>
                      {selectedWorkflowId && (() => {
                        const wf = availableWorkflows.find(w => w.id === selectedWorkflowId)
                        if (!wf) return null
                        return (
                          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${MODE_COLORS[wf.serviceMode] || 'bg-gray-100 text-gray-700'}`}>
                            {MODE_LABELS[wf.serviceMode] || wf.serviceMode}
                          </div>
                        )
                      })()}
                      {!selectedWorkflowId && (
                        <p className="text-xs text-amber-700">
                          A workflow defines how this service is delivered. Services without a workflow are not visible to patients.
                        </p>
                      )}
                      {config.workflowCreateHref && (
                        <Link
                          href={config.workflowCreateHref}
                          className="inline-flex items-center gap-1 text-xs text-[#0C6780] hover:underline"
                        >
                          <FaPlus className="w-2.5 h-2.5" /> Create a new workflow instead
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t sticky bottom-0 bg-white">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || (!editingService && !!config.providerType && !selectedWorkflowId && availableWorkflows.length > 0)}
                className={`px-4 py-2.5 bg-${accent}-600 text-white rounded-lg hover:bg-${accent}-700 transition text-sm font-medium disabled:opacity-50 flex items-center gap-2`}
              >
                {saving && <FaSpinner className="animate-spin" />}
                {editingService ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

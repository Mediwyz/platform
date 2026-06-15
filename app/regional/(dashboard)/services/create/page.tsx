'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { FiArrowLeft, FiSave } from 'react-icons/fi'
import IconPicker from '@/components/shared/IconPicker'

interface ProviderRole {
  code: string
  label: string
}

export default function CreateServicePage() {
  const router = useRouter()
  const [roles, setRoles] = useState<ProviderRole[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showPicker, setShowPicker] = useState(false)

  const [form, setForm] = useState({
    providerType: '',
    serviceName: '',
    category: '',
    description: '',
    defaultPrice: 0,
    currency: 'MUR',
    duration: 30,
    isDefault: true,
    countryCode: '',
    iconKey: '',
    emoji: '',
    requiredContentType: '',
  })

  useEffect(() => {
    fetch('/api/roles?isProvider=true')
      .then(r => r.json())
      .then(json => { if (json.success && json.data) setRoles(json.data) })
      .catch(() => {})
  }, [])

  const set = (field: string, value: unknown) => setForm(prev => ({ ...prev, [field]: value }))

  const handleIconChange = (iconKey: string, isEmoji: boolean) => {
    if (isEmoji) {
      set('emoji', iconKey)
      set('iconKey', '')
    } else {
      set('iconKey', iconKey)
      set('emoji', '')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.providerType) { setError('Provider type is required'); return }
    if (!form.serviceName.trim()) { setError('Service name is required'); return }
    if (!form.category.trim()) { setError('Category is required'); return }
    if (!form.description.trim()) { setError('Description is required'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/services/admin', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          defaultPrice: Number(form.defaultPrice),
          duration: Number(form.duration),
          iconKey: form.iconKey || undefined,
          emoji: form.emoji || undefined,
          countryCode: form.countryCode || undefined,
          requiredContentType: form.requiredContentType || undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        router.push('/regional/services')
      } else {
        setError(json.message || 'Failed to create service')
      }
    } catch {
      setError('Network error - please try again')
    } finally {
      setSaving(false)
    }
  }

  const iconPreview = form.iconKey || form.emoji

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/regional/services" className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
          <FiArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Create Platform Service</h1>
          <p className="text-sm text-gray-500">Add a new service to the catalog for all providers of a given type.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Icon picker */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <label className="block text-sm font-semibold text-gray-700">Service Illustration</label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-[#0C6780]/10 flex items-center justify-center">
              {form.iconKey ? (
                <Icon icon={form.iconKey} width={36} height={36} color="#0C6780" />
              ) : form.emoji ? (
                <span className="text-3xl">{form.emoji}</span>
              ) : (
                <Icon icon="healthicons:stethoscope" width={36} height={36} color="#9CA3AF" />
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => setShowPicker(!showPicker)}
                className="px-3 py-1.5 text-sm border border-[#0C6780] text-[#0C6780] rounded-lg hover:bg-[#0C6780]/5 transition-colors"
              >
                {iconPreview ? 'Change Icon' : 'Choose Icon'}
              </button>
              {iconPreview && (
                <p className="text-xs text-gray-500 mt-1 font-mono">{form.iconKey || form.emoji}</p>
              )}
            </div>
          </div>
          {showPicker && (
            <div className="mt-2">
              <IconPicker
                value={form.iconKey || form.emoji}
                onChange={handleIconChange}
                onClose={() => setShowPicker(false)}
                color="#0C6780"
              />
            </div>
          )}
        </div>

        {/* Core fields */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <label className="block text-sm font-semibold text-gray-700">Service Details</label>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Provider Type *</label>
            <select
              value={form.providerType}
              onChange={e => set('providerType', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780]"
              required
            >
              <option value="">Select a provider type</option>
              {roles.map(r => <option key={r.code} value={r.code}>{r.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Service Name *</label>
            <input
              type="text"
              value={form.serviceName}
              onChange={e => set('serviceName', e.target.value)}
              placeholder="e.g. General Consultation, Blood Pressure Check"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
            <input
              type="text"
              value={form.category}
              onChange={e => set('category', e.target.value)}
              placeholder="e.g. Consultation, Screening, Wound Care"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
              placeholder="Describe what this service includes..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780] resize-none"
              required
            />
          </div>
        </div>

        {/* Pricing & duration */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <label className="block text-sm font-semibold text-gray-700">Pricing &amp; Duration</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Default Price (MUR)</label>
              <input
                type="number"
                min={0}
                step={50}
                value={form.defaultPrice}
                onChange={e => set('defaultPrice', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Duration (minutes)</label>
              <input
                type="number"
                min={5}
                step={5}
                value={form.duration}
                onChange={e => set('duration', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
            <select
              value={form.currency}
              onChange={e => set('currency', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780]"
            >
              <option value="MUR">MUR - Mauritian Rupee</option>
              <option value="MGA">MGA - Malagasy Ariary</option>
              <option value="KES">KES - Kenyan Shilling</option>
              <option value="EUR">EUR - Euro</option>
            </select>
          </div>
        </div>

        {/* Advanced */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <label className="block text-sm font-semibold text-gray-700">Advanced</label>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Country Code (leave blank for all regions)</label>
            <input
              type="text"
              value={form.countryCode}
              onChange={e => set('countryCode', e.target.value.toUpperCase())}
              placeholder="MU, MG, KE, ..."
              maxLength={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Required Content Type on Completion</label>
            <select
              value={form.requiredContentType}
              onChange={e => set('requiredContentType', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780]"
            >
              <option value="">None</option>
              <option value="lab_result">Lab Result</option>
              <option value="report">Medical Report</option>
              <option value="eye_prescription">Eye Prescription</option>
              <option value="care_notes">Care Notes</option>
              <option value="exercise_plan">Exercise Plan</option>
              <option value="meal_plan">Meal Plan</option>
              <option value="dental_chart">Dental Chart</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isDefault"
              checked={form.isDefault}
              onChange={e => set('isDefault', e.target.checked)}
              className="rounded border-gray-300 text-[#0C6780]"
            />
            <label htmlFor="isDefault" className="text-xs text-gray-700">
              Auto-assign to new providers of this type on registration
            </label>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-200">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0C6780] text-white rounded-xl text-sm font-medium hover:bg-[#0a5a6e] transition-colors disabled:opacity-50"
          >
            <FiSave className="w-4 h-4" />
            {saving ? 'Creating...' : 'Create Service'}
          </button>
          <Link
            href="/regional/services"
            className="px-5 py-2.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

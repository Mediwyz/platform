'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { FiArrowLeft, FiSave } from 'react-icons/fi'
import IconPicker from '@/components/shared/IconPicker'

interface ServiceDetail {
  id: string
  providerType: string
  serviceName: string
  category: string
  description: string
  defaultPrice: number
  currency: string
  duration: number | null
  isDefault: boolean
  isActive: boolean
  countryCode: string | null
  iconKey: string | null
  emoji: string | null
  requiredContentType: string | null
}

export default function EditServicePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [form, setForm] = useState<Partial<ServiceDetail>>({})

  useEffect(() => {
    if (!id) return
    fetch(`/api/services/admin/${id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(json => {
        if (json.success) setForm(json.data)
        else setError('Service not found')
      })
      .catch(() => setError('Failed to load service'))
      .finally(() => setLoading(false))
  }, [id])

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
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/services/admin/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceName: form.serviceName,
          category: form.category,
          description: form.description,
          defaultPrice: Number(form.defaultPrice),
          currency: form.currency,
          duration: form.duration ? Number(form.duration) : undefined,
          isDefault: form.isDefault,
          isActive: form.isActive,
          countryCode: form.countryCode || null,
          iconKey: form.iconKey || null,
          emoji: form.emoji || null,
          requiredContentType: form.requiredContentType || null,
        }),
      })
      const json = await res.json()
      if (json.success) router.push('/regional/services')
      else setError(json.message || 'Failed to update')
    } catch {
      setError('Network error - please try again')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0C6780]" />
    </div>
  )

  const iconPreview = form.iconKey || form.emoji

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/regional/services" className="p-2 rounded-lg hover:bg-subtle transition-colors text-soft">
          <FiArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-fg">Edit Service</h1>
          <p className="text-sm text-soft">{form.providerType?.replace(/_/g, ' ')}  {form.category}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Icon picker */}
        <div className="bg-surface rounded-xl border border-line p-4 space-y-3">
          <label className="block text-sm font-semibold text-soft">Service Illustration</label>
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
                <p className="text-xs text-soft mt-1 font-mono">{form.iconKey || form.emoji}</p>
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
        <div className="bg-surface rounded-xl border border-line p-4 space-y-4">
          <label className="block text-sm font-semibold text-soft">Service Details</label>

          <div>
            <label className="block text-xs font-medium text-soft mb-1">Provider Type</label>
            <input
              type="text"
              value={form.providerType?.replace(/_/g, ' ') || ''}
              disabled
              className="w-full border border-line bg-subtle rounded-lg px-3 py-2 text-sm text-soft"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-soft mb-1">Service Name *</label>
            <input
              type="text"
              value={form.serviceName || ''}
              onChange={e => set('serviceName', e.target.value)}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-soft mb-1">Category *</label>
            <input
              type="text"
              value={form.category || ''}
              onChange={e => set('category', e.target.value)}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-soft mb-1">Description *</label>
            <textarea
              value={form.description || ''}
              onChange={e => set('description', e.target.value)}
              rows={3}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780] resize-none"
              required
            />
          </div>
        </div>

        {/* Pricing & duration */}
        <div className="bg-surface rounded-xl border border-line p-4 space-y-4">
          <label className="block text-sm font-semibold text-soft">Pricing &amp; Duration</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-soft mb-1">Default Price</label>
              <input
                type="number"
                min={0}
                step={50}
                value={form.defaultPrice ?? 0}
                onChange={e => set('defaultPrice', e.target.value)}
                className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-soft mb-1">Duration (minutes)</label>
              <input
                type="number"
                min={5}
                step={5}
                value={form.duration ?? 30}
                onChange={e => set('duration', e.target.value)}
                className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-soft mb-1">Currency</label>
            <select
              value={form.currency || 'MUR'}
              onChange={e => set('currency', e.target.value)}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780]"
            >
              <option value="MUR">MUR - Mauritian Rupee</option>
              <option value="MGA">MGA - Malagasy Ariary</option>
              <option value="KES">KES - Kenyan Shilling</option>
              <option value="EUR">EUR - Euro</option>
            </select>
          </div>
        </div>

        {/* Advanced */}
        <div className="bg-surface rounded-xl border border-line p-4 space-y-4">
          <label className="block text-sm font-semibold text-soft">Advanced</label>

          <div>
            <label className="block text-xs font-medium text-soft mb-1">Country Code</label>
            <input
              type="text"
              value={form.countryCode || ''}
              onChange={e => set('countryCode', e.target.value.toUpperCase())}
              placeholder="MU, MG, KE, ..."
              maxLength={2}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-soft mb-1">Required Content Type on Completion</label>
            <select
              value={form.requiredContentType || ''}
              onChange={e => set('requiredContentType', e.target.value)}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780]"
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

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isDefault"
                checked={form.isDefault ?? true}
                onChange={e => set('isDefault', e.target.checked)}
                className="rounded border-line text-[#0C6780]"
              />
              <label htmlFor="isDefault" className="text-xs text-soft">Auto-assign to new providers</label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive ?? true}
                onChange={e => set('isActive', e.target.checked)}
                className="rounded border-line text-[#0C6780]"
              />
              <label htmlFor="isActive" className="text-xs text-soft">Active</label>
            </div>
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
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link href="/regional/services" className="px-5 py-2.5 text-sm text-soft hover:text-fg transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

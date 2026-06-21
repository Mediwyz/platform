'use client'

import { useState, useEffect, useCallback } from 'react'
import { Icon } from '@iconify/react'
import IconPicker from '@/components/shared/IconPicker'
import CmsImageUpload from '@/components/shared/CmsImageUpload'
import {
  FaPlus, FaEdit, FaTrash, FaTimes, FaSpinner,
  FaUsersCog, FaEye, FaEyeSlash, FaFileAlt,
  // Healthcare & Medical
  FaUserMd, FaUserNurse, FaBaby, FaPills, FaFlask, FaAmbulance,
  FaHandHoldingHeart, FaWalking, FaTooth, FaAppleAlt,
  FaHeadphones, FaHeart, FaBrain, FaStethoscope, FaBone,
  FaLungs, FaMicroscope, FaSyringe, FaCut,
  // Body & Wellness
  FaHeartbeat, FaAllergies, FaWeight, FaBed, FaSpa, FaRunning,
  FaBiking, FaSwimmer, FaPray, FaSmile, FaMeh,
  // Medical Tools & Equipment
  FaThermometerHalf, FaBandAid, FaCapsules, FaXRay, FaDna,
  FaPrescriptionBottleAlt, FaTablets, FaNotesMedical, FaFileMedical,
  FaHospital, FaClinicMedical, FaProcedures, FaMedkit,
  // Disability & Support
  FaWheelchair, FaDeaf, FaSignLanguage, FaBlind, FaAccessibleIcon,
  // General
  FaUser, FaUsers, FaUserShield, FaHandsHelping, FaShieldAlt,
  FaStar, FaGlobe, FaLeaf, FaSeedling, FaFire,
} from 'react-icons/fa'
import type { IconType } from 'react-icons'

interface VerificationDoc {
  id?: string
  documentName: string
  description?: string
  isRequired: boolean
}

interface ProviderRole {
  id: string
  code: string
  label: string
  singularLabel: string
  slug: string
  icon: string
  iconKey: string | null
  color: string
  cardImage: string | null
  description: string | null
  searchEnabled: boolean
  bookingEnabled: boolean
  inventoryEnabled: boolean
  isProvider: boolean
  isActive: boolean
  displayOrder: number
  urlPrefix: string | null
  cookieValue: string | null
  createdByAdminId: string | null
  verificationDocs: VerificationDoc[]
}

const emptyForm = {
  code: '',
  label: '',
  singularLabel: '',
  slug: '',
  icon: 'FaUserMd',
  iconKey: '',
  color: '#0C6780',
  cardImage: '',
  description: '',
  searchEnabled: true,
  bookingEnabled: true,
  inventoryEnabled: true,
  displayOrder: 100,
  verificationDocs: [] as { documentName: string; description: string; isRequired: boolean }[],
}

const ICON_MAP: Record<string, IconType> = {
  // Healthcare & Medical
  FaUserMd, FaUserNurse, FaBaby, FaPills, FaFlask, FaAmbulance,
  FaHandHoldingHeart, FaWalking, FaTooth, FaEye, FaAppleAlt,
  FaHeadphones, FaHeart, FaBrain, FaStethoscope, FaBone,
  FaLungs, FaMicroscope, FaSyringe, FaCut,
  // Body & Wellness
  FaHeartbeat, FaAllergies, FaWeight, FaBed, FaSpa, FaRunning,
  FaBiking, FaSwimmer, FaPray, FaSmile, FaMeh,
  // Medical Tools
  FaThermometerHalf, FaBandAid, FaCapsules, FaXRay, FaDna,
  FaPrescriptionBottleAlt, FaTablets, FaNotesMedical, FaFileMedical,
  FaHospital, FaClinicMedical, FaProcedures, FaMedkit,
  // Disability & Support
  FaWheelchair, FaDeaf, FaSignLanguage, FaBlind, FaAccessibleIcon,
  // General
  FaUser, FaUsers, FaUserShield, FaHandsHelping, FaShieldAlt,
  FaStar, FaGlobe, FaLeaf, FaSeedling, FaFire,
}
const ICON_OPTIONS = Object.keys(ICON_MAP)

export default function RolesManagementPage() {
  const [roles, setRoles] = useState<ProviderRole[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [docInput, setDocInput] = useState({ name: '', description: '', required: true })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showIconPicker, setShowIconPicker] = useState(false)

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch('/api/regional/roles', { credentials: 'include' })
      const json = await res.json()
      if (json.success) setRoles(json.data)
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchRoles() }, [fetchRoles])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (role: ProviderRole) => {
    setEditingId(role.id)
    setForm({
      code: role.code,
      label: role.label,
      singularLabel: role.singularLabel,
      slug: role.slug,
      icon: role.icon,
      iconKey: role.iconKey || '',
      color: role.color,
      cardImage: role.cardImage || '',
      description: role.description || '',
      searchEnabled: role.searchEnabled,
      bookingEnabled: role.bookingEnabled,
      inventoryEnabled: role.inventoryEnabled,
      displayOrder: role.displayOrder,
      verificationDocs: role.verificationDocs.map(d => ({
        documentName: d.documentName,
        description: d.description || '',
        isRequired: d.isRequired,
      })),
    })
    setShowModal(true)
  }

  const addDoc = () => {
    if (!docInput.name.trim()) return
    setForm(f => ({
      ...f,
      verificationDocs: [...f.verificationDocs, { documentName: docInput.name.trim(), description: docInput.description.trim(), isRequired: docInput.required }],
    }))
    setDocInput({ name: '', description: '', required: true })
  }

  const removeDoc = (idx: number) => {
    setForm(f => ({ ...f, verificationDocs: f.verificationDocs.filter((_, i) => i !== idx) }))
  }

  const autoSlug = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const autoCode = (label: string) => label.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/(^_|_$)/g, '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      if (editingId) {
        const res = await fetch(`/api/regional/roles/${editingId}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            label: form.label,
            singularLabel: form.singularLabel,
            icon: form.icon,
            iconKey: form.iconKey || undefined,
            color: form.color,
            cardImage: form.cardImage || undefined,
            description: form.description || undefined,
            searchEnabled: form.searchEnabled,
            bookingEnabled: form.bookingEnabled,
            inventoryEnabled: form.inventoryEnabled,
            displayOrder: form.displayOrder,
            verificationDocs: form.verificationDocs,
          }),
        })
        const json = await res.json()
        if (!json.success) throw new Error(json.message)
      } else {
        const res = await fetch('/api/regional/roles', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const json = await res.json()
        if (!json.success) throw new Error(json.message)
      }
      setShowModal(false)
      fetchRoles()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this role?')) return
    await fetch(`/api/regional/roles/${id}`, { method: 'DELETE', credentials: 'include' })
    fetchRoles()
  }

  const providerRoles = roles.filter(r => r.isProvider)
  const nonProviderRoles = roles.filter(r => !r.isProvider)

  if (loading) return <div className="flex justify-center py-20"><FaSpinner className="animate-spin text-[#0C6780] text-3xl" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FaUsersCog className="text-2xl text-violet-600" />
          <h1 className="text-2xl font-bold text-[#001E40]">Provider Roles</h1>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[#0C6780] hover:bg-[#0a5568] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
          <FaPlus /> Create Role
        </button>
      </div>

      {/* Provider Roles */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Provider Roles ({providerRoles.length})</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {providerRoles.map(role => (
            <RoleCard key={role.id} role={role} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      </div>

      {/* Non-Provider Roles */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">System Roles ({nonProviderRoles.length})</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {nonProviderRoles.map(role => (
            <RoleCard key={role.id} role={role} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Role' : 'Create Provider Role'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><FaTimes className="text-gray-400" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>}

              {!editingId && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Label (plural) *</label>
                    <input required value={form.label} onChange={e => {
                      const v = e.target.value
                      setForm(f => ({ ...f, label: v, slug: autoSlug(v), code: autoCode(f.singularLabel || v) }))
                    }} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0C6780] outline-none" placeholder="Audiologists" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Singular Label *</label>
                    <input required value={form.singularLabel} onChange={e => {
                      const v = e.target.value
                      setForm(f => ({ ...f, singularLabel: v, code: autoCode(v) }))
                    }} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0C6780] outline-none" placeholder="Audiologist" />
                  </div>
                </div>
              )}

              {!editingId && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code (UPPER_CASE) *</label>
                    <input required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm font-mono bg-gray-50 focus:ring-2 focus:ring-[#0C6780] outline-none" placeholder="AUDIOLOGIST" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug *</label>
                    <input required value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm font-mono bg-gray-50 focus:ring-2 focus:ring-[#0C6780] outline-none" placeholder="audiologists" />
                  </div>
                </div>
              )}

              {editingId && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Label (plural)</label>
                    <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0C6780] outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Singular Label</label>
                    <input value={form.singularLabel} onChange={e => setForm(f => ({ ...f, singularLabel: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0C6780] outline-none" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                  <div className="grid grid-cols-6 gap-1.5 p-2 border rounded-lg max-h-56 overflow-y-auto bg-white">
                    {ICON_OPTIONS.map(name => {
                      const Icon = ICON_MAP[name]
                      const selected = form.icon === name
                      return (
                        <button key={name} type="button" onClick={() => setForm(f => ({ ...f, icon: name }))}
                          title={name}
                          className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs transition-all ${
                            selected ? 'bg-[#0C6780] text-white ring-2 ring-[#0C6780]' : 'hover:bg-gray-100 text-gray-600'
                          }`}>
                          <Icon className="text-lg" />
                          <span className="truncate w-full text-center text-[9px]">{name.replace('Fa', '')}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="w-10 h-10 rounded border cursor-pointer" />
                    <input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                      className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-[#0C6780] outline-none" />
                  </div>
                </div>
              </div>

              {/* Card illustration image · shown as the background of the provider-type cards on the public landing page */}
              <div>
                <CmsImageUpload
                  value={form.cardImage || ''}
                  onChange={(url) => setForm(f => ({ ...f, cardImage: url }))}
                  label="Card image (illustration on the landing page)"
                />
                <p className="mt-1 text-xs text-gray-400">Optional — a realistic photo shown behind this provider type on the home page. If left empty, a default healthcare illustration is used.</p>
              </div>

              {/* Iconify icon picker (replaces legacy FA picker for richer healthcare icons) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Illustration Icon (Iconify)</label>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                    {form.iconKey ? (
                      <Icon icon={form.iconKey} width={22} height={22} color={form.color || '#0C6780'} />
                    ) : (
                      <span className="text-xs text-gray-400"> - </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(v => !v)}
                    className="px-3 py-1.5 text-xs border border-[#0C6780] text-[#0C6780] rounded-lg hover:bg-[#0C6780]/5 transition-colors"
                  >
                    {form.iconKey ? 'Change' : 'Choose Icon'}
                  </button>
                  {form.iconKey && (
                    <span className="text-xs text-gray-500 font-mono truncate max-w-[180px]">{form.iconKey}</span>
                  )}
                </div>
                {showIconPicker && (
                  <IconPicker
                    value={form.iconKey}
                    onChange={(key, _isEmoji) => { setForm(f => ({ ...f, iconKey: key })); setShowIconPicker(false) }}
                    onClose={() => setShowIconPicker(false)}
                    color={form.color || '#0C6780'}
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0C6780] outline-none resize-none" placeholder="Role description..." />
              </div>

              {/* Feature toggles */}
              <div className="flex flex-wrap gap-4">
                {[
                  { key: 'searchEnabled', label: 'Visible in Search' },
                  { key: 'bookingEnabled', label: 'Bookable by Patients' },
                  { key: 'inventoryEnabled', label: 'Can Sell Inventory' },
                ].map(t => (
                  <label key={t.key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={(form as Record<string, unknown>)[t.key] as boolean}
                      onChange={e => setForm(f => ({ ...f, [t.key]: e.target.checked }))}
                      className="w-4 h-4 text-[#0C6780] rounded" />
                    <span className="text-sm text-gray-700">{t.label}</span>
                  </label>
                ))}
              </div>

              {/* Verification Documents */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaFileAlt className="inline mr-1" /> Required Verification Documents
                </label>
                {form.verificationDocs.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {form.verificationDocs.map((doc, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg text-sm">
                        <div>
                          <span className="font-medium">{doc.documentName}</span>
                          {doc.description && <span className="text-gray-400 ml-2"> - {doc.description}</span>}
                          {doc.isRequired && <span className="text-red-500 ml-1">*</span>}
                        </div>
                        <button type="button" onClick={() => removeDoc(i)} className="text-red-400 hover:text-red-600"><FaTimes /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input placeholder="Document name" value={docInput.name} onChange={e => setDocInput(d => ({ ...d, name: e.target.value }))}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0C6780] outline-none" />
                  <input placeholder="Description" value={docInput.description} onChange={e => setDocInput(d => ({ ...d, description: e.target.value }))}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#0C6780] outline-none" />
                  <button type="button" onClick={addDoc} className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"><FaPlus /></button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-[#0C6780] text-white rounded-lg text-sm font-medium hover:bg-[#0a5568] disabled:opacity-50">
                  {submitting ? <FaSpinner className="animate-spin" /> : editingId ? 'Save Changes' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Role Card ────────────────────────────────────────────────────────────

function RoleCard({ role, onEdit, onDelete }: { role: ProviderRole; onEdit: (r: ProviderRole) => void; onDelete: (id: string) => void }) {
  return (
    <div className={`bg-white rounded-xl border ${role.isActive ? 'border-gray-200' : 'border-red-200 opacity-60'} p-4 hover:shadow-sm transition-shadow`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg" style={{ backgroundColor: role.color }}>
            {role.iconKey ? (
              <Icon icon={role.iconKey} width={22} height={22} color="white" />
            ) : (
              role.singularLabel[0]
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{role.label}</h3>
            <p className="text-xs text-gray-400 font-mono">{role.code}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onEdit(role)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="Edit"><FaEdit className="text-xs" /></button>
          {role.createdByAdminId && (
            <button onClick={() => onDelete(role.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg" title="Deactivate"><FaTrash className="text-xs" /></button>
          )}
        </div>
      </div>

      {role.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{role.description}</p>}

      <div className="flex flex-wrap gap-1.5 mb-3">
        <Badge active={role.searchEnabled} label="Search" />
        <Badge active={role.bookingEnabled} label="Booking" />
        <Badge active={role.inventoryEnabled} label="Inventory" />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>/{role.slug}</span>
        <span>{role.verificationDocs.length} doc{role.verificationDocs.length !== 1 ? 's' : ''} required</span>
      </div>
    </div>
  )
}

function Badge({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
      active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
    }`}>
      {active ? <FaEye className="text-[8px]" /> : <FaEyeSlash className="text-[8px]" />}
      {label}
    </span>
  )
}

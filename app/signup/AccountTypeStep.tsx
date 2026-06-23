'use client'

import { useState, useEffect } from 'react'
import { FaInfoCircle, FaUser } from 'react-icons/fa'
import * as FaIcons from 'react-icons/fa'
import { userTypes as staticUserTypes, documentRequirements as staticDocReqs } from './constants'
import type { UserType, Document } from './types'
import { useT } from '@/lib/i18n/useT'

interface RoleFromAPI {
  code: string
  label: string
  singularLabel: string
  slug: string
  icon: string
  color: string
  description: string | null
  cookieValue: string | null
  verificationDocs: { documentName: string; description: string | null; isRequired: boolean }[]
}

// Map API color hex to Tailwind classes
function colorToTailwind(hex: string): string {
  const map: Record<string, string> = {
    '#0C6780': 'bg-teal-100 text-teal-700 border-teal-300',
    '#001E40': 'bg-blue-100 text-blue-700 border-blue-300',
    '#9AE1FF': 'bg-sky-100 text-sky-700 border-sky-300',
    '#22c55e': 'bg-green-100 text-green-700 border-green-300',
    '#8b5cf6': 'bg-purple-100 text-purple-700 border-purple-300',
    '#ec4899': 'bg-pink-100 text-pink-700 border-pink-300',
    '#ef4444': 'bg-red-100 text-red-700 border-red-300',
    '#f97316': 'bg-orange-100 text-orange-700 border-orange-300',
    '#6366f1': 'bg-indigo-100 text-indigo-700 border-indigo-300',
  }
  return map[hex] || 'bg-subtle text-soft border-line'
}

function mapAPIToUserTypes(roles: RoleFromAPI[]): { types: UserType[]; docs: Record<string, Document[]> } {
  const types: UserType[] = []
  const docs: Record<string, Document[]> = {}

  for (const role of roles) {
    const id = role.cookieValue || role.slug
    const IconComponent = (FaIcons as Record<string, React.ComponentType>)[role.icon] || FaUser

    types.push({
      id,
      label: role.singularLabel || role.label,
      icon: IconComponent,
      description: role.description || role.label,
      color: colorToTailwind(role.color),
    })

    if (role.verificationDocs?.length > 0) {
      docs[id] = role.verificationDocs.map((doc, i) => ({
        id: `${id}-doc-${i}`,
        name: doc.documentName,
        description: doc.description || '',
        required: doc.isRequired,
        accepted: '.pdf,.jpg,.jpeg,.png',
      }))
    }
  }

  return { types, docs }
}

interface AccountTypeStepProps {
  selectedUserType: string
  onUserTypeChange: (userTypeId: string) => void
}

export default function AccountTypeStep({ selectedUserType, onUserTypeChange }: AccountTypeStepProps) {
  const [userTypes, setUserTypes] = useState<UserType[]>(staticUserTypes)
  const [documentRequirements, setDocumentRequirements] = useState<Record<string, Document[]>>(staticDocReqs)
  const [loading, setLoading] = useState(true)
  const [showRoleRequestModal, setShowRoleRequestModal] = useState(false)

  useEffect(() => {
    fetch('/api/roles?all=true')
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data?.length > 0) {
          // Filter out CORPORATE_ADMIN - any user can create a company from their dashboard
          const filtered = json.data.filter((r: RoleFromAPI) => r.code !== 'CORPORATE_ADMIN')
          const { types, docs } = mapAPIToUserTypes(filtered)
          if (types.length > 0) {
            setUserTypes(types)
            setDocumentRequirements(prev => ({ ...prev, ...docs }))
          }
        }
      })
      .catch(() => {
        // Keep static fallback
      })
      .finally(() => setLoading(false))
  }, [])

  const selectedType = userTypes.find(type => type.id === selectedUserType)

  return (
    <div>
      <h2 className="text-2xl font-bold text-fg mb-2">Select Account Type</h2>
      <p className="text-soft mb-8">Choose the type of account that best describes your role in healthcare</p>

      {loading ? (
        <div className="h-12 bg-subtle rounded-xl animate-pulse" />
      ) : (
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-soft mb-1.5 block">I&apos;m registering as</span>
            <select
              value={selectedUserType}
              onChange={(e) => onUserTypeChange(e.target.value)}
              className="w-full px-4 py-3 bg-surface border-2 border-line rounded-xl text-base focus:ring-2 focus:ring-[#0C6780] focus:border-[#0C6780] outline-none transition-colors"
            >
              <option value=""> - Choose one - </option>
              {userTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>

          {selectedType && (
            <div className={`p-4 border-2 rounded-xl ${selectedType.color}`}>
              <div className="flex items-start gap-3">
                <selectedType.icon className="text-2xl mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold">{selectedType.label}</h3>
                  <p className="text-sm opacity-80">{selectedType.description}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedUserType && (
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-4">
            <FaInfoCircle className="text-blue-600 mt-1" />
            <div>
              <h4 className="font-bold text-blue-800 mb-2">Required Documents for {selectedType?.label}</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                {documentRequirements[selectedUserType]?.filter(doc => doc.required).map(doc => (
                  <li key={doc.id}> {doc.name}</li>
                ))}
              </ul>
              <p className="text-blue-600 text-xs mt-2">
                You will upload these documents in the next steps. Make sure you have them ready.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Open door for roles we don't list. Submits a pending ProviderRole
          for regional admin review; user can continue signup as patient
          in the meantime. */}
      <div className="mt-6 border-t border-line pt-5">
        <RoleRequestTrigger onOpen={() => setShowRoleRequestModal(true)} />
      </div>

      {showRoleRequestModal && (
        <RoleRequestModal
          onClose={() => setShowRoleRequestModal(false)}
          onSubmitted={() => {
            setShowRoleRequestModal(false)
            onUserTypeChange('patient')
          }}
        />
      )}
    </div>
  )
}

/**
 * Internationalised trigger link for the role-request modal. Kept as its
 * own component so we can call `useT()` without pulling the hook into the
 * parent (which already has `useT()` elsewhere).
 */
function RoleRequestTrigger({ onOpen }: { onOpen: () => void }) {
  const t = useT()
  return (
    <button
      type="button"
      onClick={onOpen}
      className="text-sm text-brand-teal hover:text-brand-navy underline decoration-dotted"
    >
      {t('role.request.trigger')}
    </button>
  )
}

/**
 * Modal for the "I don't see my role" path. Submits to
 * `POST /api/roles/request` - the public endpoint that creates a pending
 * ProviderRole. Regional admins approve it before it becomes public.
 */
function RoleRequestModal({ onClose, onSubmitted }: { onClose: () => void; onSubmitted: () => void }) {
  const t = useT()
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (label.trim().length < 3) {
      setError('Role name must be at least 3 characters.')
      return
    }
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/roles/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label.trim(), description: description.trim() || undefined }),
      })
      const json = await res.json()
      if (!json.success) { setError(json.message || 'Request failed'); return }
      onSubmitted()
    } catch {
      setError('Network error - try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-surface rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-fg">{t('role.request.modal.title')}</h3>
        <p className="text-sm text-soft mt-1">{t('role.request.modal.subtitle')}</p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-soft block mb-1">{t('role.request.field.label')} *</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Audiologist, Osteopath, Homeopath"
              maxLength={40}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780] focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-soft block mb-1">{t('role.request.field.description')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description for the admin reviewer"
              rows={3}
              maxLength={200}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0C6780] focus:border-transparent outline-none"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-subtle hover:bg-line text-soft disabled:opacity-50"
          >
            {t('role.request.cancel')}
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#001E40] hover:bg-[#0C6780] text-white disabled:opacity-50"
          >
            {busy ? 'Submitting' : t('role.request.submit')}
          </button>
        </div>
      </div>
    </div>
  )
}

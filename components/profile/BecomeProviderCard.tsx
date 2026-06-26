'use client'

import { useState } from 'react'
import {
  FaStethoscope, FaUserNurse, FaBabyCarriage, FaPills, FaFlask, FaAmbulance,
  FaHandHoldingMedical, FaWalking, FaTooth, FaGlasses, FaAppleAlt, FaSpinner, FaArrowRight,
} from 'react-icons/fa'

/** Provider categories a member can self-activate. Cookie value → label + icon.
 *  Mirrors AuthService.SELF_ACTIVATABLE_PROVIDERS on the backend. */
const CATEGORIES: { value: string; label: string; icon: React.ReactNode }[] = [
  { value: 'doctor', label: 'Doctor', icon: <FaStethoscope /> },
  { value: 'nurse', label: 'Nurse', icon: <FaUserNurse /> },
  { value: 'child-care-nurse', label: 'Childcare Nurse', icon: <FaBabyCarriage /> },
  { value: 'pharmacy', label: 'Pharmacist', icon: <FaPills /> },
  { value: 'lab', label: 'Lab Technician', icon: <FaFlask /> },
  { value: 'ambulance', label: 'Emergency Responder', icon: <FaAmbulance /> },
  { value: 'caregiver', label: 'Caregiver', icon: <FaHandHoldingMedical /> },
  { value: 'physiotherapist', label: 'Physiotherapist', icon: <FaWalking /> },
  { value: 'dentist', label: 'Dentist', icon: <FaTooth /> },
  { value: 'optometrist', label: 'Optometrist', icon: <FaGlasses /> },
  { value: 'nutritionist', label: 'Nutritionist', icon: <FaAppleAlt /> },
]

/**
 * Lets a normal member activate a service-provider category from their profile.
 * Their patient data is kept; a provider profile is added and they gain the
 * provider dashboard. Render only when the viewer is the member themselves.
 */
export default function BecomeProviderCard() {
  const [selected, setSelected] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function activate() {
    if (!selected || busy) return
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/auth/activate-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ providerType: selected }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Activation failed')
      // Full navigation so middleware picks up the refreshed userType cookie.
      window.location.href = json.redirectPath || '/feed'
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Activation failed')
      setBusy(false)
    }
  }

  const selectedLabel = CATEGORIES.find(c => c.value === selected)?.label

  return (
    <div className="bg-surface rounded-2xl border border-line p-5 mb-6">
      <h3 className="font-semibold text-fg flex items-center gap-2"><FaStethoscope className="text-[#0C6780]" /> Become a service provider</h3>
      <p className="text-sm text-soft mt-1 mb-4">
        Offer your services on MediWyz. Pick a category to activate the provider dashboard, listings and bookings.
        You keep your existing account — verification documents can be added afterwards.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {CATEGORIES.map(c => {
          const on = selected === c.value
          return (
            <button
              key={c.value}
              onClick={() => setSelected(c.value)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium text-left transition
                ${on ? 'border-[#0C6780] bg-[#0C6780]/10 text-[#0C6780]' : 'border-line bg-canvas text-soft hover:border-[#0C6780]/40'}`}
            >
              <span className="text-base flex-shrink-0">{c.icon}</span>
              <span className="truncate">{c.label}</span>
            </button>
          )
        })}
      </div>

      {error && <p className="text-sm mt-3 px-3 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200">{error}</p>}

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          onClick={activate}
          disabled={!selected || busy}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0C6780] text-white rounded-xl font-semibold text-sm hover:bg-[#0a5568] disabled:opacity-50 transition-colors w-full sm:w-auto"
        >
          {busy ? <FaSpinner className="animate-spin" /> : <FaArrowRight className="text-xs" />}
          {busy ? 'Activating…' : selectedLabel ? `Activate as ${selectedLabel}` : 'Select a category'}
        </button>
        <span className="text-xs text-faint">You&apos;ll be taken to your new provider dashboard.</span>
      </div>
    </div>
  )
}

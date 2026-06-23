'use client'

import { useState, useEffect, useRef } from 'react'
import { FaSearch, FaHospital, FaCheck, FaArrowRight, FaTimes } from 'react-icons/fa'

interface OrgResult {
  id: string
  name: string
  type: string
  city: string | null
}

interface WorkplaceSelection {
  entityId: string
  entityName: string
  role: string
}

interface WorkplaceStepProps {
  onContinue: (selection: WorkplaceSelection | null) => void
  onSkip: () => void
}

export default function WorkplaceStep({ onContinue, onSkip }: WorkplaceStepProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<OrgResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<OrgResult | null>(null)
  const [role, setRole] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim() || query.length < 2) { setResults([]); return }

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/search/organizations?q=${encodeURIComponent(query.trim())}`)
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          setResults(json.data as OrgResult[])
        }
      } catch { /* silent */ }
      finally { setSearching(false) }
    }, 350)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  function selectOrg(org: OrgResult) {
    setSelected(org)
    setQuery(org.name)
    setResults([])
  }

  function clearSelection() {
    setSelected(null)
    setQuery('')
    setRole('')
    setResults([])
  }

  function handleContinue() {
    if (selected) {
      onContinue({ entityId: selected.id, entityName: selected.name, role: role.trim() })
    } else {
      onContinue(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-2xl font-bold text-fg">Where do you work?</h2>
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-faint hover:text-soft transition-colors font-medium flex items-center gap-1"
        >
          Skip for now <FaArrowRight className="text-[10px]" />
        </button>
      </div>
      <p className="text-soft text-sm mb-6">
        Link your account to an organization on MediWyz. You can do this later from your dashboard.
      </p>

      {/* Search */}
      <div className="relative">
        <div className="relative">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint text-sm" />
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); if (selected) setSelected(null) }}
            placeholder="Search clinics, hospitals, pharmacies"
            className="w-full pl-10 pr-10 py-3 border-2 border-line rounded-xl text-sm focus:ring-2 focus:ring-[#0C6780] focus:border-[#0C6780] outline-none transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={clearSelection}
              aria-label="Clear"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-soft"
            >
              <FaTimes className="text-xs" />
            </button>
          )}
        </div>

        {/* Dropdown results */}
        {results.length > 0 && !selected && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-line rounded-xl shadow-lg z-30 overflow-hidden max-h-64 overflow-y-auto">
            {searching && (
              <div className="px-4 py-2 text-xs text-faint">Searching</div>
            )}
            {results.map(org => (
              <button
                key={org.id}
                type="button"
                onClick={() => selectOrg(org)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-subtle transition-colors text-left border-b border-line last:border-0"
              >
                <div className="w-9 h-9 rounded-lg bg-[#001E40] flex items-center justify-center flex-shrink-0">
                  <FaHospital className="text-white text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-fg truncate">{org.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] bg-[#9AE1FF]/30 text-fg px-2 py-0.5 rounded-full font-medium">
                      {org.type}
                    </span>
                    {org.city && (
                      <span className="text-[10px] text-faint">{org.city}</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No results */}
        {query.length >= 2 && !searching && results.length === 0 && !selected && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-line rounded-xl shadow-lg z-30 px-4 py-4 text-center">
            <p className="text-sm text-soft">No organizations found for &quot;{query}&quot;</p>
            <p className="text-xs text-faint mt-1">Your entity may not be on MediWyz yet - you can request it later.</p>
          </div>
        )}
      </div>

      {/* Selected clinic card */}
      {selected && (
        <div className="mt-4 flex items-center gap-3 bg-[#0C6780]/5 border-2 border-[#0C6780]/30 rounded-xl px-4 py-3">
          <div className="w-10 h-10 rounded-lg bg-[#001E40] flex items-center justify-center flex-shrink-0">
            <FaHospital className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-fg text-sm truncate">{selected.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] bg-[#9AE1FF]/30 text-fg px-2 py-0.5 rounded-full font-medium">
                {selected.type}
              </span>
              {selected.city && <span className="text-[10px] text-faint">{selected.city}</span>}
            </div>
          </div>
          <FaCheck className="text-[#0C6780] flex-shrink-0" />
        </div>
      )}

      {/* Role input */}
      {selected && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-soft mb-1">
            Your role at {selected.name} <span className="text-faint font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={role}
            onChange={e => setRole(e.target.value)}
            placeholder="e.g. Cardiologist, Head Nurse, Senior Pharmacist"
            className="w-full px-3 py-2.5 border border-line rounded-xl text-sm focus:ring-2 focus:ring-[#0C6780] focus:border-[#0C6780] outline-none"
          />
          <p className="text-xs text-faint mt-1">
            This is visible to the entity admin when reviewing your membership request.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 pt-6 border-t border-line flex items-center justify-between">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-soft hover:text-soft font-medium transition-colors"
        >
          Skip this step
        </button>
        <button
          type="button"
          onClick={handleContinue}
          className="flex items-center gap-2 bg-[#0C6780] hover:bg-[#0a5568] text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors"
        >
          {selected ? 'Continue' : 'Skip & Continue'}
          <FaArrowRight className="text-xs" />
        </button>
      </div>
    </div>
  )
}

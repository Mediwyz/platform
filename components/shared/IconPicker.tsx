'use client'

import { useState, useMemo } from 'react'
import { Icon } from '@iconify/react'
import { FaSearch, FaTimes } from 'react-icons/fa'

//  Curated medical icon sets 

const HEALTHICONS: { key: string; label: string }[] = [
  { key: 'healthicons:ambulance', label: 'Ambulance' },
  { key: 'healthicons:baby-0-2m', label: 'Baby / Newborn' },
  { key: 'healthicons:blood-drop', label: 'Blood Drop' },
  { key: 'healthicons:blood-pressure', label: 'Blood Pressure' },
  { key: 'healthicons:blood-pressure-monitor', label: 'Blood Pressure Monitor' },
  { key: 'healthicons:bone', label: 'Bone' },
  { key: 'healthicons:cancer-tumor', label: 'Cancer / Tumor' },
  { key: 'healthicons:cardiology', label: 'Cardiology' },
  { key: 'healthicons:chest-x-ray', label: 'Chest X-Ray' },
  { key: 'healthicons:child-programme', label: 'Child Programme' },
  { key: 'healthicons:community-health-worker', label: 'Community Health' },
  { key: 'healthicons:dentistry', label: 'Dentist' },
  { key: 'healthicons:dentistry-tooth', label: 'Dental / Tooth' },
  { key: 'healthicons:dermatology', label: 'Dermatology' },
  { key: 'healthicons:diabetes', label: 'Diabetes' },
  { key: 'healthicons:doctor', label: 'Doctor' },
  { key: 'healthicons:ear', label: 'Ear / ENT' },
  { key: 'healthicons:ears-nose-and-throat', label: 'ENT' },
  { key: 'healthicons:emergency-response', label: 'Emergency Response' },
  { key: 'healthicons:endocrinology', label: 'Endocrinology' },
  { key: 'healthicons:eye-health', label: 'Eye Health' },
  { key: 'healthicons:gastroenterology', label: 'Gastroenterology' },
  { key: 'healthicons:gastrointestinal', label: 'Gastrointestinal' },
  { key: 'healthicons:general-surgery', label: 'General Surgery' },
  { key: 'healthicons:geriatrics', label: 'Geriatrics' },
  { key: 'healthicons:gynecology', label: 'Gynecology' },
  { key: 'healthicons:health-education', label: 'Health Education' },
  { key: 'healthicons:health-insurance', label: 'Health Insurance' },
  { key: 'healthicons:heart-cardiogram', label: 'Heart / Cardiology' },
  { key: 'healthicons:hematology', label: 'Hematology' },
  { key: 'healthicons:hepatology', label: 'Hepatology' },
  { key: 'healthicons:home-visits', label: 'Home Visit' },
  { key: 'healthicons:hygiene', label: 'Hygiene' },
  { key: 'healthicons:i-ecg', label: 'ECG' },
  { key: 'healthicons:inpatient', label: 'Inpatient' },
  { key: 'healthicons:kidney-disease', label: 'Kidney Disease' },
  { key: 'healthicons:laboratory', label: 'Laboratory' },
  { key: 'healthicons:liver', label: 'Liver / Hepatology' },
  { key: 'healthicons:medicines', label: 'Medicines' },
  { key: 'healthicons:mental-health', label: 'Mental Health' },
  { key: 'healthicons:microscopy-slides', label: 'Microscopy' },
  { key: 'healthicons:mri', label: 'MRI' },
  { key: 'healthicons:nephrology', label: 'Nephrology' },
  { key: 'healthicons:neurology', label: 'Neurology' },
  { key: 'healthicons:nurse', label: 'Nurse' },
  { key: 'healthicons:nutrition-care', label: 'Nutrition Care' },
  { key: 'healthicons:occupational-therapy', label: 'Occupational Therapy' },
  { key: 'healthicons:old-man', label: 'Elderly' },
  { key: 'healthicons:oncology', label: 'Oncology' },
  { key: 'healthicons:optometry', label: 'Optometry' },
  { key: 'healthicons:opthalmology', label: 'Ophthalmology' },
  { key: 'healthicons:orthopaedics', label: 'Orthopaedics' },
  { key: 'healthicons:outpatient', label: 'Outpatient' },
  { key: 'healthicons:oxygen', label: 'Oxygen' },
  { key: 'healthicons:pain-managment', label: 'Pain Management' },
  { key: 'healthicons:pediatrics', label: 'Pediatrics' },
  { key: 'healthicons:pharmacy', label: 'Pharmacy' },
  { key: 'healthicons:physiotherapy', label: 'Physiotherapy' },
  { key: 'healthicons:pills', label: 'Pills' },
  { key: 'healthicons:pregnancy', label: 'Pregnancy' },
  { key: 'healthicons:radiology', label: 'Radiology' },
  { key: 'healthicons:referral', label: 'Referral' },
  { key: 'healthicons:rehabilitation', label: 'Rehabilitation' },
  { key: 'healthicons:respirology', label: 'Pulmonology' },
  { key: 'healthicons:rheumatology', label: 'Rheumatology' },
  { key: 'healthicons:stethoscope', label: 'Stethoscope' },
  { key: 'healthicons:surgical', label: 'Surgical' },
  { key: 'healthicons:surgical-knife', label: 'Surgical Knife' },
  { key: 'healthicons:syringe', label: 'Syringe' },
  { key: 'healthicons:telemedicine', label: 'Telemedicine' },
  { key: 'healthicons:ultrasound', label: 'Ultrasound' },
  { key: 'healthicons:urology', label: 'Urology' },
  { key: 'healthicons:vaccines', label: 'Vaccines' },
  { key: 'healthicons:vascular-surgery', label: 'Vascular Surgery' },
  { key: 'healthicons:wound-care', label: 'Wound Care' },
]

const EMOJIS: { key: string; label: string }[] = [
  { key: '', label: 'Stethoscope' },
  { key: '', label: 'Anatomical Heart' },
  { key: '', label: 'Lungs' },
  { key: '', label: 'Brain' },
  { key: '', label: 'Tooth' },
  { key: '', label: 'Eye' },
  { key: '', label: 'Bone' },
  { key: '', label: 'Ear' },
  { key: '', label: 'Pill' },
  { key: '', label: 'Syringe' },
  { key: '', label: 'Blood' },
  { key: '', label: 'Microscope' },
  { key: '', label: 'X-Ray' },
  { key: '', label: 'Bandage' },
  { key: '', label: 'Ambulance' },
  { key: '', label: 'Hospital' },
  { key: '', label: 'Home Visit' },
  { key: '', label: 'Telemedicine' },
  { key: '', label: 'Pregnancy' },
  { key: '', label: 'Baby' },
  { key: '', label: 'Childcare' },
  { key: '', label: 'Elderly' },
  { key: '', label: 'Mental Health' },
  { key: '', label: 'Physiotherapy' },
  { key: '', label: 'Nutrition' },
  { key: '', label: 'Genetics' },
  { key: '', label: 'Oncology' },
  { key: '', label: 'Heart Health' },
  { key: '', label: 'Medical Symbol' },
  { key: '', label: 'Thermometer' },
]

type TabId = 'healthicons' | 'emoji'

const TABS: { id: TabId; label: string }[] = [
  { id: 'healthicons', label: 'Healthicons' },
  { id: 'emoji', label: 'Emoji' },
]

function getLibraryItems(tab: TabId) {
  switch (tab) {
    case 'healthicons': return HEALTHICONS
    case 'emoji': return EMOJIS
  }
}

interface IconPickerProps {
  value?: string | null
  onChange: (iconKey: string, isEmoji: boolean) => void
  onClose?: () => void
  color?: string
}

export default function IconPicker({ value, onChange, onClose, color = '#0C6780' }: IconPickerProps) {
  const [activeTab, setActiveTab] = useState<TabId>('healthicons')
  const [search, setSearch] = useState('')

  const items = useMemo(() => {
    const all = getLibraryItems(activeTab)
    if (!search.trim()) return all
    const q = search.toLowerCase()
    return all.filter(i => i.label.toLowerCase().includes(q) || i.key.toLowerCase().includes(q))
  }, [activeTab, search])

  const handleSelect = (item: { key: string; label: string }) => {
    onChange(item.key, activeTab === 'emoji')
    onClose?.()
  }

  const renderItem = (item: { key: string; label: string }) => {
    const isSelected = value === item.key
    return (
      <button
        key={item.key}
        type="button"
        title={item.label}
        onClick={() => handleSelect(item)}
        className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border transition-all text-center
          ${isSelected
            ? 'border-[#0C6780] bg-[#0C6780]/10 ring-2 ring-[#0C6780]/30'
            : 'border-line hover:border-line hover:bg-subtle'}`}
      >
        {activeTab === 'emoji' ? (
          <span className="text-2xl leading-none select-none">{item.key}</span>
        ) : (
          <Icon icon={item.key} width={28} height={28} color={isSelected ? color : '#374151'} />
        )}
        <span className="text-[9px] text-soft leading-tight line-clamp-2 w-full">{item.label}</span>
      </button>
    )
  }

  return (
    <div className="bg-surface rounded-2xl border border-line shadow-xl w-[340px] sm:w-[400px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-line">
        <span className="text-sm font-semibold text-fg">Choose Icon</span>
        {onClose && (
          <button type="button" onClick={onClose} className="text-faint hover:text-soft p-1">
            <FaTimes className="text-xs" />
          </button>
        )}
      </div>

      {/* Search */}
      <div className="px-3 pt-3">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-faint text-xs" />
          <input
            type="text"
            placeholder="Search icons..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780] bg-subtle"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-3 pt-2">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => { setActiveTab(tab.id); setSearch('') }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all
              ${activeTab === tab.id
                ? 'bg-[#0C6780] text-white'
                : 'bg-subtle text-soft hover:bg-line'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="p-3 grid grid-cols-5 gap-1.5 max-h-64 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300">
        {items.length === 0 ? (
          <div className="col-span-5 text-center py-8 text-xs text-faint">No icons found</div>
        ) : (
          items.map(renderItem)
        )}
      </div>

      {/* Selected preview */}
      {value && (
        <div className="flex items-center gap-2 px-4 py-2.5 border-t border-line bg-subtle">
          <span className="text-xs text-soft">Selected:</span>
          {value.length <= 4 ? (
            <span className="text-lg">{value}</span>
          ) : (
            <Icon icon={value} width={20} height={20} color={color} />
          )}
          <span className="text-xs font-mono text-soft truncate flex-1">{value}</span>
          <button
            type="button"
            onClick={() => onChange('', false)}
            className="text-xs text-red-400 hover:text-red-600"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { FiSearch, FiPackage } from 'react-icons/fi'
import { FaFileMedical } from 'react-icons/fa'
import ShopItemCard from '@/components/health-shop/ShopItemCard'
import FloatingCart from '@/components/health-shop/FloatingCart'
import { usePrescription } from '@/lib/contexts/prescription-context'

// Client-side rx score is the fallback when no userId (unauthenticated browsing)
function rxScore(item: ShopItem, medicines: string[]): number {
  if (!medicines.length) return 0
  const text = `${item.name} ${item.genericName ?? ''}`.toLowerCase()
  for (const med of medicines) {
    const m = med.toLowerCase().trim()
    if (!m) continue
    if (text.includes(m)) return 2
    for (const word of m.split(/\s+/)) {
      if (word.length > 3 && text.includes(word)) return 1
    }
  }
  return 0
}

// Read userId from cookie (client-side, non-httpOnly)
function getUserIdFromCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.split('; ').find(row => row.startsWith('mediwyz_user_id='))
  return match ? decodeURIComponent(match.split('=')[1]) : null
}

interface ShopItem {
  id: string
  providerUserId: string
  providerType: string
  name: string
  genericName?: string
  category: string
  description?: string
  imageUrl?: string
  unitOfMeasure: string
  strength?: string
  price: number
  quantity: number
  inStock: boolean
  requiresPrescription: boolean
  isFeatured: boolean
  isRecommended?: boolean
  sellerName?: string | null
  sellerType?: 'organisation' | 'provider'
}

interface ShopCategory {
  key: string
  label: string
}

const PROVIDER_LABELS: Record<string, string> = {
  PHARMACIST: 'Pharmacy', DOCTOR: 'Doctor', NURSE: 'Nurse', DENTIST: 'Dental',
  OPTOMETRIST: 'Eye Care', NANNY: 'Childcare', PHYSIOTHERAPIST: 'Physio',
  NUTRITIONIST: 'Nutrition', CAREGIVER: 'Caregiver', LAB_TECHNICIAN: 'Lab',
}

const CATEGORY_PILLS: { key: string; label: string; emoji: string }[] = [
  { key: 'prescription_medicines', label: 'Rx Medicines', emoji: '💊' },
  { key: 'otc_medicines', label: 'OTC Medicines', emoji: '🏥' },
  { key: 'fitness_wellness', label: 'Fitness & Wellness', emoji: '💪' },
  { key: 'beauty_care', label: 'Beauty Care', emoji: '✨' },
  { key: 'ayurveda', label: 'Ayurveda & Wellness', emoji: '🌿' },
  { key: 'medical_devices', label: 'Medical Devices', emoji: '🩺' },
  { key: 'first_aid', label: 'First Aid', emoji: '🩹' },
  { key: 'baby_care', label: 'Baby Care', emoji: '👶' },
  { key: 'personal_care', label: 'Personal Care', emoji: '🧼' },
  { key: 'dental_care', label: 'Dental Care', emoji: '🦷' },
  { key: 'eye_care', label: 'Eye Care', emoji: '👁️' },
  { key: 'nutrition', label: 'Nutrition', emoji: '🥗' },
  { key: 'vitamins', label: 'Vitamins & Supplements', emoji: '💉' },
  { key: 'supplements', label: 'Supplements', emoji: '🏋️' },
  { key: 'monitoring', label: 'Health Monitoring', emoji: '❤️' },
  { key: 'medication', label: 'Medications', emoji: '💊' },
]

function HealthShopContent() {
  const [items, setItems] = useState<ShopItem[]>([])
  const [categories, setCategories] = useState<ShopCategory[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [providerType, setProviderType] = useState('')
  const [offset, setOffset] = useState(0)
  const { prescription } = usePrescription()

  const fetchItems = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (category) params.set('category', category)
    if (providerType) params.set('providerType', providerType)
    params.set('limit', '20')
    params.set('offset', String(offset))
    // Pass userId so the backend can boost items matching the user's DB prescriptions
    const userId = getUserIdFromCookie()
    if (userId) params.set('userId', userId)

    try {
      const res = await fetch(`/api/search/health-shop?${params}`)
      const data = await res.json()
      if (data.success) {
        // Backend returns { success, data: items[], total }. Older shape nested
        // items+total+categories under `data` - support both defensively.
        const rawItems = Array.isArray(data.data) ? data.data : data.data?.items ?? []
        const rawTotal = typeof data.total === 'number' ? data.total : data.data?.total ?? rawItems.length
        const cats = data.data?.categories ?? data.categories
        setItems(rawItems)
        setTotal(rawTotal)
        if (Array.isArray(cats)) setCategories(cats)
      } else {
        setItems([])
        setTotal(0)
      }
    } catch { /* */ }
    finally { setLoading(false) }
  }, [search, category, providerType, offset])

  useEffect(() => { fetchItems() }, [fetchItems])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-brand-navy text-white py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Health Shop</h1>
          <p className="text-brand-sky text-lg">Browse products from all healthcare providers - add to cart and checkout</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Search + Provider filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setOffset(0) }} placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal outline-none" />
          </div>
          <select value={providerType} onChange={(e) => { setProviderType(e.target.value); setOffset(0) }}
            className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-teal bg-white">
            <option value="">All Providers</option>
            {Object.entries(PROVIDER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {/* Category pill strip */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          <button
            onClick={() => { setCategory(''); setOffset(0) }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${category === '' ? 'bg-[#0C6780] text-white border-[#0C6780]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#0C6780]'}`}
          >
            All
          </button>
          {CATEGORY_PILLS.map(pill => (
            <button
              key={pill.key}
              onClick={() => { setCategory(pill.key); setOffset(0) }}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${category === pill.key ? 'bg-[#0C6780] text-white border-[#0C6780]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#0C6780]'}`}
            >
              <span>{pill.emoji}</span>
              {pill.label}
            </button>
          ))}
          {/* Fallback pills from API that aren't in predefined list */}
          {categories
            .filter(c => !CATEGORY_PILLS.find(p => p.key === c.key))
            .map(c => (
              <button
                key={c.key}
                onClick={() => { setCategory(c.key); setOffset(0) }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${category === c.key ? 'bg-[#0C6780] text-white border-[#0C6780]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#0C6780]'}`}
              >
                {c.label}
              </button>
            ))}
        </div>

        <p className="text-sm text-gray-500 mb-3">{total} product{total !== 1 ? 's' : ''} found</p>

        {prescription.medicines.length > 0 && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <FaFileMedical className="text-amber-500 flex-shrink-0" />
            <span>Results sorted by your prescription · <strong>{prescription.medicines.length}</strong> medicine{prescription.medicines.length !== 1 ? 's' : ''} detected</span>
          </div>
        )}

        {/* Items grid */}
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-teal" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <FiPackage className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">No products found</h3>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...items]
              // Merge backend isRecommended with client-side rxScore (local prescription context)
              .sort((a, b) => {
                const aScore = (a.isRecommended ? 3 : 0) + rxScore(a, prescription.medicines)
                const bScore = (b.isRecommended ? 3 : 0) + rxScore(b, prescription.medicines)
                return bScore - aScore
              })
              .map(item => (
                <ShopItemCard
                  key={item.id}
                  product={item}
                  rxMatch={!!(item.isRecommended) || rxScore(item, prescription.medicines) > 0}
                />
              ))}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="flex justify-center gap-2 mt-8">
            <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 20))}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50">Previous</button>
            <span className="px-4 py-2 text-sm text-gray-500">{offset + 1}–{Math.min(offset + 20, total)} of {total}</span>
            <button disabled={offset + 20 >= total} onClick={() => setOffset(offset + 20)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50">Next</button>
          </div>
        )}
      </div>

      {/* Floating Cart */}
      <FloatingCart />
    </div>
  )
}

export default function HealthShopPage() {
  return (
      <HealthShopContent />
  )
}

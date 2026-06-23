'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  FaPills, FaLeaf, FaFirstAid, FaHeart, FaGlasses, FaEye,
  FaTooth, FaBaby, FaStethoscope, FaHeartbeat, FaDumbbell,
  FaAppleAlt, FaBox, FaShoppingCart, FaPrescription, FaLock,
  FaChevronLeft, FaChevronRight, FaSearch,
} from 'react-icons/fa'
import HorizontalScrollRow from '@/components/shared/HorizontalScrollRow'

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  medication: FaPills, vitamins: FaLeaf, first_aid: FaFirstAid,
  personal_care: FaHeart, eyewear: FaGlasses, eye_care: FaEye,
  dental_care: FaTooth, baby_care: FaBaby, medical_devices: FaStethoscope,
  monitoring: FaHeartbeat, rehab_equipment: FaDumbbell,
  nutrition: FaAppleAlt, other: FaBox,
}

const CATEGORY_EMOJI: Record<string, string> = {
  medication: '', vitamins: '', first_aid: '',
  personal_care: '', eyewear: '', eye_care: '',
  dental_care: '', baby_care: '', medical_devices: '',
  monitoring: '', rehab_equipment: '', nutrition: '', other: '',
}

const CATEGORY_COLORS: Record<string, string> = {
  medication: 'text-blue-600', vitamins: 'text-green-600', first_aid: 'text-red-600',
  personal_care: 'text-pink-600', eyewear: 'text-purple-600', eye_care: 'text-indigo-600',
  dental_care: 'text-sky-600', baby_care: 'text-rose-600', medical_devices: 'text-teal-600',
  monitoring: 'text-amber-600', rehab_equipment: 'text-orange-600',
  nutrition: 'text-lime-600', other: 'text-soft',
}

interface ShopItem {
  id: string
  name: string
  genericName?: string
  category: string
  imageUrl?: string
  price: number
  quantity: number
  inStock: boolean
  requiresPrescription: boolean
  isFeatured: boolean
  unitOfMeasure: string
  strength?: string
  description?: string
}

interface CategoryWithItems {
  key: string
  label: string
  items: ShopItem[]
}

const CATEGORIES = [
  { key: 'medication', label: 'Medications' },
  { key: 'vitamins', label: 'Vitamins & Supplements' },
  { key: 'first_aid', label: 'First Aid' },
  { key: 'personal_care', label: 'Personal Care' },
  { key: 'dental_care', label: 'Dental Care' },
  { key: 'baby_care', label: 'Baby & Child Care' },
  { key: 'nutrition', label: 'Nutrition & Diet' },
  { key: 'eyewear', label: 'Eyewear & Lenses' },
  { key: 'medical_devices', label: 'Medical Devices' },
  { key: 'monitoring', label: 'Health Monitoring' },
]

function isLoggedIn(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.split(';').some(c => c.trim().startsWith('mediwyz_userType='))
}

export default function HealthShopMarketplace({ embedded = false }: { embedded?: boolean } = {}) {
  const [categories, setCategories] = useState<CategoryWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const catScrollRef = useRef<HTMLDivElement>(null)
  const [catCanLeft, setCatCanLeft] = useState(false)
  const [catCanRight, setCatCanRight] = useState(false)

  const checkCatScroll = () => {
    const el = catScrollRef.current
    if (!el) return
    setCatCanLeft(el.scrollLeft > 4)
    setCatCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  const scrollCat = (dir: 'left' | 'right') => {
    const el = catScrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === 'left' ? -180 : 180, behavior: 'smooth' })
  }

  useEffect(() => {
    const el = catScrollRef.current
    if (!el) return
    checkCatScroll()
    el.addEventListener('scroll', checkCatScroll, { passive: true })
    const ro = new ResizeObserver(checkCatScroll)
    ro.observe(el)
    return () => { el.removeEventListener('scroll', checkCatScroll); ro.disconnect() }
  }, [categories])

  useEffect(() => {
    setAuthenticated(isLoggedIn())

    const topCategories = CATEGORIES.slice(0, 6)
    Promise.all(
      topCategories.map(cat =>
        fetch(`/api/search/health-shop?category=${cat.key}&limit=12`)
          .then(r => r.json())
          .then(json => ({
            key: cat.key,
            label: cat.label,
            items: json.success ? (Array.isArray(json.data) ? json.data : json.data?.items || []) : [],
          }))
          .catch(() => ({ key: cat.key, label: cat.label, items: [] as ShopItem[] }))
      )
    ).then(results => {
      setCategories(results.filter(c => c.items.length > 0))
      setLoading(false)
    })
  }, [])

  const handleAddToCart = (item: ShopItem) => {
    if (!authenticated) {
      router.push(`/login?returnUrl=${encodeURIComponent('/search/health-shop')}`)
      return
    }
    router.push(`/search/health-shop?category=${item.category}`)
  }

  // Inlined class strings instead of a Wrapper subcomponent - defining a
  // component inside the function body is a React anti-pattern (recreates
  // the component type every render and breaks children identity).
  const scrollbarClass = `[&::-webkit-scrollbar]:w-[3px]
    [&::-webkit-scrollbar-thumb]:bg-line
    [&::-webkit-scrollbar-thumb]:rounded-full
    [&::-webkit-scrollbar-track]:bg-transparent`

  if (loading) {
    if (embedded) {
      return (
        <>
          <div className="flex-shrink-0 px-5 sm:px-7 pt-5 sm:pt-6 pb-3 sm:pb-4 border-b border-line animate-pulse">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 bg-line rounded" />
              <div className="h-7 bg-line rounded w-36" />
            </div>
            <div className="h-4 bg-subtle rounded w-72 mt-1" />
          </div>
          <div className="flex-1 px-5 sm:px-7 py-4 animate-pulse space-y-8">
            {[1, 2, 3].map(i => (
              <div key={i}>
                <div className="h-5 bg-line rounded w-40 mb-4" />
                <div className="flex gap-4">
                  {[1, 2, 3, 4].map(j => (
                    <div key={j} className="w-52 h-48 bg-surface rounded-2xl border border-line flex-shrink-0" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )
    }
    return (
      <section className="py-8 sm:py-12 bg-subtle overflow-hidden">
        <div className="w-full px-6 sm:px-12 lg:px-20 xl:px-28">
          <div className="animate-pulse">
            <div className="h-8 bg-line rounded w-48 mb-2" />
            <div className="h-4 bg-subtle rounded w-80 mb-8" />
            {[1, 2, 3].map(i => (
              <div key={i} className="mb-10">
                <div className="h-5 bg-line rounded w-40 mb-4" />
                <div className="flex gap-4">
                  {[1, 2, 3, 4].map(j => (
                    <div key={j} className="w-52 h-48 bg-surface rounded-2xl border border-line flex-shrink-0" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (categories.length === 0) {
    if (embedded) {
      return (
        <>
          <div className="flex-shrink-0 px-5 sm:px-7 pt-5 sm:pt-6 pb-3 sm:pb-4 bg-surface border-b border-line">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <FaShoppingCart className="text-xl sm:text-2xl text-[#0C6780]" />
              <h2 className="text-2xl sm:text-3xl font-bold text-fg">Health Shop</h2>
            </div>
            <p className="text-sm sm:text-base text-soft">Order medicines, supplements &amp; health products from verified providers</p>
          </div>
          <div className="flex-1 flex items-center justify-center px-5 sm:px-7">
            <div className="text-center">
              <FaShoppingCart className="text-3xl text-faint mx-auto mb-3" />
              <p className="text-sm font-medium text-soft">Products are loading...</p>
              <p className="text-xs text-faint mt-1">
                <Link href="/search/health-shop" className="text-[#0C6780] hover:underline">Browse all health products </Link>
              </p>
            </div>
          </div>
        </>
      )
    }
    return (
      <section className="py-8 sm:py-12 bg-subtle overflow-hidden">
        <div className="w-full px-6 sm:px-12 lg:px-20 xl:px-28">
          <div className="flex items-center gap-2 sm:gap-3 mb-3">
            <FaShoppingCart className="text-xl text-[#0C6780]" />
            <h2 className="text-2xl font-bold text-fg">Health Shop</h2>
          </div>
          <div className="bg-subtle border border-line rounded-xl p-8 text-center">
            <FaShoppingCart className="text-3xl text-faint mx-auto mb-3" />
            <p className="text-sm font-medium text-soft">Products are loading...</p>
            <p className="text-xs text-faint mt-1">
              <Link href="/search/health-shop" className="text-[#0C6780] hover:underline">Browse all health products </Link>
            </p>
          </div>
        </div>
      </section>
    )
  }

  // Client-side search filter across all item names
  const filteredCategories = searchQuery.trim()
    ? categories.map(cat => ({
        ...cat,
        items: cat.items.filter(item =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.genericName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (item.description?.toLowerCase().includes(searchQuery.toLowerCase()))
        ),
      })).filter(cat => cat.items.length > 0)
    : categories

  const categoriesContent = filteredCategories.map(cat => {
    const Icon = CATEGORY_ICONS[cat.key] || FaBox
    const iconColor = CATEGORY_COLORS[cat.key] || 'text-soft'

    return (
      <HorizontalScrollRow
        key={cat.key}
        title={cat.label}
        subtitle={`${cat.items.length}+ products`}
        icon={<Icon className={iconColor} />}
        seeAllHref={`/search/health-shop?category=${cat.key}`}
      >
        {cat.items.map(item => (
          <div
            key={item.id}
            className={`flex-shrink-0 snap-start w-[160px] sm:w-52 md:w-56 bg-surface
              rounded-[1.5rem] border-2 overflow-hidden
              ${item.isFeatured
                ? 'border-[#0C6780] ring-2 ring-[#0C6780]/15 shadow-[0_4px_24px_-4px_rgba(12,103,128,0.22)]'
                : 'border-gray-150 shadow-[0_2px_16px_-2px_rgba(0,30,64,0.07)]'}
              hover:shadow-[0_8px_36px_-4px_rgba(12,103,128,0.20)]
              hover:scale-[1.03] hover:-translate-y-0.5
              transition-all duration-200 group`}
          >
            {item.imageUrl ? (
              <div className="h-20 sm:h-28 bg-subtle overflow-hidden rounded-t-[1.4rem]">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  width={400}
                  height={112}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            ) : (
              <div className="h-20 sm:h-28 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center rounded-t-[1.4rem]">
                <span className="text-3xl sm:text-4xl">{CATEGORY_EMOJI[item.category] || ''}</span>
              </div>
            )}

            <div className="p-3 sm:p-4">
              <div className="flex items-start justify-between mb-1">
                <h4 className="text-sm font-bold text-fg line-clamp-2 flex-1 min-w-0">
                  {item.name}
                </h4>
                {item.requiresPrescription && (
                  <span className="ml-1 flex-shrink-0 inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                    <FaPrescription className="text-[8px]" /> Rx
                  </span>
                )}
              </div>

              {item.genericName && (
                <p className="text-[11px] text-faint truncate mb-1">{item.genericName}</p>
              )}

              {item.strength && (
                <p className="text-[11px] text-soft mb-2">{item.strength}</p>
              )}

              <div className="flex items-end justify-between mt-2">
                <div>
                  <span className="text-sm sm:text-lg font-bold text-fg">Rs {item.price}</span>
                  <span className="text-[10px] text-faint ml-0.5">/{item.unitOfMeasure}</span>
                </div>
                <span className={`text-[10px] font-medium ${item.inStock ? 'text-green-600' : 'text-red-500'}`}>
                  {item.inStock ? 'In Stock' : 'Out'}
                </span>
              </div>

              <button
                onClick={() => handleAddToCart(item)}
                disabled={!item.inStock}
                className={`w-full mt-3 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  !item.inStock
                    ? 'bg-subtle text-faint cursor-not-allowed'
                    : authenticated
                      ? 'bg-[#0C6780] text-white hover:bg-[#0a5568]'
                      : 'bg-line text-soft hover:bg-gray-300'
                }`}
              >
                {!item.inStock ? (
                  'Unavailable'
                ) : authenticated ? (
                  <><FaShoppingCart className="text-[10px]" /> Add to Cart</>
                ) : (
                  <><FaLock className="text-[10px]" /> Login to Buy</>
                )}
              </button>
            </div>
          </div>
        ))}
      </HorizontalScrollRow>
    )
  })

  if (embedded) {
    return (
      <>
        {/* Header - sits above the scroll area, never moves */}
        <div className="flex-shrink-0 px-5 sm:px-7 pt-5 sm:pt-6 pb-3 sm:pb-4 bg-surface border-b border-line">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <FaShoppingCart className="text-xl sm:text-2xl text-[#0C6780]" />
            <h2 className="text-2xl sm:text-3xl font-bold text-fg">Health Shop</h2>
          </div>
          <p className="text-sm sm:text-base text-soft">Order medicines, supplements &amp; health products from verified providers</p>
          {/* Category quick links - scrollable strip with prev/next buttons */}
          <div className="flex items-center gap-1.5 mt-3">
            <button
              onClick={() => scrollCat('left')}
              disabled={!catCanLeft}
              className={`flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-all
                ${catCanLeft ? 'border-[#0C6780] text-[#0C6780] hover:bg-[#0C6780] hover:text-white' : 'border-line text-faint cursor-default'}`}
              aria-label="Scroll categories left"
            >
              <FaChevronLeft className="text-[10px]" />
            </button>

            <div className="flex-1 min-w-0 overflow-hidden relative">
              {catCanRight && (
                <div className="absolute right-0 top-0 bottom-0 w-6 z-10 pointer-events-none"
                  style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.95))' }} />
              )}
              {catCanLeft && (
                <div className="absolute left-0 top-0 bottom-0 w-6 z-10 pointer-events-none"
                  style={{ background: 'linear-gradient(to left, transparent, rgba(255,255,255,0.95))' }} />
              )}
              <div
                ref={catScrollRef}
                onScroll={checkCatScroll}
                className="flex gap-2 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden scroll-smooth"
              >
                {CATEGORIES.map(cat => (
                  <Link
                    key={cat.key}
                    href={`/search/health-shop?category=${cat.key}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-subtle border border-line text-xs text-soft hover:border-[#0C6780] hover:text-[#0C6780] transition-all whitespace-nowrap flex-shrink-0"
                  >
                    <span className="text-sm">{CATEGORY_EMOJI[cat.key] || ''}</span>
                    {cat.label}
                  </Link>
                ))}
              </div>
            </div>

            <button
              onClick={() => scrollCat('right')}
              disabled={!catCanRight}
              className={`flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-all
                ${catCanRight ? 'border-[#0C6780] text-[#0C6780] hover:bg-[#0C6780] hover:text-white' : 'border-line text-faint cursor-default'}`}
              aria-label="Scroll categories right"
            >
              <FaChevronRight className="text-[10px]" />
            </button>
          </div>
        </div>
        {/* Scrollable content */}
        <div className={`flex-1 overflow-y-auto px-5 sm:px-7 py-4 sm:py-6 ${scrollbarClass}`}>
          {categoriesContent}
          <div className="text-center mt-4 mb-2">
            <Link
              href="/search/health-shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0C6780] text-white rounded-xl font-medium hover:bg-[#0a5568] transition-colors"
            >
              <FaShoppingCart className="text-sm" />
              Browse All Products
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <section className="py-8 sm:py-12 bg-subtle overflow-hidden">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14">
        <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-10 xl:-mx-14 px-4 sm:px-6 lg:px-10 xl:px-14
          pt-4 sm:pt-6 pb-3 sm:pb-4 mb-4 sm:mb-6 bg-white/95 backdrop-blur-sm border-b border-line">
          <div className="flex items-start justify-between gap-4 mb-1 sm:mb-2">
            <div>
              <div className="flex items-center gap-2 sm:gap-3">
                <FaShoppingCart className="text-xl sm:text-2xl text-[#0C6780]" />
                <h2 className="text-2xl sm:text-3xl font-bold text-fg">Health Shop</h2>
              </div>
              <p className="text-sm sm:text-base text-soft mt-0.5">Order medicines, supplements &amp; health products</p>
            </div>
            {/* Search input */}
            <div className="relative hidden sm:block w-56">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-faint text-xs" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780] bg-subtle"
              />
            </div>
          </div>
          {/* Mobile search */}
          <div className="relative sm:hidden mt-2">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-faint text-xs" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780] bg-subtle"
            />
          </div>
        </div>

        {/* Category Quick Links */}
        <div className="flex gap-2 mb-6 sm:mb-8 overflow-x-auto scrollbar-hide pb-1 sm:flex-wrap">
          {CATEGORIES.map(cat => (
            <Link
              key={cat.key}
              href={`/search/health-shop?category=${cat.key}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-full bg-surface border border-line text-xs sm:text-sm text-soft hover:border-[#0C6780] hover:text-[#0C6780] transition-all whitespace-nowrap flex-shrink-0"
            >
              <span className="text-base">{CATEGORY_EMOJI[cat.key] || ''}</span>
              {cat.label}
            </Link>
          ))}
        </div>

        {categoriesContent}

        <div className="text-center mt-4">
          <Link
            href="/search/health-shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0C6780] text-white rounded-xl font-medium hover:bg-[#0a5568] transition-colors"
          >
            <FaShoppingCart className="text-sm" />
            Browse All Products
          </Link>
        </div>
      </div>
    </section>
  )
}

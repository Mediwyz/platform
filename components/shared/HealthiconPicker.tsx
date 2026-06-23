'use client'

/**
 * HealthiconPicker - lets a provider choose a Healthicon for their service from
 * the full 740-icon set (browse by category + search by tag/title), or supply a
 * custom image URL. Returns the chosen healthicon path (e.g. "specialties/cardiology")
 * via onSelectIcon, or a custom image URL via onSelectImage.
 */

import { useEffect, useMemo, useState } from 'react'
import { FaSearch, FaTimes, FaCheck, FaLink } from 'react-icons/fa'

interface CatalogEntry {
  id: string
  category: string
  path: string
  title: string
  tags: string[]
}

interface HealthiconPickerProps {
  /** Currently selected healthicon path, if any. */
  value?: string | null
  onSelectIcon: (path: string) => void
  onSelectImage?: (url: string) => void
  onClose: () => void
}

export default function HealthiconPicker({ value, onSelectIcon, onSelectImage, onClose }: HealthiconPickerProps) {
  const [catalog, setCatalog] = useState<CatalogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [activeCat, setActiveCat] = useState<string>('all')
  const [customUrl, setCustomUrl] = useState('')

  useEffect(() => {
    fetch('/healthicons-catalog.json')
      .then(r => r.json())
      .then((d: CatalogEntry[]) => setCatalog(d))
      .catch(() => setCatalog([]))
      .finally(() => setLoading(false))
  }, [])

  const categories = useMemo(() => {
    const set = new Set(catalog.map(c => c.category))
    return ['all', ...Array.from(set).sort()]
  }, [catalog])

  const filtered = useMemo(() => {
    let list = catalog
    if (activeCat !== 'all') list = list.filter(c => c.category === activeCat)
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q)),
      )
    }
    return list.slice(0, 300) // cap render for performance
  }, [catalog, activeCat, query])

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-surface rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h3 className="text-base font-bold text-fg">Choose a service icon</h3>
          <button onClick={onClose} aria-label="Close" className="text-faint hover:text-soft p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300">
            <FaTimes />
          </button>
        </div>

        {/* search + custom URL */}
        <div className="px-5 py-3 border-b border-line space-y-2">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-faint text-xs" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search icons (e.g. heart, tooth, vaccine, lab)…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780] bg-subtle"
            />
          </div>
          {onSelectImage && (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <FaLink className="absolute left-3 top-1/2 -translate-y-1/2 text-faint text-xs" />
                <input
                  type="url"
                  value={customUrl}
                  onChange={e => setCustomUrl(e.target.value)}
                  placeholder="…or paste a custom image URL"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C6780]/30 focus:border-[#0C6780] bg-subtle"
                />
              </div>
              <button
                onClick={() => { if (customUrl.trim()) { onSelectImage(customUrl.trim()); onClose() } }}
                disabled={!customUrl.trim()}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-white bg-[#0C6780] disabled:opacity-40 hover:bg-[#001E40] transition-colors"
              >
                Use
              </button>
            </div>
          )}
        </div>

        {/* category tabs */}
        <div className="px-5 py-2 border-b border-line flex gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors border
                ${activeCat === cat ? 'bg-[#0C6780] text-white border-[#0C6780]' : 'bg-surface text-soft border-line hover:border-[#0C6780]'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* icon grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center text-sm text-faint py-12">Loading icons…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-sm text-faint py-12">No icons match “{query}”.</div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {filtered.map(ic => {
                const selected = value === ic.path
                return (
                  <button
                    key={ic.path}
                    onClick={() => { onSelectIcon(ic.path); onClose() }}
                    title={ic.title}
                    className={`relative aspect-square rounded-xl border flex items-center justify-center p-2 transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0C6780]
                      ${selected ? 'border-[#0C6780] ring-2 ring-[#0C6780]/30 bg-[#0C6780]/5' : 'border-line bg-surface hover:border-[#0C6780]/40'}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- local static SVG */}
                    <img src={`/healthicons/${ic.path}.svg`} alt={ic.title} className="w-full h-full object-contain" loading="lazy" />
                    {selected && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#0C6780] text-white flex items-center justify-center">
                        <FaCheck className="text-[9px]" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
          {!loading && filtered.length >= 300 && (
            <p className="text-center text-xs text-faint mt-4">Showing first 300 - refine your search to see more.</p>
          )}
        </div>
      </div>
    </div>
  )
}

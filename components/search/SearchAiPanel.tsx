'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FaRobot, FaSpinner, FaPaperPlane, FaCheckCircle, FaMagic } from 'react-icons/fa'

interface Result {
  id: string; name: string; userType: string; profileImage: string | null
  address: string | null; verified: boolean; score?: number; specializations?: string[]
}

/** Natural-language provider search: ask in plain words, a RAG agent embeds the
 *  query (Gemini) + ranks providers by semantic similarity, returning result cards. */
export default function SearchAiPanel() {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Result[] | null>(null)
  const [intent, setIntent] = useState<{ type?: string; specialty?: string }>({})
  const [asked, setAsked] = useState('')

  async function ask() {
    if (!q.trim() || loading) return
    setLoading(true); setAsked(q.trim())
    try {
      const res = await fetch('/api/search/semantic', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ query: q.trim() }),
      })
      const j = await res.json()
      if (j.success) { setResults(j.providers || []); setIntent(j.intent || {}) }
      else setResults([])
    } catch { setResults([]) } finally { setLoading(false) }
  }

  return (
    <div className="rounded-2xl border border-[#0C6780]/30 bg-gradient-to-b from-[#0C6780]/[0.06] to-surface p-4 shadow-sm">
      <h3 className="text-sm font-bold text-fg flex items-center gap-2">
        <span className="w-7 h-7 rounded-lg bg-[#0C6780] text-white flex items-center justify-center"><FaRobot className="text-xs" /></span>
        AI provider search
        <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold text-[#0C6780] bg-[#0C6780]/10 px-1.5 py-0.5 rounded-full"><FaMagic className="text-[8px]" /> RAG</span>
      </h3>
      <p className="text-xs text-soft mt-1 mb-3">Describe what you need in your own words.</p>

      <div className="flex gap-2">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && ask()}
          placeholder="e.g. a cardiologist who does video calls"
          className="flex-1 min-w-0 px-3 py-2 border border-line rounded-xl text-sm bg-canvas focus:ring-2 focus:ring-[#0C6780] outline-none"
        />
        <button onClick={ask} disabled={loading || !q.trim()} aria-label="Search"
          className="px-3 py-2 bg-[#0C6780] text-white rounded-xl hover:bg-[#0a5568] disabled:opacity-50 flex-shrink-0">
          {loading ? <FaSpinner className="animate-spin text-sm" /> : <FaPaperPlane className="text-sm" />}
        </button>
      </div>

      {(intent.type || intent.specialty) && results && (
        <p className="text-[11px] text-soft mt-3">
          Understood: {intent.type ? <span className="font-medium capitalize">{intent.type.toLowerCase().replace(/_/g, ' ')}</span> : 'provider'}
          {intent.specialty ? <> · <span className="font-medium">{intent.specialty}</span></> : ''}
        </p>
      )}

      {results && (
        <div className="mt-2 space-y-2">
          {results.length === 0 ? (
            <p className="text-xs text-faint py-2">No close matches for “{asked}”. Try rephrasing, or use the search box above.</p>
          ) : results.map(r => (
            <Link key={r.id} href={`/profile/${r.id}`} className="group flex items-center gap-3 rounded-xl border border-line hover:border-[#0C6780]/50 px-3 py-2 transition">
              <span className="w-9 h-9 rounded-full bg-[#0C6780]/10 text-[#0C6780] flex items-center justify-center text-xs font-bold flex-shrink-0">
                {r.name.split(' ').map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-fg truncate">{r.name}</span>
                  {r.verified && <FaCheckCircle className="text-[#0C6780] text-[11px] flex-shrink-0" />}
                </span>
                <span className="block text-[11px] text-faint capitalize truncate">
                  {r.userType.toLowerCase().replace(/_/g, ' ')}{r.address ? ` · ${r.address}` : ''}
                </span>
              </span>
              {typeof r.score === 'number' && r.score > 0 && (
                <span className="text-[10px] font-semibold text-[#0C6780] flex-shrink-0">{r.score}%</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

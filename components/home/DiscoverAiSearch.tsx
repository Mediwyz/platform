'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FaRobot, FaSpinner, FaPaperPlane, FaCheckCircle, FaMagic, FaArrowRight } from 'react-icons/fa'

interface Result {
  id: string; name: string; userType: string; profileImage: string | null
  address: string | null; verified: boolean; score?: number
}

/** Natural-language provider search for the home "Discover" section. A RAG agent
 *  parses the request, embeds it (local e5 model) and ranks providers semantically. */
export default function DiscoverAiSearch() {
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
    <div className="max-w-3xl mx-auto mb-10">
      <div className="rounded-3xl border border-[#0C6780]/25 bg-gradient-to-b from-[#0C6780]/[0.07] to-surface p-5 sm:p-6 shadow-lg">
        <div className="flex items-start gap-3 mb-4">
          <span className="w-10 h-10 rounded-2xl bg-[#0C6780] text-white flex items-center justify-center flex-shrink-0"><FaRobot /></span>
          <div className="min-w-0">
            <h3 className="font-bold text-fg flex items-center gap-2">
              Ask in your own words
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#0C6780] bg-[#0C6780]/10 px-1.5 py-0.5 rounded-full"><FaMagic className="text-[8px]" /> AI</span>
            </h3>
            <p className="text-xs sm:text-sm text-soft">Describe your need — our AI finds the right provider. e.g. “a cardiologist who does video calls”.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && ask()}
            placeholder="What do you need help with?"
            className="flex-1 min-w-0 px-4 py-3 border border-line rounded-2xl text-sm bg-canvas focus:ring-2 focus:ring-[#0C6780] outline-none"
            aria-label="Describe what you need"
          />
          <button onClick={ask} disabled={loading || !q.trim()} aria-label="Search"
            className="px-4 py-3 bg-[#0C6780] text-white rounded-2xl hover:bg-[#001E40] disabled:opacity-50 transition-colors flex-shrink-0">
            {loading ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
          </button>
        </div>

        {(intent.type || intent.specialty) && results && (
          <p className="text-[11px] text-soft mt-3">
            Understood: {intent.type ? <span className="font-medium capitalize">{intent.type.toLowerCase().replace(/_/g, ' ')}</span> : 'provider'}
            {intent.specialty ? <> · <span className="font-medium">{intent.specialty}</span></> : ''}
          </p>
        )}

        {results && (
          <div className="mt-3 space-y-2">
            {results.length === 0 ? (
              <p className="text-sm text-faint py-2">No close match for “{asked}”. Try rephrasing, or pick a category below.</p>
            ) : results.map(r => (
              <Link key={r.id} href={`/profile/${r.id}`} className="group flex items-center gap-3 rounded-2xl border border-line hover:border-[#0C6780]/50 bg-surface px-3 py-2.5 transition">
                <span className="w-9 h-9 rounded-full bg-[#0C6780]/10 text-[#0C6780] flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {r.name.split(' ').map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-fg truncate">{r.name}</span>
                    {r.verified && <FaCheckCircle className="text-[#0C6780] text-[11px] flex-shrink-0" />}
                  </span>
                  <span className="block text-[11px] text-faint capitalize truncate">
                    {r.userType.toLowerCase().replace(/_/g, ' ')}{r.address ? ` · ${r.address}` : ''}
                  </span>
                </span>
                {typeof r.score === 'number' && r.score > 0 && (
                  <span className="text-[10px] font-semibold text-[#0C6780] flex-shrink-0">{r.score}%</span>
                )}
                <FaArrowRight className="text-[10px] text-faint group-hover:text-[#0C6780] flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { FaRobot, FaSpinner, FaPaperPlane, FaCheckCircle, FaMagic, FaArrowRight } from 'react-icons/fa'

interface Result {
  id: string; name: string; userType: string; profileImage: string | null
  address: string | null; verified: boolean; score?: number
}
interface Intent { type?: string; specialty?: string; location?: string; serviceMode?: string; serviceName?: string }
interface Msg { role: 'bot' | 'user'; text?: string; providers?: Result[]; typing?: boolean }

const SUGGESTIONS = [
  'A cardiologist who does video calls',
  'Un laboratoire à Moka',
  'Someone to care for my elderly mother at home',
  'A dentist for my kids',
  'A nurse for home visits',
  'Un nutritionniste pour perdre du poids',
]

const GREETING = "Hi! 👋 Tell me what you need — in any language — and I'll find the right provider for you."

/** Conversational RAG search for the home "Discover" section: a chat dialog with
 *  suggestion chips. Parses the request (Groq), embeds it (local e5) and returns
 *  semantically-ranked provider cards. */
export default function DiscoverAiSearch() {
  const [messages, setMessages] = useState<Msg[]>([{ role: 'bot', text: GREETING }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send(text?: string) {
    const q = (text ?? input).trim()
    if (!q || loading) return
    setInput('')
    setMessages(m => [...m, { role: 'user', text: q }, { role: 'bot', typing: true }])
    setLoading(true)
    try {
      const res = await fetch('/api/search/semantic', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ query: q }),
      })
      const j = await res.json()
      const providers: Result[] = j.success ? (j.providers || []) : []
      const intent: Intent = j.intent || {}
      const bits = [
        intent.type ? intent.type.toLowerCase().replace(/_/g, ' ') : 'provider',
        intent.specialty, intent.serviceName,
        intent.serviceMode ? `(${intent.serviceMode.replace(/_/g, ' ')})` : '',
        intent.location ? `in ${intent.location}` : '',
      ].filter(Boolean).join(' · ')
      const summary = providers.length
        ? `Here ${providers.length === 1 ? 'is a match' : `are ${providers.length} matches`} for ${bits}:`
        : `I couldn't find a close match for that. Try rephrasing, or pick a category on the left.`
      setMessages(m => [...m.slice(0, -1), { role: 'bot', text: summary, providers }])
    } catch {
      setMessages(m => [...m.slice(0, -1), { role: 'bot', text: 'Something went wrong — please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="rounded-3xl border border-[#0C6780]/25 bg-surface shadow-lg overflow-hidden flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-[#0C6780] to-[#001E40] text-white">
          <span className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0"><FaRobot /></span>
          <div className="min-w-0">
            <div className="font-bold text-sm leading-tight">AI Health Assistant</div>
            <div className="text-[11px] text-white/75">Describe your need in your own words</div>
          </div>
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold bg-white/15 px-1.5 py-0.5 rounded-full flex-shrink-0"><FaMagic className="text-[8px]" /> RAG</span>
        </div>

        {/* Conversation */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-[420px] lg:min-h-[480px] max-h-[640px] bg-canvas">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'gap-2'}`}>
              {m.role === 'bot' && (
                <span className="w-7 h-7 rounded-full bg-[#0C6780] text-white flex items-center justify-center text-[11px] flex-shrink-0 mt-0.5"><FaRobot /></span>
              )}
              <div className={`max-w-[85%] ${m.role === 'user' ? 'order-2' : ''}`}>
                <div className={`rounded-2xl px-3 py-2 text-sm ${m.role === 'user' ? 'bg-[#0C6780] text-white rounded-br-sm' : 'bg-surface border border-line text-fg rounded-tl-sm'}`}>
                  {m.typing ? (
                    <span className="inline-flex gap-1 py-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-soft animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-soft animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-soft animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  ) : m.text}
                </div>
                {/* Provider result cards */}
                {m.providers && m.providers.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {m.providers.map(r => (
                      <Link key={r.id} href={`/profile/${r.id}`} className="group flex items-center gap-2.5 rounded-xl border border-line hover:border-[#0C6780]/50 bg-surface px-2.5 py-2 transition">
                        <span className="w-8 h-8 rounded-full bg-[#0C6780]/10 text-[#0C6780] flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                          {r.name.split(' ').map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1">
                            <span className="text-[13px] font-semibold text-fg truncate">{r.name}</span>
                            {r.verified && <FaCheckCircle className="text-[#0C6780] text-[10px] flex-shrink-0" />}
                          </span>
                          <span className="block text-[10px] text-faint capitalize truncate">
                            {r.userType.toLowerCase().replace(/_/g, ' ')}{r.address ? ` · ${r.address}` : ''}
                          </span>
                        </span>
                        {typeof r.score === 'number' && r.score > 0 && (
                          <span className="text-[10px] font-semibold text-[#0C6780] flex-shrink-0">{r.score}%</span>
                        )}
                        <FaArrowRight className="text-[9px] text-faint group-hover:text-[#0C6780] flex-shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Suggestion chips — shown before the first question */}
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)}
                  className="text-[11px] text-[#0C6780] border border-[#0C6780]/30 bg-[#0C6780]/5 hover:bg-[#0C6780]/10 rounded-full px-2.5 py-1 transition">
                  {s}
                </button>
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-line flex gap-2 bg-surface">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Type your request…"
            className="flex-1 min-w-0 px-3 py-2.5 border border-line rounded-2xl text-sm bg-canvas focus:ring-2 focus:ring-[#0C6780] outline-none"
            aria-label="Describe what you need"
          />
          <button onClick={() => send()} disabled={loading || !input.trim()} aria-label="Send"
            className="px-3.5 py-2.5 bg-[#0C6780] text-white rounded-2xl hover:bg-[#001E40] disabled:opacity-50 transition-colors flex-shrink-0">
            {loading ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
          </button>
        </div>
      </div>
    </div>
  )
}

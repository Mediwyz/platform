'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { FaRobot, FaSpinner, FaPaperPlane, FaCheckCircle, FaMagic, FaArrowRight, FaCalendarCheck, FaSignInAlt, FaTimes } from 'react-icons/fa'

/* ── Shared agentic assistant: natural-language provider search + in-chat
 *    booking, plus general Q&A (health-aware when logged in). One component,
 *    three placements: the home Discover panel, the floating widget, a dashboard tab. */

interface Result {
  id: string; name: string; userType: string; profileImage: string | null
  address: string | null; verified: boolean; score?: number
}
interface Intent { type?: string; specialty?: string; location?: string; serviceMode?: string; serviceName?: string }
interface Day { date: string; label: string; slots: string[] }
interface Service { id: string; serviceName: string; price: number; duration: number; workflows?: { id: string; serviceMode: string }[] }
interface Draft { provider?: Result; date?: string; time?: string; service?: Service }
interface Msg {
  role: 'bot' | 'user'
  text?: string
  typing?: boolean
  providers?: Result[]
  days?: Day[]
  services?: Service[]
  confirm?: Draft
  signIn?: boolean
  bookedHref?: string
}
export interface Suggestion { label: string; kind: 'search' | 'ask' }
type Variant = 'panel' | 'floating' | 'tab' | 'hero'

interface Props {
  variant?: Variant
  onClose?: () => void
  greeting?: string
  suggestions?: Suggestion[]
}

const DEFAULT_GREETING = "Hi! 👋 Tell me what you need — in any language. I can find a provider and book it, or answer your questions about MediWyz."
const DEFAULT_SUGGESTIONS: Suggestion[] = [
  { label: 'A cardiologist who does video calls', kind: 'search' },
  { label: 'Un laboratoire à Moka', kind: 'search' },
  { label: 'Someone to care for my elderly mother at home', kind: 'search' },
  { label: 'How do I book a doctor?', kind: 'ask' },
  { label: 'How does the Health Shop work?', kind: 'ask' },
]
const PENDING_KEY = 'wyzo_pending_booking'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return m ? decodeURIComponent(m[1]) : null
}
function isoDate(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }

export default function WyzoAssistant({ variant = 'panel', onClose, greeting, suggestions }: Props) {
  const hero = variant === 'hero'
  const [messages, setMessages] = useState<Msg[]>(hero ? [] : [{ role: 'bot', text: greeting ?? DEFAULT_GREETING }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [draft, setDraft] = useState<Draft>({})
  const endRef = useRef<HTMLDivElement>(null)
  const sessionRef = useRef<string | undefined>(undefined)
  const chips = suggestions ?? DEFAULT_SUGGESTIONS
  const loggedIn = typeof document !== 'undefined' && !!getCookie('mediwyz_user_id')

  const push = useCallback((m: Msg) => setMessages(prev => [...prev, m]), [])
  const replaceTyping = useCallback((m: Msg) => setMessages(prev => [...prev.slice(0, -1), m]), [])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Resume a pending booking after sign-in.
  useEffect(() => {
    if (!loggedIn) return
    try {
      const raw = localStorage.getItem(PENDING_KEY)
      if (!raw) return
      const d: Draft = JSON.parse(raw)
      if (d.provider && d.date && d.time) {
        setDraft(d)
        setMessages(prev => [...prev, { role: 'bot', text: `Welcome back! Want to finish booking ${d.provider!.name} on ${d.date} at ${d.time}?`, confirm: d }])
      }
      localStorage.removeItem(PENDING_KEY)
    } catch { /* ignore */ }
  }, [loggedIn])

  // External "ask" trigger (e.g. dashboard quick-prompt buttons).
  useEffect(() => {
    const handler = (e: Event) => {
      const msg = (e as CustomEvent).detail?.message
      if (typeof msg === 'string' && msg.trim()) send(msg, 'ask')
    }
    window.addEventListener('wyzo:ask', handler)
    return () => window.removeEventListener('wyzo:ask', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  async function askQA(text: string): Promise<string> {
    try {
      const endpoint = loggedIn ? '/api/ai/chat' : '/api/ai/widget-chat'
      const body = loggedIn ? { message: text, sessionId: sessionRef.current } : { message: text }
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) })
      const j = await res.json()
      if (loggedIn && j?.data?.sessionId) sessionRef.current = j.data.sessionId
      return j?.data?.response || "I couldn't process that — please try rephrasing."
    } catch {
      return 'Connection problem — please try again in a moment.'
    }
  }

  // Route a message: a "search" finds providers; an "ask" answers a question;
  // free text tries search first and falls back to Q&A when nothing matches.
  async function send(text?: string, kind?: 'search' | 'ask') {
    const q = (text ?? input).trim()
    if (!q || loading) return
    setInput('')
    setMessages(m => [...m, { role: 'user', text: q }, { role: 'bot', typing: true }])
    setLoading(true)
    try {
      if (kind === 'ask') { replaceTyping({ role: 'bot', text: await askQA(q) }); return }
      const res = await fetch('/api/search/semantic', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ query: q }),
      })
      const j = await res.json()
      const providers: Result[] = j.success ? (j.providers || []) : []
      if (kind === 'search' || providers.length > 0) {
        const intent: Intent = j.intent || {}
        const bits = [
          intent.type ? intent.type.toLowerCase().replace(/_/g, ' ') : 'provider',
          intent.specialty, intent.serviceName,
          intent.serviceMode ? `(${intent.serviceMode.replace(/_/g, ' ')})` : '',
          intent.location ? `in ${intent.location}` : '',
        ].filter(Boolean).join(' · ')
        replaceTyping(providers.length
          ? { role: 'bot', text: `Here ${providers.length === 1 ? 'is a match' : `are ${providers.length} matches`} for ${bits}. Tap “Book” to schedule:`, providers }
          : { role: 'bot', text: 'No provider matched that — try rephrasing.' })
      } else {
        // No provider match → treat it as a general question.
        replaceTyping({ role: 'bot', text: await askQA(q) })
      }
    } catch {
      replaceTyping({ role: 'bot', text: 'Something went wrong — please try again.' })
    } finally {
      setLoading(false)
    }
  }

  async function startBooking(provider: Result) {
    setDraft({ provider })
    push({ role: 'user', text: `Book ${provider.name}` })
    push({ role: 'bot', typing: true })
    try {
      const today = new Date(); const days: Day[] = []
      for (let i = 0; i < 7; i++) {
        const d = new Date(today); d.setDate(today.getDate() + i)
        const date = isoDate(d)
        const res = await fetch(`/api/bookings/available-slots?providerUserId=${provider.id}&date=${date}&duration=30`, { credentials: 'include' })
        const j = await res.json().catch(() => ({}))
        const slots: string[] = j?.slots || []
        if (slots.length) days.push({ date, label: d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }), slots: slots.slice(0, 8) })
      }
      replaceTyping(days.length
        ? { role: 'bot', text: `Here's ${provider.name}'s availability this week — pick a time:`, days }
        : { role: 'bot', text: `${provider.name} has no open slots this week. Try another provider, or check back soon.` })
    } catch { replaceTyping({ role: 'bot', text: 'Could not load availability — please try again.' }) }
  }

  async function pickSlot(date: string, time: string, label: string) {
    setDraft(d => ({ ...d, date, time }))
    push({ role: 'user', text: `${label} at ${time}` })
    push({ role: 'bot', typing: true })
    try {
      const res = await fetch(`/api/providers/${draft.provider!.id}/services`, { credentials: 'include' })
      const j = await res.json().catch(() => ({}))
      const services: Service[] = (j?.data || []).slice(0, 6)
      replaceTyping(services.length
        ? { role: 'bot', text: 'Which service would you like to book?', services }
        : { role: 'bot', text: "No specific services listed — I'll book a standard consultation.", confirm: { provider: draft.provider, date, time } })
    } catch { replaceTyping({ role: 'bot', text: 'Could not load services — please try again.' }) }
  }

  function pickService(svc: Service) {
    const next = { ...draft, service: svc }
    setDraft(next)
    push({ role: 'user', text: svc.serviceName })
    push({ role: 'bot', text: `Confirm: ${svc.serviceName}${svc.price ? ` · Rs ${svc.price}` : ''} with ${next.provider!.name} on ${next.date} at ${next.time}?`, confirm: next })
  }

  async function confirmBooking(d: Draft) {
    if (!loggedIn) {
      try { localStorage.setItem(PENDING_KEY, JSON.stringify(d)) } catch { /* ignore */ }
      push({ role: 'bot', text: 'You just need to sign in to confirm — your booking is saved and resumes right after.', signIn: true })
      return
    }
    push({ role: 'bot', typing: true })
    try {
      const wf = d.service?.workflows?.[0]
      const res = await fetch('/api/bookings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({
          providerUserId: d.provider!.id, providerType: d.provider!.userType,
          scheduledDate: d.date, scheduledTime: d.time,
          platformServiceId: d.service?.id, serviceName: d.service?.serviceName,
          duration: d.service?.duration ?? 30, type: wf?.serviceMode || 'in_person',
          workflowTemplateId: wf?.id, reason: d.service?.serviceName,
        }),
      })
      const j = await res.json()
      if (!j.success && !j.booking) throw new Error(j.message || 'Booking failed')
      const ticket = j.booking?.ticketId ? ` (ref ${j.booking.ticketId})` : ''
      replaceTyping({ role: 'bot', text: `✅ Booked! Your appointment with ${d.provider!.name} is on ${d.date} at ${d.time}${ticket}.`, bookedHref: '/bookings' })
      setDraft({})
    } catch (e) { replaceTyping({ role: 'bot', text: e instanceof Error ? e.message : 'Booking failed — please try again.' }) }
  }

  // ── Shared bits ─────────────────────────────────────────────────────────
  const showChips = hero ? messages.length === 0 : messages.length === 1
  const chipsNode = showChips ? (
    <div className={`flex flex-wrap gap-1.5 ${hero ? 'justify-center' : 'pt-1'}`}>
      {chips.map(s => (
        <button key={s.label} onClick={() => send(s.label, s.kind)}
          className={hero
            ? 'text-xs text-white border border-white/30 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 transition'
            : 'text-[11px] text-[#0C6780] border border-[#0C6780]/30 bg-[#0C6780]/5 hover:bg-[#0C6780]/10 rounded-full px-2.5 py-1 transition'}>
          {s.label}
        </button>
      ))}
    </div>
  ) : null

  const inputBar = (
    <div className={hero ? 'flex gap-2 max-w-2xl mx-auto' : 'p-3 border-t border-line flex gap-2 bg-surface flex-shrink-0'}>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && send()}
        placeholder={hero ? 'Posez votre question ou décrivez votre besoin…' : 'Type your request or question…'}
        className={hero
          ? 'flex-1 min-w-0 px-4 py-3.5 rounded-2xl text-base bg-white/10 border border-white/25 text-white placeholder-white/55 focus:ring-2 focus:ring-brand-sky focus:bg-white/15 outline-none backdrop-blur-sm'
          : 'flex-1 min-w-0 px-3 py-2.5 border border-line rounded-2xl text-sm bg-canvas focus:ring-2 focus:ring-[#0C6780] outline-none'}
        aria-label="Ask Wyzo"
      />
      <button onClick={() => send()} disabled={loading || !input.trim()} aria-label="Send"
        className={hero
          ? 'px-5 py-3.5 bg-brand-sky text-[#001225] font-bold rounded-2xl hover:bg-white disabled:opacity-50 transition-colors flex-shrink-0'
          : 'px-3.5 py-2.5 bg-[#0C6780] text-white rounded-2xl hover:bg-[#001E40] disabled:opacity-50 transition-colors flex-shrink-0'}>
        {loading ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
      </button>
    </div>
  )

  const messageNodes = messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'gap-2'}`}>
            {m.role === 'bot' && <span className="w-7 h-7 rounded-full bg-[#0C6780] text-white flex items-center justify-center text-[11px] flex-shrink-0 mt-0.5"><FaRobot /></span>}
            <div className={`max-w-[88%] ${m.role === 'user' ? 'order-2' : ''}`}>
              <div className={`rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-[#0C6780] text-white rounded-br-sm' : 'bg-surface border border-line text-fg rounded-tl-sm'}`}>
                {m.typing ? (
                  <span className="inline-flex gap-1 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-soft animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-soft animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-soft animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                ) : m.text}
              </div>

              {m.providers && m.providers.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {m.providers.map(r => (
                    <div key={r.id} className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-2.5 py-2">
                      <span className="w-8 h-8 rounded-full bg-[#0C6780]/10 text-[#0C6780] flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                        {r.name.split(' ').map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2)}
                      </span>
                      <Link href={`/profile/${r.id}`} className="min-w-0 flex-1">
                        <span className="flex items-center gap-1">
                          <span className="text-[13px] font-semibold text-fg truncate">{r.name}</span>
                          {r.verified && <FaCheckCircle className="text-[#0C6780] text-[10px] flex-shrink-0" />}
                        </span>
                        <span className="block text-[10px] text-faint capitalize truncate">
                          {r.userType.toLowerCase().replace(/_/g, ' ')}{r.address ? ` · ${r.address}` : ''}{typeof r.score === 'number' && r.score > 0 ? ` · ${r.score}%` : ''}
                        </span>
                      </Link>
                      <button onClick={() => startBooking(r)} className="text-[11px] font-semibold text-white bg-[#0C6780] hover:bg-[#001E40] px-2.5 py-1 rounded-lg flex-shrink-0 inline-flex items-center gap-1 transition">
                        <FaCalendarCheck className="text-[9px]" /> Book
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {m.days && (
                <div className="mt-2 space-y-2">
                  {m.days.map(day => (
                    <div key={day.date}>
                      <p className="text-[11px] font-semibold text-soft mb-1">{day.label}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {day.slots.map(t => (
                          <button key={t} onClick={() => pickSlot(day.date, t, day.label)} className="text-[11px] border border-[#0C6780]/30 text-[#0C6780] hover:bg-[#0C6780] hover:text-white rounded-lg px-2 py-1 transition">{t}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {m.services && (
                <div className="mt-2 space-y-1.5">
                  {m.services.map(svc => (
                    <button key={svc.id} onClick={() => pickService(svc)} className="w-full flex items-center justify-between gap-2 rounded-xl border border-line hover:border-[#0C6780]/50 bg-surface px-3 py-2 text-left transition">
                      <span className="min-w-0">
                        <span className="block text-[13px] font-semibold text-fg truncate">{svc.serviceName}</span>
                        <span className="block text-[10px] text-faint">{svc.duration} min{svc.workflows?.[0]?.serviceMode ? ` · ${svc.workflows[0].serviceMode}` : ''}</span>
                      </span>
                      <span className="text-[12px] font-bold text-[#0C6780] flex-shrink-0">{svc.price ? `Rs ${svc.price}` : 'Free'}</span>
                    </button>
                  ))}
                </div>
              )}

              {m.confirm && (
                <button onClick={() => confirmBooking(m.confirm!)} disabled={loading} className="mt-2 inline-flex items-center gap-2 bg-[#0C6780] hover:bg-[#001E40] text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
                  <FaCalendarCheck className="text-xs" /> Confirm booking
                </button>
              )}
              {m.signIn && (
                <Link href="/login" className="mt-2 inline-flex items-center gap-2 bg-[#0C6780] hover:bg-[#001E40] text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
                  <FaSignInAlt className="text-xs" /> Sign in to continue
                </Link>
              )}
              {m.bookedHref && (
                <Link href={m.bookedHref} className="mt-2 inline-flex items-center gap-2 border border-[#0C6780]/30 text-[#0C6780] text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#0C6780]/5 transition">
                  View my bookings <FaArrowRight className="text-[10px]" />
                </Link>
              )}
            </div>
          </div>
        ))

  // ── HERO variant: blends into the hero (no card/header); a frosted dialog
  //    box appears once the conversation starts. ──
  if (hero) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        {messages.length > 0 && (
          <div className="rounded-2xl border border-white/20 bg-canvas/95 backdrop-blur-md shadow-2xl overflow-y-auto max-h-[42vh] p-3 mb-3 text-left space-y-3">
            {messageNodes}
            <div ref={endRef} />
          </div>
        )}
        {chipsNode && <div className="mb-3">{chipsNode}</div>}
        {inputBar}
      </div>
    )
  }

  const outer = variant === 'panel'
    ? 'rounded-3xl border border-[#0C6780]/25 shadow-lg'
    : variant === 'tab'
      ? 'rounded-2xl border border-line'
      : ''
  const msgArea = variant === 'panel'
    ? 'min-h-[420px] lg:min-h-[480px] max-h-[640px]'
    : 'flex-1 min-h-0'

  return (
    <div className={`w-full h-full bg-surface overflow-hidden flex flex-col ${outer}`}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-[#0C6780] to-[#001E40] text-white flex-shrink-0">
        <span className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0"><FaRobot /></span>
        <div className="min-w-0">
          <div className="font-bold text-sm leading-tight">Wyzo — Health AI Assistant</div>
          <div className="text-[11px] text-white/75 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Find a provider, book, or ask anything</div>
        </div>
        {onClose ? (
          <button onClick={onClose} aria-label="Close" className="ml-auto w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center flex-shrink-0 transition"><FaTimes className="text-xs" /></button>
        ) : (
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold bg-white/15 px-1.5 py-0.5 rounded-full flex-shrink-0"><FaMagic className="text-[8px]" /> RAG</span>
        )}
      </div>

      {/* Conversation */}
      <div className={`flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-canvas ${msgArea}`}>
        {messageNodes}
        {chipsNode}
        <div ref={endRef} />
      </div>

      {inputBar}
    </div>
  )
}

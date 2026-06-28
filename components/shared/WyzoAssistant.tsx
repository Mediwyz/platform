'use client'

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'
import Link from 'next/link'
import { FaRobot, FaSpinner, FaPaperPlane, FaCheckCircle, FaMagic, FaArrowRight, FaCalendarCheck, FaSignInAlt, FaTimes, FaPills, FaBuilding, FaUserPlus } from 'react-icons/fa'

/* ── Shared agentic assistant: natural-language provider search + in-chat
 *    booking, plus general Q&A (health-aware when logged in). One component,
 *    three placements: the home Discover panel, the floating widget, a dashboard tab. */

interface Result {
  id: string; name: string; userType: string; profileImage: string | null
  address: string | null; verified: boolean; score?: number
}
interface Day { date: string; label: string; slots: string[] }
interface Service { id: string; serviceName: string; price: number; duration: number; workflows?: { id: string; serviceMode: string }[] }
interface Draft { provider?: Result; date?: string; time?: string; service?: Service }
interface Org { id: string; name: string; type?: string; city?: string | null; logoUrl?: string | null; isVerified?: boolean; providerCount?: number }
interface Product { id: string; name: string; category?: string | null; price?: number | null; currency?: string; inStock?: boolean; providerUserId?: string | null; requiresPrescription?: boolean }
interface Msg {
  role: 'bot' | 'user'
  text?: string
  typing?: boolean
  providers?: Result[]
  organisations?: Org[]
  products?: Product[]
  followUps?: string[]
  days?: Day[]
  services?: Service[]
  confirm?: Draft
  signIn?: boolean
  authChoice?: Draft
  signup?: Draft
  bookedHref?: string
}
export interface Suggestion { label: string; kind: 'search' | 'ask' }
type Variant = 'panel' | 'floating' | 'tab' | 'hero'

interface Props {
  variant?: Variant
  onClose?: () => void
  greeting?: string
  suggestions?: Suggestion[]
  /** hero only: the slogan/identity block rendered INSIDE the scroll area, so
   *  it scrolls up and out of view as the conversation grows. */
  heroIntro?: ReactNode
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

export default function WyzoAssistant({ variant = 'panel', onClose, greeting, suggestions, heroIntro }: Props) {
  const hero = variant === 'hero'
  const [messages, setMessages] = useState<Msg[]>(hero ? [] : [{ role: 'bot', text: greeting ?? DEFAULT_GREETING }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [draft, setDraft] = useState<Draft>({})
  const endRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const sessionRef = useRef<string | undefined>(undefined)
  const lastProviderIdsRef = useRef<string[]>([])
  const firstRenderRef = useRef(true)
  // Active booking sub-flow: while a step is awaiting input, free-text typed in
  // the box is interpreted IN CONTEXT (pick a slot / service / confirm) instead
  // of being re-classified by the agent (which would restart the booking).
  const stageRef = useRef<null | 'slot' | 'service' | 'confirm'>(null)
  const availDaysRef = useRef<Day[]>([])
  const availServicesRef = useRef<Service[]>([])
  const confirmDraftRef = useRef<Draft | null>(null)
  const chips = suggestions ?? DEFAULT_SUGGESTIONS
  const loggedIn = typeof document !== 'undefined' && !!getCookie('mediwyz_user_id')

  const push = useCallback((m: Msg) => setMessages(prev => [...prev, m]), [])
  const replaceTyping = useCallback((m: Msg) => setMessages(prev => [...prev.slice(0, -1), m]), [])
  // Non-hero placements: scroll the message into view as before. Hero: keep the
  // identity block pinned at first paint (no messages yet); once the user
  // engages, scroll the bounded container so the intro slides up and away.
  useEffect(() => {
    // Never auto-scroll on first paint — otherwise a panel placement (e.g. the
    // Discover section) would scroll the whole window down to itself on page
    // load, hiding the hero. Only scroll once the user has actually engaged.
    if (firstRenderRef.current) { firstRenderRef.current = false; return }
    if (hero) {
      const el = scrollRef.current
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
      return
    }
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, hero])

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

  const WEEKDAYS: Record<string, number> = {
    sun: 0, sunday: 0, dim: 0, dimanche: 0,
    mon: 1, monday: 1, lun: 1, lundi: 1,
    tue: 2, tuesday: 2, mar: 2, mardi: 2,
    wed: 3, wednesday: 3, mer: 3, mercredi: 3,
    thu: 4, thursday: 4, jeu: 4, jeudi: 4,
    fri: 5, friday: 5, ven: 5, vendredi: 5,
    sat: 6, saturday: 6, sam: 6, samedi: 6,
  }
  function hasTimeToken(s: string) { return /\b\d{1,2}\s*[:hH.]\s*\d{2}\b/.test(s) }
  // Match a typed time (and optional weekday) to one of the shown slots.
  function matchSlot(s: string): { date: string; time: string; label: string } | null {
    const m = s.match(/\b(\d{1,2})\s*[:hH.]\s*(\d{2})\b/)
    if (!m) return null
    const time = `${String(parseInt(m[1], 10)).padStart(2, '0')}:${m[2]}`
    const days = availDaysRef.current
    const wdKey = Object.keys(WEEKDAYS).find(k => new RegExp(`\\b${k}`, 'i').test(s))
    let day = wdKey
      ? days.find(d => new Date(d.date).getDay() === WEEKDAYS[wdKey] && d.slots.includes(time))
      : undefined
    if (!day) day = days.find(d => d.slots.includes(time))
    return day ? { date: day.date, time, label: day.label } : null
  }
  function matchService(s: string): Service | null {
    const ql = s.toLowerCase().trim()
    const list = availServicesRef.current
    if (/\b(first|1st|premier|première)\b/.test(ql)) return list[0] ?? null
    if (/\b(second|2nd|deuxi)\b/.test(ql)) return list[1] ?? null
    if (/\b(third|3rd|troisi)\b/.test(ql)) return list[2] ?? null
    return list.find(svc => ql.includes(svc.serviceName.toLowerCase()) || svc.serviceName.toLowerCase().includes(ql)) ?? null
  }
  const isYes = (s: string) => /\b(yes|yeah|yep|ok|okay|sure|confirm|book it|go ahead|oui|valide[rz]?|d'accord|c'est bon)\b/i.test(s)
  const isNo = (s: string) => /\b(no|nope|cancel|stop|non|annule[rz]?)\b/i.test(s)

  // Every message flows through the Wyzo agent: it classifies intent, extracts
  // and resolves entities (names→IDs, fuzzy), runs the right tool (provider /
  // org / product search, booking, or Q&A), and returns a reply + result cards
  // + follow-up suggestions. The deterministic booking sub-flow stays client-side.
  async function send(text?: string, _kind?: 'search' | 'ask') {
    const q = (text ?? input).trim()
    if (!q || loading) return

    // ── In-flow interception: interpret free-text within the active booking step
    if (stageRef.current === 'slot') {
      const hit = matchSlot(q)
      if (hit) { setInput(''); pickSlot(hit.date, hit.time, hit.label); return }
      if (hasTimeToken(q)) {
        setInput('')
        setMessages(m => [...m, { role: 'user', text: q }, { role: 'bot', text: "That time isn't open — please pick one of the slots shown above." }])
        return
      }
    } else if (stageRef.current === 'service') {
      const svc = matchService(q)
      if (svc) { setInput(''); pickService(svc); return }
    } else if (stageRef.current === 'confirm') {
      if (isNo(q)) {
        setInput(''); stageRef.current = null; confirmDraftRef.current = null
        setMessages(m => [...m, { role: 'user', text: q }, { role: 'bot', text: 'No problem — booking cancelled. Anything else I can help with?' }])
        return
      }
      if (isYes(q) && confirmDraftRef.current) {
        setInput(''); setMessages(m => [...m, { role: 'user', text: q }]); confirmBooking(confirmDraftRef.current); return
      }
    }
    // Leaving any booking step → hand the message to the agent.
    stageRef.current = null
    setInput('')
    setMessages(m => [...m, { role: 'user', text: q }, { role: 'bot', typing: true }])
    setLoading(true)
    try {
      const endpoint = loggedIn ? '/api/ai/agent' : '/api/ai/agent-public'
      const history = messages
        .filter(m => m.text && !m.typing)
        .slice(-6)
        .map(m => ({ role: m.role, text: m.text as string }))
      const res = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ message: q, history, sessionId: sessionRef.current, lastProviderIds: lastProviderIdsRef.current }),
      })
      const j = await res.json()
      const d = j?.data || {}
      if (d.sessionId) sessionRef.current = d.sessionId
      const providers: Result[] = Array.isArray(d.providers) ? d.providers : []
      if (providers.length) lastProviderIdsRef.current = providers.map((p: Result) => p.id)
      replaceTyping({
        role: 'bot',
        text: d.reply || "I couldn't process that — please try rephrasing.",
        providers: providers.length ? providers : undefined,
        organisations: Array.isArray(d.organisations) && d.organisations.length ? d.organisations : undefined,
        products: Array.isArray(d.products) && d.products.length ? d.products : undefined,
        followUps: Array.isArray(d.followUps) && d.followUps.length ? d.followUps : undefined,
      })
      // Agentic booking: when the agent pinned a single provider to book, jump
      // straight into the slot picker.
      if (d.action === 'book' && d.bookProviderId) {
        const p = providers.find((x: Result) => x.id === d.bookProviderId)
        if (p) startBooking(p)
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
      if (days.length) { availDaysRef.current = days; stageRef.current = 'slot' } else { stageRef.current = null }
      replaceTyping(days.length
        ? { role: 'bot', text: `Here's ${provider.name}'s availability this week — pick a time, or just type one (e.g. "Tue 11:00"):`, days }
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
      if (services.length) {
        availServicesRef.current = services
        stageRef.current = 'service'
      } else {
        confirmDraftRef.current = { provider: draft.provider, date, time }
        stageRef.current = 'confirm'
      }
      replaceTyping(services.length
        ? { role: 'bot', text: 'Which service would you like to book? Tap one, or type its name:', services }
        : { role: 'bot', text: "No specific services listed — I'll book a standard consultation.", confirm: { provider: draft.provider, date, time } })
    } catch { replaceTyping({ role: 'bot', text: 'Could not load services — please try again.' }) }
  }

  function pickService(svc: Service) {
    const next = { ...draft, service: svc }
    setDraft(next)
    confirmDraftRef.current = next
    stageRef.current = 'confirm'
    push({ role: 'user', text: svc.serviceName })
    push({ role: 'bot', text: `Confirm: ${svc.serviceName}${svc.price ? ` · Rs ${svc.price}` : ''} with ${next.provider!.name} on ${next.date} at ${next.time}? (yes/no)`, confirm: next })
  }

  async function confirmBooking(d: Draft) {
    stageRef.current = null
    if (!loggedIn) {
      // Guest: keep the booking and offer to sign in OR create an account in-chat.
      try { localStorage.setItem(PENDING_KEY, JSON.stringify(d)) } catch { /* ignore */ }
      push({ role: 'bot', text: 'Almost there! Sign in or create a free account to confirm — your booking resumes right after. No payment now; you pay at the appointment.', authChoice: d })
      return
    }
    return submitBooking(d)
  }

  // Create the booking. Uses pay-at-appointment so no wallet pre-funding is
  // needed — the appointment is settled on the day.
  async function submitBooking(d: Draft) {
    stageRef.current = null
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
          paymentMethod: 'pay_at_appointment',
        }),
      })
      const j = await res.json()
      if (!j.success && !j.booking) throw new Error(j.message || 'Booking failed')
      const ticket = j.booking?.ticketId ? ` (ref ${j.booking.ticketId})` : ''
      replaceTyping({ role: 'bot', text: `✅ Booked! Your appointment with ${d.provider!.name} is on ${d.date} at ${d.time}${ticket}. You'll pay at the appointment.`, bookedHref: '/bookings' })
      setDraft({}); confirmDraftRef.current = null
    } catch (e) { replaceTyping({ role: 'bot', text: e instanceof Error ? e.message : 'Booking failed — please try again.' }) }
  }

  // Kick off in-chat account creation, keeping the pending booking to resume.
  function startSignup(d: Draft) {
    push({ role: 'bot', text: "Great — let's set up your free account (about 30 seconds):", signup: d })
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
    <div className={hero ? 'flex gap-2' : 'p-3 border-t border-line flex gap-2 bg-surface flex-shrink-0'}>
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
              <div className={`rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-[#0C6780] text-white rounded-br-sm' : hero ? 'bg-white/10 border border-white/20 text-white backdrop-blur-md rounded-tl-sm' : 'bg-surface border border-line text-fg rounded-tl-sm'}`}>
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

              {m.organisations && m.organisations.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {m.organisations.map(o => (
                    <Link key={o.id} href={`/organization/${o.id}/book`} className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-2.5 py-2 hover:border-[#0C6780]/50 transition">
                      <span className="w-8 h-8 rounded-lg bg-[#0C6780]/10 text-[#0C6780] flex items-center justify-center text-[11px] flex-shrink-0"><FaBuilding /></span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1">
                          <span className="text-[13px] font-semibold text-fg truncate">{o.name}</span>
                          {o.isVerified && <FaCheckCircle className="text-[#0C6780] text-[10px] flex-shrink-0" />}
                        </span>
                        <span className="block text-[10px] text-faint capitalize truncate">
                          {o.type || 'organisation'}{o.city ? ` · ${o.city}` : ''}{typeof o.providerCount === 'number' ? ` · ${o.providerCount} provider${o.providerCount === 1 ? '' : 's'}` : ''}
                        </span>
                      </span>
                      <FaArrowRight className="text-faint text-[10px] flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              )}

              {m.products && m.products.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {m.products.map(p => (
                    <div key={p.id} className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-2.5 py-2">
                      <span className="w-8 h-8 rounded-lg bg-[#0C6780]/10 text-[#0C6780] flex items-center justify-center text-[11px] flex-shrink-0"><FaPills /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-semibold text-fg truncate">{p.name}</span>
                        <span className="block text-[10px] text-faint capitalize truncate">
                          {p.category || 'product'}{p.requiresPrescription ? ' · prescription required' : ''}{p.inStock === false ? ' · out of stock' : ''}
                        </span>
                      </span>
                      {p.price != null && <span className="text-[12px] font-bold text-[#0C6780] flex-shrink-0">{p.currency || 'Rs'} {p.price}</span>}
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
              {m.authChoice && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link href="/login" className="inline-flex items-center gap-2 bg-[#0C6780] hover:bg-[#001E40] text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
                    <FaSignInAlt className="text-xs" /> Sign in
                  </Link>
                  <button onClick={() => startSignup(m.authChoice!)} className="inline-flex items-center gap-2 border border-[#0C6780]/40 text-[#0C6780] text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#0C6780]/5 transition">
                    <FaUserPlus className="text-xs" /> Create account
                  </button>
                </div>
              )}
              {m.signup && <InlineSignup onCreated={() => submitBooking(m.signup!)} />}
              {m.bookedHref && (
                <Link href={m.bookedHref} className="mt-2 inline-flex items-center gap-2 border border-[#0C6780]/30 text-[#0C6780] text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#0C6780]/5 transition">
                  View my bookings <FaArrowRight className="text-[10px]" />
                </Link>
              )}

              {/* Conversation continuation: tappable next-step suggestions. */}
              {m.followUps && m.followUps.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.followUps.map((f, k) => (
                    <button key={k} onClick={() => send(f)} disabled={loading}
                      className={hero
                        ? 'text-[11px] text-white border border-white/30 bg-white/10 hover:bg-white/20 rounded-full px-2.5 py-1 transition disabled:opacity-50'
                        : 'text-[11px] text-[#0C6780] border border-[#0C6780]/30 bg-[#0C6780]/5 hover:bg-[#0C6780]/10 rounded-full px-2.5 py-1 transition disabled:opacity-50'}>
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))

  // ── HERO variant: blends into the hero (no card/header); a frosted dialog
  //    box appears once the conversation starts. ──
  if (hero) {
    return (
      <div className="w-full h-full flex flex-col">
        {/* One bounded, vertically-scrollable area: the identity block + the
            conversation share it, so older content slides up and out of view
            as new replies arrive. */}
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-1 pb-2 space-y-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {heroIntro}
          {messages.length > 0 && <div className="space-y-3 text-left">{messageNodes}</div>}
          {chipsNode}
          <div ref={endRef} />
        </div>
        <div className="pt-3 flex-shrink-0">{inputBar}</div>
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

/** In-chat patient account creation. Collects the fields `POST /api/auth/register`
 *  requires; that endpoint auto-logs-in active patient accounts (sets cookies),
 *  so on success we call `onCreated` to resume the pending booking. */
function InlineSignup({ onCreated }: { onCreated: () => void }) {
  const [f, setF] = useState({ fullName: '', email: '', phone: '', dateOfBirth: '', gender: '', address: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const set = (k: keyof typeof f, v: string) => setF(p => ({ ...p, [k]: v }))

  async function submit() {
    setErr(null)
    if (!f.fullName.trim() || !f.email.trim() || !f.phone.trim() || !f.dateOfBirth || !f.gender || !f.address.trim()) {
      setErr('Please fill in all fields.'); return
    }
    if (f.password.length < 6) { setErr('Password must be at least 6 characters.'); return }
    setBusy(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ ...f, userType: 'patient' }),
      })
      const j = await res.json()
      if (!res.ok || !j.success) { setErr(j.message || 'Could not create your account. Please try again.'); return }
      setDone(true)
      onCreated()
    } catch { setErr('Network error — please try again.') } finally { setBusy(false) }
  }

  const field = 'w-full px-3 py-2 border border-line rounded-lg text-sm bg-canvas text-fg focus:ring-2 focus:ring-[#0C6780] outline-none'

  if (done) return <p className="mt-2 text-sm text-emerald-600 font-medium">✅ Account created — finishing your booking…</p>

  return (
    <div className="mt-2 rounded-xl border border-line bg-surface p-3 space-y-2 text-left max-w-sm">
      <div className="grid grid-cols-2 gap-2">
        <input className={field} placeholder="Full name" value={f.fullName} onChange={e => set('fullName', e.target.value)} />
        <input className={field} placeholder="Phone" value={f.phone} onChange={e => set('phone', e.target.value)} />
      </div>
      <input className={field} type="email" placeholder="Email" value={f.email} onChange={e => set('email', e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <input className={field} type="date" aria-label="Date of birth" value={f.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} />
        <select className={field} aria-label="Gender" value={f.gender} onChange={e => set('gender', e.target.value)}>
          <option value="">Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="prefer-not-to-say">Prefer not to say</option>
        </select>
      </div>
      <input className={field} placeholder="Address" value={f.address} onChange={e => set('address', e.target.value)} />
      <input className={field} type="password" placeholder="Password (min 6 characters)" value={f.password} onChange={e => set('password', e.target.value)} />
      {err && <p className="text-xs text-red-600">{err}</p>}
      <button onClick={submit} disabled={busy} className="w-full inline-flex items-center justify-center gap-2 bg-[#0C6780] hover:bg-[#001E40] text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50">
        {busy ? <FaSpinner className="animate-spin" /> : <FaUserPlus className="text-xs" />} Create account &amp; continue
      </button>
      <p className="text-[10px] text-faint text-center">Already have an account? <Link href="/login" className="text-[#0C6780] font-medium">Sign in</Link></p>
    </div>
  )
}

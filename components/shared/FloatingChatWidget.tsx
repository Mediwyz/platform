'use client'

import { useEffect, useRef, useState } from 'react'
import { FaTimes, FaPaperPlane, FaSpinner, FaRobot } from 'react-icons/fa'
import Image from 'next/image'

interface Turn {
  role: 'user' | 'agent'
  text: string
}

const SUGGESTED = [
  'Comment réserver un médecin ?',
  'Quels services propose MediWyz ?',
  'Livrez-vous des médicaments ?',
  'Comment fonctionne le Health Shop ?',
  'What types of doctors are available?',
  'How much does a consultation cost?',
]

export default function FloatingChatWidget() {
  const [open, setOpen] = useState(false)
  const [turns, setTurns] = useState<Turn[]>([
    {
      role: 'agent',
      text: "Bonjour 👋 Je suis Wyzo, votre Assistant Santé IA. Je peux vous aider à réserver un médecin, trouver des médicaments dans le Health Shop, ou répondre à toutes vos questions sur la plateforme.",
    },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [turns, open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  async function ask(text: string) {
    const clean = text.trim()
    if (!clean || sending) return
    setInput('')
    setTurns(prev => [...prev, { role: 'user', text: clean }])
    setSending(true)

    try {
      const res = await fetch('/api/ai/widget-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: clean }),
      })
      const json = await res.json()
      const reply = json?.data?.response ?? "Je n'ai pas pu traiter votre question. Reformulez-la ou réservez directement un professionnel."
      setTurns(prev => [...prev, { role: 'agent', text: String(reply) }])
    } catch {
      setTurns(prev => [...prev, { role: 'agent', text: "Problème de connexion. Veuillez réessayer dans un moment." }])
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* ─── Full-page overlay when open ─────────────────────────────── */}
      {open && (
        <>
          {/* Dark backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Chat panel — fills most of the screen, comfortable reading width */}
          <div
            className="fixed inset-0 sm:inset-2 md:inset-4 lg:inset-6 xl:inset-10 z-50
              flex flex-col bg-white rounded-none sm:rounded-3xl
              shadow-[0_40px_100px_-12px_rgba(0,30,64,0.45)]
              overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Wyzo — Health AI Assistant"
          >
            {/* Header */}
            <div className="flex items-center gap-4 px-6 sm:px-10 py-5 sm:py-6 bg-gradient-to-r from-brand-navy via-[#0a3d62] to-brand-teal flex-shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Image src="/images/logo-icon.png" alt="MediWyz" width={44} height={44} className="rounded-xl" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-lg sm:text-xl">Wyzo — Health AI Assistant</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                  <p className="text-white/80 text-sm sm:text-base">En ligne • Réponses instantanées</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition flex-shrink-0"
                aria-label="Fermer"
              >
                <FaTimes className="text-base" />
              </button>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-10 py-6 sm:py-8 space-y-5 min-h-0 bg-gray-50/50">
              {turns.map((t, i) => (
                <div key={i} className={`flex gap-3 ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {t.role === 'agent' && (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-navy to-brand-teal flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FaRobot className="text-white text-sm" />
                    </div>
                  )}
                  <div
                    className={`max-w-[78%] sm:max-w-[68%] px-5 py-4 rounded-2xl text-base sm:text-lg leading-relaxed shadow-sm ${
                      t.role === 'user'
                        ? 'bg-brand-navy text-white rounded-br-sm'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                    }`}
                  >
                    {t.text}
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex gap-3 justify-start">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-navy to-brand-teal flex items-center justify-center flex-shrink-0">
                    <FaRobot className="text-white text-sm" />
                  </div>
                  <div className="bg-white border border-gray-100 px-5 py-4 rounded-2xl rounded-bl-sm text-base inline-flex items-center gap-2 shadow-sm">
                    <FaSpinner className="animate-spin text-brand-teal text-sm" />
                    <span className="text-gray-500">En train de répondre...</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggested questions — first turn only */}
            {turns.length === 1 && (
              <div className="px-5 sm:px-10 py-4 flex flex-wrap gap-2.5 border-t border-gray-100 bg-white flex-shrink-0">
                <p className="w-full text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Questions fréquentes</p>
                {SUGGESTED.map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => ask(q)}
                    className="text-sm sm:text-base px-4 py-2 rounded-full bg-brand-teal/10 text-brand-navy hover:bg-brand-teal hover:text-white border border-brand-teal/20 transition font-medium"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={e => { e.preventDefault(); ask(input) }}
              className="border-t border-gray-200 px-5 sm:px-10 py-5 flex items-center gap-3 bg-white flex-shrink-0"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Posez votre question sur MediWyz..."
                className="flex-1 px-5 py-3.5 text-base sm:text-lg bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-teal focus:bg-white focus:border-brand-teal outline-none transition"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                aria-label="Envoyer"
                className="w-12 h-12 rounded-xl bg-brand-navy hover:bg-brand-teal text-white flex items-center justify-center disabled:opacity-40 transition flex-shrink-0"
              >
                {sending ? <FaSpinner className="animate-spin text-base" /> : <FaPaperPlane className="text-base" />}
              </button>
            </form>
          </div>
        </>
      )}

      {/* ─── Floating trigger — pill button, slot 1 (lowest) ────────── */}
      <button
        onClick={() => setOpen(v => !v)}
        title={open ? 'Close Wyzo' : 'Wyzo — Health AI Assistant'}
        aria-label={open ? 'Close Wyzo' : 'Wyzo — Health AI Assistant'}
        className={`fixed bottom-24 sm:bottom-5 right-4 sm:right-5 z-[150]
          h-12 w-40 pl-3 pr-5 rounded-full shadow-lg shadow-black/25
          flex items-center gap-2.5 text-sm font-semibold text-white
          transition-all duration-200 hover:scale-105 active:scale-95
          ${open ? 'bg-gray-700' : 'bg-gradient-to-r from-[#001E40] to-[#0C6780]'}`}
      >
        <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
          {open ? (
            <FaTimes className="text-white text-base" />
          ) : (
            <Image src="/images/logo-icon.png" alt="Wyzo" width={20} height={20} className="rounded-full" />
          )}
        </span>
        <span>{open ? 'Close' : 'Wyzo AI'}</span>
        {!open && turns.length > 1 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>
    </>
  )
}

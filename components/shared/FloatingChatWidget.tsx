'use client'

import { useEffect, useState } from 'react'
import { FaTimes } from 'react-icons/fa'
import Image from 'next/image'
import WyzoAssistant, { Suggestion } from './WyzoAssistant'

const GREETING = "Bonjour 👋 Je suis Wyzo, votre Assistant Santé IA. Je peux trouver et réserver un médecin pour vous, vous aider avec le Health Shop, ou répondre à toutes vos questions sur la plateforme."

const SUGGESTIONS: Suggestion[] = [
  { label: 'Un cardiologue en téléconsultation', kind: 'search' },
  { label: 'Comment réserver un médecin ?', kind: 'ask' },
  { label: 'Quels services propose MediWyz ?', kind: 'ask' },
  { label: 'Comment fonctionne le Health Shop ?', kind: 'ask' },
  { label: 'How much does a consultation cost?', kind: 'ask' },
]

/** Floating launcher + full-screen modal hosting the shared Wyzo agent. */
export default function FloatingChatWidget() {
  const [open, setOpen] = useState(false)
  const [opened, setOpened] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  function toggle() { setOpen(v => !v); setOpened(true) }

  return (
    <>
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            className="fixed inset-0 sm:inset-2 md:inset-4 lg:inset-6 xl:inset-10 z-50 flex flex-col rounded-none sm:rounded-3xl shadow-[0_40px_100px_-12px_rgba(0,30,64,0.45)] overflow-hidden"
            role="dialog" aria-modal="true" aria-label="Wyzo - Health AI Assistant"
          >
            <WyzoAssistant variant="floating" onClose={() => setOpen(false)} greeting={GREETING} suggestions={SUGGESTIONS} />
          </div>
        </>
      )}

      {/* Floating trigger */}
      <button
        onClick={toggle}
        title={open ? 'Close Wyzo' : 'Wyzo - Health AI Assistant'}
        aria-label={open ? 'Close Wyzo' : 'Wyzo - Health AI Assistant'}
        className={`fixed bottom-24 sm:bottom-5 right-4 sm:right-5 z-[150] h-12 w-12 justify-center rounded-full shadow-lg shadow-black/25 flex items-center text-sm font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95 ${open ? 'bg-gray-700' : 'bg-gradient-to-r from-[#001E40] to-[#0C6780]'}`}
      >
        <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
          {open ? <FaTimes className="text-white text-base" /> : <Image src="/images/logo-icon.png" alt="Wyzo" width={20} height={20} className="rounded-full" />}
        </span>
        {!open && !opened && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>
    </>
  )
}
